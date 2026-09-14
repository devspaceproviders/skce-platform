"use client";

import { useState } from "react";
import {
  PlayCircle,
  Megaphone,
  Copy,
  Check,
  Link as LinkIcon,
} from "lucide-react";

const TRAININGS = [
  {
    title: "Affiliate Training — Part 1",
    description: "Learn the basics of affiliate marketing and how the SKCE affiliate program works.",
    duration: "Training Video",
  },
  {
    title: "Affiliate Training — Part 2",
    description: "Understand referrals, sharing your referral link and building your network.",
    duration: "Training Video",
  },
  {
    title: "Affiliate Training — Part 3",
    description: "Learn how to effectively promote courses and maximize your affiliate opportunities.",
    duration: "Training Video",
  },
];

const PROMOTIONAL_MATERIALS = [
  {
    title: "SKCE Course Brochure",
    description: "Promotional information about SK Computer Education courses.",
  },
  {
    title: "Course Promotion Material",
    description: "Use these materials when sharing SKCE courses with prospective students.",
  },
  {
    title: "Social Media Promotion",
    description: "Ready-to-use content for promoting SKCE courses on social platforms.",
  },
];

export default function AffiliateMarketingPage() {
  const [activeTab, setActiveTab] = useState<"trainings" | "materials">(
    "trainings"
  );
  const [copied, setCopied] = useState(false);

  const referralCode = "SKCE12345";
  const referralLink = `https://skce.in/register?ref=${referralCode}`;

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main
      style={{
        padding: "28px 32px",
        flex: 1,
        background: "#F4F6FA",
        minHeight: "100%",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#111827",
            margin: 0,
          }}
        >
          Affiliate Marketing
        </h1>

        <p
          style={{
            fontSize: 14,
            color: "#6B7280",
            margin: "5px 0 0",
          }}
        >
          Learn, promote SKCE courses and grow your affiliate network.
        </p>
      </div>

      {/* Referral Information */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 22,
          marginBottom: 24,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "#EAF0FE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LinkIcon size={20} color="#2F6BFF" />
          </div>

          <div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}
            >
              Your Referral Link
            </h2>

            <p
              style={{
                fontSize: 12.5,
                color: "#6B7280",
                margin: "3px 0 0",
              }}
            >
              Share your referral link with prospective students.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              background: "#F8F9FC",
              border: "1px solid #E2E5EC",
              borderRadius: 8,
              padding: "11px 14px",
              fontSize: 13,
              color: "#374151",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {referralLink}
          </div>

          <button
            onClick={copyReferralLink}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: copied ? "#22A555" : "#2F6BFF",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "11px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12.5,
            color: "#6B7280",
          }}
        >
          <span>Referral Code:</span>

          <span
            style={{
              background: "#EEF2FF",
              color: "#3B6BF0",
              fontWeight: 700,
              padding: "4px 9px",
              borderRadius: 6,
            }}
          >
            {referralCode}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "22px 22px 0",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: "1px solid #E5E7EB",
            marginBottom: 22,
          }}
        >
          <button
            onClick={() => setActiveTab("trainings")}
            style={{
              background: activeTab === "trainings" ? "#fff" : "transparent",
              border:
                activeTab === "trainings"
                  ? "1px solid #111827"
                  : "1px solid transparent",
              borderBottom:
                activeTab === "trainings"
                  ? "1px solid #fff"
                  : "1px solid transparent",
              borderRadius: "7px 7px 0 0",
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              color:
                activeTab === "trainings" ? "#F05A28" : "#374151",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            Affiliate Trainings
          </button>

          <button
            onClick={() => setActiveTab("materials")}
            style={{
              background: activeTab === "materials" ? "#fff" : "transparent",
              border:
                activeTab === "materials"
                  ? "1px solid #111827"
                  : "1px solid transparent",
              borderBottom:
                activeTab === "materials"
                  ? "1px solid #fff"
                  : "1px solid transparent",
              borderRadius: "7px 7px 0 0",
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              color:
                activeTab === "materials" ? "#F05A28" : "#374151",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            Promotional Material
          </button>
        </div>

        {/* Affiliate Trainings */}
        {activeTab === "trainings" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 20,
              paddingBottom: 24,
            }}
          >
            {TRAININGS.map((training) => (
              <div
                key={training.title}
                style={{
                  border: "1px solid #D9DDE5",
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                {/* Video Placeholder */}
                <div
                  style={{
                    height: 220,
                    background:
                      "linear-gradient(135deg, #0F2A44 0%, #174E80 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: "50%",
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PlayCircle size={30} color="#2F6BFF" />
                  </div>

                  <span
                    style={{
                      position: "absolute",
                      bottom: 12,
                      left: 14,
                      background: "rgba(0,0,0,0.55)",
                      color: "#fff",
                      padding: "5px 9px",
                      borderRadius: 5,
                      fontSize: 11.5,
                    }}
                  >
                    {training.duration}
                  </span>
                </div>

                <div style={{ padding: "16px 18px" }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#123B73",
                      margin: 0,
                    }}
                  >
                    {training.title}
                  </h3>

                  <p
                    style={{
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: "#6B7280",
                      margin: "7px 0 0",
                    }}
                  >
                    {training.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Promotional Materials */}
        {activeTab === "materials" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              paddingBottom: 24,
            }}
          >
            {PROMOTIONAL_MATERIALS.map((material) => (
              <div
                key={material.title}
                style={{
                  border: "1px solid #E2E5EC",
                  borderRadius: 10,
                  padding: 20,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 9,
                    background: "#FFF1EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Megaphone size={20} color="#F05A28" />
                </div>

                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#111827",
                      margin: 0,
                    }}
                  >
                    {material.title}
                  </h3>

                  <p
                    style={{
                      fontSize: 12.5,
                      color: "#6B7280",
                      lineHeight: 1.5,
                      margin: "5px 0 12px",
                    }}
                  >
                    {material.description}
                  </p>

                  <button
                    style={{
                      border: "1px solid #2F6BFF",
                      background: "#fff",
                      color: "#2F6BFF",
                      borderRadius: 7,
                      padding: "7px 13px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    View Material
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}