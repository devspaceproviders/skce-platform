"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDashboard =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/");

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="min-w-0 flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}