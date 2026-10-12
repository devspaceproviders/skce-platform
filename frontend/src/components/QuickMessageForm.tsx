"use client";

import { useState, FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const FIELD_CLASS = "w-full rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white outline-none transition duration-200 placeholder:text-blue-200/80 hover:border-white/40 focus:border-orange-400 focus:bg-white/15 focus:ring-4 focus:ring-orange-400/20";

export default function QuickMessageForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const response = await fetch(`${API_URL}/contact/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Failed to send message");
      setStatus("success");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Contact message error:", error);
      setStatus("error");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-white">Send a Message</h2>
      <div className="mb-5 mt-2 flex items-center gap-1.5" aria-hidden="true">
        <span className="h-1 w-8 rounded-full bg-orange-500" />
        <span className="h-1 w-3 rounded-full bg-white/60" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="quick-name" className="sr-only">Your Name</label>
          <input id="quick-name" required autoComplete="name" placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${FIELD_CLASS} h-11`} />
        </div>
        <div>
          <label htmlFor="quick-email" className="sr-only">Email Address</label>
          <input id="quick-email" required type="email" autoComplete="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${FIELD_CLASS} h-11`} />
        </div>
        <div>
          <label htmlFor="quick-phone" className="sr-only">Phone Number</label>
          <input id="quick-phone" required autoComplete="tel" placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${FIELD_CLASS} h-11`} />
        </div>
        <div>
          <label htmlFor="quick-message" className="sr-only">Your message</label>
          <textarea id="quick-message" required rows={4} placeholder="Your message..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${FIELD_CLASS} resize-none py-3`} />
        </div>
        <button type="submit" disabled={status === "loading"} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-lg shadow-orange-900/20 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2F5F] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
          {status === "loading" ? <><Loader2 size={17} className="animate-spin" />Sending...</> : <>Send Message<Send size={16} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></>}
        </button>
        {status === "success" && <div role="status" className="sk-form-msg flex items-start gap-2.5 rounded-xl border border-emerald-300/30 bg-emerald-400/15 p-3.5 text-sm text-emerald-50"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />Thanks! We&apos;ll get back to you shortly.</div>}
        {status === "error" && <div role="alert" className="sk-form-msg flex items-start gap-2.5 rounded-xl border border-red-300/30 bg-red-500/20 p-3.5 text-sm text-red-50"><AlertCircle size={18} className="mt-0.5 shrink-0" />Something went wrong. Please try again.</div>}
      </form>
      <style jsx global>{`
        @keyframes skFormMsg { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .sk-form-msg { animation: skFormMsg 0.25s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .sk-form-msg { animation: none; } }
      `}</style>
    </div>
  );
}
