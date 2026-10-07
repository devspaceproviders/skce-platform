"use client";

import { useState, FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100";

export default function QuickMessageForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch(`${API_URL}/contact/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setStatus("success");

      setForm({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact message error:", error);
      setStatus("error");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-[#173B67]">Send a Message</h2>

      <div className="mb-5 mt-2 flex items-center gap-1.5" aria-hidden="true">
        <span className="h-1 w-8 rounded-full bg-orange-500" />
        <span className="h-1 w-3 rounded-full bg-[#173B67]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="quick-name" className="sr-only">
            Your Name
          </label>
          <input
            id="quick-name"
            required
            autoComplete="name"
            placeholder="Your Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            className={`${FIELD_CLASS} h-11`}
          />
        </div>

        <div>
          <label htmlFor="quick-email" className="sr-only">
            Email Address
          </label>
          <input
            id="quick-email"
            required
            type="email"
            autoComplete="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className={`${FIELD_CLASS} h-11`}
          />
        </div>

        <div>
          <label htmlFor="quick-phone" className="sr-only">
            Phone Number
          </label>
          <input
            id="quick-phone"
            required
            autoComplete="tel"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
            className={`${FIELD_CLASS} h-11`}
          />
        </div>

        <div>
          <label htmlFor="quick-message" className="sr-only">
            Your message
          </label>
          <textarea
            id="quick-message"
            required
            rows={4}
            placeholder="Your message..."
            value={form.message}
            onChange={(e) =>
              setForm({
                ...form,
                message: e.target.value,
              })
            }
            className={`${FIELD_CLASS} resize-none py-3`}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173B67] text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#0F2F5F] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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
      </form>

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
    </div>
  );
}
