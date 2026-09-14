"use client";

import type { MouseEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Clock3,
  Eye,
  IndianRupee,
  MoreVertical,
  Search,
  Users,
  Wallet,
  X,
} from "lucide-react";

type AffiliateStatus = "Active" | "Inactive" | "Suspended";

type Affiliate = {
  id: number;
  affiliateId: string;
  name: string;
  email: string;
  phone: string;
  referrals: number;
  enrollments: number;
  commission: number;
  pendingCommission: number;
  status: AffiliateStatus;
  joinedDate: string;
};

const INITIAL_AFFILIATES: Affiliate[] = [];

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>(INITIAL_AFFILIATES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewAffiliate, setViewAffiliate] = useState<Affiliate | null>(null);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const filteredAffiliates = useMemo(() => {
    const query = search.toLowerCase().trim();

    return affiliates.filter((affiliate) => {
      const matchesSearch =
        !query ||
        affiliate.name.toLowerCase().includes(query) ||
        affiliate.email.toLowerCase().includes(query) ||
        affiliate.phone.toLowerCase().includes(query) ||
        affiliate.affiliateId.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        affiliate.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [affiliates, search, statusFilter]);

  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter((a) => a.status === "Active").length;
  const inactiveAffiliates = affiliates.filter((a) => a.status === "Inactive").length;
  const suspendedAffiliates = affiliates.filter((a) => a.status === "Suspended").length;
  const totalReferrals = affiliates.reduce((sum, a) => sum + a.referrals, 0);
  const totalEnrollments = affiliates.reduce((sum, a) => sum + a.enrollments, 0);
  const totalCommission = affiliates.reduce((sum, a) => sum + a.commission, 0);
  const pendingCommission = affiliates.reduce((sum, a) => sum + a.pendingCommission, 0);
  const paidCommission = Math.max(totalCommission - pendingCommission, 0);

  const closeMenu = () => {
    setActiveMenu(null);
    setMenuPosition(null);
  };

  const openMenu = (event: MouseEvent<HTMLButtonElement>, affiliateId: number) => {
    event.stopPropagation();

    if (activeMenu === affiliateId) {
      closeMenu();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const width = 225;
    const height = 205;
    const padding = 12;

    let left = Math.max(padding, Math.min(rect.right - width, window.innerWidth - width - padding));
    let top = rect.bottom + 8;

    if (top + height > window.innerHeight - padding) {
      top = Math.max(padding, rect.top - height - 8);
    }

    setActiveMenu(affiliateId);
    setMenuPosition({ top, left });
  };

  const updateAffiliateStatus = (affiliateId: number, status: AffiliateStatus) => {
    setAffiliates((current) =>
      current.map((affiliate) =>
        affiliate.id === affiliateId ? { ...affiliate, status } : affiliate
      )
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
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-500">
            <Users size={15} />
            Partner & Referral Management
          </div>
          <h1 className="text-2xl font-bold text-[#173B67] sm:text-3xl">
            Affiliate Marketing
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor affiliates, referrals, enrollments and commission activity.
          </p>
        </div>

        {/* Development note */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Users size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Development mode</p>
            <p className="mt-0.5 text-blue-700">
              Affiliate records are currently stored in page state. Referral
              tracking, commission calculations and payouts can be connected
              to the backend later.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Affiliates"
            value={totalAffiliates}
            icon={<Users size={20} />}
            iconClass="bg-blue-50 text-blue-600"
          />
          <SummaryCard
            title="Active Affiliates"
            value={activeAffiliates}
            icon={<CheckCircle2 size={20} />}
            iconClass="bg-green-50 text-green-600"
          />
          <SummaryCard
            title="Total Referrals"
            value={totalReferrals}
            icon={<ArrowUpRight size={20} />}
            iconClass="bg-violet-50 text-violet-600"
          />
          <SummaryCard
            title="Successful Enrollments"
            value={totalEnrollments}
            icon={<Users size={20} />}
            iconClass="bg-amber-50 text-amber-600"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MoneyCard
            title="Total Commission"
            value={totalCommission}
            icon={<IndianRupee size={20} />}
            iconClass="bg-blue-50 text-blue-600"
          />
          <MoneyCard
            title="Paid Commission"
            value={paidCommission}
            icon={<Wallet size={20} />}
            iconClass="bg-green-50 text-green-600"
          />
          <MoneyCard
            title="Pending Payouts"
            value={pendingCommission}
            icon={<Clock3 size={20} />}
            iconClass="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Table */}
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
                placeholder="Search affiliate, ID, email or phone..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  {[
                    "AFFILIATE",
                    "AFFILIATE ID",
                    "REFERRALS",
                    "ENROLLMENTS",
                    "COMMISSION",
                    "PENDING",
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
                {filteredAffiliates.map((affiliate) => (
                  <tr
                    key={affiliate.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">{affiliate.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{affiliate.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#173B67]">
                      {affiliate.affiliateId}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{affiliate.referrals}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{affiliate.enrollments}</td>
                    <td className="px-5 py-4 text-sm font-bold text-green-700">
                      ₹{affiliate.commission.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold">
                      <span className={affiliate.pendingCommission > 0 ? "text-amber-600" : "text-slate-500"}>
                        ₹{affiliate.pendingCommission.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={affiliate.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          title="View Affiliate"
                          onClick={(event) => {
                            event.stopPropagation();
                            setViewAffiliate(affiliate);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          title="More Actions"
                          onClick={(event) => openMenu(event, affiliate.id)}
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

            {filteredAffiliates.length === 0 && (
              <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-10 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#173B67]">
                  <Users size={30} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  No affiliate records
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Affiliate activity will appear here automatically when
                  students join the affiliate program and generate referrals.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating actions */}
      {activeMenu !== null && menuPosition && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="fixed z-[1000] w-[225px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <MenuButton
            icon={<Eye size={16} />}
            label="View Referral Activity"
            onClick={() => {
              const affiliate = affiliates.find((item) => item.id === activeMenu);
              if (affiliate) setViewAffiliate(affiliate);
              closeMenu();
            }}
          />
          <MenuButton
            icon={<Wallet size={16} />}
            label="View Commission Details"
            onClick={() => {
              alert("Commission details will be connected to the affiliate transaction history.");
              closeMenu();
            }}
          />
          <MenuButton
            icon={<Ban size={16} />}
            label="Suspend Affiliate"
            danger
            onClick={() => updateAffiliateStatus(activeMenu, "Suspended")}
          />
          <MenuButton
            icon={<CheckCircle2 size={16} />}
            label="Activate Affiliate"
            onClick={() => updateAffiliateStatus(activeMenu, "Active")}
          />
        </div>
      )}

      {/* View modal */}
      {viewAffiliate && (
        <Modal onClose={() => setViewAffiliate(null)}>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#173B67]">Affiliate Details</h2>
              <p className="mt-1 text-sm text-slate-500">{viewAffiliate.affiliateId}</p>
            </div>
            <button
              onClick={() => setViewAffiliate(null)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <X size={18} />
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <DetailRow label="Name" value={viewAffiliate.name} />
            <DetailRow label="Affiliate ID" value={viewAffiliate.affiliateId} />
            <DetailRow label="Email" value={viewAffiliate.email} />
            <DetailRow label="Phone" value={viewAffiliate.phone} />
            <DetailRow label="Total Referrals" value={String(viewAffiliate.referrals)} />
            <DetailRow label="Successful Enrollments" value={String(viewAffiliate.enrollments)} />
            <DetailRow
              label="Total Commission"
              value={`₹${viewAffiliate.commission.toLocaleString("en-IN")}`}
            />
            <DetailRow
              label="Pending Commission"
              value={`₹${viewAffiliate.pendingCommission.toLocaleString("en-IN")}`}
            />
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-slate-500">Status</span>
              <StatusBadge status={viewAffiliate.status} />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setViewAffiliate(null)}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
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
        <p className="mt-1 text-2xl font-bold text-slate-800">
          {value.toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}

function MoneyCard({
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
        <p className="mt-1 text-xl font-bold text-slate-800">
          ₹{value.toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AffiliateStatus }) {
  const classes =
    status === "Active"
      ? "bg-green-50 text-green-700"
      : status === "Inactive"
        ? "bg-slate-100 text-slate-600"
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

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
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
