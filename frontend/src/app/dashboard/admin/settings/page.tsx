"use client";

import {
  Settings,
  Building2,
  GraduationCap,
  Award,
  CreditCard,
  Users,
  Bell,
  ShieldCheck,
  CheckCircle2,
  Info,
  LockKeyhole,
  Clock3,
  Percent,
  Wallet,
} from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4F6FA",
        padding: "32px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "20px",
          marginBottom: "28px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#E8EEF9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Settings size={22} color="#0F2F6B" />
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Settings
            </h1>
          </div>

          <p
            style={{
              margin: 0,
              color: "#6B7280",
              fontSize: "14px",
            }}
          >
            View the current platform configuration and operational policies.
          </p>
        </div>

        {/* Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "#ECFDF3",
            border: "1px solid #BBF7D0",
            color: "#166534",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={17} />
          Platform Operational
        </div>
      </div>

      {/* Information Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "16px 18px",
          borderRadius: "12px",
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          marginBottom: "28px",
        }}
      >
        <Info
          size={19}
          color="#2563EB"
          style={{ marginTop: "2px", flexShrink: 0 }}
        />

        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#1E3A8A",
              marginBottom: "4px",
            }}
          >
            Configuration Overview
          </div>

          <div
            style={{
              fontSize: "13px",
              lineHeight: 1.6,
              color: "#374151",
            }}
          >
            These settings represent the current platform policies. Routine
            operations such as enrollment, completion tracking, certificates,
            payments, attendance, and affiliate calculations are intended to
            be handled automatically by the system.
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <Section
        icon={<Building2 size={20} />}
        title="Platform Overview"
        description="Basic institute and platform information"
      >
        <InfoGrid
          items={[
            ["Institute Name", "SK Computer Education"],
            ["Platform", "SKCE Learning Platform"],
            ["Currency", "Indian Rupee (INR)"],
            ["Platform Status", "Operational"],
            ["Registration", "Enabled"],
            ["User Roles", "Student, Trainer, Admin"],
          ]}
        />
      </Section>

      {/* Course & Completion */}
      <Section
        icon={<GraduationCap size={20} />}
        title="Course & Completion Policies"
        description="Current rules used to determine course completion"
      >
        <InfoGrid
          items={[
            ["Course Completion", "100% required"],
            ["Attendance Requirement", "75% minimum"],
            ["Assignment Requirement", "80% minimum"],
            ["Quiz Requirement", "50% minimum"],
            ["Final Assessment", "Required"],
            ["Completion Tracking", "Automatic"],
          ]}
        />

        <div
          style={{
            marginTop: "18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 14px",
            borderRadius: "9px",
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            color: "#166534",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={17} />
          Course completion is automatically evaluated by the platform.
        </div>
      </Section>

      {/* Certificate Policies */}
      <Section
        icon={<Award size={20} />}
        title="Certificate Policies"
        description="Certificate issuance and verification rules"
      >
        <InfoGrid
          items={[
            ["Automatic Certificates", "Enabled"],
            ["Certificate Generation", "Automatic"],
            ["Eligibility", "Based on course completion"],
            ["Certificate ID", "Automatically generated"],
            ["Certificate Storage", "Digital"],
            ["Verification", "Certificate ID based"],
          ]}
        />

        <div
          style={{
            marginTop: "18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 14px",
            borderRadius: "9px",
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            color: "#166534",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={17} />
          Eligible students receive certificates automatically after completion.
        </div>
      </Section>

      {/* Payments */}
      <Section
        icon={<CreditCard size={20} />}
        title="Payment Configuration"
        description="Current payment and transaction policies"
      >
        <InfoGrid
          items={[
            ["Currency", "INR (₹)"],
            ["Payment Tracking", "Automatic"],
            ["Payment Confirmation", "Automatic"],
            ["Receipt Generation", "Automatic"],
            ["Transaction Status", "System managed"],
            ["Refund Tracking", "System managed"],
          ]}
        />
      </Section>

      {/* Affiliate */}
      <Section
        icon={<Users size={20} />}
        title="Affiliate Marketing"
        description="Current affiliate and referral policies"
      >
        <InfoGrid
          items={[
            ["Affiliate Program", "Enabled"],
            ["Referral Tracking", "Automatic"],
            ["Commission Calculation", "Automatic"],
            ["Commission Type", "Percentage"],
            ["Minimum Payout", "System defined"],
            ["Referral Validity", "System managed"],
          ]}
        />

        <div
          style={{
            marginTop: "18px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          <MiniStat
            icon={<Percent size={18} />}
            label="Commission"
            value="Configured"
          />

          <MiniStat
            icon={<Wallet size={18} />}
            label="Wallet"
            value="Automatic"
          />

          <MiniStat
            icon={<Users size={18} />}
            label="Referral Tracking"
            value="Enabled"
          />
        </div>
      </Section>

      {/* Notifications */}
      <Section
        icon={<Bell size={20} />}
        title="Notification Status"
        description="System-generated notifications"
      >
        <InfoGrid
          items={[
            ["Student Registration", "Enabled"],
            ["Course Enrollment", "Enabled"],
            ["Payment Updates", "Enabled"],
            ["Assignment Updates", "Enabled"],
            ["Certificate Availability", "Enabled"],
            ["Affiliate Updates", "Enabled"],
          ]}
        />
      </Section>

      {/* Security */}
      <Section
        icon={<ShieldCheck size={20} />}
        title="Security Overview"
        description="Current platform access and security policies"
      >
        <InfoGrid
          items={[
            ["Authentication", "Required"],
            ["Student Access", "Enabled"],
            ["Trainer Access", "Enabled"],
            ["Admin Access", "Restricted"],
            ["Password Policy", "System enforced"],
            ["Session Management", "System managed"],
          ]}
        />

        <div
          style={{
            marginTop: "18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 14px",
            borderRadius: "9px",
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
            color: "#374151",
            fontSize: "13px",
          }}
        >
          <LockKeyhole size={17} color="#0F2F6B" />
          Security policies are enforced by the platform and are not intended
          for routine manual administration.
        </div>
      </Section>

      {/* Automation Summary */}
      <div
        style={{
          marginTop: "28px",
          padding: "22px",
          borderRadius: "14px",
          background: "#0F2F6B",
          color: "#FFFFFF",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <Clock3 size={20} />

          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            Automated Operations
          </h2>
        </div>

        <p
          style={{
            margin: "0 0 18px",
            color: "#DCE7FA",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          The platform is designed to perform routine operational activities
          automatically so administrators can focus on monitoring and
          exceptions rather than repetitive data entry.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
          }}
        >
          {[
            "Enrollment Tracking",
            "Course Completion",
            "Certificate Generation",
            "Payment Updates",
            "Affiliate Commission",
            "Report Aggregation",
          ].map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={15} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div
        style={{
          marginTop: "20px",
          textAlign: "center",
          color: "#9CA3AF",
          fontSize: "12px",
        }}
      >
        Settings shown here represent the current platform policy overview.
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable Section                                                            */
/* -------------------------------------------------------------------------- */

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "14px",
        padding: "22px",
        marginBottom: "20px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "9px",
            background: "#EEF3FB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0F2F6B",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {title}
          </h2>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: "13px",
              color: "#6B7280",
            }}
          >
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Information Grid                                                            */
/* -------------------------------------------------------------------------- */

function InfoGrid({
  items,
}: {
  items: [string, string][];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "12px",
      }}
    >
      {items.map(([label, value]) => (
        <div
          key={label}
          style={{
            padding: "14px",
            borderRadius: "10px",
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#6B7280",
              marginBottom: "6px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {label}
          </div>

          <div
            style={{
              fontSize: "14px",
              color: "#111827",
              fontWeight: 600,
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mini Stat                                                                   */
/* -------------------------------------------------------------------------- */

function MiniStat({
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
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "13px",
        borderRadius: "10px",
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          background: "#EEF3FB",
          color: "#0F2F6B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: "11px",
            color: "#6B7280",
            marginBottom: "2px",
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
    </div>
  );
}