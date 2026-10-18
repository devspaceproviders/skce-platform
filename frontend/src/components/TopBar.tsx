import { Mail, MapPin, Phone, Sparkles } from "lucide-react";

const TICKER_CSS = `
@keyframes skTicker {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}
.sk-ticker-track { animation: skTicker 38s linear infinite; }
.sk-ticker:hover .sk-ticker-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .sk-ticker-track { animation: none; transform: none; }
}
`;

type Item = { key: string; icon: typeof Phone; text: string; href?: string };

const ITEMS: Item[] = [
  { key: "slogan", icon: Sparkles, text: "Learn · Practice · Succeed" },
  { key: "tag", icon: Sparkles, text: "SK Computer Education — Skills for a Brighter Tomorrow" },
  { key: "phone", icon: Phone, text: "+91 98854 22483", href: "tel:+919885422483" },
  { key: "email", icon: Mail, text: "admissions@skce.in", href: "mailto:admissions@skce.in" },
  { key: "place", icon: MapPin, text: "Tirupati, Andhra Pradesh" },
];

function Row({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center"
    >
      {ITEMS.map(({ key, icon: Icon, text, href }) => {
        const inner = (
          <>
            <Icon size={13} className="shrink-0 text-white" />
            <span>{text}</span>
          </>
        );

        return (
          <li key={key} className="flex items-center">
            {href ? (
              <a
                href={href}
                tabIndex={hidden ? -1 : undefined}
                className="inline-flex items-center gap-1.5 px-5 font-bold text-[#071C3A] transition-colors hover:text-white focus:outline-none focus-visible:text-white"
              >
                {inner}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-5 font-bold text-[#071C3A]">
                {inner}
              </span>
            )}
            <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-white/90" />
          </li>
        );
      })}
    </ul>
  );
}

export default function TopBar() {
  return (
    <div
      className="sk-ticker relative w-full overflow-hidden bg-gradient-to-r from-[#F97316] via-[#FB8A2E] to-[#FFB15C] py-[5px] text-[12.5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
      role="region"
      aria-label="SK Computer Education announcements"
    >
      <style dangerouslySetInnerHTML={{ __html: TICKER_CSS }} />
      <div className="sk-ticker-track flex w-max">
        <Row />
        <Row hidden />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F97316] to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#FFB15C] to-transparent" />
    </div>
  );
}
