"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Save,
  Clock,
  Users,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type DemoStatus =
  | "NEW"
  | "CONTACTED"
  | "IN_PROGRESS"
  | "CONVERTED"
  | "CLOSED";

type MessageStatus = "NEW" | "READ" | "REPLIED" | "CLOSED";

interface DemoRequest {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  course?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  courseSlug?: string | null;
  message?: string | null;
  status: DemoStatus;
  createdAt: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
}

interface ContactSettings {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  mapUrl?: string | null;
}

type Tab = "demo" | "messages" | "settings";

export default function AdminContactPage() {
  const [activeTab, setActiveTab] = useState<Tab>("demo");

  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [settings, setSettings] = useState<ContactSettings>({
    phone: "",
    email: "",
    address: "",
    workingHours: "",
    mapUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getHeaders = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [demoResponse, messageResponse, settingsResponse] =
        await Promise.all([
          fetch(`${API_URL}/contact/admin/demo-requests`, {
            headers: getHeaders(),
            cache: "no-store",
          }),
          fetch(`${API_URL}/contact/admin/messages`, {
            headers: getHeaders(),
            cache: "no-store",
          }),
          fetch(`${API_URL}/contact/settings`, {
            cache: "no-store",
          }),
        ]);

      if (!demoResponse.ok) {
        throw new Error("Unable to load demo requests");
      }

      if (!messageResponse.ok) {
        throw new Error("Unable to load contact messages");
      }

      if (!settingsResponse.ok) {
        throw new Error("Unable to load contact settings");
      }

      const demoResult = await demoResponse.json();
      const messageResult = await messageResponse.json();
      const settingsResult = await settingsResponse.json();

      setDemoRequests(demoResult.data || []);
      setMessages(messageResult.data || []);

      setSettings(
        settingsResult.data || {
          phone: "",
          email: "",
          address: "",
          workingHours: "",
          mapUrl: "",
        },
      );
    } catch (err) {
      console.error("Admin contact load error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load contact data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateDemoStatus = async (
    id: string,
    status: DemoStatus,
  ) => {
    setUpdatingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/contact/admin/demo-requests/${id}/status`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.message || "Unable to update demo request.",
        );
      }

      setDemoRequests((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status } : item,
        ),
      );

      setSuccess("Demo request status updated.");
    } catch (err) {
      console.error("Demo status update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update demo request.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const updateMessageStatus = async (
    id: string,
    status: MessageStatus,
  ) => {
    setUpdatingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/contact/admin/messages/${id}/status`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.message || "Unable to update message.",
        );
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status } : item,
        ),
      );

      setSuccess("Message status updated.");
    } catch (err) {
      console.error("Message status update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update message.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/contact/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(settings),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || "Unable to save contact settings.",
        );
      }

      setSettings(result.data || settings);
      setSuccess("Contact settings saved successfully.");
    } catch (err) {
      console.error("Contact settings save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save contact settings.",
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const formatDate = (value: string) => {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const demoNewCount = demoRequests.filter(
    (item) => item.status === "NEW",
  ).length;

  const messageNewCount = messages.filter(
    (item) => item.status === "NEW",
  ).length;

  return (
    <div className="min-h-full bg-slate-50 px-6 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-500">
              Website Management
            </p>

            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#173B67]">
              Contact Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage demo enquiries, contact messages, and public contact
              information.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* FEEDBACK */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
            {success}
          </div>
        )}

        {/* SUMMARY */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Demo Requests"
            value={demoRequests.length}
            detail={`${demoNewCount} new`}
            icon={<Users size={20} />}
          />

          <SummaryCard
            label="Contact Messages"
            value={messages.length}
            detail={`${messageNewCount} new`}
            icon={<MessageSquare size={20} />}
          />

          <SummaryCard
            label="Contact Email"
            value={settings.email || "—"}
            detail="Public website contact"
            icon={<Mail size={20} />}
          />
        </div>

        {/* TABS */}
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <TabButton
            active={activeTab === "demo"}
            onClick={() => setActiveTab("demo")}
            icon={<Users size={17} />}
          >
            Demo Requests

            {demoNewCount > 0 && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                {demoNewCount}
              </span>
            )}
          </TabButton>

          <TabButton
            active={activeTab === "messages"}
            onClick={() => setActiveTab("messages")}
            icon={<MessageSquare size={17} />}
          >
            Messages

            {messageNewCount > 0 && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                {messageNewCount}
              </span>
            )}
          </TabButton>

          <TabButton
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            icon={<MapPin size={17} />}
          >
            Contact Settings
          </TabButton>
        </div>

        {/* CONTENT */}
        {loading ? (
          <LoadingState />
        ) : activeTab === "demo" ? (
          <DemoRequestsTable
            requests={demoRequests}
            updatingId={updatingId}
            onStatusChange={updateDemoStatus}
            formatDate={formatDate}
          />
        ) : activeTab === "messages" ? (
          <MessagesTable
            messages={messages}
            updatingId={updatingId}
            onStatusChange={updateMessageStatus}
            formatDate={formatDate}
          />
        ) : (
          <ContactSettingsForm
            settings={settings}
            saving={savingSettings}
            onChange={setSettings}
            onSave={saveSettings}
          />
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold text-[#173B67]">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {detail}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          {icon}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-orange-500 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-[#173B67]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function DemoRequestsTable({
  requests,
  updatingId,
  onStatusChange,
  formatDate,
}: {
  requests: DemoRequest[];
  updatingId: string | null;
  onStatusChange: (id: string, status: DemoStatus) => void;
  formatDate: (value: string) => string;
}) {
  if (!requests.length) {
    return (
      <EmptyState
        icon={<Users size={26} />}
        title="No demo requests yet"
        description="New free demo enquiries from the public Contact page will appear here."
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-bold text-[#173B67]">
          Demo Requests
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Manage free demo enquiries submitted from the website.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1220px]">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3.5">Applicant</th>
              <th className="px-5 py-3.5">Contact</th>
              <th className="px-5 py-3.5">Course</th>
              <th className="px-5 py-3.5">Message</th>
              <th className="px-5 py-3.5">Submitted</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Actions</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((request) => (
              <tr
                key={request.id}
                className="border-t border-slate-100 align-top transition hover:bg-slate-50/60"
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-[#173B67]">
                    {request.name}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm text-slate-700">
                    {request.phone}
                  </p>

                  {request.email && (
                    <p className="mt-1 text-xs text-slate-400">
                      {request.email}
                    </p>
                  )}
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-700">
                    {request.course?.title ||
                      request.courseSlug ||
                      "—"}
                  </p>
                </td>

                <td className="max-w-[250px] px-5 py-4">
                  <p className="text-sm leading-6 text-slate-600">
                    {request.message || "—"}
                  </p>
                </td>

                <td className="px-5 py-4 text-xs text-slate-500">
                  {formatDate(request.createdAt)}
                </td>

                <td className="px-5 py-4">
                  <StatusSelect
                    value={request.status}
                    disabled={updatingId === request.id}
                    options={[
                      "NEW",
                      "CONTACTED",
                      "IN_PROGRESS",
                      "CONVERTED",
                      "CLOSED",
                    ]}
                    onChange={(value) =>
                      onStatusChange(
                        request.id,
                        value as DemoStatus,
                      )
                    }
                  />
                </td>

                <td className="px-5 py-4">
                  <DemoActions request={request} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DemoActions({
  request,
}: {
  request: DemoRequest;
}) {
  const phone = request.phone.trim();
  const phoneDigits = phone.replace(/\D/g, "");

  const whatsappNumber =
    phoneDigits.length === 10
      ? `91${phoneDigits}`
      : phoneDigits.startsWith("0") && phoneDigits.length === 11
        ? `91${phoneDigits.slice(1)}`
        : phoneDigits;

  const whatsappMessage = encodeURIComponent(
    `Hi ${request.name}, this is SK Computer Education. You requested a free demo for ${
      request.course?.title ||
      request.courseSlug ||
      "your selected course"
    }. We would like to help you schedule your demo. Please let us know a convenient date and time.`,
  );

  return (
    <div className="flex items-center gap-2">
      <a
        href={`tel:${phone}`}
        title={`Call ${request.name}`}
        aria-label={`Call ${request.name}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 transition hover:border-emerald-200 hover:bg-emerald-100"
      >
        <Phone size={16} />
      </a>

      <a
        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
        target="_blank"
        rel="noreferrer"
        title={`WhatsApp ${request.name}`}
        aria-label={`WhatsApp ${request.name}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-green-100 bg-green-50 text-green-600 transition hover:border-green-200 hover:bg-green-100"
      >
        <MessageSquare size={16} />
      </a>

      {request.email ? (
        <a
          href={`mailto:${request.email}?subject=${encodeURIComponent(
            "SK Computer Education - Free Demo",
          )}&body=${encodeURIComponent(
            `Hi ${request.name},\n\nThank you for your interest in SK Computer Education. We received your request for a free demo for ${
              request.course?.title ||
              request.courseSlug ||
              "your selected course"
            }.\n\nPlease let us know a convenient date and time for the demo.\n\nRegards,\nSK Computer Education`,
          )}`}
          title={`Email ${request.name}`}
          aria-label={`Email ${request.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
        >
          <Mail size={16} />
        </a>
      ) : (
        <button
          type="button"
          disabled
          title="No email address available"
          aria-label="No email address available"
          className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-300"
        >
          <Mail size={16} />
        </button>
      )}
    </div>
  );
}

function MessagesTable({
  messages,
  updatingId,
  onStatusChange,
  formatDate,
}: {
  messages: ContactMessage[];
  updatingId: string | null;
  onStatusChange: (id: string, status: MessageStatus) => void;
  formatDate: (value: string) => string;
}) {
  if (!messages.length) {
    return (
      <EmptyState
        icon={<MessageSquare size={26} />}
        title="No contact messages yet"
        description="Messages submitted from the public Contact page will appear here."
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-bold text-[#173B67]">
          Contact Messages
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Review and manage messages received from visitors.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5">Contact</th>
              <th className="px-5 py-3.5">Message</th>
              <th className="px-5 py-3.5">Submitted</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Actions</th>
            </tr>
          </thead>

          <tbody>
            {messages.map((message) => (
              <tr
                key={message.id}
                className="border-t border-slate-100 align-top transition hover:bg-slate-50/60"
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-[#173B67]">
                    {message.name}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm text-slate-700">
                    {message.email}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {message.phone}
                  </p>
                </td>

                <td className="max-w-[400px] px-5 py-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {message.message}
                  </p>
                </td>

                <td className="px-5 py-4 text-xs text-slate-500">
                  {formatDate(message.createdAt)}
                </td>

                <td className="px-5 py-4">
                  <StatusSelect
                    value={message.status}
                    disabled={updatingId === message.id}
                    options={[
                      "NEW",
                      "READ",
                      "REPLIED",
                      "CLOSED",
                    ]}
                    onChange={(value) =>
                      onStatusChange(
                        message.id,
                        value as MessageStatus,
                      )
                    }
                  />
                </td>

                <td className="px-5 py-4">
                  <MessageActions message={message} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MessageActions({
  message,
}: {
  message: ContactMessage;
}) {
  const phone = message.phone.trim();
  const phoneDigits = phone.replace(/\D/g, "");

  const whatsappNumber =
    phoneDigits.length === 10
      ? `91${phoneDigits}`
      : phoneDigits.startsWith("0") && phoneDigits.length === 11
        ? `91${phoneDigits.slice(1)}`
        : phoneDigits;

  const whatsappMessage = encodeURIComponent(
    `Hi ${message.name}, this is SK Computer Education. We received your message and would be happy to assist you. You mentioned: "${message.message}". Please let us know how we can help.`,
  );

  const emailSubject = encodeURIComponent(
    "SK Computer Education - Response to your enquiry",
  );

  const emailBody = encodeURIComponent(
    `Hi ${message.name},

Thank you for contacting SK Computer Education.

We received your message:
"${message.message}"

We would be happy to assist you. Please let us know how we can help.

Regards,
SK Computer Education`,
  );

  return (
    <div className="flex items-center gap-2">
      <a
        href={`tel:${phone}`}
        title={`Call ${message.name}`}
        aria-label={`Call ${message.name}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 transition hover:border-emerald-200 hover:bg-emerald-100"
      >
        <Phone size={16} />
      </a>

      <a
        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
        target="_blank"
        rel="noreferrer"
        title={`WhatsApp ${message.name}`}
        aria-label={`WhatsApp ${message.name}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-green-100 bg-green-50 text-green-600 transition hover:border-green-200 hover:bg-green-100"
      >
        <MessageSquare size={16} />
      </a>

      <a
        href={`mailto:${message.email}?subject=${emailSubject}&body=${emailBody}`}
        title={`Email ${message.name}`}
        aria-label={`Email ${message.name}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
      >
        <Mail size={16} />
      </a>
    </div>
  );
}

function StatusSelect({
  value,
  options,
  disabled,
  onChange,
}: {
  value: string;
  options: string[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`min-w-[135px] rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 ${getStatusClasses(
        value,
      )}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {formatStatus(option)}
        </option>
      ))}
    </select>
  );
}

function getStatusClasses(status: string) {
  switch (status) {
    case "NEW":
      return "border-blue-100 bg-blue-50 text-blue-700";

    case "CONTACTED":
      return "border-violet-100 bg-violet-50 text-violet-700";

    case "IN_PROGRESS":
      return "border-amber-100 bg-amber-50 text-amber-700";

    case "CONVERTED":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "READ":
      return "border-sky-100 bg-sky-50 text-sky-700";

    case "REPLIED":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "CLOSED":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

function ContactSettingsForm({
  settings,
  saving,
  onChange,
  onSave,
}: {
  settings: ContactSettings;
  saving: boolean;
  onChange: (settings: ContactSettings) => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="font-bold text-[#173B67]">
          Public Contact Information
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          These values are displayed on the public Contact page.
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <Field
          label="Phone"
          value={settings.phone}
          onChange={(value) =>
            onChange({
              ...settings,
              phone: value,
            })
          }
          placeholder="+91 98854 22483"
          icon={<Phone size={16} />}
        />

        <Field
          label="Email"
          type="email"
          value={settings.email}
          onChange={(value) =>
            onChange({
              ...settings,
              email: value,
            })
          }
          placeholder="admissions@skce.in"
          icon={<Mail size={16} />}
        />

        <div className="lg:col-span-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MapPin size={16} className="text-orange-500" />
            Address
          </label>

          <textarea
            rows={4}
            value={settings.address}
            onChange={(e) =>
              onChange({
                ...settings,
                address: e.target.value,
              })
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <Field
          label="Working Hours"
          value={settings.workingHours}
          onChange={(value) =>
            onChange({
              ...settings,
              workingHours: value,
            })
          }
          placeholder="Contact us for current timings"
          icon={<Clock size={16} />}
        />

        <Field
          label="Map URL"
          value={settings.mapUrl || ""}
          onChange={(value) =>
            onChange({
              ...settings,
              mapUrl: value,
            })
          }
          placeholder="https://www.google.com/maps/..."
          icon={<MapPin size={16} />}
        />

        <div className="flex justify-end border-t border-slate-100 pt-5 lg:col-span-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Contact Settings"}
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="text-orange-500">{icon}</span>
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        {icon}
      </div>

      <h2 className="mt-4 text-lg font-bold text-[#173B67]">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-20 animate-pulse rounded-2xl bg-white" />
      <div className="h-96 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}