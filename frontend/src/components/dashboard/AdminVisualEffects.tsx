"use client";

export default function AdminVisualEffects() {
  return (
    <style jsx global>{`
      @keyframes skceFadeUp {
        from { opacity: 0; transform: translate3d(0, 12px, 0); }
        to { opacity: 1; transform: translate3d(0, 0, 0); }
      }
      @keyframes skceOrbit {
        0%, 100% { transform: scale(1); opacity: .45; }
        50% { transform: scale(1.035); opacity: .75; }
      }
      .skce-page-enter {
        animation: skceFadeUp .48s cubic-bezier(.2,.7,.2,1) both;
      }
      .skce-banner-orbit {
        animation: skceOrbit 8s ease-in-out infinite;
        transform-origin: center;
      }
      .skce-interactive-card {
        transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
      }
      .skce-interactive-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(23, 59, 103, .08);
        border-color: rgba(20, 91, 166, .22);
      }
      @media (prefers-reduced-motion: reduce) {
        .skce-page-enter, .skce-banner-orbit { animation: none !important; }
        .skce-interactive-card { transition: none !important; }
        .skce-interactive-card:hover { transform: none; }
      }
    `}</style>
  );
}
