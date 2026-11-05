
import type { Metadata, Viewport } from "next";
import "./globals.css";
import PublicShell from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "SK Computer Education — Learn. Grow. Succeed.",
  description:
    "SK Computer Education provides practical computer and digital education, including Computer Basics, MS Office, DCA, PGDCA, AI Skills, Programming, Digital Marketing, and job-oriented courses.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen w-full">
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  );
}
