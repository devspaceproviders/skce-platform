"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

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
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not provided";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return safeText(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default function ProfilePage() {
  const [student, setStudent] =
    useState<StudentProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPhoneModal, setShowPhoneModal] =
    useState(false);

  const [newPhone, setNewPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  const [photoError, setPhotoError] = useState("");

  const photoInputRef =
    useRef<HTMLInputElement>(null);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

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

  function getPhotoUrl(
    photoUrl?: string | null
  ): string | null {
    if (!photoUrl) {
      return null;
    }

    if (
      photoUrl.startsWith("http://") ||
      photoUrl.startsWith("https://")
    ) {
      return photoUrl;
    }

    const backendUrl = API_URL.replace(
      /\/api\/?$/,
      ""
    );

    return `${backendUrl}${
      photoUrl.startsWith("/") ? "" : "/"
    }${photoUrl}`;
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
      setPhotoError(
        "Profile photo must be 5 MB or smaller."
      );
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
    setNewPhone(student?.phone ?? "");
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

    const normalizedPhone = newPhone.trim();

    setPhoneError("");

    if (!normalizedPhone) {
      setPhoneError(
        "Please enter your mobile number."
      );
      return;
    }

    if (!/^[0-9]{10}$/.test(normalizedPhone)) {
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

      const token = localStorage.getItem("token");

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

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to update mobile number."
        );
      }

      const updatedPhone =
        result.data?.phone ?? normalizedPhone;

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
      <main style={pageStyle} className="student-profile-page">
        <PageHeading />

        <div style={loadingCardStyle}>
          <div style={spinnerStyle} />
          <strong>Loading your profile</strong>
          <span>
            Fetching your latest account information.
          </span>
        </div>

        <GlobalStyles />
      </main>
    );
  }

  if (error) {
    return (
      <main style={pageStyle}>
        <PageHeading />

        <div style={errorCardStyle}>
          <div style={errorIconStyle}>!</div>
          <strong>Unable to load your profile</strong>
          <span>{error}</span>

          <button
            type="button"
            onClick={loadProfile}
            style={primaryButtonStyle}
          >
            Try Again
          </button>
        </div>

        <GlobalStyles />
      </main>
    );
  }

  if (!student) {
    return null;
  }

  const initials = getInitials(student.name);
  const photoUrl = getPhotoUrl(
    student.profilePhotoUrl
  );

  return (
    <>
      <main style={pageStyle}>
        <PageHeading />

        {/* Profile identity */}
        <section style={heroCardStyle} className="student-profile-hero">
          <div style={heroAccentStyle} />

          <div style={heroContentStyle}>
            <div style={avatarColumnStyle}>
              <div style={avatarShellStyle}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
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
                  style={photoButtonStyle}
                >
                  {uploadingPhoto
                    ? "Uploading..."
                    : "Change photo"}
                </button>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />

                {photoError ? (
                  <div style={photoErrorStyle}>
                    {photoError}
                  </div>
                ) : null}
              </div>
            </div>

            <div style={identityStyle}>
              <div style={statusRowStyle}>
                <span
                  style={
                    student.isActive
                      ? activeBadgeStyle
                      : inactiveBadgeStyle
                  }
                >
                  <span
                    style={{
                      ...statusDotStyle,
                      background:
                        student.isActive
                          ? "#16a05d"
                          : "#9ca3af",
                    }}
                  />
                  {student.isActive
                    ? "Active Student"
                    : "Inactive"}
                </span>
              </div>

              <h2 style={heroNameStyle}>
                {safeText(student.name)}
              </h2>

              <p style={heroEmailStyle}>
                {safeText(student.email)}
              </p>

              <div style={identityFactsStyle}>
                <IdentityFact
                  label="Student ID"
                  value={safeText(student.studentId)}
                />

                <IdentityFact
                  label="Location"
                  value={
                    student.city ||
                    student.state ||
                    "Not provided"
                  }
                />

                <IdentityFact
                  label="Joined"
                  value="Student account"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Personal details */}
        <div style={sectionGridStyle} className="student-profile-grid">
          <ProfileSection
            title="Personal Details"
            subtitle="Your basic student information"
          >
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
              value={
                student.dateOfBirth
                  ? formatDate(
                      student.dateOfBirth
                    )
                  : null
              }
            />

            <ProfileRow
              label="Gender"
              value={student.gender}
            />

            <ProfileRow
              label="Qualification"
              value={student.qualification}
            />

            <ProfileRow
              label="School / College / Organization"
              value={student.organization}
              last
            />
          </ProfileSection>

          <ProfileSection
            title="Parent / Guardian"
            subtitle="Emergency and guardian contact"
          >
            <ProfileRow
              label="Guardian Name"
              value={student.guardianName}
            />

            <ProfileRow
              label="Relationship"
              value={student.guardianRelationship}
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
              last
            />
          </ProfileSection>

          <ProfileSection
            title="Learning Setup"
            subtitle="Your preferred learning facilities"
          >
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
              last
            />
          </ProfileSection>

          <ProfileSection
            title="Address"
            subtitle="Your registered location"
          >
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
              last
            />
          </ProfileSection>

          <ProfileSection
            title="Referral Information"
            subtitle="How you were referred to SKCE"
          >
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

            <ProfileRow
              label="Referral ID"
              value={student.referralId}
              last
            />
          </ProfileSection>

          <ProfileSection
            title="Student Declaration"
            subtitle="Registration declaration status"
          >
            <ProfileRow
              label="Declaration Accepted"
              value={
                student.declarationAccepted
                  ? "Yes"
                  : "No"
              }
              valueBadge
              last
            />
          </ProfileSection>
        </div>

        {/* Edit note */}
        <section style={editNoteStyle}>
          <div style={editNoteIconStyle}>
            <LockIcon />
          </div>

          <div style={{ minWidth: 0 }}>
            <strong style={editNoteTitleStyle}>
              Profile information
            </strong>

            <p style={editNoteTextStyle}>
              Your registered details are displayed from
              your student account. Mobile number and profile
              photo can be updated directly from this page.
            </p>
          </div>
        </section>
      </main>

      {/* Change mobile modal */}
      {showPhoneModal ? (
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

                <p style={modalSubtitleStyle}>
                  Update the mobile number linked to your
                  student account.
                </p>
              </div>

              <button
                type="button"
                onClick={closePhoneModal}
                disabled={savingPhone}
                aria-label="Close"
                style={modalCloseButtonStyle}
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePhoneUpdate}>
              <div style={{ marginTop: 20 }}>
                <label
                  htmlFor="new-mobile"
                  style={inputLabelStyle}
                >
                  Mobile Number
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
                  style={phoneInputStyle}
                />

                {phoneError ? (
                  <div style={phoneErrorStyle}>
                    {phoneError}
                  </div>
                ) : null}
              </div>

              <div style={modalActionsStyle}>
                <button
                  type="button"
                  onClick={closePhoneModal}
                  disabled={savingPhone}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPhone}
                  style={{
                    ...saveButtonStyle,
                    opacity: savingPhone
                      ? 0.65
                      : 1,
                  }}
                >
                  {savingPhone
                    ? "Saving..."
                    : "Save Number"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <GlobalStyles />
    </>
  );
}

function PageHeading() {
  return (
    <div style={pageHeadingStyle}>
      <div>
        <div style={sectionEyebrowStyle}>
          STUDENT ACCOUNT
        </div>

        <h1 style={titleStyle}>
          My Profile
        </h1>

        <p style={subtitleStyle}>
          Manage your account information and registered
          student details.
        </p>
      </div>
    </div>
  );
}

function IdentityFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={identityFactStyle}>
      <span style={identityFactLabelStyle}>
        {label}
      </span>

      <strong style={identityFactValueStyle}>
        {value}
      </strong>
    </div>
  );
}

function ProfileSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section style={sectionCardStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={sectionTitleStyle}>
            {title}
          </h2>

          <p style={sectionSubtitleStyle}>
            {subtitle}
          </p>
        </div>
      </div>

      <div style={rowsContainerStyle}>
        {children}
      </div>
    </section>
  );
}

function ProfileRow({
  label,
  value,
  last = false,
  valueBadge = false,
}: {
  label: string;
  value: unknown;
  last?: boolean;
  valueBadge?: boolean;
}) {
  const valueText = safeText(value);

  return (
    <div
      className="student-profile-row"
      style={{
        ...rowStyle,
        borderBottom: last
          ? "none"
          : "1px solid #eef1f5",
      }}
    >
      <span style={labelStyle}>
        {label}
      </span>

      {valueBadge ? (
        <span style={acceptedBadgeStyle}>
          {valueText}
        </span>
      ) : (
        <span className="student-profile-value" style={valueStyle}>
          {valueText}
        </span>
      )}
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
    <div style={rowStyle}>
      <span style={labelStyle}>
        Mobile Number
      </span>

      <div className="student-profile-phone" style={phoneValueContainerStyle}>
        <span className="student-profile-value" style={valueStyle}>
          {safeText(value)}
        </span>

        <button
          type="button"
          onClick={onEdit}
          style={changePhoneButtonStyle}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <span
      style={{
        fontSize: 17,
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      ✓
    </span>
  );
}

const pageStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  flex: 1,
  boxSizing: "border-box",
  padding: "28px 32px 36px",
  background: "#f5f7fb",
};

const pageHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 20,
};

const sectionEyebrowStyle: CSSProperties = {
  marginBottom: 5,
  fontSize: 10.5,
  fontWeight: 800,
  letterSpacing: "0.11em",
  color: "#a01441",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 27,
  lineHeight: 1.2,
  fontWeight: 800,
  color: "#111827",
  letterSpacing: "-0.02em",
};

const subtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 13,
  lineHeight: 1.6,
  color: "#818b9b",
};

const heroCardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  marginBottom: 18,
  padding: "24px 26px",
  borderRadius: 20,
  background:
    "linear-gradient(135deg,#10223f 0%,#173f70 68%,#245fd6 100%)",
  boxShadow:
    "0 12px 28px rgba(16,34,63,0.14)",
  color: "#ffffff",
};

const heroAccentStyle: CSSProperties = {
  position: "absolute",
  width: 240,
  height: 240,
  right: -70,
  top: -140,
  borderRadius: "50%",
  background:
    "rgba(255,255,255,0.08)",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  gap: 22,
  minWidth: 0,
};

const avatarColumnStyle: CSSProperties = {
  flex: "0 0 118px",
  display: "flex",
  justifyContent: "center",
};

const avatarShellStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
};

const avatarImageStyle: CSSProperties = {
  width: 84,
  height: 84,
  borderRadius: "50%",
  objectFit: "cover",
  display: "block",
  border: "3px solid rgba(255,255,255,0.28)",
};

const avatarStyle: CSSProperties = {
  width: 84,
  height: 84,
  borderRadius: "50%",
  background: "#2f6bff",
  border: "3px solid rgba(255,255,255,0.24)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 25,
  fontWeight: 800,
};

const photoButtonStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.10)",
  color: "#ffffff",
  borderRadius: 8,
  padding: "6px 9px",
  fontSize: 10.5,
  fontWeight: 700,
  cursor: "pointer",
};

const photoErrorStyle: CSSProperties = {
  maxWidth: 150,
  fontSize: 9.5,
  lineHeight: 1.35,
  color: "#fecaca",
  textAlign: "center",
};

const identityStyle: CSSProperties = {
  minWidth: 0,
  flex: 1,
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
};

const activeBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 8px",
  borderRadius: 999,
  background: "rgba(232,249,240,0.14)",
  border: "1px solid rgba(151,232,190,0.28)",
  color: "#d6f7e3",
  fontSize: 10,
  fontWeight: 750,
};

const inactiveBadgeStyle: CSSProperties = {
  ...activeBadgeStyle,
  color: "#e5e7eb",
  background: "rgba(148,163,184,0.15)",
  border: "1px solid rgba(148,163,184,0.24)",
};

const statusDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  display: "inline-block",
};

const heroNameStyle: CSSProperties = {
  margin: 0,
  fontSize: 25,
  lineHeight: 1.2,
  fontWeight: 800,
};

const heroEmailStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 13,
  color: "#d6e2f5",
};

const identityFactsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 26,
  marginTop: 17,
};

const identityFactStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const identityFactLabelStyle: CSSProperties = {
  fontSize: 9.5,
  color: "#aec0db",
};

const identityFactValueStyle: CSSProperties = {
  fontSize: 11.5,
  color: "#ffffff",
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2,minmax(0,1fr))",
  gap: 16,
};

const sectionCardStyle: CSSProperties = {
  minWidth: 0,
  padding: "20px 22px",
  border: "1px solid #e4e8ef",
  borderRadius: 17,
  background: "#ffffff",
  boxShadow:
    "0 4px 14px rgba(15,23,42,0.035)",
};

const sectionHeaderStyle: CSSProperties = {
  marginBottom: 15,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 800,
  color: "#172033",
};

const sectionSubtitleStyle: CSSProperties = {
  margin: "3px 0 0",
  fontSize: 10.5,
  color: "#98a1af",
};

const rowsContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const rowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 18,
  padding: "11px 0",
};

const labelStyle: CSSProperties = {
  minWidth: 0,
  flex: "0 0 42%",
  fontSize: 11,
  color: "#8a94a4",
};

const valueStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "58%",
  fontSize: 11.5,
  lineHeight: 1.45,
  fontWeight: 700,
  color: "#303a4b",
  textAlign: "right",
  wordBreak: "break-word",
};

const phoneValueContainerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 7,
  minWidth: 0,
  maxWidth: "58%",
};

const changePhoneButtonStyle: CSSProperties = {
  border: "1px solid #dbe1ea",
  background: "#ffffff",
  color: "#2f6bff",
  borderRadius: 7,
  padding: "5px 8px",
  fontSize: 9.5,
  fontWeight: 800,
  cursor: "pointer",
};

const acceptedBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 8px",
  borderRadius: 999,
  background: "#eaf8f0",
  color: "#188653",
  fontSize: 9.5,
  fontWeight: 800,
};

const editNoteStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  marginTop: 16,
  padding: "13px 15px",
  border: "1px solid #e1e7f0",
  borderRadius: 13,
  background: "#fbfcfe",
};

const editNoteIconStyle: CSSProperties = {
  width: 30,
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 30px",
  borderRadius: 9,
  background: "#eaf0ff",
  color: "#2f6bff",
};

const editNoteTitleStyle: CSSProperties = {
  display: "block",
  fontSize: 11.5,
  color: "#354052",
};

const editNoteTextStyle: CSSProperties = {
  margin: "3px 0 0",
  fontSize: 10.5,
  lineHeight: 1.5,
  color: "#9099a8",
};

const loadingCardStyle: CSSProperties = {
  minHeight: 300,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: 30,
  border: "1px solid #e4e8ef",
  borderRadius: 18,
  background: "#ffffff",
  color: "#7d8796",
  fontSize: 12,
};

const spinnerStyle: CSSProperties = {
  width: 28,
  height: 28,
  marginBottom: 7,
  border: "3px solid #e8edf3",
  borderTopColor: "#2f6bff",
  borderRadius: "50%",
  animation:
    "studentProfileSpin 0.8s linear infinite",
};

const errorCardStyle: CSSProperties = {
  minHeight: 300,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: 30,
  border: "1px solid #f1d6d6",
  borderRadius: 18,
  background: "#ffffff",
  color: "#7d8796",
  fontSize: 12,
  textAlign: "center",
};

const errorIconStyle: CSSProperties = {
  width: 44,
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 6,
  borderRadius: 12,
  background: "#fdebea",
  color: "#c8433e",
  fontSize: 20,
  fontWeight: 800,
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 9,
  border: 0,
  borderRadius: 8,
  padding: "8px 12px",
  background: "#2f6bff",
  color: "#ffffff",
  fontSize: 10.5,
  fontWeight: 800,
  cursor: "pointer",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  background: "rgba(15,23,42,0.5)",
};

const modalCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 440,
  padding: 23,
  borderRadius: 15,
  background: "#ffffff",
  boxShadow:
    "0 24px 60px rgba(15,23,42,0.2)",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 15,
};

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  color: "#111827",
};

const modalSubtitleStyle: CSSProperties = {
  maxWidth: 350,
  margin: "5px 0 0",
  fontSize: 11.5,
  lineHeight: 1.5,
  color: "#7d8796",
};

const modalCloseButtonStyle: CSSProperties = {
  border: 0,
  background: "transparent",
  color: "#7a8494",
  fontSize: 25,
  lineHeight: 1,
  cursor: "pointer",
  padding: 0,
};

const inputLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: 7,
  fontSize: 11.5,
  fontWeight: 750,
  color: "#374151",
};

const phoneInputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d9e0e9",
  borderRadius: 8,
  padding: "10px 11px",
  outline: "none",
  fontSize: 13,
  color: "#111827",
};

const phoneErrorStyle: CSSProperties = {
  marginTop: 7,
  fontSize: 11.5,
  color: "#b42318",
};

const modalActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 9,
  marginTop: 21,
};

const cancelButtonStyle: CSSProperties = {
  border: "1px solid #d9e0e9",
  background: "#ffffff",
  color: "#374151",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 11.5,
  fontWeight: 750,
  cursor: "pointer",
};

const saveButtonStyle: CSSProperties = {
  border: 0,
  background: "#2f6bff",
  color: "#ffffff",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 11.5,
  fontWeight: 750,
  cursor: "pointer",
};

function GlobalStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @keyframes studentProfileSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @media (max-width: 900px) {
            .student-profile-grid {
              grid-template-columns: minmax(0, 1fr) !important;
            }

            .student-profile-hero {
              flex-direction: column !important;
              align-items: flex-start !important;
            }
          }

          @media (max-width: 600px) {
            .student-profile-page {
              padding: 20px 15px 28px !important;
            }

            .student-profile-name {
              font-size: 22px !important;
            }

            .student-profile-row {
              flex-direction: column !important;
              gap: 5px !important;
            }

            .student-profile-value {
              max-width: 100% !important;
              text-align: left !important;
            }

            .student-profile-phone {
              max-width: 100% !important;
              justify-content: flex-start !important;
            }
          }
        `,
      }}
    />
  );
}
