"use client";

import { useEffect, useRef, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type StudentProfile = {
  id: number;
  name: string;
  studentId: string;
  email: string;
  phone: string | null;

  state: string | null;
  referralId: string | null;

  dateOfBirth: string | null;
  gender: string | null;
  qualification: string | null;
  organization: string | null;

  guardianName: string | null;
  guardianRelationship: string | null;
  guardianMobile: string | null;
  guardianWhatsapp: string | null;
  guardianEmail: string | null;

  deviceTypes: string | null;
  internetFacility: string | null;
  preferredClassApp: string | null;

  address: string | null;
  city: string | null;
  pin: string | null;

  referralSource: string | null;
  referralName: string | null;
  referralMobile: string | null;

  declarationAccepted: boolean;

  isActive: boolean;
  profilePhotoUrl?: string | null;
};

type DashboardResponse = {
  success: boolean;
  data?: {
    student?: StudentProfile;
  };
  message?: string;
};

type UpdatePhoneResponse = {
  success: boolean;
  data?: {
    phone?: string | null;
  };
  message?: string;
};

function safeText(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not provided";
  }

  return String(value);
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "ST";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

export default function ProfilePage() {
  const [student, setStudent] =
    useState<StudentProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPhoneModal, setShowPhoneModal] =
    useState(false);

  const [newPhone, setNewPhone] =
    useState("");

  const [phoneError, setPhoneError] =
    useState("");

  const [savingPhone, setSavingPhone] =
    useState(false);

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  const [photoError, setPhotoError] =
    useState("");

  const photoInputRef =
    useRef<HTMLInputElement>(null);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/students/me/dashboard`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const result: DashboardResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.data?.student
      ) {
        throw new Error(
          result.message ||
            "Unable to load your profile."
        );
      }

      setStudent(result.data.student);
    } catch (err) {
      console.error(
        "Profile loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function getPhotoUrl(photoUrl?: string | null): string | null {
    if (!photoUrl) {
      return null;
    }

    if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
      return photoUrl;
    }

    const backendUrl = API_URL.replace(/\/api\/?$/, "");

    return `${backendUrl}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;
  }

  function openPhotoPicker() {
    setPhotoError("");
    photoInputRef.current?.click();
  }

  async function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPhotoError("");

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);

    if (!allowedTypes.has(file.type)) {
      setPhotoError(
        "Please select a JPG, PNG, WEBP, or GIF image."
      );
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Profile photo must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setPhotoError(
        "Your session has expired. Please login again."
      );
      event.target.value = "";
      return;
    }

    try {
      setUploadingPhoto(true);

      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(
        `${API_URL}/profile/photo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result: {
        success: boolean;
        data?: {
          profilePhotoUrl?: string;
        };
        message?: string;
      } = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to upload profile photo."
        );
      }

      setStudent((current) =>
        current
          ? {
              ...current,
              profilePhotoUrl:
                result.data?.profilePhotoUrl ??
                current.profilePhotoUrl ??
                null,
            }
          : current
      );
    } catch (err) {
      console.error(
        "Profile photo upload error:",
        err
      );

      setPhotoError(
        err instanceof Error
          ? err.message
          : "Unable to upload profile photo."
      );
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  }

  function openPhoneModal() {
    setNewPhone(
      student?.phone ?? ""
    );
    setPhoneError("");
    setShowPhoneModal(true);
  }

  function closePhoneModal() {
    if (savingPhone) {
      return;
    }

    setShowPhoneModal(false);
    setNewPhone("");
    setPhoneError("");
  }

  async function handlePhoneUpdate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const normalizedPhone =
      newPhone.trim();

    setPhoneError("");

    if (!normalizedPhone) {
      setPhoneError(
        "Please enter your mobile number."
      );
      return;
    }

    if (
      !/^[0-9]{10}$/.test(
        normalizedPhone
      )
    ) {
      setPhoneError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (
      normalizedPhone ===
      (student?.phone ?? "")
    ) {
      setShowPhoneModal(false);
      return;
    }

    try {
      setSavingPhone(true);

      const token =
        localStorage.getItem("token");

      if (!token) {
        setPhoneError(
          "Your session has expired. Please login again."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/students/me/phone`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: normalizedPhone,
          }),
        }
      );

      const result: UpdatePhoneResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to update mobile number."
        );
      }

      const updatedPhone =
        result.data?.phone ??
        normalizedPhone;

      setStudent((current) =>
        current
          ? {
              ...current,
              phone: updatedPhone,
            }
          : current
      );

      setShowPhoneModal(false);
      setNewPhone("");
      setPhoneError("");
    } catch (err) {
      console.error(
        "Mobile number update error:",
        err
      );

      setPhoneError(
        err instanceof Error
          ? err.message
          : "Unable to update mobile number."
      );
    } finally {
      setSavingPhone(false);
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <h1 style={titleStyle}>
          Profile
        </h1>

        <p style={subtitleStyle}>
          Your account details.
        </p>

        <div style={loadingCardStyle}>
          Loading profile...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={pageStyle}>
        <h1 style={titleStyle}>
          Profile
        </h1>

        <p style={subtitleStyle}>
          Your account details.
        </p>

        <div style={errorCardStyle}>
          {error}
        </div>
      </main>
    );
  }

  if (!student) {
    return null;
  }

  const initials = getInitials(
    student.name
  );

  return (
    <>
      <main style={pageStyle}>
        <h1 style={titleStyle}>
          Profile
        </h1>

        <p style={subtitleStyle}>
          Your account details.
        </p>

        {/* Header Card */}
        <div style={headerCardStyle}>
          <div style={headerStyle}>
            <div style={avatarWrapperStyle}>
              {getPhotoUrl(student.profilePhotoUrl) ? (
                <img
                  src={getPhotoUrl(student.profilePhotoUrl) ?? undefined}
                  alt={`${student.name} profile`}
                  style={avatarImageStyle}
                />
              ) : (
                <div style={avatarStyle}>
                  {initials}
                </div>
              )}

              <button
                type="button"
                onClick={openPhotoPicker}
                disabled={uploadingPhoto}
                style={changePhotoButtonStyle}
              >
                {uploadingPhoto ? "Uploading..." : "Change Photo"}
              </button>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoChange}
                style={hiddenFileInputStyle}
              />

              {photoError && (
                <div style={photoErrorStyle}>
                  {photoError}
                </div>
              )}
            </div>

            <div>
              <div style={nameStyle}>
                {safeText(student.name)}
              </div>

              <div style={emailStyle}>
                {safeText(student.email)}
              </div>
            </div>
          </div>

          <div style={statusBadgeStyle}>
            {student.isActive
              ? "Active Student"
              : "Inactive"}
          </div>
        </div>

        {/* Personal Details */}
        <ProfileSection title="Personal Details">
          <ProfileRow
            label="Student ID"
            value={student.studentId}
          />

          <PhoneProfileRow
            value={student.phone}
            onEdit={openPhoneModal}
          />

          <ProfileRow
            label="Date of Birth"
            value={student.dateOfBirth}
          />

          <ProfileRow
            label="Gender"
            value={student.gender}
          />

          <ProfileRow
            label="Class / Qualification"
            value={student.qualification}
          />

          <ProfileRow
            label="School / College / Organization"
            value={student.organization}
          />

          <ProfileRow
            label="State"
            value={student.state}
          />
        </ProfileSection>

        {/* Guardian Details */}
        <ProfileSection title="Parent / Guardian Details">
          <ProfileRow
            label="Guardian Name"
            value={student.guardianName}
          />

          <ProfileRow
            label="Relationship"
            value={
              student.guardianRelationship
            }
          />

          <ProfileRow
            label="Mobile"
            value={student.guardianMobile}
          />

          <ProfileRow
            label="WhatsApp"
            value={student.guardianWhatsapp}
          />

          <ProfileRow
            label="Email"
            value={student.guardianEmail}
          />
        </ProfileSection>

        {/* Learning Facilities */}
        <ProfileSection title="Online Learning Facilities">
          <ProfileRow
            label="Device"
            value={student.deviceTypes}
          />

          <ProfileRow
            label="Internet"
            value={student.internetFacility}
          />

          <ProfileRow
            label="Preferred App"
            value={student.preferredClassApp}
          />
        </ProfileSection>

        {/* Address */}
        <ProfileSection title="Address">
          <ProfileRow
            label="Address"
            value={student.address}
          />

          <ProfileRow
            label="City"
            value={student.city}
          />

          <ProfileRow
            label="PIN"
            value={student.pin}
          />

          <ProfileRow
            label="State"
            value={student.state}
          />
        </ProfileSection>

        {/* Referral */}
        <ProfileSection title="How You Heard About SKCE">
          <ProfileRow
            label="Source"
            value={student.referralSource}
          />

          <ProfileRow
            label="Name"
            value={student.referralName}
          />

          <ProfileRow
            label="Mobile"
            value={student.referralMobile}
          />
        </ProfileSection>

        {/* Declaration */}
        <ProfileSection title="Student Declaration">
          <ProfileRow
            label="Declaration Accepted"
            value={
              student.declarationAccepted
                ? "Yes"
                : "No"
            }
          />
        </ProfileSection>
      </main>

      {/* Change Mobile Modal */}
      {showPhoneModal && (
        <div style={modalOverlayStyle}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-mobile-title"
            style={modalCardStyle}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2
                  id="change-mobile-title"
                  style={modalTitleStyle}
                >
                  Change Mobile Number
                </h2>

                <p
                  style={modalSubtitleStyle}
                >
                  Update the mobile number associated with your student account.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closePhoneModal
                }
                disabled={savingPhone}
                style={
                  modalCloseButtonStyle
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handlePhoneUpdate
              }
            >
              <div
                style={{
                  marginTop: 20,
                }}
              >
                <label
                  htmlFor="new-mobile"
                  style={inputLabelStyle}
                >
                  New Mobile Number
                </label>

                <input
                  id="new-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                  value={newPhone}
                  onChange={(event) =>
                    setNewPhone(
                      event.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  placeholder="Enter 10-digit mobile number"
                  disabled={savingPhone}
                  style={
                    phoneInputStyle
                  }
                />

                {phoneError && (
                  <div
                    style={
                      phoneErrorStyle
                    }
                  >
                    {phoneError}
                  </div>
                )}
              </div>

              <div
                style={
                  modalActionsStyle
                }
              >
                <button
                  type="button"
                  onClick={
                    closePhoneModal
                  }
                  disabled={savingPhone}
                  style={
                    cancelButtonStyle
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPhone}
                  style={
                    saveButtonStyle
                  }
                >
                  {savingPhone
                    ? "Saving..."
                    : "Save Mobile Number"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>
        {title}
      </h2>

      <div style={rowsContainerStyle}>
        {children}
      </div>
    </section>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>
        {label}
      </span>

      <span style={valueStyle}>
        {safeText(value)}
      </span>
    </div>
  );
}

function PhoneProfileRow({
  value,
  onEdit,
}: {
  value: string | null;
  onEdit: () => void;
}) {
  return (
    <div
      style={{
        ...rowStyle,
        alignItems: "center",
      }}
    >
      <span style={labelStyle}>
        Phone
      </span>

      <div
        style={phoneValueContainerStyle}
      >
        <span style={valueStyle}>
          {safeText(value)}
        </span>

        <button
          type="button"
          onClick={onEdit}
          style={changePhoneButtonStyle}
        >
          Change Mobile
        </button>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  padding: "28px 32px",
  flex: 1,
  maxWidth: 1100,
};

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 4px",
};

const subtitleStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: 14,
  margin: "0 0 24px",
};

const headerCardStyle: React.CSSProperties = {
  position: "relative",
  background: "#fff",
  borderRadius: 12,
  padding: "28px 30px",
  boxShadow:
    "0 1px 2px rgba(0,0,0,0.04)",
  marginBottom: 20,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const avatarWrapperStyle: React.CSSProperties = {
  position: "relative",
  width: 150,
  minHeight: 96,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};

const avatarImageStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  objectFit: "cover",
  display: "block",
};

const avatarStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  background: "#2F6BFF",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  fontWeight: 700,
  flexShrink: 0,
};

const changePhotoButtonStyle: React.CSSProperties = {
  border: "1px solid #D7DCE5",
  background: "#fff",
  borderRadius: 7,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 600,
  color: "#2F6BFF",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const hiddenFileInputStyle: React.CSSProperties = {
  display: "none",
};

const photoErrorStyle: React.CSSProperties = {
  maxWidth: 180,
  fontSize: 11.5,
  lineHeight: 1.4,
  color: "#B42318",
  textAlign: "center",
};

const nameStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#111827",
};

const emailStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#6B7280",
  marginTop: 3,
};

const statusBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 28,
  right: 30,
  padding: "6px 10px",
  borderRadius: 999,
  background: "#ECFDF3",
  color: "#027A48",
  fontSize: 12,
  fontWeight: 600,
};

const sectionStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: "24px 28px",
  boxShadow:
    "0 1px 2px rgba(0,0,0,0.04)",
  marginBottom: 20,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 20px",
  fontSize: 17,
  fontWeight: 700,
  color: "#111827",
};

const rowsContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
  paddingBottom: 14,
  borderBottom: "1px solid #F0F1F4",
};

const labelStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: 13.5,
  minWidth: 220,
};

const valueStyle: React.CSSProperties = {
  color: "#111827",
  fontWeight: 600,
  fontSize: 13.5,
  textAlign: "right",
  wordBreak: "break-word",
};

const phoneValueContainerStyle: React.CSSProperties =
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  };

const changePhoneButtonStyle: React.CSSProperties =
  {
    border: "1px solid #D7DCE5",
    background: "#fff",
    borderRadius: 7,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "#2F6BFF",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

const modalOverlayStyle: React.CSSProperties =
  {
    position: "fixed",
    inset: 0,
    background:
      "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  };

const modalCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 460,
  background: "#fff",
  borderRadius: 14,
  padding: 24,
  boxShadow:
    "0 20px 50px rgba(0,0,0,0.18)",
};

const modalHeaderStyle: React.CSSProperties =
  {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  };

const modalTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: "#111827",
};

const modalSubtitleStyle: React.CSSProperties =
  {
    margin: "6px 0 0",
    fontSize: 13,
    lineHeight: 1.5,
    color: "#6B7280",
  };

const modalCloseButtonStyle: React.CSSProperties =
  {
    border: "none",
    background: "transparent",
    color: "#6B7280",
    fontSize: 26,
    lineHeight: 1,
    cursor: "pointer",
    padding: 0,
  };

const inputLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

const phoneInputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #D9DEE8",
  borderRadius: 8,
  padding: "11px 12px",
  fontSize: 14,
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const phoneErrorStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12.5,
  color: "#B42318",
};

const modalActionsStyle: React.CSSProperties =
  {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 24,
  };

const cancelButtonStyle: React.CSSProperties = {
  border: "1px solid #D9DEE8",
  background: "#fff",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  cursor: "pointer",
};

const saveButtonStyle: React.CSSProperties = {
  border: "none",
  background: "#2F6BFF",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 600,
  color: "#fff",
  cursor: "pointer",
};

const loadingCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 30,
  maxWidth: 480,
  boxShadow:
    "0 1px 2px rgba(0,0,0,0.04)",
  color: "#6B7280",
  fontSize: 14,
};

const errorCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 30,
  maxWidth: 480,
  color: "#B42318",
  boxShadow:
    "0 1px 2px rgba(0,0,0,0.04)",
};