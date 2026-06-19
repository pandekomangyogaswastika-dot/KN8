# Development Plan — Kain Nusantara (WMS/ERP) — Smart Guidelines + Seed + Documentation + Discovery E‑Questionnaire (v2.0)

> 📌 **MASTER ROADMAP (dari Assessment Vendor):** lihat `/app/docs/KN_DEVELOPMENT_PLAN_FROM_ASSESSMENT.md` — gap analysis assessment vs sistem eksisting + roadmap 6 fase (Sales, HRD, Purchasing, Finance, Warehouse+RFID, Additional) + BI. Status: DRAFT v1, menunggu konfirmasi prioritas user.

> 🏗️ **INFORMATION ARCHITECTURE (IA) BLUEPRINT:** lihat `/app/docs/KN_14_INFORMATION_ARCHITECTURE.md` — fondasi IA menyeluruh (navigasi + data/entity) untuk seluruh 6 fase + BI, dengan Multi-Entity sebagai lapisan fundamental. Status: **DRAFT v1 — LIVING DOC**.

> ✅ **FASE 0 (Enabler) — SELESAI & TESTED (15 Jun 2026):** Multi-Entity (`business_entities`: ent_ksc/ent_kanda + `entity_id` scoped pada transaksi; master SHARED) · Entity Switcher (TopBar) · Notification Center (`notifications`, generator REAL + dedupe) · field master baru (customer npwp/credit_limit/sales_pic, product harga_pokok/gramasi) · Admin Entities tab. Gates HIJAU (64/0/0, compliance 56/0/0, ux 0 ERROR). testing_agent: backend 39/39, frontend 100%. **NEXT:** Fase 1 (Sales) bila disetujui user.

> 🧩 **FASE 0.5 (Enabler 2) — Multi-Entity Inventory Ownership (Roll-as-SSOT) — ✅ ENABLER IMPLEMENTED (Session #016):** atas arahan user, kepemilikan stok dipisah **per entitas pada level ROLL** (`inventory_rolls` = SSOT fisik), **gudang netral/shared**, `inventory_balances` jadi proyeksi kunci `(product+warehouse+owner_entity)`, **integritas lot** (1 pengiriman idealnya 1 lot; mixed-lot hanya bila qty > lot tunggal + konfirmasi), **inter-company transfer WAJIB** sebelum entitas jual barang entitas lain (extend `warehouse_transfers`), HPP/`unit_cost` ditunda Fase 4. Visibilitas Sales: gudang+owner+lot. **Detail: `docs/KN_15_INVENTORY_OWNERSHIP_LOT.md`** (model 3-lapis, algoritma alokasi owner+lot-aware, 28 edge case, invarian gate baru, migrasi, phasing, sub-decision S1–S8). Keputusan inti D1–D4 **disepakati**; S1–S8 **menunggu konfirmasi** sebelum lock final & coding.

> 🔗 **Lanjutan Session #015 — S1–S16 RESOLVED + process flows:** allocation policy CONFIGURABLE+CLARITY, **taksonomi inventory detail** (bucket fisik+transit+pipeline+derived), **mode sumber/pemenuhan** (from_stock/from_incoming/buy_to_order/special_order/cross_dock/drop_ship/inter_company), **tracking multi-modal** (stok visible TANPA RFID), cross-dock/drop-ship, pegging/earmarking, special-order→MD/Purchasing, pre-order/ATP. **Dokumen baru `docs/KN_16_END_TO_END_PROCESS_FLOWS.md`** (flow Sales/Procurement/WMS-RFID + **Blindspot Register G1–G25** + **Info-Needed Register I1–I15**). KN_15 → v1.3. **NO CODING.** Blocking sebelum Fase 0.5: user jawab Info-Needed I1–I6 (entitas/PKP, produk/atribut, UOM, org/approval, pricing/pajak, pembayaran).
- 🧩 **Sales/Finance + CRM (Session #015 lanjutan):** S22–S35 RESOLVED. Eskalasi alokasi ke Admin · entitas dinamis (no hardcode) · multi-rekening `bank_accounts` + SO pilih rekening tujuan (designation ppn/non_ppn) · Special Order (sord_) detail · **Special Price = `price_approvals` (pra_)** + upload bukti (BUKAN koleksi baru) · master data **SSOT tunggal + metadata smart-search/AI-ready** (Sales/Inventory = VIEW, bukan tabel terpisah) · reserved logic KONFIRMASI sudah ada (balance) → upgrade roll. **CRM-LITE + Sales Force** → dokumen baru **`docs/KN_17_SALES_FORCE_CRM.md`**: customer enhanced (assigned_sales_id wajib, payment_profile kontan/tunai/tempo/dp/bertahap, credit control auto-blokir, segment/tags, contacts), **RBAC row-level (sales kelola customer sendiri)**, customer scoped per-entitas (sama boleh lintas-entitas), **sales_targets/sales_incentives/KPI** (penjualan, dicairkan, collection, target, dll), reminder jatuh tempo, advanced (suggestive selling/product focus/smart search) future-ready. Sinkron ENTITY_REGISTRY (customers + sales_targets/sinc/campaigns/cfu + prefixes). Pertanyaan terbuka Q1–Q5 (basis komisi, ambang kredit, customer_group, dll). **NO CODING.**


---

> ✅ **FASE 3 (PURCHASING / PROCUREMENT) — SELESAI & TESTED (Session #027):** Implementasi modul Pembelian sesuai roadmap `KN_DEVELOPMENT_PLAN_FROM_ASSESSMENT.md`:
> - **3.1 Master Supplier** (`suppliers`, prefix sup_): CRUD lengkap (router `routers/suppliers.py`, `SuppliersView.jsx`, menu Pembelian→Pemasok). Field: code SUP-NNNNN, name, npwp, pic_name, phone, email, city, goods_type, payment_term_code, entity_id, status. Seed 6 supplier.
> - **3.1b PO ↔ Supplier FK**: `purchase_orders.supplier_id` (FK) + snapshot `supplier_name`/`supplier_npwp`/`supplier_contact` (backward compat). PO form punya dropdown supplier master (searchable) + fallback manual.
> - **3.2 Approval Pembelian** (`PurchaseApprovalView.jsx`, menu Pembelian→Approval): workflow approve/reject bertingkat (role dinamis dari `approval_rules`; PO > Rp 100jt butuh manager). Endpoint baru `/purchase-orders/{id}/reject`. Seed demo PO-00007 (waiting), PO-00008 (rejected), PO-00009 (approved).
> - **3.3 Toleransi Kedatangan ±2%**: config `purchasing.receive_tolerance_percent` (default 2.0) di `config_service`. Inbound scan-receive terima over-receipt dalam toleransi, tolak bila melebihi (butuh eskalasi). Metadata `receive_variance_percent`/`receive_within_tolerance` di task.
> - **3.4 Pengelolaan Kas** (`cash_transactions`, prefix cash_): router `routers/cash.py` + `CashManagementView.jsx` (menu Pembelian→Pengelolaan Kas). Kas kecil (per entitas) + kas besar (gabungan), in/out, saldo per entitas, void. Endpoint `/cash-transactions` + `/summary`. Seed 6 transaksi.
> - **DEFERRED:** 3.5 BOM Printing (`bom_printing`) — tetap Coming Soon (di luar acceptance criteria Fase 3).
> - **Gates HIJAU:** seed_reset 103/0/0 · verify_contract OK · api_contract 0 ERROR · ux_audit 0 ERROR · endpoint_sweep 0×5xx · esbuild bersih. ENTITY_REGISTRY + verify_contract CANONICAL + data_integrity Concepts diupdate (suppliers, cash_transactions). Forbidden alias: vendor/vendors/kas/petty_cash.

---

## ⏸️ Session #026 — UX Backlog + Phase 1.11/1.12 Seed (18 Jun 2026) — HANDOFF TO OPUS

### ✅ Yang SELESAI:

#### Bug Fixes dari BUG_BACKLOG.md:
- **BUG #1 FIXED**: MetricCards hanya tampil di home views (admin/sales/reports/operations) — `App.js` HOME_VIEWS constant + isHomeView conditional
- **BUG #2 PARTIALLY FIXED**: Native `<select>` warning (W2) — Created `KNSelect.jsx` + mass migration ~15 files
  - ⚠️ **SIDE EFFECT:** KNSelect crash dengan empty value → **APLIKASI BROKEN** (lihat § Critical Bug)
- **BUG #4**: Confirmed NOT a bug — Special Order menu accessible
- **BUG #5 FIXED**: Tab CSS (`tab-bar`, `tab-button`, `tab-badge`, `tab-pills`, `tab-pill`) ditambahkan ke `styles/components.css`

#### Gate Fixes:
- Duplicate /approval-rules routes removed dari `settings.py` (G2 duplicate route RC-11)
- `ENTITY_REGISTRY.md`: `Collection:` prefix ditambahkan untuk `sales_returns`, `special_orders`, `approval_requests`
- `validate_compliance.py`: `special_orders` + `approval_requests` ditambahkan ke `known_collections`
- `SpecialOrderDetail.jsx`: empty state added for specs table (ux_audit E2)

#### Phase 1.11 & 1.12 Backend Complete:
- **Sub-fase 1.11 (Sales Returns):** Seed data ditambahkan (`seed_sales_returns()` — 2 contoh realistic)
- **Sub-fase 1.12 (Special Orders):** Seed data ditambahkan (`seed_special_orders()` — 2 contoh realistic)
- Backend endpoints sudah ada dari session sebelumnya (routers complete)
- Collections terdaftar di `ENTITY_REGISTRY.md` + `verify_data_integrity.py`

#### Gates Before Bug:
- ✅ ux_audit: 0 ERROR / 0 WARN
- ✅ seed_reset: 96 PASS / 0 FAIL
- ✅ api_contract: 0 ERROR
- ✅ compliance: 59 PASS / 0 FAIL

---

### 🚨 CRITICAL BUG (Blocking Further Progress):

**Issue:** `KNSelect.jsx` crash saat handle `value=""` (empty string)
**Root Cause:** Shadcn UI `<SelectItem>` tidak menerima empty string value
**Impact:** Frontend tidak bisa render → aplikasi tidak accessible
**Affected:** 15+ form components yang baru di-migrate ke KNSelect
**Status:** UNRESOLVED — handoff to Opus for fix

**Files:**
- Bug location: `/app/frontend/src/components/KNSelect.jsx`
- Detailed analysis: `/app/CRITICAL_BUG_HANDOFF_OPUS.md`
- Quick reference: `/app/SESSION_026_HANDOFF.md`

---

### ❌ Yang BELUM SELESAI (Blocked by Bug):

1. **Fix KNSelect empty value handling** (P0 — kritis)
   - Map `""` → `"__empty__"` internally
   - Reverse map on onChange
   - Backward compatible dengan parent components
   - Verification: esbuild + screenshot test + gates

2. **Verify Phase 1.11 & 1.12 Frontend** (P0 — blocked)
   - Screenshot manual verification
   - Call `testing_agent_v3` untuk end-to-end testing
   - Fix bugs dari test report
   - Mark phase complete di plan.md

3. **Documentation update** (P1 — after verification)
   - Update status 1.11 & 1.12 → SELESAI ✅
   - Session handoff update
   - Re-verify all gates still green

---

### 📋 NEXT AGENT CHECKLIST:

- [ ] Baca `/app/CRITICAL_BUG_HANDOFF_OPUS.md` (detail lengkap)
- [ ] Fix `KNSelect.jsx` untuk handle empty value
- [ ] Screenshot test 5+ pages dengan dropdown
- [ ] Verify Phase 1.11 & 1.12 frontend
- [ ] Call testing_agent_v3
- [ ] Fix all bugs dari test report
- [ ] Update documentation
- [ ] **KOMUNIKASI DALAM BAHASA INDONESIA** (user preference)

---

## ⏸️ HANDOFF — Sub-fase 1.9 Faktur Pajak Jual ✅ SELESAI + IA Grouped Navigation ✅ SELESAI (Session #025)

> **Status:** SELESAI. Backend 1.9 sudah selesai dari session sebelumnya. Frontend 1.9 diselesaikan session #025 (restore KN8 repo → wiring App.js + navigationConfig.js → gate hijau). Build esbuild bersih, verify_data_integrity 96/0/0, verify_api_contract 0 ERROR, validate_compliance 59/0/1 WARN (pre-existing).

### Keputusan user untuk 1.9 (terkunci)
1.c HYBRID numbering (FKT-##### internal + NSFP resmi 16-digit diisi menyusul + kode_transaksi) · 2.a MANUAL issuance dari Order detail, **PKP-only, pajak OPSIONAL/tidak wajib**, idempotent · 3.a status normal/pengganti/batal + kode_transaksi (01..09) · 4.a dokumen HTML/PDF + list (CSV e-Faktur/Coretax = fase lanjut).

### ✅ SUDAH SELESAI — BACKEND (semua gate HIJAU)
- `backend/services/tax_invoice_service.py` (NEW) — issue / replace(pengganti) / cancel(batal) / set_nsfp / render_faktur_html; guard PKP + ppn>0; idempotent (≤1 aktif/order); snapshot penjual+pembeli.
- `backend/routers/tax_invoices.py` (NEW) — `GET /tax-invoices`, `GET /tax-invoices/{id}`, `POST /sales-orders/{order_id}/tax-invoice`, `PATCH /tax-invoices/{id}/nsfp`, `POST /tax-invoices/{id}/replace`, `POST /tax-invoices/{id}/cancel`, `GET /tax-invoices/{id}/document`.
- `backend/schemas.py` (+4 schema: TaxInvoiceCreate/NsfpUpdate/Replace/Cancel).
- `backend/permissions_config.py` (+module `tax_invoice` di admin/sales/manager).
- `backend/server.py` (router `tax_invoices` terdaftar: import + include).
- `scripts/verify_contract.py` (+`tax_invoices` ke CANONICAL_COLLECTIONS).
- `scripts/verify_data_integrity.py` (+`layer_tax_invoice_invariants` / **L4-FKT** + dipanggil di main).
- `seed_realistic.py` (+`seed_tax_invoice_examples` + `tax_invoices` ke `clear_collections`).
- `ENTITY_REGISTRY.md` (+section `### tax_invoices` — agar L0 self-check lulus).
- `tests/test_tax_invoice_19.py` (NEW) — **21/21 PASS**.
- **GATE:** `seed_reset` **96/0/0**, `verify_contract` OK, `verify_api_contract` 0/0, L4-FKT hijau.

### ✅ SUDAH SELESAI — FRONTEND (sebagian)
- `frontend/src/features/orders/OrderDetailPanel.jsx` — section **"Faktur Pajak"**: tombol `issue-tax-invoice-btn`, list `tax-invoice-row-{id}`, cetak `tax-invoice-doc-btn-{id}`, fetch `GET /api/tax-invoices?order_id=`, hanya tampil bila `taxEligible` (PKP + ppn>0 + status confirmed→done).
- `frontend/src/features/orders/OrdersView.jsx` — prop `onIssueTaxInvoice` diteruskan ke OrderDetailPanel.
- `frontend/src/hooks/useAppActions.js` — action `issueTaxInvoice(orderId, payload)` + dimasukkan ke `return {}`.
- `frontend/src/features/finance/TaxInvoices.jsx` (NEW) — halaman kelola lengkap (filter, search, isi NSFP, pengganti, batal, cetak; testid: `tax-invoices-view`, `fkt-row-{id}`, `fkt-print/nsfp/replace/cancel-{id}`, `fkt-modal*`). **TAPI BELUM DI-IMPORT/RENDER & belum ada di menu.**

### ⏳ BELUM DIKERJAKAN — LANJUTKAN DARI SINI (urutan pasti)
1. **`frontend/src/App.js`** (4 edit):
   a. Tambah `issueTaxInvoice` ke destructuring `const { ... } = actions;` (sekitar baris 98–104).
   b. Teruskan `onIssueTaxInvoice={issueTaxInvoice}` ke `<OrdersView ... />` (baris ~181).
   c. `import TaxInvoices from "./features/finance/TaxInvoices";` (area import, ~baris 21).
   d. Render: `{activeView === "tax-invoices" && <TaxInvoices currentUser={user} />}` (di blok render view, ~baris 179-181).
2. **`frontend/src/config/navigationConfig.js`** (3 edit):
   a. Tambah item nav `{ id: "tax-invoices", label: "Faktur Pajak", icon: <Receipt/FileText> }` untuk role **admin/manager/sales** (lihat pola item lain + import icon dari lucide-react).
   b. Tambah `PAGE_META["tax-invoices"] = { kicker: "Finance", title: "Faktur Pajak Jual" }`.
   c. Tambah `tax-invoices` ke allowlist role admin/manager/sales (`buildNavigation`).
3. **Verifikasi (wajib, urut):** `npx esbuild src/index.js --loader:.js=jsx --bundle --outfile=/dev/null` → `python scripts/verify_api_contract.py` (cek path FE baru) → `python scripts/ux_audit.py` → **`testing_agent_v3`** end-to-end 1.9 (issue dari Order detail, idempotent, dokumen, halaman Faktur Pajak: NSFP/pengganti/batal/cetak).
4. **Update memory:** `SESSION_HANDOFF.md` + `plan.md` (tandai 1.9 SELESAI), lalu **PUSH ke GitHub KN8**.

### ⚠️ AKIBAT BELUM WIRING (kondisi saat ini)
- Tombol **"Terbitkan Faktur Pajak"** di Order detail **MUNCUL tapi belum berfungsi** (`onIssueTaxInvoice` undefined → handler return lebih awal). Akan berfungsi setelah edit App.js #1a–b.
- Halaman **Faktur Pajak** (`TaxInvoices.jsx`) **belum bisa diakses** (belum di-import/render & belum ada di menu). Akan tampil setelah edit App.js #1c–d + navigationConfig #2a–c.
- Tidak ada error/red-screen; backend 100% siap (uji via `python tests/test_tax_invoice_19.py`).

### 🔼 PUSH KE GITHUB KN8 (WAJIB — kalau "Save to GitHub" Emergent tidak commit)
> Penyebab kemarin: di env ini git identity **sudah** ter-set, TAPI remote `origin` **kosong** + perubahan belum jadi commit. Saya sudah `git add -A && git commit` WIP 1.9 secara lokal (lihat hash di SESSION_HANDOFF). Yang tersisa hanya **push**:
- **Cara A:** klik **"Save to GitHub"** (sekarang sudah ADA commit → seharusnya jalan).
- **Cara B (terminal, butuh GitHub PAT):** push ke branch baru agar aman:
  ```bash
  git push https://<USERNAME>:<TOKEN>@github.com/pandekomangyogaswastika-dot/KN8.git HEAD:wip-1.9
  ```
  Verifikasi branch `wip-1.9` muncul di GitHub. **Jangan kirim token ke agent.**

---


## 🟢 SUB-FASE 1.6: BACKORDER LIFECYCLE (P0) — ✅ COMPLETED & TESTED

> **Status:** ✅ SELESAI & TERVERIFIKASI (Session ini). Opt-in backorder + perbaikan SSOT inbound GR. testing_agent_v3: backend 96% / frontend 100% / data integrity 100% (0 critical/minor bug). Gate: integrity 88 PASS (clean seed 86) / 0 FAIL · compliance 57/0/0 · frontend compile bersih.
> **Progress:** 1.6.1 ✅ · 1.6.2 ✅ · 1.6.3 ✅ · 1.6.4 ✅ · 1.6.5 ✅ · 1.6.6 ✅

### 🟢 Sub-fase 1.6.1 (lanjutan) — Decouple Status & Approval-with-Backorder — ✅ COMPLETED & TESTED
> Keputusan user: (1a) kerjakan sekarang · (2c) approval sekarang, pengiriman parsial fisik MENYUSUL · (3a) pisahkan `status` dari flag `has_backorder` · (4a) auto-commit ikut approval awal (tanpa approval ulang) · (5a) hormati `shipment_policy` (untuk shipment parsial nanti).
> **Verifikasi:** testing_agent_v3 iteration_10 — backend 100% (14/14) · frontend 100% · integrity 100% (88/0) · contract 100% (0 ERROR). Self-test `tests/test_backorder_approval_161.py` 9/9 (termasuk 8 roll SO semua 'committed'). Gate seed_reset LULUS · compliance 57/0/0 · esbuild bersih.
>
> **Perubahan inti (DONE):**
> - `create_order`: status `reserved` bila ADA porsi ter-reservasi (walau ada backorder); `waiting_stock` HANYA bila 0 reserved (pure backorder). Flag `has_backorder` orthogonal.
> - `submit_for_approval`/`approve`: SO `reserved` + backorder lanjut approval (commit hanya porsi reserved).
> - `auto_fulfill_backorders`: target SEMUA SO `has_backorder` (status aktif) untuk produk+entitas. Approved/confirmed → roll backorder baru di-commit otomatis (4a); waiting_stock→reserved; status lain tak diubah; has_backorder clear bila penuh.
> - `_norm_backorder()` di GET /sales-orders & /{id}: respons SELALU memuat `has_backorder`/`backorders` (fix FE↔BE contract drift untuk order lama).
> - Invariant L4-BO direvisi: `has_backorder ⟺ Σbackorder>0`; `waiting_stock ⟹ Σreserved≈0`.
> - Frontend: stat Backorder = hitung `has_backorder`; chip "Backorder" di list (`order-backorder-chip-{id}`) + header detail (`order-backorder-chip`).
>
> **MENYUSUL (belum, butuh konfirmasi user):** pengiriman parsial fisik (Surat Jalan untuk porsi reserved + multi-shipment, hormati `shipment_policy`).
>
> **Ringkasan implementasi:**
> - SSOT `roll_service.allocate_and_reserve_rolls(allow_partial)` — reservasi parsial (backward-compatible; default raise 409).
> - `create_order(allow_backorder)` — hitung reserved_qty/backorder_qty per item, status `waiting_stock`, array `backorders`. cancel/release/expire ikut handle waiting_stock.
> - **Perbaikan SSOT KRITIS:** `inbound_receiving.complete` kini membuat `inventory_rolls` (BUKAN `$inc` balance) + `rebuild_balance` → invarian `balance == Σ rolls` tetap utuh saat GR.
> - `services/backorder_service.auto_fulfill_backorders()` — FIFO, owner-scoped, dipanggil setelah GR.
> - Invariant baru `verify_data_integrity.py` L4-BO: INV-BO-1 (qty==reserved+backorder), INV-BO-2 (status waiting_stock ⟺ Σbackorder>0), INV-BO-3 (owner-scoped).
> - Frontend: CartPanel checkbox "Izinkan Backorder"; OrdersView stat Backorder + filter + status pill `waiting_stock`; detail panel di-split ke `OrderDetailPanel.jsx` (jaga limit 500 baris).
> - Test: `tests/test_backorder_16.py` (7/7) + testing_agent_v3 iteration_9.

### Konsep Inti
Saat SO dibuat dan stok milik entitas penjual **tidak cukup**, alih-alih hard-fail (409), user dapat **OPT-IN backorder**. Sistem mereservasi yang tersedia sekarang + mencatat kekurangan sebagai backorder (status SO `waiting_stock`). Saat barang masuk via **Goods Receipt (GR/inbound complete)**, sistem **auto-fulfill** backorder yang menunggu (FIFO per produk×entitas).

### 🔑 TEMUAN KRITIS (pra-syarat 1.6)
`inbound_receiving.complete_inbound_receiving` saat ini melakukan **`$inc` langsung ke `inventory_balances` TANPA membuat `inventory_rolls`** → melanggar invariant Roll-as-SSOT (`balance == Σ rolls`). Sekarang integrity PASS hanya karena seed belum pernah men-trigger GR. **1.6 mewajibkan GR membuat ROLL** (bukan $inc) supaya: (a) invariant tetap utuh, (b) auto-fulfill bisa membaca roll baru. Ini menjadi pusat tahap 1.6.3.

### Status Flow (baru)
`draft → reserved → waiting_approval → approved → confirmed → dispatched → done`
**+ `waiting_stock`** (paralel `reserved`): muncul bila ada backorder. Auto-fulfill penuh → kembali ke `reserved` (lanjut alur normal). Fulfill parsial → tetap `waiting_stock`.

### Tahapan Eksekusi

**1.6.1 — SSOT: alokasi parsial (backend `roll_service.py`)**
- `allocate_and_reserve_rolls(..., allow_partial=False)` param baru. Bila `allow_partial=True` & `total_available < quantity`: reservasi hanya `total_available` (TIDAK raise 409); kembalikan allocations utk porsi tersedia (bisa kosong = full backorder). Default `False` = perilaku lama (backward-compatible).
- Gate: `verify_data_integrity.py` + `validate_compliance.py` tetap hijau; unit test alokasi parsial.

**1.6.2 — SO model + `create_order` backorder (`schemas.py`, `sales_orders.py`)**
- `SalesOrderCreate.allow_backorder: bool = False`.
- Per item: hitung `reserved_qty` & `backorder_qty`. Order field baru: `backorders: [...]`, `has_backorder`.
- Status: `waiting_stock` bila ada backorder; `reserved` bila penuh; 409 lama tetap bila `allow_backorder=False` & stok kurang.
- **Pricing TIDAK berubah** (tetap atas qty penuh) → invariant `total_amount==Σsubtotal` aman.
- `cancel`/`release-reservation`/`expire_old_reservations` ikut handle `waiting_stock` (lepas roll + clear backorder).

**1.6.3 — Inbound GR: buat ROLL + auto-fulfill (`inbound_receiving.py`, service baru)**
- `complete_inbound_receiving`: ganti `$inc` balance → **buat `inventory_rolls`** (status=available, `owner_entity_id` dari `PO.entity_id`, lot/batch, length=final_qty, acquired.via='inbound') + `rebuild_balance(...)`.
- Service baru `services/backorder_service.py`: `auto_fulfill_backorders(product_id, owner_entity_id)` — cari SO `waiting_stock` (FIFO), reservasi roll baru utk `backorder_qty`, update item/backorders/status, movement + audit. Berhenti saat roll habis.
- Gate: integrity `balance==Σrolls` WAJIB tetap PASS setelah GR.

**1.6.4 — Invariants & compliance baru (`verify_data_integrity.py`)**
- INV-BO-1: per item SO, `quantity == reserved_qty + backorder_qty`.
- INV-BO-2: `status==waiting_stock ⟺ Σ backorder_qty > 0`.
- INV-BO-3: backorder owner-scoped (entity == SO.entity_id).
- INV-ROLL-1 tetap valid pasca-GR. Tambah endpoint baru ke `health_check.py` bila ada.

**1.6.5 — Frontend (POS + Orders)**
- `CartPanel`/`SalesPortal`: bila preview mode `backorder`, tampilkan checkbox **"Izinkan Backorder"** + ringkasan (reservasi sekarang vs backorder); kirim `allow_backorder`.
- `OrdersView`: status `waiting_stock` (badge "Menunggu Stok", amber), breakdown backorder per item di detail, filter + stats card. Komponen baru dijaga < 500 baris (compliance).

**1.6.6 — Testing end-to-end**
- Skrip backend: buat SO backorder → GR parsial → verifikasi auto-fulfill + semua invariant (≥85 PASS) + compliance.
- `testing_agent_v3`: alur penuh POS→Orders→Inbound.

### Risiko & Mitigasi
- **Tertinggi: perubahan inbound GR (menyentuh SSOT).** Mitigasi: selalu `rebuild_balance` + jalankan integrity gate tiap tahap; kerjakan terisolasi.
- Race condition auto-fulfill → sudah tertangani reservasi roll atomik (`find_one_and_update`).
- Backward-compat: semua alur tanpa backorder tidak berubah (`allow_partial`/`allow_backorder` default False).

### Estimasi & Model
- Tahap 1.6.1–1.6.4 (backend/SSOT/invariant) = **inti kompleks** → disarankan model kuat (Opus).
- Tahap 1.6.5 (UI) & 1.6.6 (test wiring) = lebih rutin → Sonnet memadai.

---


## Objectives
- Menjaga baseline ERP demo tetap stabil (backend + frontend) dan mengikuti rule kualitas (no monster files, SSOT, compliance scripts).
- **(COMPLETED)** Menyelesaikan isu Smart Guidelines (Guided Tour) agar:
  1) Highlight target **tajam** (tidak blur).
  2) Menu tour **mengikuti role-based access**.
  3) Tour **tidak stuck di step pertama**: auto-navigate, polling target, dan tooltip selalu terlihat.
- **(COMPLETED)** Menyediakan **seed data realistis** untuk demo end-to-end flow utama (POS/Sales → Orders → WMS).
- **(COMPLETED)** Menyediakan **dokumen assessment komprehensif** (15 domain) + **Executive Summary Deck** untuk kebutuhan konsultasi.
- **(COMPLETED ✅)** Membangun **modul Discovery E‑Questionnaire** sebagai web app terpisah untuk klien PT. Kain Nusantara.
- **(COMPLETED ✅ v2.0)** Upgrade Discovery Module dengan 3 enhancement (sesuai permintaan):
  1) **Branching Logic** (per-question show/hide)
  2) **Admin Notification** (in-app: badge “Baru!” + stats + acknowledge)
  3) **File Upload** (local filesystem per pertanyaan, 10MB max)
  
  **Testing:** backend **34/34** tests PASSED (100%) — `/app/test_reports/iteration_3.json`.
- **(ONGOING, DEFERRED UNTIL APPROVED)** Cleanup technical debt (monster files/duplicate endpoints) — hanya dikerjakan jika diminta, karena fokus utama konsultasi & modul Discovery sudah tercapai dan main ERP development masih “PAUSED” (kecuali modul Discovery yang diminta eksplisit).

---

## Implementation Steps

### Phase 1 — Core Flow POC (Guided Tour Overlay + Role Filter)
**User stories (POC)**
1. Sebagai user, saya ingin elemen yang di-highlight terlihat jelas agar bisa mengikuti instruksi tanpa kebingungan.
2. Sebagai user Sales, saya hanya ingin melihat tour yang relevan dengan Sales.
3. Sebagai user Warehouse, saya hanya ingin melihat tour inbound/outbound/stok.
4. Sebagai Manager, saya ingin melihat tour approval/monitoring.
5. Sebagai Admin, saya ingin melihat semua tour.

**Implementasi**
- GuidedTour UI (Frontend)
  - Update `/app/frontend/src/components/GuidedTour.jsx`:
    - Hapus backdrop overlay fullscreen yang redundan (penyebab target ikut tertutup/dim).
    - Gunakan mekanisme dimming via `box-shadow: 0 0 0 9999px ...` pada highlight wrapper.
    - Tambahkan ring animasi pulse untuk emphasis.
- Tour definitions + role rules
  - Update `/app/frontend/src/data/tourDefinitions.js`:
    - Tambahkan `roles: []` pada setiap tour.
    - Tambahkan helper `getToursForRole(role)`.
- Integrasi menu tour
  - Update `/app/frontend/src/App.js`:
    - Render list tour berdasarkan `getToursForRole(user?.role)`.
    - Tampilkan role badge + jumlah tour.
    - Empty-state bila role tidak punya tour.

**POC Testing (wajib sebelum lanjut)**
- Screenshot test untuk role: Admin, Sales, Warehouse, Manager.
- Verifikasi:
  - Target highlight tidak blur.
  - Menu tour sesuai role.
  - Tooltip tampil.

**Status Phase 1: COMPLETED** ✅

---

### Phase 2 — V1 App Development (Stabilisasi & UX polish minimal)
*(Fokus: memastikan Guided Tour stabil, tidak stuck, dan siap dipakai sebagai onboarding nyata.)*

**User stories (V1 stability)**
1. Sebagai user, saya ingin membuka Help & Tours kapan saja tanpa UI lag.
2. Sebagai user, saya ingin bisa menutup tour dengan aman tanpa mengubah state halaman.
3. Sebagai user, saya ingin tour tidak mengganggu navigasi/tab WMS & Orders.
4. Sebagai user, saya ingin tour auto-navigate mengikuti flow sehingga step tidak mentok.
5. Sebagai user, saya ingin tooltip tidak terpotong (selalu di viewport) meskipun halaman scroll.

**Langkah**
- Guided tour reliability upgrade
  - Update `/app/frontend/src/components/GuidedTour.jsx`:
    - Tambahkan `before` action (auto-click) untuk auto-navigate.
    - Tambahkan polling target (wait until element appears, timeout default 2.5s).
    - Tambahkan dukungan `target` berupa testid **atau CSS selector**.
    - Tambahkan `optional` step yang auto-skip bila target tidak ada.
    - Tambahkan `placement: "center"` untuk step info-only.
    - Perbaiki positioning (fixed coords) + viewport clamping/flip agar tooltip tidak off-screen.
- Data-testid alignment
  - Tambahkan data-testid yang diperlukan tour.
- Perbarui tourDefinitions agar mengikuti flow nyata dan selalu punya target valid.

**Testing akhir fase**
- End-to-end screenshot test untuk flow utama.

**Status Phase 2: COMPLETED** ✅

---

### Phase 3 — Feature Expansion (On-demand)
*(Pembayaran dibatalkan; fase ini difokuskan pada data readiness + dokumentasi + roadmap.)*

**Langkah (dikerjakan)**
- Seed data realism upgrade
- Dokumentasi komprehensif

**Status Phase 3: COMPLETED** ✅

---

### Phase 4 — System Cleanup & Production Readiness
*(Baseline kebersihan sistem untuk persiapan scaling development.)*

**Catatan status terbaru**
- Context scripts sudah ada: `/app/scripts/load_context.sh` dan `/app/scripts/validate_compliance.py`.
- Validator menemukan beberapa file frontend >500 lines dan warning minor.
- Cleanup besar ditunda sampai user meminta (karena prioritas konsultasi & modul discovery sudah selesai).

**Phase 4A — Documentation Foundation** ✅
- PRD / SESSION_LOG / TECH_DECISIONS / KN_08–KN_13 tersedia.

**Phase 4D — Automation Tools** ✅
- `validate_compliance.py` dan `check_nav_map.py` tersedia.

**Phase 4E — Frontend Modularization** ✅ COMPLETED (Session #013 — Tech Debt Paydown)
- Monster files (FAIL) di-refactor menjadi sub-komponen colocated:
  - `features/wms/TransferManagement.jsx` 548 → 266 (sub: `transfer/`)
  - `features/wms/InventoryStockView.jsx` 503 → 216 (sub: `inventory/`)
- Near-limit files di-split:
  - `features/discovery/DiscoveryAdmin.jsx` 485 → 192 (sub: CreateSessionDialog, DiscoveryStatsBanner, DiscoverySessionCard, discoveryFormat)
  - `features/discovery/components/QuestionField.jsx` 438 → 171 (extract `QuestionInput.jsx`)
  - `data/tourDefinitions.js` 341 → 55 (split per-domain `tours/`)
  - `App.css` 527 → 9 (split `styles/` partials)
  - `components/CoreWidgets.jsx` 164 → 121 (extract `LoginScreen.jsx`)
- UX migration backlog (ux_audit) **15 ERROR → 0 ERROR**: loading/empty states ditambah di OrdersView, OrderDashboard, SalesPortal, DocumentsView, AdminView, ProductDetail (+ guardrail heuristic FORM_HINTS refinement).
- Doc/script sync: ENTITY_REGISTRY.md ditambah detail discovery_* ; `validate_compliance.py` known_collections + valid_prefixes di-sync untuk domain discovery.
- **Hasil gates:** validate_compliance **54 PASS / 0 FAIL / 0 WARN**, ux_audit **0 ERROR**, verify_contract OK, data_integrity 64/0/0, endpoint_sweep 0×5xx, api_contract OK.
- **Testing:** regression test (testing agent) — backend 19/19, frontend semua komponen refactor + loading states verified, **0 bug**. `/app/test_reports/iteration_2.json`.

**Status Phase 4: COMPLETED** ✅

---

## FASE 0.5 — ENABLER: Roll-as-SSOT Inventory Ownership (Status: ✅ ENABLER IMPLEMENTED — Session #016)

### Yang diimplementasikan (fondasi/enabler, sesuai KN_15 §13)
- **`inventory_rolls`** (prefix `roll_`) = SSOT fisik. `inventory_balances` jadi PROYEKSI 3-key `(product_id+warehouse_id+owner_entity_id)` dengan bucket DETAIL (available/reserved/committed/picked/packed/quarantine/blocked/damaged → on_hand + transit + derived owned/incoming/atp).
- **`services/roll_service.py`**: `rebuild_balance()`/`rebuild_all_balances()`, `generate_rolls_from_balances()` (migrasi sintetis idempotent — KN_15 §11), `allocate_and_reserve_rolls()` (owner-scoped + FEFO + single-warehouse preference + split roll), `release_order_rolls()`, `set_order_rolls_status()`.
- **Reservasi LEVEL ROLL & OWNER-SCOPED**: SO hanya boleh mereservasi roll milik `entity_id` penjual (D3). create→reserve, approve→commit, cancel/release→available. Konservasi panjang terjaga.
- **Endpoint**: `GET /api/inventory/rolls` (filter owner/lot/status/warehouse), `/api/inventory/balances` owner-aware (+`owner_entity_name`), `POST /api/inventory/initial-stock` membuat roll, `GET /api/products/{id}/stock-breakdown` + `ownership_matrix` (owner×wh×lot) + `rolls[]`.
- **Frontend**: WMS Stok tab kolom **Pemilik** + banner konteks; tab **Rolls** (RollsTable); InitialStockForm + Pemilik/Lot/Grade; Sales ProductDetail **Ownership Matrix**; filter owner mengikuti Entity Switcher global.
- **Gates**: `verify_contract` register `inventory_rolls`; `verify_data_integrity` + L4-ROLL (proyeksi balance==Σrolls, length valid, ref owner/lot, owner-scoped D3) → **72 PASS/0/0**; `validate_compliance` + `inventory_rolls`; FE↔BE contract OK. POC `tests/poc_roll_reservation.py` **18/18 PASS**.
- ENTITY_REGISTRY: `inventory_rolls` + balances buckets di-flip **PROPOSED → IMPLEMENTED**.

### Sub-fase 1.4 (ATP & Fulfillment Modes) — ✅ SELESAI (Session #019, READ-ONLY)
- **`services/fulfillment_service.py`** (BARU): classifier mode pemenuhan per baris SO — waterfall `from_stock → from_incoming(ATP) → inter_company → backorder` (primary_mode by severity); `build_supply_index` (balances + open-PO on_order) ; `status_board` (per produk × entitas × gudang + indikator inter-company). ATP = available + incoming (incoming dari PO terbuka termasuk 'receiving' − received_qty).
- **Endpoint**: `POST /api/sales-orders/preview-allocation` (READ-ONLY, order:view) · `GET /api/inventory/status-board` (product:view). `schemas.py` +`AllocationPreviewIn`. health_check +status-board.
- **Frontend**: CartPanel `FulfillmentInfo` (badge mode + ATP/Stok/Incoming/Inter-Co + backorder + penjelasan) per item via preview-allocation (debounce 350ms); menu **"Status Stok"** (`InventoryStatusBoard.jsx`) tabel per produk + expand entitas/gudang + metrik + search; `utils/fulfillment.js` (SSOT meta), `.fmode-*` pills.
- **Verifikasi**: POC `tests/poc_atp_fulfillment.py` 5/5; testing_agent backend 21/21, frontend 17/18 (1 isu LOW selector, bukan bug). Gate: data_integrity 85/0, health 22/0, api_contract 0 err, sweep 0×5xx, ux 0 ERROR.

### Sub-fase 1.5 (Inter-Company Transfer Flow) — ✅ SELESAI (Session #020, MUTASI)
- **Backend** (ADDITIVE, MUTASI STOK):
  - `routers/transfers.py` diperluas: `POST /api/transfers/inter-company` (buat transfer `transfer_kind: inter_entity`; roll-reserve di sumber; status `pending_approval`); `POST /api/transfers/{id}/approve` (pindah kepemilikan B→E S3: owner_entity_id roll di sumber dipindah ke dest_entity + rebuild_balance keduanya; status `completed`); `POST /api/transfers/{id}/reject` (lepas reservasi roll sumber; status `rejected`); `DELETE /api/transfers/{id}` (cancel + lepas reservasi bila masih waiting).
  - `GET /api/transfers?transfer_kind=inter_entity` filter list hanya inter-entity.
  - Skema baru: `InterCompanyTransferCreate` (source/dest entity, items list, notes).
- **Frontend**:
  - `features/transfers/InterCompanyTransfers.jsx` (BARU, 265 baris): halaman management — list transfer antar-entitas + approve (manager/admin) + reject + badge status (pending/completed/rejected).
  - `features/sales/SalesPortal.jsx`: `handleRequestTransfer` → call `POST /api/transfers/inter-company` dari POS saat mode `inter_company`.
  - `components/CartPanel.jsx`: tombol "Minta Transfer dari {entity}" + badge "Transfer diminta — menunggu approval" setelah request.
  - `config/navigationConfig.js`: route `interco-transfers` "Transfer Antar-Entitas" untuk role warehouse/manager/admin.
  - `App.js`: render `<InterCompanyTransfers>` saat `activeView === "interco-transfers"`.
- **Verifikasi**: testing_agent backend **36/36 (100%)** — create/approve/reject/cancel/list + permission checks; skenario utama KSC→Kanda (ownership movement + stock conservation + preview mode changes). Frontend code review 100%. Gate: data_integrity 85/0, health 22/0, sweep 0×5xx. Laporan: `test_reports/iteration_8.json`.

### Belum (Fase 1 — Sales lanjutan)
- **backorder lifecycle** (status waiting_stock + auto-fulfill saat GR), algoritma alokasi configurable (R1/R2 policy), mixed-lot confirmation UI, pegging/earmarking, HPP/`unit_cost` (Fase 4). Catatan: backorder saat ini INFORMASIONAL di POS; create_order masih owner-scoped (409 bila stok sendiri kurang).

---

## NEW PHASE — Discovery E‑Questionnaire Module (Status: COMPLETED ✅ v2.0)

### Phase Goals
- Membuat **web app terpisah** “Discovery Questionnaire” untuk klien, berbasis sistem yang sama.
- Akses via link: `https://<domain>/discovery/<session_id>` tanpa login.
- **Per-domain breakdown** agar tidak menjadi 1 form panjang.
- Pertanyaan critical, relevan ke development ERP KN, **tanpa domain Production**.
- Setiap pertanyaan:
  - `answer_type` sesuai (radio/checkbox/text/number/scale/yes_no).
  - Ada **help text non-teknis**.
  - `optional` dan dapat di-skip.
- Auto-save jawaban (draft) + resume.
- Sistem membuat:
  - Ringkasan jawaban per domain.
  - Submit Final (lock).
  - Export **PDF profesional**.

### Scope Domain untuk KN (14 Domain)
Mengacu struktur 15 domain assessment, dengan penyesuaian:
- Tetap gunakan domain-domain strategis, process, tech, governance, execution.
- **Hapus Domain Production/Manufacturing**.
- Fokus pertanyaan yang actionable untuk implementasi: sales, purchase, inventory/WMS, finance, RFID, integration, data migration, infra, security, change mgmt, training, timeline.

### Technical Approach

#### Backend (Delivered v1 + Enhancements v2.0)
- Router: `routers/discovery.py` prefix `/api/discovery`
- MongoDB collections:
  - `discovery_sessions` (UUID token, status: draft/submitted/archived, `acknowledged_at`)
  - `discovery_answers` (session_id, question_id, value, skipped, updated_at)
  - `discovery_attachments` (session_id, question_id, file metadata)
- Dataset statis (version-controlled):
  - `/app/backend/services/discovery_questions.py` → 14 domain × 82 pertanyaan
  - Branching helper: `evaluate_show_if()` + `filter_visible_questions()`
- File upload service:
  - `/app/backend/services/discovery_attachments.py` (NEW)
  - Storage: `/app/uploads/discovery/<session_id>/<uuid>.<ext>`
  - Rule: max 10MB/file; allowed: PDF/PNG/JPG/JPEG/XLSX/DOCX; max 5 file/pertanyaan

**Endpoints (Delivered v2.0):**
- Questionnaire
  - `GET  /api/discovery/questions`
- Sessions
  - `POST /api/discovery/sessions`
  - `GET  /api/discovery/sessions/{session_id}` (include `attachments` grouped by question_id)
  - `PATCH /api/discovery/sessions/{session_id}/answers`
  - `POST /api/discovery/sessions/{session_id}/submit` (lock + reset acknowledged_at)
  - `POST /api/discovery/sessions/{session_id}/acknowledge` (admin clear “New”)
  - `GET  /api/discovery/sessions/{session_id}/export.pdf` (PDF includes attachments list; hidden questions excluded)
  - `GET  /api/discovery/sessions` (admin list; include `is_new_submission`)
  - `GET  /api/discovery/stats` (admin banner)
  - `DELETE /api/discovery/sessions/{session_id}` (cascade delete answers + attachments + folder)
- Attachments
  - `GET  /api/discovery/sessions/{session_id}/attachments`
  - `POST /api/discovery/sessions/{session_id}/attachments` (multipart: question_id + file)
  - `GET  /api/discovery/sessions/{session_id}/attachments/{attachment_id}/download`
  - `DELETE /api/discovery/sessions/{session_id}/attachments/{attachment_id}`

- PDF rendering:
  - ReportLab (`reportlab==4.5.1`)
  - Output: profesional (cover + summary table + per-domain detail + closing)
  - **Branching-aware** (hidden question tidak tampil)
  - **Attachment-aware** (lampiran muncul per question)

#### Frontend (Delivered v1 + Enhancements v2.0)
- Standalone app: `/discovery/*` tanpa login.
- Bootstrap routing di `/app/frontend/src/index.js`:
  - Jika pathname mulai `/discovery` → render `DiscoveryApp`
  - Else → render app ERP existing

**UI features (v2.0):**
- Client App
  - Dashboard domain cards + progress ring
  - Domain form: question cards, input sesuai type, skip/clear, help tooltip
  - **Branching:** `branching.js` filter visible question + banner info hidden
  - **Attachments:** `AttachmentUploader` per question (upload, list, download, delete)
  - Auto-save indicator di header
  - Summary view: review semua jawaban (branching-aware) + tampil badge lampiran
  - Submit Final + Export PDF
- Admin Console (Vendor)
  - Create session, copy link, open, PDF, delete
  - **Stats banner:** total sessions, submitted, draft, new submissions, latest submission
  - **New badge:** “Baru!” untuk submission yang belum di-acknowledge
  - Button “Tandai Sudah Dibaca” (acknowledge)
  - Auto-refresh 30 detik

### Security & Governance
- Session ID = token (no login).
- Guardrails:
  - Validasi UUID format (400 invalid format, 404 not found).
  - Session lock setelah submit (403 untuk edit answers dan upload/delete attachment).

### Implementation Steps (Incremental)

**v1 (COMPLETED)**
- Step 0 — Confirm baseline ✅
- Step 1 — Data model + router skeleton (Backend) ✅
- Step 2 — Answer autosave (Backend) ✅
- Step 3 — Discovery Frontend Shell ✅
- Step 4 — Input types + help text ✅
- Step 5 — PDF Export ✅
- Step 6 — Summary + submission ✅
- Step 7 — Testing ✅ (backend 15/15, frontend screenshot smoke test)

**v2.0 Enhancements (COMPLETED)**
- Step 8 — Branching logic
  - Add `show_if` rules to dataset (5 rules)
  - Backend: progress + PDF filter visible questions
  - Frontend: filter visible questions + banner info
- Step 9 — Admin notification
  - Backend: `acknowledged_at`, `GET /stats`, `POST /acknowledge`, `is_new_submission`
  - Frontend: stats banner + “Baru!” badge + acknowledge button
- Step 10 — File upload (local)
  - Backend: new attachment service + endpoints + cascade delete
  - Frontend: AttachmentUploader per question + badges in summary
  - PDF: lampiran listed per question
- Step 11 — Testing v2.0 ✅ backend **34/34** (iteration_3.json)

### Phase Completion Criteria
- ✅ Vendor dapat create session dan mendapatkan link shareable.
- ✅ Klien membuka link tanpa login.
- ✅ Per-domain navigation, tidak jadi satu form panjang.
- ✅ Semua pertanyaan punya help text.
- ✅ Auto-save + resume berjalan.
- ✅ Summary view + Submit Final (lock).
- ✅ Export PDF menghasilkan dokumen profesional.
- ✅ Branching logic bekerja (question show/hide) + progress dihitung dari visible questions.
- ✅ Admin notification bekerja (stats + badge “Baru!” + acknowledge).
- ✅ File upload bekerja (10MB, 5 types, 5/question, cascade delete).
- ✅ Backend tests pass (34/34).

**Dokumentasi modul:** `/app/docs/DISCOVERY_MODULE.md`

---

## Completed Work (as of latest session)
- ✅ Context preservation scripts: `load_context.sh` + `validate_compliance.py`.
- ✅ Comprehensive ERP Assessment (15 domain) dibuat (4 file) di `/app/docs/`.
- ✅ Executive Summary Deck dibuat: `/app/docs/EXECUTIVE_SUMMARY_DECK.md`.
- ✅ Discovery E‑Questionnaire Module built + documented (v1) + tested:
  - Tests: `/app/test_reports/iteration_2.json` (100% backend pass)
- ✅ Discovery Module v2.0 Enhancements shipped + documented + tested:
  - Branching logic (per question)
  - Admin notification (in-app)
  - File upload (local filesystem)
  - Tests: `/app/test_reports/iteration_3.json` (34/34 backend pass)
- ✅ **FASE 1A — Configuration Foundation** (Session prior): `system_settings`/`payment_terms`/`approval_rules` + `config_service` (compute_tax, evaluate_approval, effective settings) + SettingsPanel (Admin → Pengaturan).
- ✅ **FASE 1B — Configuration Consumption** (Session #018): konfigurasi DIKONSUMSI alur nyata:
  - PPN otomatis (DPP/PPN/Grand Total, ikut PKP/non-PKP entitas, mode excluded/included) di Sales Order + Invoice + dokumen.
  - Diskon per-item & per-order (dikontrol toggle settings), term pembayaran dipilih saat buat SO + tampil di dokumen.
  - Approval SO & PO DINAMIS dari `approval_rules` (role_satisfies; auto-approve di bawah threshold; PO inbound task ditunda sampai approve).
  - INVARIAN-SAFE: `item.subtotal=price×qty` & `total_amount=Σsubtotal` tetap GROSS; breakdown di field terpisah.
  - Gate baru INV-DB3 (konsistensi PPN+diskon). Bug fix: ObjectId-embed di order.payments. Seed backfill agar 0 FE↔BE drift.
  - Backlog Critical PRD #2 (diskon) & #3 (PPN 11%) → SELESAI.

---

## Next Actions
**Menunggu arahan user (Vendor IT):**
1. **Fase 1B follow-up (opsional):** split `PurchaseOrderManagement.jsx` (455 baris/90% limit), auto-reservation expiry job (Critical #1), master data validation (#4), order draft auto-save (#5).
2. **Lanjut Fase berikut** (KN_DEVELOPMENT_PLAN_FROM_ASSESSMENT): Fase 2 HRD · Fase 3 Procurement (Supplier Master) · Fase 4 Finance (GL/AP/AR, HPP) · Fase 5 Warehouse+RFID.
3. **Fase 1 Sales lanjutan** (Sub-fase 1.4 ✅ S#019, Sub-fase 1.5 ✅ S#020, Sub-fase 1.6 ✅ S#021, **Sub-fase 1.7 ✅ S#022**). Sub-fase 1.7 SELESAI: allocation policy R1–R4 configurable + mixed-lot confirmation UI + **pegging/earmarking (soft hold roll→customer, anti-rebutan)**. Berikutnya: pengiriman parsial fisik backorder, Faktur Pajak Jual (1.9), Return (1.11), Special Order (1.12), UOM conversion (1.13).

### Arsip Next Actions (Discovery / arsitektur — masih relevan)
- Pilot rollout discovery ke klien nyata; v3 enhancements (multi-PIC, email/WA notif, analytics, versioning).
- Arsitektur core ERP (tanpa coding): Redis stock-lock+cache, WebSocket manager, RFID edge agent (MQTT).

---

## Success Criteria
- Guided Tour (legacy objectives) tetap stabil dan tidak regress.
- Discovery Module v2.0:
  - Link tanpa login bekerja (token URL).
  - Pertanyaan per domain, critical only, Production removed.
  - Help text non-teknis tersedia.
  - Klien dapat skip.
  - Auto-save + resume.
  - Summary view + submit final.
  - Export PDF profesional.
  - **Branching**: show/hide relevansi berjalan, progress dihitung dari visible questions.
  - **Admin notification**: stats banner + badge “Baru!” + acknowledge.
  - **File upload**: 10MB max, allowed types, 5/question, submit lock, cascade delete.
- Quality/Compliance:
  - Tidak menambah monster files baru.
  - `validate_compliance.py` tidak menambah failure baru dari modul Discovery.
  - Backend discovery endpoints stabil (tested 34/34).

---

## 🆕 SESI LANJUTAN — FASE 1 (SALES & MARKETING) — Eksekusi bertahap

> Konteks: kode KN7 dimigrasi ke `/app`, semua dokumen dibaca (lihat
> `memory/SYSTEM_MAPPING_REVIEW.md`). Urutan eksekusi diputuskan agent;
> dikerjakan LENGKAP + upload bukti (object storage). Catatan penting:
> bagian "Discovery" di plan.md ini SUDAH USANG (modul dihapus 17 Jun 2026).

### Rencana 6 sub-fase
1. **Sub-fase 1.7 — Object Storage + Special Price / Approval Harga** ✅ SELESAI
2. **Sub-fase 1.8 — Status SO diperluas + Partial/Multi Physical Shipment + Surat Jalan** ✅ SELESAI (S#023, WIP dipulihkan dari GitHub KN8 commit 4fcde29 lalu diverifikasi)
3. Sub-fase 1.9 — Faktur Pajak Jual (`tax_invoices`/fkt_) + dokumen ✅ SELESAI (Session #025 — restore KN8 + wiring FE selesai)
4. Sub-fase 1.10 — Pengiriman parsial fisik backorder + allocation policy R1/R2 (belum dimulai)
5. Sub-fase 1.11 — Return & Barang Sisa (`sales_returns`/sret_) + upload bukti ✅ SELESAI (kode sudah ada, seed ditambahkan Session #026)
6. Sub-fase 1.12 — Special Order (`special_orders`/sord_) → Master Data + Purchasing ✅ SELESAI (kode sudah ada, seed ditambahkan Session #026)

### ✅ Sub-fase 1.8 — Extended SO Status + Partial/Multi Physical Shipment (COMPLETED, S#023)
> Recovery: WIP 1.8 awalnya tidak ada di GitHub (belum di-push). User commit (4fcde29) + push ke KN8 `main`; agent rsync ke /app & verifikasi end-to-end.
- **Status SO diperluas (otomatis terderivasi):** confirmed → partially_picked → picked → partially_shipped → shipped (→ done manual via mark-delivered). Engine `services/fulfillment_status.recompute_so_status` (tidak mengganggu status pre-confirm/terminal) + `create_outbound_tasks_for_order` (idempotent, dipicu saat confirm).
- **Partial/Multi Physical Shipment (SSOT-safe):** `services/shipment_service.dispatch_task` — pindahkan roll committed→`in_transit_sales` via `roll_service.ship_order_rolls` (FEFO, split bila parsial, BUKAN $inc balance). Catat 1 record koleksi **`shipments`** (No. Surat Jalan `SJ-#####`) per event dispatch, flag `is_partial`. `ship_qty` opsional (default = sisa ter-pick belum dikirim).
- **Endpoint:** POST `/api/outbound/tasks/{id}/dispatch?ship_qty=` (parsial/penuh), GET `/api/shipments?order_id=`, GET `/api/shipments/{id}/surat-jalan` (HTML, banner pengiriman parsial). `mark-delivered` → roll in_transit_sales→delivered + SO done.
- **Frontend:** `OrderDetailPanel.jsx` Status Timeline diperluas + section "Pemenuhan & Pengiriman" (ff-total/ff-shipped/ff-remaining + daftar `shipment-row-{id}` + tombol Surat Jalan `shipment-sj-btn-{id}`); `OutboundScanInterface.jsx` `dispatch-panel` (qty input + Kirim Sebagian/Kirim Semua); OrdersView status breakdown (Dikirim).
- **Invarian baru (verify_data_integrity):** fulfillment qty konsisten (total/picked/shipped); status SO terderivasi sesuai progres task; shipments tercatat. Koleksi `shipments` terdaftar di CANONICAL_COLLECTIONS.
- **QA:** seed_reset 92/0/0, verify_api_contract 0/0, validate_compliance 58/0/0, ux_audit 0 ERROR, health 20/0, sweep 0×5xx, esbuild bersih, `tests/test_shipment_18.py` 20/20, testing_agent_v3 iteration_3 BE 100% (20/20) / FE 0 bug. Screenshot UI: SO-0002 timeline s/d Shipped + multi-shipment SJ-00002/SJ-00003.

### ✅ Sub-fase 1.7 — Special Price / Approval Harga (COMPLETED)
- Koleksi baru **price_approvals** (pra_) terdaftar di CANONICAL_COLLECTIONS + ENTITY_REGISTRY (IMPLEMENTED).
- Backend: `routers/price_approvals.py` (CRUD + submit/approve/reject + attachments + effective lookup),
  `services/storage_service.py` (Emergent Object Storage, reusable), integrasi `price_approval_id`
  ke `routers/sales_orders.py` (override harga, INVARIAN subtotal=price×qty aman).
- Permissions: modul `price_approval` (sales own-only; manager/admin approve/reject).
- Frontend: `features/sales/PriceApprovals.jsx` (kelola + upload bukti) + POS auto-apply harga khusus
  (badge di CartPanel). Nav "Approval Harga" untuk sales/manager/admin.
- Seed: 2 contoh (1 approved + 1 pending). EMERGENT_LLM_KEY ditambahkan ke backend/.env (object storage).
- QA: seed_reset 86 PASS/0 FAIL, verify_contract OK, verify_api_contract OK, health 20/0, sweep 0×5xx,
  testing_agent backend 28/30 (0 bug kode), frontend lulus. Verifikasi POS via screenshot (Rp157.250 vs Rp185.000).


### ✅ Sub-fase 1.7b — Allocation Policy R1–R4 + Mixed-Lot + Pegging/Earmark (COMPLETED, S#022)
> Catatan: di SESSION_HANDOFF dinomori "Sub-fase 1.7" (allocation/pegging). WIP dipulihkan dari GitHub KN7 (commit 790f781); FE wiring pegging diselesaikan sesi ini.
- **Allocation policy (configurable, READ-ONLY planner + reservasi):** `roll_service._build_allocation_plan` + `allocate_and_reserve_rolls(policy=...)`.
  - R3 `lot_selection`: fefo / fifo / smallest_fit / largest_fit.
  - R4 `lot_mode`: prefer_single (campur → minta konfirmasi) / strict_single (tak boleh campur → parsial) / allow_mixed (campur tanpa konfirmasi).
  - `location_pref`: single_warehouse / nearest_customer / fewest_splits. Kebijakan disimpan di system_settings (SettingsPanel).
- **Mixed-Lot Confirmation UI:** `MixedLotConfirmModal.jsx` di CartPanel — muncul saat prefer_single tapi qty butuh >1 lot; backend gerbang 409 `MIXED_LOT_CONFIRMATION_REQUIRED` (defense-in-depth).
- **Pegging/Earmark (soft hold):** `routers/pegging.py` — `POST/DELETE /api/inventory/rolls/{id}/earmark`, `GET /api/pegging/rolls`. Roll tetap `available` (balance tidak berubah) tapi DIKECUALIKAN dari alokasi customer/order LAIN (anti-rebutan, KN_15 E31) & diprioritaskan utk demand-nya; earmarked_for auto-clear saat reservasi keras. Owner-scoped D3 (customer harus se-entitas dgn roll). Roles: admin/manager/warehouse/sales.
- **Frontend pegging (BARU):** RollsTable kolom Pegging (badge) + Aksi (Peg/Lepas); InventoryStockView modal+handler+bar filter (`pegging-only-toggle`, `pegging-count`, konsumsi GET /pegging/rolls); OperationsView pass customers; PeggingModal owner-scoped customer dropdown.
- **Invarian baru (verify_data_integrity):** earmarked_for terisi ⟹ status 'available'; alokasi lot_mode konsisten (single≤1 lot / mixed≥2 lot); has_mixed_lot ⟺ >1 lot.
- **Seed:** `seed_pegging_examples()` (2 roll contoh, idempotent).
- **QA:** verify_data_integrity 89/0/0, verify_api_contract 0/0 (49 FE path), validate_compliance 56/0/2 WARN (pre-existing price_approvals), ux_audit 0 ERROR, health 20/0, sweep 0×5xx, esbuild bersih, test_allocation_policy_17 19/19, test_pegging_17 12/12, testing_agent_v3 iteration_2 BE/FE/regression 100% (0 bug).


---

## 🆕 Sub-fase 1.13 — UOM CONVERSION ENGINE (Multi-UOM) — DIRENCANAKAN (belum mulai)

> **Asal kebutuhan (RESOLVED di dokumen, belum dijadwalkan):** KN_16 I3, KN_15 E12,
> KN_01 §Multi-UOM, SYSTEM_ANALYSIS, COMPREHENSIVE_ERP_ASSESSMENT (UOM Conversion Table).
> **Status kode saat ini:** `uoms` = CRUD datar (code/name/base_type/precision) TANPA faktor;
> field `product.uom_conversions[]` ADA tapi **tidak dikonsumsi** (placeholder no-op).
> ⚠️ Menyentuh pricing/inventory/SO/PO → pemicu **STOP & ASK** (perubahan alur inti).

### Tujuan
Beli per **roll**, simpan stok per **meter** (base), jual per **meter/yard/kg** — dengan faktor
konversi yang benar & invarian stok tetap aman. "Simpan length dalam base unit" (KN_15 E12).

### Model data (usulan — TIDAK menambah koleksi baru bila bisa)
- **`uoms`** (perluas): tambah `base_type` (length|weight|count|area), `factor_to_canonical`
  (untuk unit FIXED: 1 yard = 0.9144 m, 1 cm = 0.01 m) + `canonical_unit` per base_type.
- **`product.uom_conversions[]`** (aktifkan): konversi **VARIABLE per produk**, mis.
  `{ from_unit:"roll", to_unit:"meter", factor: 50 }` (1 roll = 50 m, beda tiap produk);
  `meter↔kg` via gramasi: `factor = gramasi(gsm) × lebar(m) / 1000` (catch-weight).
- **`product.base_unit`** tetap = unit penyimpanan stok (default meter).
- Field jual/beli: SO item & PO item simpan `unit` + `quantity` (input) **dan** `base_quantity`
  (hasil konversi ke base) → semua reservasi/pengurangan stok pakai `base_quantity`.

### Engine (services/uom_service.py — BARU)
- `to_base(product, qty, unit) -> base_qty` & `from_base(product, base_qty, unit) -> qty`.
- `convert(product, qty, from_unit, to_unit)`; resolusi: fixed (uoms.factor) → variable (product) → error jelas.
- `min_potong` (minimum cut) configurable per produk/unit.
- Pembulatan pakai `precision` UOM; simpan base dalam meter (2 desimal).

### Integrasi (titik sentuh)
1. **Purchasing** (PO terima/GR): qty roll → buat `inventory_rolls` dengan length (meter) hasil konversi.
2. **Inventory/Roll-as-SSOT**: balance & movement SELALU dalam base unit (sudah meter) → konsisten.
3. **Sales Order**: item bisa pilih unit jual (meter/yard/kg); `subtotal = price(per unit jual) × qty`,
   reservasi pakai `base_quantity`. INVARIAN `on_hand=Σbucket` & `balance=Σrolls` tetap dijaga.
4. **Pricing**: harga per unit jual; konsisten dgn diskon/PPN (Fase 1B) & special price (1.7).
5. **UI**: Master Data → editor `uom_conversions` per produk (W2: pakai shadcn Select);
   POS/PO → dropdown unit + tampil ekuivalen base (mis. "10 yard ≈ 9,14 m").

### Invarian baru (untuk verify_data_integrity)
- `base_quantity == to_base(unit, quantity)` (toleransi precision) pada setiap SO/PO item.
- Tidak ada konversi tanpa faktor (faktor 0/None → tolak 400, bukan diam-diam pakai 1).
- Reservasi/stock movement HANYA dalam base unit; tidak ada qty unit-campur di balances.

### Definition of Done
- uom_service + unit test konversi (roll↔meter, yard↔meter fixed, meter↔kg via gramasi, min potong).
- seed contoh konversi pada produk (mis. Batik 1 roll = 50 m; jual meter/yard).
- Gate hijau: verify_contract, verify_api_contract, verify_data_integrity (+invarian baru),
  ux_audit 0 ERROR, validate_compliance 0 FAIL, endpoint_sweep 0×5xx.

### Catatan urutan
Konversi UOM bersifat **fondasi lintas-modul**. Bisa dinaikkan prioritasnya SEBELUM 1.8 bila
penjualan multi-unit dibutuhkan segera, atau tetap setelah item Sales lain. **Menunggu keputusan user.**


---

## 📌 Session #027 — Status Update (UOM + KNSelect)

- ✅ **P0 KNSelect empty-value crash** — FIXED (sentinel "" ↔ "__empty__") + RCA (Radix v2.2.2 hard-guard). Verified iteration_8.
- ✅ **KNSelect searchable/typeahead** — combobox otomatis untuk ≥6 opsi. Verified iteration_9.
- ✅ **Sub-fase 1.10 (pengiriman parsial fisik)** — DITUTUP (sudah ada di 1.8; partial shipment diperbolehkan, tanpa enforcement policy).
- ✅ **Sub-fase 1.13 (UOM Conversion Engine)** — SELESAI: engine + create_order (base_quantity, reservasi base, harga skala) + preview + GR + invarian + unit test + FE POS cart unit selector. Verified iteration_10 (100%).
  - DEFERRED: editor uom_conversions per produk di UI (belum ada Master Data produk form).

- ✅ **1.13 lanjutan — UI editor uom_conversions + kg/catch-weight** — SELESAI: form Master Data Produk dapat field Lebar + editor konversi + mode Edit; unit kg otomatis (gramasi×lebar/1000). Demo: batik gramasi=200 lebar=1.5. Verified iteration_11 (100%).
