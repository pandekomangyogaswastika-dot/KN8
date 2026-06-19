/**
 * Approval Inbox
 * Centralized dashboard untuk pending approvals
 */
import { useState, useEffect } from "react";
import axios from "axios";
import {
  AlertCircle, Bell, Check, CheckCircle2, Clock, FileText, Loader2, Search, X
} from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

// Helper
function fmtNum(n) {
  return new Intl.NumberFormat("id-ID").format(n || 0);
}

function fmtDate(s) {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const ENTITY_TYPE_LABELS = {
  special_order: "Special Order",
  purchase_order: "Purchase Order",
  transfer: "Transfer",
  price_approval: "Price Approval",
  invoice: "Invoice",
};

const STATUS_STYLE = {
  pending: { cls: "pill-warning", label: "Pending" },
  approved: { cls: "pill-success", label: "Approved" },
  rejected: { cls: "pill-danger", label: "Rejected" },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || { cls: "pill-muted", label: status };
  return <span className={`status-pill ${s.cls}`}>{s.label}</span>;
}

export default function ApprovalInbox({ currentUser }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const token = localStorage.getItem("kn_token");
  const canApprove = ["manager", "admin"].includes(currentUser?.role);

  useEffect(() => {
    loadApprovals();
  }, [statusFilter]);

  async function loadApprovals() {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      params.append("my_approvals", "true"); // Only show approvals for user's role

      const res = await axios.get(`${API}/api/approval-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApprovals(res.data || []);
      setError(null);
    } catch (e) {
      setError("Gagal memuat approvals: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(approval) {
    if (!window.confirm(`Approve ${approval.entity_number}?`)) return;

    try {
      await axios.post(
        `${API}/api/approval-requests/${approval.id}/approve`,
        { notes: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotice(`${approval.entity_number} berhasil di-approve!`);
      loadApprovals();
    } catch (e) {
      setError("Gagal approve: " + (e.response?.data?.detail || e.message));
    }
  }

  async function handleReject() {
    if (!selectedApproval || !rejectReason.trim()) return;

    try {
      await axios.post(
        `${API}/api/approval-requests/${selectedApproval.id}/reject`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotice(`${selectedApproval.entity_number} ditolak.`);
      setShowRejectModal(false);
      setSelectedApproval(null);
      setRejectReason("");
      loadApprovals();
    } catch (e) {
      setError("Gagal reject: " + (e.response?.data?.detail || e.message));
    }
  }

  const filteredApprovals = approvals.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.entity_number || "").toLowerCase().includes(q) ||
      (a.entity_type || "").toLowerCase().includes(q) ||
      (a.metadata?.customer_name || "").toLowerCase().includes(q)
    );
  });

  if (!canApprove) {
    return (
      <div className="view-container">
        <div className="notice-bar info">
          <AlertCircle size={14} /> Anda tidak memiliki akses untuk approve/reject.
        </div>
      </div>
    );
  }

  return (
    <div data-testid="approval-inbox" className="view-container">
      {/* Notice */}
      {notice && (
        <div className="notice-bar success">
          <CheckCircle2 size={14} /> {notice}
          <button onClick={() => setNotice(null)}><X size={12} /></button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="notice-bar danger">
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError(null)}><X size={12} /></button>
        </div>
      )}

      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">
            <Bell size={20} /> Approval Inbox
          </h1>
          <p className="view-subtitle">
            Approval requests untuk {currentUser?.role}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={14} />
          <input
            data-testid="approval-search"
            type="text"
            placeholder="Cari nomor / entity type / customer..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="tab-bar">
        {["pending", "approved", "rejected"].map(status => (
          <button
            key={status}
            data-testid={`status-tab-${status}`}
            className={`tab-button ${statusFilter === status ? "active" : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {STATUS_STYLE[status].label}
            {status === "pending" && approvals.length > 0 && (
              <span className="tab-badge">{approvals.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="loading-state">
          <Loader2 size={24} className="spin" />
          <p>Memuat approvals...</p>
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="empty-state">
          <Bell size={32} style={{ opacity: 0.3 }} />
          <p>Tidak ada approval {statusFilter === "pending" ? "yang pending" : `dengan status ${STATUS_STYLE[statusFilter].label}`}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApprovals.map(approval => (
            <div
              key={approval.id}
              data-testid={`approval-card-${approval.id}`}
              className="section-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <FileText size={16} className="text-muted" />
                    <span className="font-mono font-semibold">{approval.entity_number}</span>
                    <span className="feature-badge badge-blue">
                      {ENTITY_TYPE_LABELS[approval.entity_type] || approval.entity_type}
                    </span>
                    <StatusPill status={approval.status} />
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {approval.metadata?.customer_name && (
                      <div>
                        <span className="text-muted">Customer:</span>{" "}
                        <span className="font-medium">{approval.metadata.customer_name}</span>
                      </div>
                    )}
                    {approval.metadata?.total_amount && (
                      <div>
                        <span className="text-muted">Amount:</span>{" "}
                        <span className="font-semibold tabular-nums">Rp {fmtNum(approval.metadata.total_amount)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted">Requested by:</span>{" "}
                      <span>{approval.requested_by}</span>
                    </div>
                    <div>
                      <span className="text-muted">Requested at:</span>{" "}
                      <span>{fmtDate(approval.requested_at)}</span>
                    </div>
                  </div>

                  {/* Rule info */}
                  {approval.rule && (
                    <div className="mt-2 text-xs text-muted">
                      Rule: {approval.rule.name} ({approval.rule.threshold_field} {approval.rule.threshold_operator} {fmtNum(approval.rule.threshold_value)})
                    </div>
                  )}

                  {/* Decision info */}
                  {approval.status !== "pending" && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-muted">
                          {approval.status === "approved" ? "Approved" : "Rejected"} by:
                        </span>{" "}
                        <span className="font-medium">{approval.reviewed_by}</span>
                        {" "}on {fmtDate(approval.reviewed_at)}
                      </div>
                      {approval.decision_notes && (
                        <div className="text-sm text-muted mt-1">
                          Notes: {approval.decision_notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {approval.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      data-testid={`approve-btn-${approval.id}`}
                      className="primary-button"
                      onClick={() => handleApprove(approval)}
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      data-testid={`reject-btn-${approval.id}`}
                      className="danger-button"
                      onClick={() => {
                        setSelectedApproval(approval);
                        setShowRejectModal(true);
                      }}
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApproval && (
        <div className="modal-overlay" data-testid="reject-approval-modal">
          <div className="modal-card small">
            <h3 className="modal-title">Reject {selectedApproval.entity_number}?</h3>
            <p className="modal-subtitle">Berikan alasan penolakan</p>
            <textarea
              data-testid="reject-reason-textarea"
              className="textarea"
              rows={3}
              placeholder="Alasan penolakan..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedApproval(null);
                  setRejectReason("");
                }}
              >
                Batal
              </button>
              <button
                data-testid="confirm-reject-approval-btn"
                className="danger-button"
                disabled={!rejectReason.trim()}
                onClick={handleReject}
              >
                <X size={14} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
