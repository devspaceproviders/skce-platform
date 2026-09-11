"use client";

import { useState, FormEvent } from "react";
import { submitContactForm } from "@/lib/api";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await submitContactForm(form);
      setStatus("success");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          required
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <input
          required
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>
      <input
        required
        placeholder="Phone Number"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
      />
      <textarea
        required
        placeholder="How can we help you?"
        rows={4}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
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
  );
}
