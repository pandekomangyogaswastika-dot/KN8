"""Suppliers router (Fase 3 — Procurement / Master Pemasok).

Master supplier menggantikan supplier sebagai STRING di purchase_orders.
Koleksi kanonik: `suppliers` (prefix sup_). Lihat ENTITY_REGISTRY.md.
"""
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Request
from pymongo import ReturnDocument
from db import db
from dependencies import require_permission, audit
from core_utils import new_id, now_iso, safe_doc, DEFAULT_ENTITY_ID
from schemas import SupplierCreate, GenericPatch

router = APIRouter(prefix="/api")


async def _next_supplier_code() -> str:
    """Number series SUP-NNNNN (cegah duplikat via max existing)."""
    last = await db.suppliers.find_one({}, {"_id": 0, "code": 1}, sort=[("code", -1)])
    n = 0
    if last and isinstance(last.get("code"), str) and last["code"].startswith("SUP-"):
        try:
            n = int(last["code"].split("-")[1])
        except (ValueError, IndexError):
            n = await db.suppliers.count_documents({})
    else:
        n = await db.suppliers.count_documents({})
    return f"SUP-{n + 1:05d}"


@router.get("/suppliers")
async def list_suppliers(request: Request, entity_id: str = None, status: str = None) -> List[Dict[str, Any]]:
    """List supplier (optional filter entitas & status)."""
    await require_permission(request, "supplier", "view")
    query: Dict[str, Any] = {}
    if entity_id and entity_id != "all":
        query["entity_id"] = entity_id
    if status:
        query["status"] = status
    rows = await db.suppliers.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return rows


@router.post("/suppliers")
async def create_supplier(payload: SupplierCreate, request: Request) -> Dict[str, Any]:
    """Buat master supplier baru."""
    actor = await require_permission(request, "supplier", "create")
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Nama supplier wajib diisi")

    code = await _next_supplier_code()
    doc = {
        "id": new_id("sup"),
        "code": code,
        "name": payload.name.strip(),
        "npwp": payload.npwp.strip(),
        "pic_name": payload.pic_name.strip(),
        "phone": payload.phone.strip(),
        "email": payload.email.strip(),
        "address": payload.address.strip(),
        "city": payload.city.strip(),
        "goods_type": payload.goods_type.strip(),
        "payment_term_code": payload.payment_term_code,
        "entity_id": payload.entity_id or DEFAULT_ENTITY_ID,
        "notes": payload.notes,
        "status": "active",
        "created_by": payload.created_by,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.suppliers.insert_one(doc)
    await audit(actor["name"], "supplier_created", "supplier", doc["id"],
                {"code": code, "name": doc["name"], "npwp": doc["npwp"]})
    return safe_doc(doc)


@router.get("/suppliers/{supplier_id}")
async def get_supplier(supplier_id: str, request: Request) -> Dict[str, Any]:
    """Detail supplier + ringkasan PO terkait."""
    await require_permission(request, "supplier", "view")
    sup = safe_doc(await db.suppliers.find_one({"id": supplier_id}, {"_id": 0}))
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier tidak ditemukan")
    pos = await db.purchase_orders.find(
        {"supplier_id": supplier_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    sup["purchase_orders"] = pos
    sup["po_count"] = len(pos)
    sup["po_total_value"] = round(sum(float(p.get("total_amount", 0) or 0) for p in pos), 2)
    return sup


@router.patch("/suppliers/{supplier_id}")
async def update_supplier(supplier_id: str, payload: GenericPatch, request: Request) -> Dict[str, Any]:
    """Update field supplier (whitelist)."""
    actor = await require_permission(request, "supplier", "update")
    sup = await db.suppliers.find_one({"id": supplier_id}, {"_id": 0})
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier tidak ditemukan")
    allowed = {"name", "npwp", "pic_name", "phone", "email", "address", "city",
               "goods_type", "payment_term_code", "entity_id", "notes", "status"}
    updates = {k: v for k, v in (payload.data or {}).items() if k in allowed}
    if not updates:
        raise HTTPException(status_code=400, detail="Tidak ada field valid untuk diupdate")
    updates["updated_at"] = now_iso()
    updated = await db.suppliers.find_one_and_update(
        {"id": supplier_id}, {"$set": updates},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER,
    )
    await audit(actor["name"], "supplier_updated", "supplier", supplier_id, updates)
    return safe_doc(updated)


@router.delete("/suppliers/{supplier_id}")
async def deactivate_supplier(supplier_id: str, request: Request) -> Dict[str, Any]:
    """Nonaktifkan supplier (soft delete → status inactive)."""
    actor = await require_permission(request, "supplier", "delete")
    sup = await db.suppliers.find_one({"id": supplier_id}, {"_id": 0})
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier tidak ditemukan")
    updated = await db.suppliers.find_one_and_update(
        {"id": supplier_id}, {"$set": {"status": "inactive", "updated_at": now_iso()}},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER,
    )
    await audit(actor["name"], "supplier_deactivated", "supplier", supplier_id, {})
    return safe_doc(updated)
