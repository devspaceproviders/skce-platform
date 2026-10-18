"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Gift,
  Laptop,
  MapPin,
  Pencil,
  ShieldCheck,
  User,
  Users,
  RefreshCw,
  UserCircle,
  X,
} from "lucide-react";
import {
  CountUp,
  Modal,
  SkStyles,
  reveal,
  useToasts,
} from "@/components/student/skce-ui";
import { AdminPageHeader } from "@/components/dashboard/admin/AdminPageHeader";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "ST";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
  const toasts = useToasts();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Your session has expired. Please login again.");
        return;
      }

      const response = await fetch(`${API_URL}/students/me/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const result: DashboardResponse = await response.json();

      if (!response.ok || !result.success || !result.data?.student) {
        throw new Error(result.message || "Unable to load your profile.");
      }

      setStudent(result.data.student);
    } catch (err) {
      console.error("Profile loading error:", err);

      setError(err instanceof Error ? err.message : "Unable to load your profile.");
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

    const backendUrl = API_URL.replace(/\/api\/?$/i, "");

    return `${backendUrl}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;
  }

  function openPhotoPicker() {
    setPhotoError("");
    photoInputRef.current?.click();
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
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
      setPhotoError("Please select a JPG, PNG, WEBP, or GIF image.");
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
      setPhotoError("Your session has expired. Please login again.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingPhoto(true);

      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(`${API_URL}/profile/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result: {
        success: boolean;
        data?: {
          profilePhotoUrl?: string;
        };
        message?: string;
      } = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to upload profile photo.");
      }

      setStudent((current) =>
        current
          ? {
              ...current,
              profilePhotoUrl:
                result.data?.profilePhotoUrl ?? current.profilePhotoUrl ?? null,
            }
          : current
      );

      toasts.push("success", "Profile photo updated.");
    } catch (err) {
      console.error("Profile photo upload error:", err);

      setPhotoError(
        err instanceof Error ? err.message : "Unable to upload profile photo."
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

  async function handlePhoneUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPhone = newPhone.trim();

    setPhoneError("");

    if (!normalizedPhone) {
      setPhoneError("Please enter your mobile number.");
      return;
    }

    if (!/^[0-9]{10}$/.test(normalizedPhone)) {
      setPhoneError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (normalizedPhone === (student?.phone ?? "")) {
      setShowPhoneModal(false);
      return;
    }

    try {
      setSavingPhone(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setPhoneError("Your session has expired. Please login again.");
        return;
      }

      const response = await fetch(`${API_URL}/students/me/phone`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: normalizedPhone,
        }),
      });

      const result: UpdatePhoneResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update mobile number.");
      }

      const updatedPhone = result.data?.phone ?? normalizedPhone;

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

      toasts.push("success", "Mobile number updated.");
    } catch (err) {
      console.error("Mobile number update error:", err);

      setPhoneError(
        err instanceof Error ? err.message : "Unable to update mobile number."
      );
    } finally {
      setSavingPhone(false);
    }
  }

  const completeness = useMemo(() => {
    if (!student) {
      return 0;
    }

    const fields = [
      student.phone,
      student.state,
      student.dateOfBirth,
      student.gender,
      student.qualification,
      student.organization,
      student.guardianName,
      student.guardianMobile,
      student.deviceTypes,
      student.internetFacility,
      student.preferredClassApp,
      student.address,
      student.city,
      student.pin,
    ];

    const filled = fields.filter(
      (value) => value !== null && value !== undefined && value !== ""
    ).length;

    return Math.round((filled / fields.length) * 100);
  }, [student]);

  const banner = (
    <AdminPageHeader
      className="mb-6"
      label="Student account"
      title="My Profile"
      subtitle="Manage your account information and registered student details."
      icon={UserCircle}
      chips={
        student
          ? [
              { label: student.isActive ? "Active Student" : "Inactive" },
              { label: "Student ID", value: safeText(student.studentId) },
            ]
          : undefined
      }
    />
  );

  if (loading) {
    return (
      <>
        <main className="sk-page" aria-busy="true">
          <div className="sk-container">
            {banner}
            <div className="sk-skel" style={{ height: 190, marginBottom: 20 }} />
            <div className="sk-grid-2">
              {[0, 1, 2, 3].map((n) => (
                <div key={n} className="sk-skel" style={{ height: 230 }} />
              ))}
            </div>
            <span className="sk-sr">Loading your profile</span>
          </div>
        </main>
        <SkStyles />
      </>
    );
  }

  if (error) {
    return (
      <>
        <main className="sk-page">
          <div className="sk-container">
            {banner}
            <div className="sk-error-card" role="alert">
              <div className="sk-error-icon">
                <AlertCircle size={24} />
              </div>
              <h2>Unable to load your profile</h2>
              <p>{error}</p>
              <button
                type="button"
                onClick={loadProfile}
                className="sk-btn sk-btn-primary"
              >
                <RefreshCw size={15} />
                Try Again
              </button>
            </div>
          </div>
        </main>
        <SkStyles />
      </>
    );
  }

  if (!student) {
    return null;
  }

  const initials = getInitials(student.name);
  const photoUrl = getPhotoUrl(student.profilePhotoUrl);

  return (
    <>
      <main className="sk-page">
        <div className="sk-container">
          {banner}

          {/* Identity */}
          <section className="sk-panel pf-id" style={reveal(1)}>
            <div className="pf-avatar-col">
              <button
                type="button"
                className="pf-avatar"
                onClick={openPhotoPicker}
                disabled={uploadingPhoto}
                aria-label="Change profile photo"
              >
                {photoUrl ? (
                  <img src={photoUrl} alt={`${student.name} profile`} />
                ) : (
                  <span>{initials}</span>
                )}
                <i className="pf-avatar-overlay">
                  {uploadingPhoto ? (
                    <RefreshCw size={20} className="sk-spin" />
                  ) : (
                    <Camera size={20} />
                  )}
                  <b>{uploadingPhoto ? "Uploading..." : "Change photo"}</b>
                </i>
              </button>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
            </div>

            <div className="sk-min0 sk-grow">
              <h2>{safeText(student.name)}</h2>
              <p>{safeText(student.email)}</p>
              {photoError ? <div className="pf-photo-error">{photoError}</div> : null}
            </div>

            <div className="pf-meter">
              <div className="pf-meter-top">
                <span>Profile completeness</span>
                <b>
                  <CountUp value={completeness} suffix="%" />
                </b>
              </div>
              <div className="pf-meter-track">
                <span style={{ width: `${completeness}%` }} />
              </div>
              <em>
                {completeness === 100
                  ? "Your profile is fully complete."
                  : "Some details are still missing."}
              </em>
            </div>
          </section>

          {/* Sections */}
          <div className="pf-cols">
            <div className="pf-col">
            <ProfileSection
              icon={User}
              index={2}
              title="Personal Details"
              subtitle="Your basic student information"
            >
              <ProfileRow label="Student ID" value={student.studentId} />

              <PhoneProfileRow value={student.phone} onEdit={openPhoneModal} />

              <ProfileRow
                label="Date of Birth"
                value={student.dateOfBirth ? formatDate(student.dateOfBirth) : null}
              />

              <ProfileRow label="Gender" value={student.gender} />

              <ProfileRow label="Qualification" value={student.qualification} />

              <ProfileRow
                label="School / College / Organization"
                value={student.organization}
                last
              />
            </ProfileSection>

            <ProfileSection
              icon={MapPin}
              index={5}
              title="Address"
              subtitle="Your registered location"
            >
              <ProfileRow label="Address" value={student.address} />
              <ProfileRow label="City" value={student.city} />
              <ProfileRow label="PIN" value={student.pin} />
              <ProfileRow label="State" value={student.state} last />
            </ProfileSection>

            <ProfileSection
              icon={ShieldCheck}
              index={7}
              title="Student Declaration"
              subtitle="Registration declaration status"
            >
              <ProfileRow
                label="Declaration Accepted"
                value={student.declarationAccepted ? "Yes" : "No"}
                valueBadge
                last
              />
            </ProfileSection>
            </div>
            <div className="pf-col">
            <ProfileSection
              icon={Users}
              index={3}
              title="Parent / Guardian"
              subtitle="Emergency and guardian contact"
            >
              <ProfileRow label="Guardian Name" value={student.guardianName} />
              <ProfileRow label="Relationship" value={student.guardianRelationship} />
              <ProfileRow label="Mobile" value={student.guardianMobile} />
              <ProfileRow label="WhatsApp" value={student.guardianWhatsapp} />
              <ProfileRow label="Email" value={student.guardianEmail} last />
            </ProfileSection>

            <ProfileSection
              icon={Laptop}
              index={4}
              title="Learning Setup"
              subtitle="Your preferred learning facilities"
            >
              <ProfileRow label="Device" value={student.deviceTypes} />
              <ProfileRow label="Internet" value={student.internetFacility} />
              <ProfileRow label="Preferred App" value={student.preferredClassApp} last />
            </ProfileSection>

            <ProfileSection
              icon={Gift}
              index={6}
              title="Referral Information"
              subtitle="How you were referred to SK Computer Education"
            >
              <ProfileRow label="Source" value={student.referralSource} />
              <ProfileRow label="Name" value={student.referralName} />
              <ProfileRow label="Mobile" value={student.referralMobile} />
              <ProfileRow label="Referral ID" value={student.referralId} last />
            </ProfileSection>
            </div>
          </div>
        </div>
      </main>

      {showPhoneModal ? (
        <Modal
          onClose={closePhoneModal}
          maxWidth={460}
          labelledBy="change-mobile-title"
          locked={savingPhone}
        >
          {(close) => (
            <form onSubmit={handlePhoneUpdate}>
              <div className="sk-modal-head">
                <div>
                  <h2 id="change-mobile-title">Change Mobile Number</h2>
                  <p>Update the mobile number linked to your student account.</p>
                </div>

                <button
                  type="button"
                  onClick={close}
                  disabled={savingPhone}
                  aria-label="Close"
                  className="sk-modal-close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="sk-modal-body">
                <label htmlFor="new-mobile" className="sk-label">
                  Mobile Number
                </label>

                <input
                  id="new-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                  autoFocus
                  value={newPhone}
                  onChange={(event) =>
                    setNewPhone(event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter 10-digit mobile number"
                  disabled={savingPhone}
                  className="sk-input"
                />

                <div className="pf-digits">
                  <span style={{ width: `${(newPhone.length / 10) * 100}%` }} />
                  <em>{newPhone.length}/10</em>
                </div>

                {phoneError ? (
                  <div className="sk-error-text" role="alert" key={phoneError}>
                    {phoneError}
                  </div>
                ) : null}
              </div>

              <div className="sk-modal-foot">
                <button
                  type="button"
                  onClick={close}
                  disabled={savingPhone}
                  className="sk-btn sk-btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPhone}
                  className="sk-btn sk-btn-primary"
                >
                  {savingPhone ? (
                    <>
                      <RefreshCw size={15} className="sk-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      Save Number
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </Modal>
      ) : null}

      {toasts.node}
      <SkStyles />
      <style dangerouslySetInnerHTML={{ __html: profileCss }} />
    </>
  );
}

function ProfileSection({
  index,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  index: number;
  icon: typeof User;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="sk-panel pf-section sk-reveal" style={reveal(index)}>
      <div className="pf-section-head">
        <span className="pf-section-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <div className="sk-min0">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="pf-section-body">{children}</div>
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
  const missing = valueText === "Not provided";

  return (
    <div className={`pf-row${last ? " is-last" : ""}`}>
      <span className="pf-label">{label}</span>

      {valueBadge ? (
        <span className={`sk-badge ${valueText === "Yes" ? "tone-green" : "tone-orange"}`}>
          {valueText}
        </span>
      ) : (
        <span className={`pf-value${missing ? " is-missing" : ""}`}>{valueText}</span>
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
  const valueText = safeText(value);

  return (
    <div className="pf-row">
      <span className="pf-label">Mobile Number</span>

      <div className="pf-phone">
        <span className={`pf-value${valueText === "Not provided" ? " is-missing" : ""}`}>
          {valueText}
        </span>

        <button type="button" onClick={onEdit} className="sk-btn sk-btn-secondary sk-btn-sm">
          <Pencil size={13} />
          Edit
        </button>
      </div>
    </div>
  );
}

const profileCss = `
.pf-avatar-col{position:relative;z-index:1;flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:8px}
.pf-avatar{position:relative;width:76px;height:76px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:0;border:3px solid #fff;border-radius:50%;background:linear-gradient(135deg,#4585CC,#1459B8);color:#fff;font:inherit;font-size:25px;font-weight:800;cursor:pointer;box-shadow:0 0 0 2px #DCE6F2,0 8px 18px rgba(15,47,95,.16);transition:transform .3s cubic-bezier(.2,.7,.2,1),border-color .3s ease,box-shadow .3s ease}
.pf-avatar:hover{transform:scale(1.045);border-color:#fff;box-shadow:0 12px 26px rgba(0,0,0,.24)}
.pf-avatar:disabled{cursor:progress}
.pf-avatar img{width:100%;height:100%;object-fit:cover;display:block}
.pf-avatar-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:rgba(15,47,95,.78);color:#fff;font-style:normal;opacity:0;transition:opacity .25s ease}
.pf-avatar-overlay b{font-size:10px;font-weight:700}
.pf-avatar:hover .pf-avatar-overlay,.pf-avatar:focus-visible .pf-avatar-overlay,.pf-avatar:disabled .pf-avatar-overlay{opacity:1}
.pf-avatar:focus-visible{outline:3px solid #FF9A42;outline-offset:3px}
.pf-photo-error{max-width:320px;margin-top:6px;font-size:12px;line-height:1.4;color:#B4501A;text-align:left;animation:sk-swap .3s var(--ease) both}
.pf-id{display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding:20px;margin-bottom:14px}
.pf-id h2{margin:0;font-size:20px;line-height:1.25;font-weight:800;letter-spacing:-.3px;color:var(--navy)}
.pf-id p{margin:4px 0 0;font-size:13.5px;color:var(--muted);overflow-wrap:anywhere}
.pf-meter{flex:0 0 280px;margin-left:auto;padding:14px 16px;border-radius:14px;background:#F4F8FE;border:1px solid #DCE6F2}
.pf-meter-top{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:12px;color:var(--muted)}
.pf-meter-top b{font-size:24px;color:var(--navy);font-variant-numeric:tabular-nums;letter-spacing:-.5px}
.pf-meter-track{height:8px;overflow:hidden;margin-top:10px;border-radius:999px;background:#DCE6F2}
.pf-meter-track span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#F97316,#F97316);transform-origin:left;animation:sk-grow-x 1000ms var(--ease) 300ms both}
.pf-meter em{display:block;margin-top:8px;font-size:11.5px;font-style:normal;color:var(--muted);line-height:1.5}
.pf-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}
.pf-col{display:flex;flex-direction:column;gap:16px;min-width:0}
.pf-section{min-width:0;padding:0;overflow:hidden;border:1px solid #D3DEEC;background:linear-gradient(180deg,#fff,#F6F9FE);box-shadow:0 1px 2px rgba(15,47,95,.06),0 10px 24px -18px rgba(15,47,95,.28);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.pf-section:hover{border-color:#B8CCE6;box-shadow:0 1px 2px rgba(15,47,95,.06),0 14px 28px -18px rgba(15,47,95,.34)}
.pf-section-head{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #D3DEEC;background:linear-gradient(180deg,#F1F6FD,#E9F0FA)}
.pf-section-icon{flex:0 0 36px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:#fff;color:#1459B8;box-shadow:inset 0 0 0 1px #CFDCEE}
.pf-section-body{padding:4px 18px 8px}
.pf-section-head h2{margin:0;font-size:15.5px;font-weight:750;letter-spacing:-.01em;color:#0F2F5F}
.pf-section-head p{margin:2px 0 0;font-size:12.5px;color:#5A6B85;line-height:1.45}
.pf-row{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:46px;padding:8px 8px;margin:0 -8px;border-bottom:1px solid #E1E9F3;border-radius:8px;transition:background .2s ease}
.pf-row:hover{background:#EEF4FC}
.pf-row.is-last{border-bottom:0}
.pf-label{flex:0 0 40%;min-width:0;font-size:12.5px;font-weight:600;line-height:1.4;color:#5A6B85}
.pf-value{min-width:0;max-width:60%;font-size:14px;line-height:1.45;font-weight:650;color:#0F2F5F;text-align:right;overflow-wrap:anywhere;word-break:normal}
.pf-value.is-missing{display:inline-flex;align-items:center;gap:6px;font-weight:500;font-style:italic;color:#7B8BA3}
.pf-value.is-missing:before{content:"";width:6px;height:6px;border-radius:50%;background:#F59E0B;flex:0 0 6px}
.pf-phone{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:8px;min-width:0;max-width:58%}
.pf-phone .pf-value{max-width:none}
.pf-phone .sk-btn{flex:0 0 auto}
.pf-digits{display:flex;align-items:center;gap:10px;margin-top:8px}
.pf-digits span{display:block;height:4px;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--blue-2));transition:width .2s ease}
.pf-digits em{margin-left:auto;font-style:normal;font-size:12px;color:var(--soft)}
.sk-error-text{animation:sk-swap .25s var(--ease) both}
@media(max-width:900px){.pf-cols{grid-template-columns:minmax(0,1fr)}.pf-meter{
@media(max-width:600px){.pf-id{gap:14px;padding:16px}.pf-avatar{width:64px;height:64px;font-size:20px}.pf-id h2{font-size:18px}.pf-row{flex-direction:column;gap:4px;padding:9px 8px}.pf-label{flex-basis:auto}.pf-value,.pf-phone{max-width:100%;text-align:left;justify-content:flex-start}.pf-section-head h2{font-size:16px}}
`
