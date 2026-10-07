import { Phone, Mail, MapPin } from "lucide-react";

const LINK_CLASS =
  "flex items-center gap-1.5 transition-colors duration-200 hover:text-orange-300";

export default function TopBar() {
  return (
    <div className="hidden bg-[#173B67] text-xs text-white sm:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
        <div className="flex items-center gap-6">
          <a href="tel:+919885422483" className={LINK_CLASS}>
            <Phone size={13} className="text-orange-400" /> +91 98854 22483
          </a>

          <a href="mailto:admissions@skce.in" className={LINK_CLASS}>
            <Mail size={13} className="text-orange-400" />{" "}
            admissions@skce.in
          </a>
        </div>

        <span className="flex items-center gap-1.5 text-slate-200">
          <MapPin size={13} className="text-orange-400" /> Tirupati, Andhra
          Pradesh
        </span>
      </div>
    </div>
  );
}
