import { Clock, ArrowLeft, Sparkles } from "lucide-react";

/**
 * Halaman placeholder untuk fitur yang belum diimplementasi.
 * Ditampilkan untuk semua view dengan prefix cs-*.
 */
export default function ComingSoon({ title, kicker, onBack }) {
  return (
    <div
      data-testid="coming-soon-page"
      className="cs-page"
    >
      <div className="cs-card">
        {/* Badge */}
        <div className="cs-badge">
          <Clock size={14} />
          <span>Segera Hadir</span>
        </div>

        {/* Icon */}
        <div className="cs-icon-wrap">
          <Sparkles size={32} className="cs-sparkle" />
        </div>

        {/* Text */}
        <div className="cs-text">
          {kicker && <p className="cs-kicker">{kicker}</p>}
          <h2 className="cs-title">{title || "Fitur Sedang Dikembangkan"}</h2>
          <p className="cs-desc">
            Fitur ini sedang dalam tahap pengembangan aktif dan akan tersedia di update berikutnya.
            Arsitektur data & API sudah didesain — implementasi akan mengikuti roadmap KN8.
          </p>
        </div>

        {/* Timeline */}
        <div className="cs-timeline">
          <div className="cs-timeline-item done">
            <span className="cs-tl-dot" />
            <span>Arsitektur IA &amp; Data Model ✓</span>
          </div>
          <div className="cs-timeline-item done">
            <span className="cs-tl-dot" />
            <span>API Contract &amp; Entity Registry ✓</span>
          </div>
          <div className="cs-timeline-item active">
            <span className="cs-tl-dot" />
            <span>Implementasi Frontend &amp; Backend</span>
          </div>
          <div className="cs-timeline-item">
            <span className="cs-tl-dot" />
            <span>QA Testing &amp; Gates</span>
          </div>
          <div className="cs-timeline-item">
            <span className="cs-tl-dot" />
            <span>Release ke Produksi</span>
          </div>
        </div>

        {/* Back button */}
        {onBack && (
          <button
            data-testid="cs-back-button"
            onClick={onBack}
            className="cs-back-btn"
          >
            <ArrowLeft size={14} />
            Kembali
          </button>
        )}
      </div>
    </div>
  );
}
