import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "SK Computer Education — Learn. Grow. Succeed.",
  description:
    "SK Computer Education provides practical computer and digital education, including Computer Basics, MS Office, DCA, PGDCA, AI Skills, Programming, Digital Marketing, and job-oriented courses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Navbar />

        <main className="min-w-0 flex-1">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}