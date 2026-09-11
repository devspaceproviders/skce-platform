import { Phone, Mail, MapPin } from "lucide-react";

export default function TopBar() {
  return (
    <div className="hidden bg-brand text-xs text-white sm:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <Phone size={13} /> +91 98765 00000
          </span>
          <span className="flex items-center gap-1.5">
            <Mail size={13} /> admissions@skce.in
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <MapPin size={13} /> Hyderabad, Telangana
        </span>
      </div>
    </div>
  );
}
