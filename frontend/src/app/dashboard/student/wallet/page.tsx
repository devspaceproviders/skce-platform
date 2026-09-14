"use client";

import {
  Wallet as WalletIcon,
  TrendingUp,
  Clock3,
  ArrowDownToLine,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

const TRANSACTIONS = [
  {
    id: "TXN001",
    description: "Affiliate Commission - Python Enrollment",
    date: "10 Sep 2026",
    type: "Credit",
    amount: "₹1,500",
    status: "Completed",
  },
  {
    id: "TXN002",
    description: "Affiliate Commission - Java Enrollment",
    date: "28 Aug 2026",
    type: "Credit",
    amount: "₹2,000",
    status: "Completed",
  },
  {
    id: "TXN003",
    description: "Commission - MS Office Referral",
    date: "05 Sep 2026",
    type: "Credit",
    amount: "₹800",
    status: "Pending",
  },
  {
    id: "TXN004",
    description: "Commission - Computer Basics Referral",
    date: "20 Aug 2026",
    type: "Credit",
    amount: "₹500",
    status: "Pending",
  },
];

const STATUS_STYLES: Record<
  string,
  { bg: string; fg: string }
> = {
  Completed: {
    bg: "#E9F9EF",
    fg: "#22A555",
  },
  Pending: {
    bg: "#FFF7E8",
    fg: "#B4790E",
  },
};

export default function WalletPage() {
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
          My Wallet
        </h1>

        <p
          style={{
            color: "#6B7280",
            fontSize: "14px",
            margin: 0,
          }}
        >
          View your balance, earnings and transaction history.
        </p>
      </div>

      {/* Balance Card */}
      <section
        style={{
          background: "#0F2A44",
          borderRadius: "14px",
          padding: "24px",
          color: "#FFFFFF",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                opacity: 0.8,
                marginBottom: "8px",
              }}
            >
              <WalletIcon size={17} />
              Available Balance
            </div>

            <div
              style={{
                fontSize: "30px",
                fontWeight: 700,
                marginBottom: "5px",
              }}
            >
              ₹2,200
            </div>

            <div
              style={{
                fontSize: "11px",
                opacity: 0.7,
              }}
            >
              Available for payout
            </div>
          </div>

          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WalletIcon size={25} />
          </div>
        </div>

        <div
          style={{
            marginTop: "22px",
            paddingTop: "16px",
            borderTop:
              "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "15px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              opacity: 0.75,
            }}
          >
            Minimum payout threshold: ₹1,000
          </div>

          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              border: "none",
              borderRadius: "8px",
              background: "#FFFFFF",
              color: "#0F2A44",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <ArrowDownToLine size={14} />
            Request Payout
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "22px",
        }}
      >
        <SummaryCard
          icon={<TrendingUp size={19} />}
          label="Total Earned"
          value="₹3,500"
        />

        <SummaryCard
          icon={<Clock3 size={19} />}
          label="Pending"
          value="₹1,300"
        />

        <SummaryCard
          icon={<ArrowDownToLine size={19} />}
          label="Total Paid Out"
          value="₹2,200"
        />
      </div>

      {/* Payout Information */}
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
            marginBottom: "15px",
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
            <ArrowDownToLine size={18} />
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
              Payout Information
            </h2>

            <p
              style={{
                margin: "3px 0 0",
                fontSize: "11.5px",
                color: "#6B7280",
              }}
            >
              Your payout status and account information.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          <InfoBox
            label="Payout Status"
            value="Eligible"
            valueColor="#22A555"
          />

          <InfoBox
            label="Payout Method"
            value="Not configured"
          />

          <InfoBox
            label="Last Payout"
            value="₹2,200 · 01 Sep 2026"
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            marginTop: "14px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "#F8FAFC",
            color: "#6B7280",
            fontSize: "10.5px",
          }}
        >
          <CircleAlert size={14} />

          Payouts will be processed automatically according
          to the configured payout rules.
        </div>
      </section>

      {/* Transaction History */}
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
            Transaction History
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: "11.5px",
              color: "#6B7280",
            }}
          >
            Your wallet activity and commission transactions.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "700px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#F8FAFC",
                }}
              >
                {[
                  "Transaction",
                  "Date",
                  "Type",
                  "Amount",
                  "Status",
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
              {TRANSACTIONS.map((transaction) => {
                const status =
                  STATUS_STYLES[transaction.status];

                return (
                  <tr key={transaction.id}>
                    <td
                      style={{
                        padding: "14px 20px",
                        borderBottom:
                          "1px solid #F1F3F5",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "9px",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "#E9F9EF",
                            color: "#22A555",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <ArrowUpRight size={15} />
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            {transaction.description}
                          </div>

                          <div
                            style={{
                              fontSize: "9.5px",
                              color: "#9CA3AF",
                              marginTop: "2px",
                            }}
                          >
                            {transaction.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: "11.5px",
                        color: "#6B7280",
                        borderBottom:
                          "1px solid #F1F3F5",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <CalendarDays size={13} />
                        {transaction.date}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: "11.5px",
                        color: "#22A555",
                        fontWeight: 600,
                        borderBottom:
                          "1px solid #F1F3F5",
                      }}
                    >
                      {transaction.type}
                    </td>

                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#111827",
                        borderBottom:
                          "1px solid #F1F3F5",
                      }}
                    >
                      {transaction.amount}
                    </td>

                    <td
                      style={{
                        padding: "14px 20px",
                        borderBottom:
                          "1px solid #F1F3F5",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: status.bg,
                          color: status.fg,
                          padding: "5px 9px",
                          borderRadius: "6px",
                          fontSize: "10.5px",
                          fontWeight: 600,
                        }}
                      >
                        {transaction.status ===
                        "Completed" ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Clock3 size={12} />
                        )}

                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer Note */}
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

        Wallet balance and transactions will be updated
        automatically from verified earnings and payouts.
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
/* Info Box                                                                   */
/* -------------------------------------------------------------------------- */

function InfoBox({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "9px",
        background: "#F8FAFC",
        border: "1px solid #F0F1F3",
      }}
    >
      <div
        style={{
          fontSize: "9.5px",
          color: "#9CA3AF",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: valueColor || "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}