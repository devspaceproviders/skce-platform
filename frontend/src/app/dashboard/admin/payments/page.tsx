"use client";

import type { MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  WalletCards,
  SlidersHorizontal,
  FilterX,
} from "lucide-react";

import {
  AdminPageShell,
  AdminPageHeader,
  ADMIN_BTN_GHOST,
} from "@/components/dashboard/admin/AdminPageHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type PaymentStatus = "Paid" | "Pending" | "Failed" | "Refunded";
type PaymentMethod =
  | "UPI"
  | "Cash"
  | "Card"
  | "Bank Transfer"
  | "Razorpay"
  | "Other";

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

const PAYMENT_METHODS: PaymentMethod[] = [
  "UPI",
  "Cash",
  "Card",
  "Bank Transfer",
  "Razorpay",
  "Other",
];
const PAYMENT_STATUSES: PaymentStatus[] = ["Paid", "Pending", "Failed", "Refunded"];

function getToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken")
  );
}

const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  // Dropdown-only column filters, consistent with the Students and Assessments admin tables.
  const [studentFilter, setStudentFilter] = useState("All");
  const [studentIdFilter, setStudentIdFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [amountFilter, setAmountFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState<"All" | PaymentMethod>("All");
  const [transactionFilter, setTransactionFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | PaymentStatus>("All");

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const token = getToken();
      if (!token) throw new Error("Your admin session has expired. Please login again.");

      const response = await fetch(`${API_URL}/admin/payments`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const json = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("accessToken");
        if (typeof window !== "undefined") window.location.href = "/admin/login";
        throw new Error("Your admin session has expired. Please login again.");
      }

      if (!response.ok || !json?.success || !json?.data) {
        throw new Error(json?.message || "Unable to load payment records.");
      }

      const rows = Array.isArray(json.data.payments) ? json.data.payments : [];
      setPayments(rows.map((row: Payment) => ({
        ...row,
        studentName: String(row.studentName ?? "Unknown student"),
        studentId: String(row.studentId ?? "—"),
        course: String(row.course ?? "—"),
        amount: Number(row.amount ?? 0),
        method: row.method ?? "Other",
        transactionId: String(row.transactionId ?? "—"),
        paymentDate: String(row.paymentDate ?? ""),
        status: row.status ?? "Pending",
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payment records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const uniqueFilterOptions = useMemo(() => {
    const unique = (values: string[]) => Array.from(new Set(values.filter((value) => value && value !== "—"))).sort((a, b) => a.localeCompare(b));
    return {
      students: unique(payments.map((payment) => payment.studentName)),
      studentIds: unique(payments.map((payment) => payment.studentId)),
      courses: unique(payments.map((payment) => payment.course)),
      amounts: Array.from(new Set(payments.map((payment) => String(payment.amount)))).sort((a, b) => Number(a) - Number(b)),
      transactionIds: unique(payments.map((payment) => payment.transactionId)),
      dates: unique(payments.map((payment) => toDateInputValue(payment.paymentDate))).sort((a, b) => b.localeCompare(a)),
    };
  }, [payments]);

  const filteredPayments = useMemo(() => payments.filter((payment) => (
    (!normalize(search) || normalize(`${payment.studentName} ${payment.studentId} ${payment.course} ${payment.transactionId} ${payment.method} ${payment.status} ${payment.amount}`).includes(normalize(search))) &&
    (studentFilter === "All" || payment.studentName === studentFilter) &&
    (studentIdFilter === "All" || payment.studentId === studentIdFilter) &&
    (courseFilter === "All" || payment.course === courseFilter) &&
    (amountFilter === "All" || String(payment.amount) === amountFilter) &&
    (methodFilter === "All" || payment.method === methodFilter) &&
    (transactionFilter === "All" || payment.transactionId === transactionFilter) &&
    (dateFilter === "All" || toDateInputValue(payment.paymentDate) === dateFilter) &&
    (statusFilter === "All" || payment.status === statusFilter)
  )), [payments, search, studentFilter, studentIdFilter, courseFilter, amountFilter, methodFilter, transactionFilter, dateFilter, statusFilter]);

  const totalRevenue = payments
    .filter((payment) => payment.status === "Paid")
    .reduce((total, payment) => total + payment.amount, 0);
  const pendingAmount = payments
    .filter((payment) => payment.status === "Pending")
    .reduce((total, payment) => total + payment.amount, 0);
  const paidAmount = totalRevenue;
  const transactionCount = payments.length;

  const clearFilters = () => {
    setSearch("");
    setStudentFilter("All");
    setStudentIdFilter("All");
    setCourseFilter("All");
    setAmountFilter("All");
    setMethodFilter("All");
    setTransactionFilter("All");
    setDateFilter("All");
    setStatusFilter("All");
  };

  const hasFilters = Boolean(
    search.trim() ||
    studentFilter !== "All" || studentIdFilter !== "All" || courseFilter !== "All" || amountFilter !== "All" ||
    methodFilter !== "All" || transactionFilter !== "All" || dateFilter !== "All" || statusFilter !== "All"
  );

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

  const openMoreMenu = (e: MouseEvent<HTMLButtonElement>, paymentId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 230;
    const menuHeight = 80;
    const gap = 8;
    const padding = 12;
    let left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - padding);
    left = Math.max(padding, left);
    let top = rect.bottom + gap;
    if (top + menuHeight > window.innerHeight - padding) top = rect.top - menuHeight - gap;
    top = Math.max(padding, top);
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
    <>
      <AdminPageShell>
        <AdminPageHeader
          label="Administration Portal · Finance"
          title="Payments"
          subtitle="Manage student payments, transactions, receipts and payment status in one place."
          icon={WalletCards}
          chips={[
            { label: "Transactions", value: transactionCount },
            { label: "Showing", value: filteredPayments.length },
          ]}
          actions={
            <button
              type="button"
              onClick={() => void loadPayments(true)}
              disabled={refreshing}
              className={ADMIN_BTN_GHOST}
            >
              <RotateCcw size={16} className={refreshing ? "animate-spin motion-reduce:animate-none" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          }
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={<IndianRupee size={20} />} value={totalRevenue} title="Total Revenue" currency tone="navy" />
          <SummaryCard icon={<CheckCircle2 size={20} />} value={paidAmount} title="Paid Amount" currency tone="green" />
          <SummaryCard icon={<Clock3 size={20} />} value={pendingAmount} title="Pending Amount" currency tone="orange" />
          <SummaryCard icon={<CreditCard size={20} />} value={transactionCount} title="Transactions" tone="slate" />
        </div>

        {/* Filters and payment table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-[#DCE5F1] bg-gradient-to-r from-white via-[#FBFCFE] to-[#FFF7EF] p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#173B67]">
                  <SlidersHorizontal size={17} className="text-[#F97316]" />
                  Filter payments
                </div>
                <p className="mt-1 text-xs text-slate-500">Search, or choose a dropdown under any column to filter the payment records.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student, ID, course, transaction..."
                    aria-label="Search payments"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <span className="rounded-full border border-[#D7E4F4] bg-[#EEF4FC] px-3 py-1.5 text-xs font-bold text-[#173B67]">
                  Showing {filteredPayments.length} of {payments.length} payments
                </span>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasFilters}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#DCE5F1] bg-white px-3 text-xs font-semibold text-[#173B67] transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FilterX size={14} /> Clear Filters
                </button>
              </div>
            </div>

          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] table-fixed border-separate border-spacing-0">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead>
                <tr className="bg-[#EEF3FA]">
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
                {/* Dropdown-only filters under every data column, matching Students and Assessments. */}
                <tr className="bg-[#F8FAFD]">
                  <FilterCell>
                    <FilterSelect ariaLabel="Filter by student" value={studentFilter} onChange={setStudentFilter}>
                      <option value="All">All students</option>
                      {uniqueFilterOptions.students.map((value) => <option key={value} value={value}>{value}</option>)}
                    </FilterSelect>
                  </FilterCell>
                  <FilterCell>
                    <FilterSelect ariaLabel="Filter by student ID" value={studentIdFilter} onChange={setStudentIdFilter}>
                      <option value="All">All IDs</option>
                      {uniqueFilterOptions.studentIds.map((value) => <option key={value} value={value}>{value}</option>)}
                    </FilterSelect>
                  </FilterCell>
                  <FilterCell>
                    <FilterSelect ariaLabel="Filter by course" value={courseFilter} onChange={setCourseFilter}>
                      <option value="All">All courses</option>
                      {uniqueFilterOptions.courses.map((value) => <option key={value} value={value}>{value}</option>)}
                    </FilterSelect>
                  </FilterCell>
                  <FilterCell>
                    <FilterSelect ariaLabel="Filter by amount" value={amountFilter} onChange={setAmountFilter}>
                      <option value="All">All amounts</option>
                      {uniqueFilterOptions.amounts.map((value) => <option key={value} value={value}>{formatCurrency(Number(value))}</option>)}
                    </FilterSelect>
                  </FilterCell>
                  <FilterCell>
                    <FilterSelect ariaLabel="Filter by method" value={methodFilter} onChange={(value) => setMethodFilter(value as "All" | PaymentMethod)}>
                      <option value="All">All methods</option>
                      {PAYMENT_METHODS.filter((method) => payments.some((payment) => payment.method === method)).map((method) => <option key={method} value={method}>{method}</option>)}
                    </FilterSelect>
                  </FilterCell>
                  <FilterCell>
                    <FilterSelect ariaLabel="Filter by transaction ID" value={transactionFilter} onChange={setTransactionFilter}>
                      <option value="All">All transactions</option>
                      {uniqueFilterOptions.transactionIds.map((value) => <option key={value} value={value}>{value}</option>)}
                    </FilterSelect>
                  </FilterCell>
                  <FilterCell>
                    <FilterSelect ariaLabel="Filter by date" value={dateFilter} onChange={setDateFilter}>
                      <option value="All">All dates</option>
                      {uniqueFilterOptions.dates.map((value) => <option key={value} value={value}>{formatDate(value)}</option>)}
                    </FilterSelect>
                  </FilterCell>
                  <FilterCell>
                    <FilterSelect ariaLabel="Filter by status" value={statusFilter} onChange={(value) => setStatusFilter(value as "All" | PaymentStatus)}>
                      <option value="All">All statuses</option>
                      {PAYMENT_STATUSES.filter((status) => payments.some((payment) => payment.status === status)).map((status) => <option key={status} value={status}>{status}</option>)}
                    </FilterSelect>
                  </FilterCell>
                  <FilterCell>
                    <button type="button" onClick={clearFilters} disabled={!hasFilters} className="h-9 whitespace-nowrap rounded-lg border border-[#D7E2F0] bg-white px-2 text-xs font-semibold text-[#173B67] transition hover:border-[#F97316] hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40">Clear</button>
                  </FilterCell>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <StateRow colSpan={9} icon={<CreditCard size={27} />} title="Loading payments..." description="Fetching payment records from the backend." />
                ) : error ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex min-h-[200px] flex-col items-center justify-center px-5 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500"><XCircle size={27} /></div>
                        <h3 className="text-lg font-bold text-slate-800">Unable to load payments</h3>
                        <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{error}</p>
                        <button type="button" onClick={() => void loadPayments()} className="mt-4 rounded-xl bg-[#173B67] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245487]">Try again</button>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <StateRow
                    colSpan={9}
                    icon={<CreditCard size={27} />}
                    title={payments.length === 0 ? "No payment records" : "No matching payments"}
                    description={payments.length === 0 ? "No payment records are currently available." : "Change the search or dropdown values, or clear the filters to see more payments."}
                  />
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="group border-b border-slate-100 transition-colors duration-200 hover:bg-[#F7FAFF]">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#173B67] to-[#2C639C] text-xs font-bold text-white shadow-sm">
                            {payment.studentName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800">{payment.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{payment.studentId || "—"}</TableCell>
                      <TableCell>{payment.course || "—"}</TableCell>
                      <TableCell><span className="font-bold text-slate-800">{formatCurrency(payment.amount)}</span></TableCell>
                      <TableCell><MethodBadge method={payment.method} /></TableCell>
                      <TableCell><span className="max-w-[220px] break-all text-xs font-medium text-slate-500">{payment.transactionId}</span></TableCell>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell><StatusBadge status={payment.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ActionButton title="View payment" onClick={() => openViewModal(payment)}><Eye size={16} /></ActionButton>
                          <ActionButton title="More actions" onClick={(e) => openMoreMenu(e, payment.id)}><MoreVertical size={16} /></ActionButton>
                        </div>
                      </TableCell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>Payment data is retrieved from the connected backend.</span>
            <span className="font-semibold text-[#173B67]">{filteredPayments.length} record{filteredPayments.length === 1 ? "" : "s"} displayed</span>
          </div>
        </section>
      </AdminPageShell>

      {/* Floating actions menu */}
      {openMenuId && (
        <>
          <button aria-label="Close payment actions" className="fixed inset-0 z-[9998] cursor-default" onClick={() => setOpenMenuId(null)} />
          <div className="fixed z-[9999] w-[230px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl" style={{ top: menuPosition.top, left: menuPosition.left }}>
            {(() => {
              const payment = payments.find((item) => item.id === openMenuId);
              if (!payment) return null;
              return <MoreMenuItem icon={<Receipt size={17} />} label="View Receipt" onClick={() => openReceiptModal(payment)} />;
            })()}
          </div>
        </>
      )}

      {/* Payment details modal */}
      {showViewModal && selectedPayment && (
        <ModalOverlay onClose={closeAll}>
          <div className="w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-[modalIn_180ms_ease-out] motion-reduce:animate-none">
            <ModalHeader title="Payment Details" subtitle="Complete transaction information." onClose={closeAll} />
            <div className="p-5 sm:p-6">
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-[#F4F7FB] p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]"><IndianRupee size={23} /></div>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-slate-800">{formatCurrency(selectedPayment.amount)}</h3>
                  <p className="mt-0.5 break-all text-sm text-slate-500">{selectedPayment.transactionId}</p>
                </div>
                <div className="ml-auto"><StatusBadge status={selectedPayment.status} /></div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem label="Student" value={selectedPayment.studentName} />
                <DetailItem label="Student ID" value={selectedPayment.studentId || "—"} />
                <DetailItem label="Course" value={selectedPayment.course || "—"} />
                <DetailItem label="Amount" value={formatCurrency(selectedPayment.amount)} />
                <DetailItem label="Payment Method" value={selectedPayment.method} />
                <DetailItem label="Transaction ID" value={selectedPayment.transactionId} />
                <DetailItem label="Payment Date" value={formatDate(selectedPayment.paymentDate)} />
                <DetailItem label="Status" value={selectedPayment.status} />
              </div>
            </div>
            <ModalFooter><button type="button" onClick={closeAll} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Close</button></ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Receipt preview modal */}
      {showReceiptModal && selectedPayment && (
        <ModalOverlay onClose={closeAll}>
          <div className="w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-[modalIn_180ms_ease-out] motion-reduce:animate-none">
            <ModalHeader title="Payment Receipt" subtitle="Receipt preview." onClose={closeAll} />
            <div className="p-6 sm:p-7">
              <div className="border-b border-dashed border-slate-300 pb-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]"><Receipt size={23} /></div>
                <h2 className="text-xl font-extrabold text-[#173B67]">SK Computer Education</h2>
                <p className="mt-1 text-sm text-slate-500">Payment Receipt</p>
              </div>
              <div className="py-5">
                <ReceiptRow label="Student" value={selectedPayment.studentName} />
                <ReceiptRow label="Student ID" value={selectedPayment.studentId || "—"} />
                <ReceiptRow label="Course" value={selectedPayment.course || "—"} />
                <ReceiptRow label="Amount" value={formatCurrency(selectedPayment.amount)} />
                <ReceiptRow label="Method" value={selectedPayment.method} />
                <ReceiptRow label="Transaction ID" value={selectedPayment.transactionId} />
                <ReceiptRow label="Date" value={formatDate(selectedPayment.paymentDate)} />
              </div>
              <div className="rounded-xl bg-[#F4F7FB] p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Payment Status</p>
                <div className="mt-2"><StatusBadge status={selectedPayment.status} /></div>
              </div>
            </div>
            <ModalFooter><button type="button" onClick={closeAll} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Close</button></ModalFooter>
          </div>
        </ModalOverlay>
      )}
      <style jsx global>{`
        @keyframes modalIn { from { opacity: 0; transform: translateY(8px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
      `}</style>
    </>
  );
}

function SummaryCard({ icon, value, title, currency = false, tone }: {
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
    <div className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(23,59,103,0.09)]">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#173B67] via-[#4F83B8] to-[#F97316] opacity-75`} />
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold tracking-tight text-[#173B67]">{currency ? formatCurrency(value) : value.toLocaleString("en-IN")}</div>
        <div className="mt-0.5 text-sm font-medium text-slate-500">{title}</div>
      </div>
    </div>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return <th scope="col" className="whitespace-nowrap border-b border-[#DCE5F1] border-t-2 border-t-[#F97316] px-3 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-wider text-[#173B67]">{children}</th>;
}
function TableCell({ children }: { children: ReactNode }) {
  return <td className="overflow-hidden border-b border-slate-100 px-3 py-4 text-sm text-slate-600 last:border-b-0">{children}</td>;
}
function FilterCell({ children }: { children: ReactNode }) {
  return <th className="border-b border-[#DCE5F1] px-2 py-2.5 text-left align-top font-normal">{children}</th>;
}
function FilterSelect({ ariaLabel, value, onChange, children }: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return <select aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full min-w-0 rounded-lg border border-[#D7E2F0] bg-white px-1.5 text-xs text-[#173B67] outline-none transition duration-200 hover:border-[#B8CBE2] focus:border-[#F97316] focus:ring-2 focus:ring-orange-100">{children}</select>;
}
function StateRow({ colSpan, icon, title, description }: {
  colSpan: number;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return <tr><td colSpan={colSpan}><div className="flex min-h-[200px] flex-col items-center justify-center px-5 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#F97316]">{icon}</div>
    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
  </div></td></tr>;
}
function MethodBadge({ method }: { method: PaymentMethod }) {
  return <span className="inline-flex whitespace-nowrap rounded-lg bg-[#EEF3FA] px-2.5 py-1 text-xs font-semibold text-[#425875]">{method}</span>;
}
function StatusBadge({ status }: { status: PaymentStatus }) {
  const config: Record<PaymentStatus, string> = {
    Paid: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Pending: "bg-amber-50 text-amber-700 ring-amber-100",
    Failed: "bg-red-50 text-red-700 ring-red-100",
    Refunded: "bg-sky-50 text-sky-700 ring-sky-100",
  };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${config[status]}`}>{status}</span>;
}
function ActionButton({ children, title, onClick }: {
  children: ReactNode;
  title: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return <button type="button" title={title} aria-label={title} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition duration-150 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200">{children}</button>;
}
function MoreMenuItem({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-orange-50 hover:text-orange-700">{icon}<span>{label}</span></button>;
}
function DetailItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 p-3.5"><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-700">{value}</p></div>;
}
function ReceiptRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-5 border-b border-slate-100 py-2.5 last:border-0"><span className="text-sm text-slate-500">{label}</span><span className="break-all text-right text-sm font-semibold text-slate-700">{value}</span></div>;
}
function ModalOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>{children}</div>;
}
function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
    <div><h2 className="text-xl font-bold text-[#173B67]">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
    <button type="button" onClick={onClose} aria-label="Close dialog" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-orange-50 hover:text-orange-600"><X size={18} /></button>
  </div>;
}
function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{children}</div>;
}
function formatCurrency(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
function formatDate(date: string) {
  if (!date) return "Not set";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function toDateInputValue(date: string) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
