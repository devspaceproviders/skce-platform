"use client";

import type { MouseEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Search,
  CreditCard,
  CheckCircle2,
  Clock3,
  XCircle,
  RotateCcw,
  Eye,
  MoreVertical,
  Receipt,
  IndianRupee,
  X,
} from "lucide-react";

type PaymentStatus = "Paid" | "Pending" | "Failed" | "Refunded";
type PaymentMethod = "UPI" | "Cash" | "Card" | "Bank Transfer" | "Other";

type Payment = {
  id: string;
  studentName: string;
  studentId: string;
  course: string;
  amount: number;
  method: PaymentMethod;
  transactionId: string;
  paymentDate: string;
  status: PaymentStatus;
};

const INITIAL_PAYMENTS: Payment[] = [];

const PAYMENT_METHODS: PaymentMethod[] = [
  "UPI",
  "Cash",
  "Card",
  "Bank Transfer",
  "Other",
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PaymentStatus>("All");
  const [methodFilter, setMethodFilter] = useState<"All" | PaymentMethod>("All");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const filteredPayments = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !searchText ||
        payment.studentName.toLowerCase().includes(searchText) ||
        payment.studentId.toLowerCase().includes(searchText) ||
        payment.course.toLowerCase().includes(searchText) ||
        payment.transactionId.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || payment.status === statusFilter;

      const matchesMethod =
        methodFilter === "All" || payment.method === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, search, statusFilter, methodFilter]);

  const totalRevenue = payments
    .filter((payment) => payment.status === "Paid")
    .reduce((total, payment) => total + payment.amount, 0);

  const pendingAmount = payments
    .filter((payment) => payment.status === "Pending")
    .reduce((total, payment) => total + payment.amount, 0);

  const paidAmount = payments
    .filter((payment) => payment.status === "Paid")
    .reduce((total, payment) => total + payment.amount, 0);

  const transactionCount = payments.length;

  const openViewModal = (payment: Payment) => {
    setOpenMenuId(null);
    setSelectedPayment(payment);
    setShowViewModal(true);
  };

  const openReceiptModal = (payment: Payment) => {
    setOpenMenuId(null);
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const markAsPaid = (payment: Payment) => {
    setOpenMenuId(null);
    setPayments((current) =>
      current.map((item) =>
        item.id === payment.id ? { ...item, status: "Paid" } : item
      )
    );
  };

  const refundPayment = (payment: Payment) => {
    setOpenMenuId(null);

    const confirmed = window.confirm(
      `Are you sure you want to refund the payment of ${formatCurrency(
        payment.amount
      )} for ${payment.studentName}?`
    );

    if (!confirmed) return;

    setPayments((current) =>
      current.map((item) =>
        item.id === payment.id ? { ...item, status: "Refunded" } : item
      )
    );
  };

  const openMoreMenu = (
    e: MouseEvent<HTMLButtonElement>,
    paymentId: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 230;
    const menuHeight = 180;
    const gap = 8;
    const padding = 12;

    let left = rect.right - menuWidth;
    if (left < padding) left = padding;
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    let top = rect.bottom + gap;
    if (top + menuHeight > window.innerHeight - padding) {
      top = rect.top - menuHeight - gap;
    }
    if (top < padding) top = padding;

    setMenuPosition({ top, left });
    setOpenMenuId((current) => (current === paymentId ? null : paymentId));
  };

  const closeAll = () => {
    setSelectedPayment(null);
    setShowViewModal(false);
    setShowReceiptModal(false);
    setOpenMenuId(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              <CreditCard size={14} />
              ADMIN PORTAL
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
              Payments
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage student payments, transactions and payment status.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <CreditCard size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Finance
              </p>
              <p className="text-sm font-semibold text-slate-700">
                Payment Management
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<IndianRupee size={20} />}
            value={totalRevenue}
            title="Total Revenue"
            currency
            tone="navy"
          />
          <SummaryCard
            icon={<CheckCircle2 size={20} />}
            value={paidAmount}
            title="Paid Amount"
            currency
            tone="green"
          />
          <SummaryCard
            icon={<Clock3 size={20} />}
            value={pendingAmount}
            title="Pending Amount"
            currency
            tone="orange"
          />
          <SummaryCard
            icon={<CreditCard size={20} />}
            value={transactionCount}
            title="Transactions"
            tone="slate"
          />
        </div>

        {/* Payment Card */}
        <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Filters */}
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-xl">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by student, ID, course or transaction ID..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "All" | PaymentStatus)
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="All">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>

                <select
                  value={methodFilter}
                  onChange={(e) =>
                    setMethodFilter(e.target.value as "All" | PaymentMethod)
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="All">All Methods</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50">
                  <TableHeader>Student</TableHeader>
                  <TableHeader>Student ID</TableHeader>
                  <TableHeader>Course</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Method</TableHeader>
                  <TableHeader>Transaction ID</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex min-h-[360px] flex-col items-center justify-center px-5 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                          <CreditCard size={29} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">
                          No payment records
                        </h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                          Payment records will appear here once the student and
                          payment systems are connected.
                        </p>
                        <div className="mt-5 rounded-lg border border-dashed border-orange-200 bg-orange-50/50 px-4 py-2.5 text-xs font-medium text-orange-700">
                          Backend payment integration is pending
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-xs font-bold text-white">
                            {payment.studentName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800">
                            {payment.studentName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{payment.studentId}</TableCell>
                      <TableCell>{payment.course}</TableCell>
                      <TableCell>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(payment.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <MethodBadge method={payment.method} />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-slate-500">
                          {payment.transactionId}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ActionButton
                            title="View payment"
                            onClick={() => openViewModal(payment)}
                          >
                            <Eye size={16} />
                          </ActionButton>
                          <ActionButton
                            title="More actions"
                            onClick={(e) => openMoreMenu(e, payment.id)}
                          >
                            <MoreVertical size={16} />
                          </ActionButton>
                        </div>
                      </TableCell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Development note */}
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5 text-sm text-blue-800">
          <span className="font-semibold">Development mode:</span> payment
          records are currently stored in page state. Razorpay/backend
          integration will load verified transactions from the database later.
        </div>
      </div>

      {/* Floating Menu */}
      {openMenuId && (
        <div
          className="fixed z-[99999] w-[230px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          {(() => {
            const payment = payments.find((item) => item.id === openMenuId);
            if (!payment) return null;

            return (
              <>
                <MoreMenuItem
                  icon={<Receipt size={17} />}
                  label="View Receipt"
                  onClick={() => openReceiptModal(payment)}
                />

                {payment.status === "Pending" && (
                  <MoreMenuItem
                    icon={<CheckCircle2 size={17} />}
                    label="Mark as Paid"
                    onClick={() => markAsPaid(payment)}
                  />
                )}

                {payment.status === "Paid" && (
                  <MoreMenuItem
                    icon={<RotateCcw size={17} />}
                    label="Refund"
                    onClick={() => refundPayment(payment)}
                  />
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* View Payment Modal */}
      {showViewModal && selectedPayment && (
        <ModalOverlay onClose={closeAll}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Payment Details"
              subtitle="Complete transaction information."
              onClose={closeAll}
            />

            <div className="p-5 sm:p-6">
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#173B67] text-white">
                  <IndianRupee size={23} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-slate-800">
                    {formatCurrency(selectedPayment.amount)}
                  </h3>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {selectedPayment.transactionId}
                  </p>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={selectedPayment.status} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem label="Student" value={selectedPayment.studentName} />
                <DetailItem label="Student ID" value={selectedPayment.studentId} />
                <DetailItem label="Course" value={selectedPayment.course} />
                <DetailItem
                  label="Amount"
                  value={formatCurrency(selectedPayment.amount)}
                />
                <DetailItem label="Payment Method" value={selectedPayment.method} />
                <DetailItem
                  label="Transaction ID"
                  value={selectedPayment.transactionId}
                />
                <DetailItem
                  label="Payment Date"
                  value={formatDate(selectedPayment.paymentDate)}
                />
                <DetailItem label="Status" value={selectedPayment.status} />
              </div>
            </div>

            <ModalFooter>
              <button
                type="button"
                onClick={closeAll}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <ModalOverlay onClose={closeAll}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Payment Receipt"
              subtitle="Receipt preview."
              onClose={closeAll}
            />

            <div className="p-6 sm:p-7">
              <div className="border-b border-dashed border-slate-300 pb-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                  <Receipt size={23} />
                </div>
                <h2 className="text-xl font-bold text-[#173B67]">
                  SK Computer Education
                </h2>
                <p className="mt-1 text-sm text-slate-500">Payment Receipt</p>
              </div>

              <div className="py-5">
                <ReceiptRow label="Student" value={selectedPayment.studentName} />
                <ReceiptRow label="Student ID" value={selectedPayment.studentId} />
                <ReceiptRow label="Course" value={selectedPayment.course} />
                <ReceiptRow
                  label="Amount"
                  value={formatCurrency(selectedPayment.amount)}
                />
                <ReceiptRow label="Method" value={selectedPayment.method} />
                <ReceiptRow
                  label="Transaction ID"
                  value={selectedPayment.transactionId}
                />
                <ReceiptRow
                  label="Date"
                  value={formatDate(selectedPayment.paymentDate)}
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Payment Status
                </p>
                <div className="mt-2">
                  <StatusBadge status={selectedPayment.status} />
                </div>
              </div>
            </div>

            <ModalFooter>
              <button
                type="button"
                onClick={closeAll}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}
    </main>
  );
}

function SummaryCard({
  icon,
  value,
  title,
  currency = false,
  tone,
}: {
  icon: ReactNode;
  value: number;
  title: string;
  currency?: boolean;
  tone: "navy" | "green" | "orange" | "slate";
}) {
  const styles = {
    navy: "bg-blue-50 text-[#173B67]",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-800">
          {currency ? formatCurrency(value) : value}
        </div>
        <div className="mt-0.5 text-sm text-slate-500">{title}</div>
      </div>
    </div>
  );
}

function MethodBadge({ method }: { method: PaymentMethod }) {
  return (
    <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      {method}
    </span>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const config = {
    Paid: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Pending: "bg-amber-50 text-amber-700 ring-amber-100",
    Failed: "bg-red-50 text-red-700 ring-red-100",
    Refunded: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${config[status]}`}
    >
      {status}
    </span>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-4 text-sm text-slate-600">{children}</td>;
}

function ActionButton({
  children,
  title,
  onClick,
}: {
  children: ReactNode;
  title: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
    >
      {children}
    </button>
  );
}

function MoreMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-700"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-5 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
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
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
      <div>
        <h2 className="text-xl font-bold text-[#173B67]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-orange-50 hover:text-orange-600"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      {children}
    </div>
  );
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(date: string) {
  if (!date) return "Not set";

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
