"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Award,
  Ban,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  MoreVertical,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { COURSE_OPTIONS } from "@/lib/courseList";

type CertificateStatus = "Issued" | "Pending" | "Revoked";

type Certificate = {
  id: number;
  certificateId: string;
  studentName: string;
  studentId: string;
  course: string;
  issueDate: string;
  status: CertificateStatus;
};

const COURSES = COURSE_OPTIONS.map((course) => course.title);

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewCertificate, setViewCertificate] =
    useState<Certificate | null>(null);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [generateForm, setGenerateForm] = useState({
    studentName: "",
    studentId: "",
    course: COURSES[0] ?? "",
  });

  const filteredCertificates = useMemo(() => {
    const query = search.toLowerCase().trim();

    return certificates.filter((certificate) => {
      const matchesSearch =
        !query ||
        certificate.studentName.toLowerCase().includes(query) ||
        certificate.studentId.toLowerCase().includes(query) ||
        certificate.certificateId.toLowerCase().includes(query) ||
        certificate.course.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        certificate.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [certificates, search, statusFilter]);

  const totalCertificates = certificates.length;
  const issuedCertificates = certificates.filter((c) => c.status === "Issued").length;
  const pendingCertificates = certificates.filter((c) => c.status === "Pending").length;
  const revokedCertificates = certificates.filter((c) => c.status === "Revoked").length;

  const closeMenu = () => {
    setActiveMenu(null);
    setMenuPosition(null);
  };

  const openMenu = (event: MouseEvent<HTMLButtonElement>, certificateId: number) => {
    event.stopPropagation();

    if (activeMenu === certificateId) {
      closeMenu();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const menuHeight = 170;
    const padding = 12;

    let left = rect.right - menuWidth;
    let top = rect.bottom + 8;

    left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));

    if (top + menuHeight > window.innerHeight - padding) {
      top = Math.max(padding, rect.top - menuHeight - 8);
    }

    setActiveMenu(certificateId);
    setMenuPosition({ top, left });
  };

  const handleGenerateCertificate = () => {
    if (!generateForm.studentName.trim() || !generateForm.studentId.trim()) {
      alert("Please enter the student name and student ID.");
      return;
    }

    const nextNumber = certificates.length + 1;

    const newCertificate: Certificate = {
      id: Date.now(),
      certificateId: `SKCE-CERT-${String(nextNumber).padStart(4, "0")}`,
      studentName: generateForm.studentName.trim(),
      studentId: generateForm.studentId.trim(),
      course: generateForm.course,
      issueDate: new Date().toLocaleDateString("en-IN"),
      status: "Issued",
    };

    setCertificates((current) => [newCertificate, ...current]);
    setGenerateForm({
      studentName: "",
      studentId: "",
      course: COURSES[0] ?? "",
    });
    setShowGenerateModal(false);
  };

  const handleRevoke = (certificateId: number) => {
    setCertificates((current) =>
      current.map((certificate) =>
        certificate.id === certificateId
          ? { ...certificate, status: "Revoked" }
          : certificate
      )
    );
    closeMenu();
  };

  const handleReissue = (certificateId: number) => {
    setCertificates((current) =>
      current.map((certificate) =>
        certificate.id === certificateId
          ? {
              ...certificate,
              status: "Issued",
              issueDate: new Date().toLocaleDateString("en-IN"),
            }
          : certificate
      )
    );
    closeMenu();
  };

  const handleDownload = (certificate: Certificate) => {
    alert(
      `Certificate download will be connected to the certificate PDF service for ${certificate.certificateId}.`
    );
    closeMenu();
  };

  return (
    <div
      className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8"
      onClick={() => activeMenu !== null && closeMenu()}
    >
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-500">
              <Award size={15} />
              Certification Management
            </div>
            <h1 className="text-2xl font-bold text-[#173B67] sm:text-3xl">
              Certificates
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage student certificates and certification records.
            </p>
          </div>

          <button
            onClick={(event) => {
              event.stopPropagation();
              setShowGenerateModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <Award size={18} />
            Generate Certificate
          </button>
        </div>

        {/* Development note */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <FileText size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Development mode</p>
            <p className="mt-0.5 text-blue-700">
              Certificate records are currently stored in page state. Backend
              certificate generation and PDF download can be connected later.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Certificates"
            value={totalCertificates}
            icon={<Award size={20} />}
            iconClass="bg-blue-50 text-blue-600"
          />
          <SummaryCard
            title="Issued"
            value={issuedCertificates}
            icon={<CheckCircle2 size={20} />}
            iconClass="bg-green-50 text-green-600"
          />
          <SummaryCard
            title="Pending"
            value={pendingCertificates}
            icon={<Clock3 size={20} />}
            iconClass="bg-amber-50 text-amber-600"
          />
          <SummaryCard
            title="Revoked"
            value={revokedCertificates}
            icon={<Ban size={20} />}
            iconClass="bg-red-50 text-red-600"
          />
        </div>

        {/* Main table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, ID, certificate ID or course..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="all">All Status</option>
              <option value="Issued">Issued</option>
              <option value="Pending">Pending</option>
              <option value="Revoked">Revoked</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  {[
                    "STUDENT",
                    "STUDENT ID",
                    "CERTIFICATE ID",
                    "COURSE",
                    "ISSUE DATE",
                    "STATUS",
                    "ACTIONS",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-left text-[11px] font-bold tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredCertificates.map((certificate) => (
                  <tr
                    key={certificate.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                      {certificate.studentName}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {certificate.studentId}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#173B67]">
                      {certificate.certificateId}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {certificate.course}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {certificate.issueDate}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={certificate.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setViewCertificate(certificate);
                          }}
                          title="View Certificate"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          onClick={(event) => openMenu(event, certificate.id)}
                          title="More Actions"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCertificates.length === 0 && (
              <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-10 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#173B67]">
                  <Award size={30} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  No certificate records
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Certificates will appear here once certificates are generated
                  for students.
                </p>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  <Award size={16} />
                  Generate First Certificate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* More menu */}
      {activeMenu !== null && menuPosition && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="fixed z-[1000] w-[220px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <MenuButton
            icon={<Download size={16} />}
            label="Download Certificate"
            onClick={() => {
              const certificate = certificates.find((item) => item.id === activeMenu);
              if (certificate) handleDownload(certificate);
            }}
          />
          <MenuButton
            icon={<RefreshCw size={16} />}
            label="Reissue Certificate"
            onClick={() => handleReissue(activeMenu)}
          />
          <MenuButton
            icon={<Ban size={16} />}
            label="Revoke Certificate"
            danger
            onClick={() => handleRevoke(activeMenu)}
          />
        </div>
      )}

      {/* View modal */}
      {viewCertificate && (
        <Modal onClose={() => setViewCertificate(null)}>
          <ModalHeader
            title="Certificate Details"
            subtitle={viewCertificate.certificateId}
            onClose={() => setViewCertificate(null)}
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <DetailRow label="Student Name" value={viewCertificate.studentName} />
            <DetailRow label="Student ID" value={viewCertificate.studentId} />
            <DetailRow label="Course" value={viewCertificate.course} />
            <DetailRow label="Certificate ID" value={viewCertificate.certificateId} />
            <DetailRow label="Issue Date" value={viewCertificate.issueDate} />
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-slate-500">Status</span>
              <StatusBadge status={viewCertificate.status} />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setViewCertificate(null)}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Generate modal */}
      {showGenerateModal && (
        <Modal onClose={() => setShowGenerateModal(false)}>
          <ModalHeader
            title="Generate Certificate"
            subtitle="Create a certificate record for a student."
            onClose={() => setShowGenerateModal(false)}
          />

          <div className="grid gap-5">
            <FormField label="Student Name">
              <input
                value={generateForm.studentName}
                onChange={(event) =>
                  setGenerateForm((current) => ({
                    ...current,
                    studentName: event.target.value,
                  }))
                }
                placeholder="Enter student name"
                className={inputClass}
              />
            </FormField>

            <FormField label="Student ID">
              <input
                value={generateForm.studentId}
                onChange={(event) =>
                  setGenerateForm((current) => ({
                    ...current,
                    studentId: event.target.value,
                  }))
                }
                placeholder="Example: SKCE0001"
                className={inputClass}
              />
            </FormField>

            <FormField label="Course">
              <select
                value={generateForm.course}
                onChange={(event) =>
                  setGenerateForm((current) => ({
                    ...current,
                    course: event.target.value,
                  }))
                }
                className={inputClass}
              >
                {COURSES.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <button
              onClick={() => setShowGenerateModal(false)}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateCertificate}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              <FileText size={17} />
              Generate
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CertificateStatus }) {
  const classes =
    status === "Issued"
      ? "bg-green-50 text-green-700"
      : status === "Pending"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${classes}`}>
      {status}
    </span>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-5 border-b border-slate-200 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-[#173B67]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <button
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
      >
        <X size={18} />
      </button>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
