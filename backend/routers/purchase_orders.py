"""Purchase Orders router: simplified PO management for inbound receiving."""
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Request
from pymongo import ReturnDocument
from db import db
from dependencies import require_permission, audit, current_user
from core_utils import new_id, now_iso, safe_doc, DEFAULT_ENTITY_ID
from schemas import PurchaseOrderCreate, POReceiveItem
from services.config_service import evaluate_approval, role_satisfies

router = APIRouter(prefix="/api")


async def _create_inbound_tasks_for_po(po: Dict[str, Any]) -> None:
    """Buat inbound receiving task untuk tiap item PO (dipanggil saat PO siap
    diterima: langsung bila tak butuh approval, atau setelah di-approve)."""
    # Resolve warehouse name/city defensively (PO lama/seed mungkin tak menyimpannya).
    wh_name = po.get("warehouse_name", "")
    wh_city = po.get("warehouse_city", "")
    if not wh_name and po.get("warehouse_id"):
        wh = await db.warehouses.find_one({"id": po["warehouse_id"]}, {"_id": 0, "name": 1, "city": 1})
        if wh:
            wh_name = wh.get("name", "")
            wh_city = wh.get("city", "") or wh_city
    for item in po.get("items", []):
        stages = ["waiting_goods", "receiving", "qc_check", "put_away", "completed"]
        await db.wms_tasks.insert_one({
            "id": new_id("wms"),
            "flow_type": "inbound",
            "source_type": "purchase_order",
            "po_id": po["id"],
            "po_number": po["po_number"],
            "product_id": item["product_id"],
            "product_name": item.get("product_name", ""),
            "sku": item.get("sku", ""),
            "expected_qty": item["quantity"],
            "received_qty": 0.0,
            "quantity": 0.0,
            "unit": item.get("unit", "meter"),
            "warehouse_id": po["warehouse_id"],
            "warehouse_name": wh_name,
            "warehouse_city": wh_city,
            "supplier_name": po.get("supplier_name", ""),
            "bin_id": "", "batch": "", "lot": "", "roll_id": "",
            "status": stages[0], "stages": stages, "scan_log": [],
            "escalation": None,
            "created_by": po.get("created_by", "system"),
            "created_at": now_iso(), "updated_at": now_iso(),
        })


@router.get("/purchase-orders")
async def list_purchase_orders(request: Request, entity_id: str = None) -> List[Dict[str, Any]]:
    """List all purchase orders."""
    await require_permission(request, "purchase_order", "view")

    query = {}
    if entity_id and entity_id != "all":
        query["entity_id"] = entity_id
    pos = await db.purchase_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return pos


@router.post("/purchase-orders")
async def create_purchase_order(payload: PurchaseOrderCreate, request: Request) -> Dict[str, Any]:
    """
    Create a new purchase order.
    
    This will auto-create an inbound receiving task.
    """
    actor = await require_permission(request, "purchase_order", "create")
    
    # Validate warehouse
    warehouse = safe_doc(await db.warehouses.find_one({"id": payload.warehouse_id}, {"_id": 0}))
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse tidak ditemukan")

    # Fase 3 — resolve supplier master (FK) → snapshot. Fallback ke supplier_name manual.
    supplier_id = ""
    supplier_name = (payload.supplier_name or "").strip()
    supplier_contact = payload.supplier_contact
    supplier_npwp = ""
    if payload.supplier_id:
        supplier = safe_doc(await db.suppliers.find_one({"id": payload.supplier_id}, {"_id": 0}))
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier tidak ditemukan")
        supplier_id = supplier["id"]
        supplier_name = supplier.get("name", "")
        supplier_npwp = supplier.get("npwp", "")
        if not supplier_contact:
            pic = supplier.get("pic_name", "")
            phone = supplier.get("phone", "")
            supplier_contact = " | ".join([x for x in [pic, phone] if x])
    if not supplier_name:
        raise HTTPException(status_code=400, detail="Supplier wajib dipilih atau diisi")
    
    # Validate products and calculate total
    products = {p["id"]: p for p in await db.products.find({}, {"_id": 0}).to_list(1000)}
    items = []
    total_amount = 0.0
    
    for item_in in payload.items:
        product = products.get(item_in.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Produk {item_in.product_id} tidak ditemukan")
        
        price = item_in.price if item_in.price > 0 else product.get("price", 0)
        subtotal = price * item_in.quantity
        
        items.append({
            "product_id": product["id"],
            "sku": product["sku"],
            "product_name": product["name"],
            "quantity": item_in.quantity,
            "unit": item_in.unit,
            "price": price,
            "subtotal": subtotal,
            "received_qty": 0.0  # Tracking actual received
        })
        total_amount += subtotal
    
    # Generate PO number
    count = await db.purchase_orders.count_documents({})
    po_number = f"PO-{count + 1:05d}"

    entity_id = payload.entity_id or DEFAULT_ENTITY_ID
    # Fase 1B — kebutuhan approval dinamis dari approval_rules (basis total_amount)
    appr = await evaluate_approval("purchase_order", total_amount, entity_id)
    needs_approval = appr["requires_approval"]

    # Create PO document
    po = {
        "id": new_id("po"),
        "po_number": po_number,
        "supplier_id": supplier_id,
        "supplier_name": supplier_name,
        "supplier_contact": supplier_contact,
        "supplier_npwp": supplier_npwp,
        "warehouse_id": payload.warehouse_id,
        "warehouse_name": warehouse["name"],
        "warehouse_city": warehouse.get("city", ""),
        "items": items,
        "total_amount": total_amount,
        "entity_id": entity_id,
        "expected_delivery_date": payload.expected_delivery_date,
        "notes": payload.notes,
        # waiting_approval → pending → receiving → completed / partial / cancelled
        "status": "waiting_approval" if needs_approval else "pending",
        "approval_required": needs_approval,
        "required_approval_role": appr["required_role"],
        "approval_status": "pending" if needs_approval else "not_required",
        "approval_amount": total_amount,
        "created_by": payload.created_by,
        "created_at": now_iso(),
        "updated_at": now_iso()
    }

    await db.purchase_orders.insert_one(po)

    # Inbound task dibuat hanya bila PO TIDAK butuh approval (atau nanti setelah approve)
    if not needs_approval:
        await _create_inbound_tasks_for_po(po)

    await audit(actor["name"], "po_created", "purchase_order", po["id"], {
        "po_number": po_number,
        "supplier": supplier_name,
        "supplier_id": supplier_id,
        "total_amount": total_amount,
        "approval_required": needs_approval,
        "required_role": appr["required_role"],
    })

    return safe_doc(po)


@router.post("/purchase-orders/{po_id}/approve")
async def approve_purchase_order(po_id: str, request: Request) -> Dict[str, Any]:
    """Fase 1B — approve PO (role dinamis dari matriks). Setelah approve, PO
    masuk status 'pending' dan inbound receiving task otomatis dibuat."""
    actor = await current_user(request)
    po = safe_doc(await db.purchase_orders.find_one({"id": po_id}, {"_id": 0}))
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order tidak ditemukan")
    if po.get("status") != "waiting_approval":
        raise HTTPException(status_code=409, detail=f"PO status '{po.get('status')}' tidak menunggu approval")
    required = po.get("required_approval_role")
    if not role_satisfies(actor.get("role"), required):
        raise HTTPException(
            status_code=403,
            detail=f"Approval PO butuh role minimal '{required}'. Role Anda: '{actor.get('role')}'.")
    updated = await db.purchase_orders.find_one_and_update(
        {"id": po_id},
        {"$set": {"status": "pending", "approval_status": "approved",
                  "approved_by": actor["name"], "updated_at": now_iso()}},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER
    )
    # Buat inbound task setelah PO disetujui
    await _create_inbound_tasks_for_po(updated)
    await audit(actor["name"], "po_approved", "purchase_order", po_id,
                {"po_number": po.get("po_number"), "total_amount": po.get("total_amount")})
    return safe_doc(updated)


@router.post("/purchase-orders/{po_id}/reject")
async def reject_purchase_order(po_id: str, request: Request) -> Dict[str, Any]:
    """Fase 3 — tolak PO yang menunggu approval (role dinamis dari matriks).
    PO → status 'rejected'; tidak ada inbound task yang dibuat."""
    actor = await current_user(request)
    po = safe_doc(await db.purchase_orders.find_one({"id": po_id}, {"_id": 0}))
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order tidak ditemukan")
    if po.get("status") != "waiting_approval":
        raise HTTPException(status_code=409, detail=f"PO status '{po.get('status')}' tidak menunggu approval")
    required = po.get("required_approval_role")
    if not role_satisfies(actor.get("role"), required):
        raise HTTPException(
            status_code=403,
            detail=f"Reject PO butuh role minimal '{required}'. Role Anda: '{actor.get('role')}'.")
    body = {}
    try:
        body = await request.json()
    except Exception:  # noqa: BLE001
        body = {}
    reason = (body or {}).get("reason", "")
    updated = await db.purchase_orders.find_one_and_update(
        {"id": po_id},
        {"$set": {"status": "rejected", "approval_status": "rejected",
                  "rejected_by": actor["name"], "rejection_reason": reason,
                  "updated_at": now_iso()}},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER
    )
    await audit(actor["name"], "po_rejected", "purchase_order", po_id,
                {"po_number": po.get("po_number"), "reason": reason})
    return safe_doc(updated)


@router.get("/purchase-orders/{po_id}")
async def get_purchase_order(po_id: str, request: Request) -> Dict[str, Any]:
    """Get purchase order detail."""
    await require_permission(request, "purchase_order", "view")
    
    po = safe_doc(await db.purchase_orders.find_one({"id": po_id}, {"_id": 0}))
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order tidak ditemukan")
    
    # Get related inbound tasks
    tasks = await db.wms_tasks.find({"po_id": po_id}, {"_id": 0}).to_list(100)
    po["inbound_tasks"] = tasks
    
    return po


@router.post("/purchase-orders/{po_id}/cancel")
async def cancel_purchase_order(po_id: str, request: Request) -> Dict[str, Any]:
    """Cancel a purchase order."""
    actor = await require_permission(request, "purchase_order", "update")
    
    po = await db.purchase_orders.find_one({"id": po_id}, {"_id": 0})
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order tidak ditemukan")
    
    if po["status"] not in ["pending", "receiving", "waiting_approval"]:
        raise HTTPException(status_code=400, detail=f"PO dengan status {po['status']} tidak bisa dibatalkan")
    
    # Update PO status
    updated_po = await db.purchase_orders.find_one_and_update(
        {"id": po_id},
        {"$set": {"status": "cancelled", "updated_at": now_iso()}},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER
    )
    
    # Cancel related inbound tasks
    await db.wms_tasks.update_many(
        {"po_id": po_id},
        {"$set": {"status": "cancelled", "updated_at": now_iso()}}
    )
    
    await audit(actor["name"], "po_cancelled", "purchase_order", po_id, {})
    
    return safe_doc(updated_po)
