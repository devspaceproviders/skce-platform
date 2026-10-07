"use client";

import { useState, FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { submitContactForm } from "@/lib/api";

const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-slate-600";

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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-7"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={LABEL_CLASS}>
            Full Name
          </label>
          <input
            id="contact-name"
            required
            autoComplete="name"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`${FIELD_CLASS} h-11`}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className={LABEL_CLASS}>
            Email Address
          </label>
          <input
            id="contact-email"
            required
            type="email"
            autoComplete="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={`${FIELD_CLASS} h-11`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-phone" className={LABEL_CLASS}>
          Phone Number
        </label>
        <input
          id="contact-phone"
          required
          autoComplete="tel"
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className={`${FIELD_CLASS} h-11`}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={LABEL_CLASS}>
          Message
        </label>
        <textarea
          id="contact-message"
          required
          placeholder="How can we help you?"
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`${FIELD_CLASS} resize-none py-3`}
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md hover:shadow-orange-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {status === "loading" ? (
          <>
            <Loader2 size={17} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Send Message
            <Send
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </>
        )}
      </button>

      {status === "success" && (
        <div
          role="status"
          className="sk-form-msg flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          Thanks! We&apos;ll get back to you shortly.
        </div>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="sk-form-msg flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          Something went wrong. Please try again.
        </div>
      )}

      <style jsx global>{`
        @keyframes skFormMsg {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sk-form-msg {
          animation: skFormMsg 0.25s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .sk-form-msg {
            animation: none;
          }
        }
      `}</style>
    </form>
  );
}
