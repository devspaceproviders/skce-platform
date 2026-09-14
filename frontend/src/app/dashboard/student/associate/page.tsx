"use client";

import { useState } from "react";
import {
  Users,
  UserCheck,
  Clock3,
  Wallet,
  Copy,
  Check,
  Link2,
  TrendingUp,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";

const REFERRAL_CODE = "SKCE12345";
const REFERRAL_LINK = `https://skce.in/register?ref=${REFERRAL_CODE}`;

const REFERRALS = [
  {
    id: "REF001",
    student: "Rahul Kumar",
    course: "Python",
    date: "10 Sep 2026",
    status: "Enrolled",
    commission: "₹1,500",
  },
  {
    id: "REF002",
    student: "Priya Sharma",
    course: "MS Office",
    date: "05 Sep 2026",
    status: "Pending",
    commission: "₹800",
  },
  {
    id: "REF003",
    student: "Arun Reddy",
    course: "Java",
    date: "28 Aug 2026",
    status: "Enrolled",
    commission: "₹2,000",
  },
  {
    id: "REF004",
    student: "Sneha Devi",
    course: "Computer Basics",
    date: "20 Aug 2026",
    status: "Pending",
    commission: "₹500",
  },
];

const STATUS_STYLES: Record<
  string,
  { bg: string; fg: string }
> = {
  Enrolled: {
    bg: "#E9F9EF",
    fg: "#22A555",
  },
  Pending: {
    bg: "#FFF7E8",
    fg: "#B4790E",
  },
};

export default function AssociatePage() {
  const [copied, setCopied] = useState(false);

  const totalReferrals = REFERRALS.length;

  const successfulEnrollments = REFERRALS.filter(
    (item) => item.status === "Enrolled"
  ).length;

  const pendingReferrals = REFERRALS.filter(
    (item) => item.status === "Pending"
  ).length;

  const totalEarnings = "₹3,500";

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_LINK);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Clipboard may be unavailable in some browsers.
    }
  };

  return (
    <main
      style={{
        padding: "28px 32px 40px",
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 5px",
          }}
        >
          Associate Panel
        </h1>

        <p
          style={{
            color: "#6B7280",
            fontSize: "14px",
            margin: 0,
          }}
        >
          Track your referrals, enrollments and earnings.
        </p>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <SummaryCard
          icon={<Users size={19} />}
          label="Total Referrals"
          value={String(totalReferrals)}
        />

        <SummaryCard
          icon={<UserCheck size={19} />}
          label="Successful Enrollments"
          value={String(successfulEnrollments)}
        />

        <SummaryCard
          icon={<Clock3 size={19} />}
          label="Pending Referrals"
          value={String(pendingReferrals)}
        />

        <SummaryCard
          icon={<Wallet size={19} />}
          label="Total Earnings"
          value={totalEarnings}
        />
      </div>

      {/* Referral Link */}
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "13px",
          padding: "20px",
          marginBottom: "22px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "5px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "9px",
              background: "#EAF0FE",
              color: "#2F6BFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Link2 size={18} />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              My Referral Link
            </h2>

            <p
              style={{
                margin: "3px 0 0",
                fontSize: "11.5px",
                color: "#6B7280",
              }}
            >
              Share this link to refer new students to SKCE.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "16px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "12px",
              color: "#374151",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {REFERRAL_LINK}
          </div>

          <button
            onClick={copyReferralLink}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 14px",
              border: "none",
              borderRadius: "8px",
              background: copied
                ? "#22A555"
                : "#2F6BFF",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {copied ? (
              <Check size={15} />
            ) : (
              <Copy size={15} />
            )}

            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>

        <div
          style={{
            marginTop: "12px",
            fontSize: "10.5px",
            color: "#9CA3AF",
          }}
        >
          Referral Code:{" "}
          <span
            style={{
              color: "#374151",
              fontWeight: 600,
            }}
          >
            {REFERRAL_CODE}
          </span>
        </div>
      </section>

      {/* Associate Status + Earnings */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
          marginBottom: "22px",
        }}
      >
        {/* Status */}
        <section
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "13px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "15px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Associate Status
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px",
              borderRadius: "9px",
              background: "#F8FAFC",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "10.5px",
                  color: "#9CA3AF",
                  marginBottom: "3px",
                }}
              >
                Current Status
              </div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#22A555",
                }}
              >
                Active
              </div>
            </div>

            <div
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "#22A555",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              marginTop: "14px",
              color: "#6B7280",
              fontSize: "11.5px",
            }}
          >
            <CalendarDays size={14} />
            Joined 15 June 2026
          </div>
        </section>

        {/* Earnings */}
        <section
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "13px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "15px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Earnings Overview
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            <EarningItem
              label="Earned"
              value="₹3,500"
            />

            <EarningItem
              label="Pending"
              value="₹1,300"
            />

            <EarningItem
              label="Paid"
              value="₹2,200"
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              marginTop: "13px",
              fontSize: "11px",
              color: "#22A555",
            }}
          >
            <TrendingUp size={14} />
            Earnings update automatically after successful enrollment.
          </div>
        </section>
      </div>

      {/* Referral Activity */}
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "13px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <h2
            style={{
              margin: "0 0 4px",
              fontSize: "15px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Referral Activity
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: "11.5px",
              color: "#6B7280",
            }}
          >
            Track students referred through your link.
          </p>
        </div>

        {/* Desktop Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "650px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#F8FAFC",
                }}
              >
                {[
                  "Student",
                  "Course",
                  "Referral Date",
                  "Status",
                  "Commission",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: "left",
                      padding: "11px 20px",
                      fontSize: "10.5px",
                      fontWeight: 700,
                      color: "#6B7280",
                      borderBottom:
                        "1px solid #E5E7EB",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {REFERRALS.map((referral) => {
                const style =
                  STATUS_STYLES[referral.status];

                return (
                  <tr key={referral.id}>
                    <td
                      style={{
                        padding: "13px 20px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#111827",
                        borderBottom:
                          "1px solid #F1F3F5",
                      }}
                    >
                      {referral.student}
                    </td>

                    <td
                      style={{
                        padding: "13px 20px",
                        fontSize: "12px",
                        color: "#4B5563",
                        borderBottom:
                          "1px solid #F1F3F5",
                      }}
                    >
                      {referral.course}
                    </td>

                    <td
                      style={{
                        padding: "13px 20px",
                        fontSize: "11.5px",
                        color: "#6B7280",
                        borderBottom:
                          "1px solid #F1F3F5",
                      }}
                    >
                      {referral.date}
                    </td>

                    <td
                      style={{
                        padding: "13px 20px",
                        borderBottom:
                          "1px solid #F1F3F5",
                      }}
                    >
                      <span
                        style={{
                          background: style.bg,
                          color: style.fg,
                          padding: "5px 9px",
                          borderRadius: "6px",
                          fontSize: "10.5px",
                          fontWeight: 600,
                        }}
                      >
                        {referral.status}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: "13px 20px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#111827",
                        borderBottom:
                          "1px solid #F1F3F5",
                      }}
                    >
                      {referral.commission}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Future Note */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginTop: "16px",
          fontSize: "10.5px",
          color: "#9CA3AF",
        }}
      >
        <ArrowUpRight size={13} />

        Referral tracking and earnings will be automatically
        calculated from student enrollments and payments.
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary Card                                                               */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "11px",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "9px",
          background: "#EAF0FE",
          color: "#2F6BFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: "10.5px",
            color: "#6B7280",
            marginBottom: "3px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Earnings Item                                                              */
/* -------------------------------------------------------------------------- */

function EarningItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: "11px",
        borderRadius: "8px",
        background: "#F8FAFC",
      }}
    >
      <div
        style={{
          fontSize: "9.5px",
          color: "#9CA3AF",
          marginBottom: "3px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}