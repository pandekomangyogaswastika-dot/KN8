import { useEffect, useState } from "react";
import axios, { API } from "../../services/apiClient";
import { BadgePercent, CheckCircle, XCircle, RefreshCw, ClipboardList } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

/**
 * PurchaseApprovalView (Fase 3 — Approval Pembelian).
 * Workflow approval bertingkat untuk Purchase Order (role dinamis dari approval_rules).
 * Menggunakan endpoint /purchase-orders/{id}/approve | /reject.
 */
const TABS = [
  { key: "waiting", label: "Menunggu" },
  { key: "approved", label: "Disetujui" },
  { key: "rejected", label: "Ditolak" },
];

function matchTab(po, tab) {
  if (tab === "waiting") return po.status === "waiting_approval";
  if (tab === "approved") return po.approval_status === "approved";
  if (tab === "rejected") return po.status === "rejected";
  return true;
}

export default function PurchaseApprovalView({ currentUser, selectedEntity }) {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("waiting");
  const [busyId, setBusyId] = useState(null);

  const canApprove = ["admin", "manager"].includes(currentUser?.role);

  useEffect(() => { loadPOs(); }, [selectedEntity]); // eslint-disable-line

  async function loadPOs() {
    setLoading(true);
    try {
      const params = (selectedEntity && selectedEntity !== "all") ? { entity_id: selectedEntity } : {};
      const res = await axios.get(`${API}/purchase-orders`, { params });
      setPos(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (e) {
      setError(e.response?.data?.detail || "Gagal memuat purchase order.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(po) {
    setBusyId(po.id);
    try {
      await axios.post(`${API}/purchase-orders/${po.id}/approve`);
      setNotice(`PO ${po.po_number} disetujui. Inbound task otomatis dibuat.`);
      await loadPOs();
    } catch (e) {
      setError(e.response?.data?.detail || "Gagal approve PO.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(po) {
    const reason = window.prompt(`Alasan menolak PO ${po.po_number}?`, "");
    if (reason === null) return;
    setBusyId(po.id);
    try {
      await axios.post(`${API}/purchase-orders/${po.id}/reject`, { reason });
      setNotice(`PO ${po.po_number} ditolak.`);
      await loadPOs();
    } catch (e) {
      setError(e.response?.data?.detail || "Gagal reject PO.");
    } finally {
      setBusyId(null);
    }
  }

  const counts = {
    waiting: pos.filter((p) => matchTab(p, "waiting")).length,
    approved: pos.filter((p) => matchTab(p, "approved")).length,
    rejected: pos.filter((p) => matchTab(p, "rejected")).length,
  };
  const filtered = pos.filter((p) => matchTab(p, tab));

  return (
    <div data-testid="purchase-approval-view">
      {notice && <div className="notice-bar success" data-testid="po-approval-notice"><span>{notice}</span><button onClick={() => setNotice("")}>×</button></div>}
      {error && <div className="notice-bar danger" data-testid="po-approval-error"><span>{error}</span><button onClick={() => setError("")}>×</button></div>}

      <div className="section-card mb-3">
        <div className="section-head">
          <div className="flex items-center gap-2 min-w-0">
            <BadgePercent size={16} className="text-[#0058CC]" />
            <h2 data-testid="purchase-approval-title">Approval Pembelian</h2>
          </div>
          <button data-testid="po-approval-refresh" onClick={loadPOs} className="secondary-button">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Muat Ulang
          </button>
        </div>
        <div className="section-body">
          <div className="tab-bar">
            {TABS.map((t) => (
              <button key={t.key} data-testid={`po-approval-tab-${t.key}`}
                className={`tab-button ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                {t.label}<span className="tab-badge">{counts[t.key]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="overflow-hidden">
          <div className="grid grid-cols-[80px_1.3fr_120px_110px_120px_140px] px-3 py-1.5 bg-[#FAFBFC] text-[10px] font-bold uppercase text-[#6B6B73] border-b border-[#EFF0F2]">
            <span>Nomor</span><span>Supplier / Gudang</span><span className="text-right">Total</span><span>Butuh Role</span><span>Status</span><span className="text-right">Aksi</span>
          </div>
          {loading ? (
            <div className="py-10 text-center text-[12px] text-[#6B6B73]">Memuat purchase order...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[12px] text-[#6B6B73]">
              <ClipboardList className="mx-auto mb-2 text-gray-300" size={28} />
              <p>Tidak ada PO {TABS.find((t) => t.key === tab)?.label.toLowerCase()}.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#EFF0F2] max-h-[600px] overflow-y-auto">
              {filtered.map((po) => (
                <div key={po.id} data-testid={`po-approval-row-${po.id}`}
                  className="grid grid-cols-[80px_1.3fr_120px_110px_120px_140px] items-center px-3 py-2.5 hover:bg-[#FAFBFC]">
                  <span className="text-[11.5px] font-bold text-[#0058CC]">{po.po_number}</span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold truncate">{po.supplier_name}</p>
                    <p className="text-[10.5px] text-[#6B6B73] truncate">{po.warehouse_name} · {po.items?.length || 0} item</p>
                  </div>
                  <span className="text-[12px] font-bold tabular-nums text-right">{formatCurrency(po.total_amount)}</span>
                  <span className="text-[11px] uppercase font-semibold text-[#A05000]">{po.required_approval_role || "—"}</span>
                  <ApprovalStatusPill po={po} />
                  <div className="flex items-center justify-end gap-1.5">
                    {po.status === "waiting_approval" && canApprove ? (
                      <>
                        <button data-testid={`po-approve-${po.id}`} disabled={busyId === po.id}
                          onClick={() => handleApprove(po)} className="primary-button !px-2.5 !py-1 text-[11px]">
                          <CheckCircle size={12} /> Setujui
                        </button>
                        <button data-testid={`po-reject-${po.id}`} disabled={busyId === po.id}
                          onClick={() => handleReject(po)} className="danger-button !px-2.5 !py-1 text-[11px]">
                          <XCircle size={12} /> Tolak
                        </button>
                      </>
                    ) : (
                      <span className="text-[10.5px] text-[#9A9BA3]">
                        {po.approved_by ? `oleh ${po.approved_by}` : po.rejected_by ? `oleh ${po.rejected_by}` : "—"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApprovalStatusPill({ po }) {
  let cls = "pill-muted", label = "—";
  if (po.status === "waiting_approval") { cls = "pill-warning"; label = "Menunggu"; }
  else if (po.status === "rejected") { cls = "pill-danger"; label = "Ditolak"; }
  else if (po.approval_status === "approved") { cls = "pill-success"; label = "Disetujui"; }
  return <span data-testid={`po-approval-pill-${po.id}`} className={`status-pill ${cls}`}>{label}</span>;
}
