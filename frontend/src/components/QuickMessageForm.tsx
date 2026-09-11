"use client";

import { useState, FormEvent } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function QuickMessageForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <div>
      <h2 className="mb-5 text-lg font-bold text-slate-900">Send a Message</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="Your Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <input
          required
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <input
          required
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <textarea
          required
          rows={4}
          placeholder="Your message..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-lg bg-brand-dark py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
        >
          {status === "loading" ? "Sending..." : "Send Message"}
        </button>
        {status === "success" && (
          <p className="text-sm text-emerald-600">Thanks! We&apos;ll get back to you shortly.</p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
        )}
      </form>
    </div>
  );
}
