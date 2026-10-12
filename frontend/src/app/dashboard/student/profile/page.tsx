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

  Pencil,

  RefreshCw,


  X,

} from "lucide-react";

import {

  CountUp,

  Modal,

  SkStyles,

  reveal,

  useToasts,

} from "@/components/student/skce-ui";



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



  if (loading) {

    return (

      <>

        <main className="sk-page" aria-busy="true">

          <div className="sk-container">

            <div className="sk-skel" style={{ height: 70, marginBottom: 20 }} />

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

          <header className="sk-head sk-reveal pf-page-head">

            <div>

              <div className="sk-kicker">Student account</div>

              <h1>My Profile</h1>

              <p>Manage your account information and registered student details.</p>

            </div>

          </header>



          {/* Identity */}

          <section className="sk-hero pf-hero" style={reveal(1)}>

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



              {photoError ? <div className="pf-photo-error">{photoError}</div> : null}

            </div>



            <div className="sk-min0 sk-grow">

              <span className={`pf-status${student.isActive ? " is-on" : ""}`}>

                <i />

                {student.isActive ? "Active Student" : "Inactive"}

              </span>



              <h2>{safeText(student.name)}</h2>

              <p>{safeText(student.email)}</p>



              <div className="pf-facts">

                <div>

                  <span>Student ID</span>

                  <strong>{safeText(student.studentId)}</strong>

                </div>

                <div>

                  <span>Location</span>

                  <strong>{student.city || student.state || "Not provided"}</strong>

                </div>

                <div>

                  <span>Joined</span>

                  <strong>Student account</strong>

                </div>

              </div>

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

          <div className="sk-grid-2">

            <ProfileSection

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

              index={4}

              title="Learning Setup"

              subtitle="Your preferred learning facilities"

            >

              <ProfileRow label="Device" value={student.deviceTypes} />

              <ProfileRow label="Internet" value={student.internetFacility} />

              <ProfileRow label="Preferred App" value={student.preferredClassApp} last />

            </ProfileSection>



            <ProfileSection

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

              index={6}

              title="Referral Information"

              subtitle="How you were referred to SKCE"

            >

              <ProfileRow label="Source" value={student.referralSource} />

              <ProfileRow label="Name" value={student.referralName} />

              <ProfileRow label="Mobile" value={student.referralMobile} />

              <ProfileRow label="Referral ID" value={student.referralId} last />

            </ProfileSection>



            <ProfileSection

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

  title,

  subtitle,

  children,

}: {

  index: number;

  title: string;

  subtitle: string;

  children: ReactNode;

}) {

  return (

    <section className="sk-panel pf-section sk-reveal" style={reveal(index)}>

      <div className="pf-section-head">

        <h2>{title}</h2>

        <p>{subtitle}</p>

      </div>



      <div>{children}</div>

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
.pf-page-head{margin-bottom:22px}
.pf-hero{position:relative;isolation:isolate;display:flex;align-items:center;gap:22px;flex-wrap:wrap;overflow:hidden;padding:27px 26px;border:1px solid rgba(255,255,255,.12);border-bottom:3px solid #FF7900;border-radius:22px;background:radial-gradient(circle at 100% 0%,rgba(66,130,202,.38),transparent 43%),linear-gradient(112deg,#252330 0%,#142F57 38%,#16477F 72%,#2863A1 100%);box-shadow:0 14px 30px rgba(15,47,95,.13);transition:box-shadow .3s ease,transform .3s ease}
.pf-hero:before{position:absolute;z-index:-1;inset:0;content:"";pointer-events:none;opacity:.14;background-image:radial-gradient(rgba(255,255,255,.75) .7px,transparent .7px);background-size:17px 17px;mask-image:linear-gradient(90deg,transparent,#000 45%,#000)}
.pf-hero:after{position:absolute;z-index:-1;right:-105px;top:-235px;width:380px;height:380px;content:"";border:1px solid rgba(255,255,255,.08);border-radius:50%;box-shadow:0 0 0 22px rgba(255,255,255,.025),0 0 0 44px rgba(255,255,255,.018);pointer-events:none;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.pf-hero:hover:after{transform:translate(-8px,8px)}
.pf-avatar-col{position:relative;z-index:1;flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:8px}
.pf-avatar{position:relative;width:88px;height:88px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:0;border:3px solid rgba(255,255,255,.48);border-radius:50%;background:linear-gradient(135deg,#4585CC,#1459B8);color:#fff;font:inherit;font-size:25px;font-weight:800;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.2);transition:transform .3s cubic-bezier(.2,.7,.2,1),border-color .3s ease,box-shadow .3s ease}
.pf-avatar:hover{transform:scale(1.045);border-color:#fff;box-shadow:0 12px 26px rgba(0,0,0,.24)}
.pf-avatar:disabled{cursor:progress}
.pf-avatar img{width:100%;height:100%;object-fit:cover;display:block}
.pf-avatar-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:rgba(15,47,95,.78);color:#fff;font-style:normal;opacity:0;transition:opacity .25s ease}
.pf-avatar-overlay b{font-size:10px;font-weight:700}
.pf-avatar:hover .pf-avatar-overlay,.pf-avatar:focus-visible .pf-avatar-overlay,.pf-avatar:disabled .pf-avatar-overlay{opacity:1}
.pf-avatar:focus-visible{outline:3px solid #FF9A42;outline-offset:3px}
.pf-photo-error{max-width:170px;font-size:12px;line-height:1.4;color:#FFE1D0;text-align:center;animation:sk-swap .3s var(--ease) both}
.pf-status{display:inline-flex;align-items:center;gap:7px;margin-bottom:8px;padding:5px 11px;border-radius:999px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.24);font-size:12px;font-weight:700;color:#F2F6FC}
.pf-status i{width:8px;height:8px;border-radius:50%;background:#94A3B8}
.pf-status.is-on i{background:#4ADE80;box-shadow:0 0 0 3px rgba(74,222,128,.12);animation:sk-pulse 2s infinite}
.pf-hero h2{margin:0;font-size:25px;line-height:1.2;font-weight:800;letter-spacing:-.4px;color:#fff}
.pf-hero p{margin:6px 0 0;font-size:14px;color:#D3E1F5;overflow-wrap:anywhere}
.pf-facts{display:flex;flex-wrap:wrap;gap:12px 28px;margin-top:15px}
.pf-facts div{display:flex;flex-direction:column;gap:4px;min-width:74px}
.pf-facts span{font-size:12px;color:#B7C9E4}
.pf-facts strong{font-size:13px;font-weight:700;color:#fff;overflow-wrap:anywhere}
.pf-meter{position:relative;z-index:1;flex:0 0 255px;margin-left:auto;padding:15px 16px;border-radius:15px;background:rgba(255,255,255,.105);border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(8px)}
.pf-meter-top{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:12px;color:#D5E3F6}
.pf-meter-top b{font-size:27px;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:-.6px}
.pf-meter-track{height:8px;overflow:hidden;margin-top:11px;border-radius:999px;background:rgba(255,255,255,.2)}
.pf-meter-track span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#fff,#CFE0FA);transform-origin:left;animation:sk-grow-x 1000ms var(--ease) 300ms both}
.pf-meter em{display:block;margin-top:9px;font-size:11px;font-style:normal;color:#C5D7EF;line-height:1.5}
.pf-section{min-width:0;padding:20px;border:1px solid #DEE7F3;background:#fff;box-shadow:0 3px 9px rgba(15,47,95,.035);transition:transform .28s cubic-bezier(.2,.7,.2,1),box-shadow .28s ease,border-color .28s ease}
.pf-section:hover{transform:translateY(-3px);border-color:#C6D7EF;box-shadow:0 12px 24px rgba(15,47,95,.075)}
.pf-section-head{margin-bottom:10px}
.pf-section-head h2{margin:0;font-size:17px;font-weight:800;letter-spacing:-.2px;color:var(--navy)}
.pf-section-head p{margin:5px 0 0;font-size:12.5px;color:var(--muted);line-height:1.5}
.pf-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:10px 8px;margin:0 -8px;border-bottom:1px solid var(--line-2);border-radius:8px;transition:background .2s ease}
.pf-row:hover{background:#F5F8FD}
.pf-row.is-last{border-bottom:0}
.pf-label{flex:0 0 42%;min-width:0;font-size:12.5px;line-height:1.5;color:var(--muted)}
.pf-value{min-width:0;max-width:58%;font-size:13.5px;line-height:1.5;font-weight:650;color:var(--navy);text-align:right;overflow-wrap:anywhere;word-break:normal}
.pf-value.is-missing{font-weight:400;color:var(--soft)}
.pf-phone{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:8px;min-width:0;max-width:58%}
.pf-phone .pf-value{max-width:none}
.pf-phone .sk-btn{flex:0 0 auto}
.pf-digits{display:flex;align-items:center;gap:10px;margin-top:8px}
.pf-digits span{display:block;height:4px;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--blue-2));transition:width .2s ease}
.pf-digits em{margin-left:auto;font-style:normal;font-size:12px;color:var(--soft)}
.sk-error-text{animation:sk-swap .25s var(--ease) both}
@media(max-width:1050px){.pf-hero{gap:18px}.pf-meter{flex-basis:220px}.pf-facts{gap:10px 18px}}
@media(max-width:900px){.pf-hero{align-items:flex-start}.pf-meter{flex:1 1 100%;margin-left:0}.pf-section{padding:17px}}
@media(max-width:600px){.pf-hero{gap:15px;padding:21px 18px;border-radius:19px}.pf-avatar{width:70px;height:70px;font-size:21px}.pf-hero h2{font-size:22px}.pf-hero p{font-size:13px}.pf-facts{gap:10px 16px;margin-top:12px}.pf-facts strong{font-size:12px}.pf-meter{flex-basis:100%}.pf-row{flex-direction:column;gap:4px;padding:9px 8px}.pf-label{flex-basis:auto}.pf-value,.pf-phone{max-width:100%;text-align:left;justify-content:flex-start}.pf-section-head h2{font-size:16px}}
@media(prefers-reduced-motion:reduce){.pf-hero,.pf-hero:after,.pf-avatar,.pf-avatar-overlay,.pf-section,.pf-row{animation:none!important;transition:none!important}.pf-status.is-on i{animation:none!important}}
`
