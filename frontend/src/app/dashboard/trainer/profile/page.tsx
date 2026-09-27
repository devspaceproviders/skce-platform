"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BriefcaseBusiness,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Mail,
  Phone,
  Save,
  User,
  X,
  Camera,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type TrainerProfile = {
  profileId: number;
  userId: number;

  name: string;
  email: string;
  phone: string | null;

  specialization: string | null;
  qualification: string | null;
  bio: string | null;

  experience: number | null;

  profilePhotoUrl: string | null;

  joinedDate: string;

  status:
    | "Active"
    | "Inactive";

  activeBatches: number;
  totalBatches: number;
};

type ProfileResponse = {
  success: boolean;
  data?: TrainerProfile;
  message?: string;
};

function getPhotoUrl(
  photoUrl?: string | null
) {
  if (!photoUrl) {
    return null;
  }

  if (
    photoUrl.startsWith("http://") ||
    photoUrl.startsWith("https://")
  ) {
    return photoUrl;
  }

  const backendUrl =
    API_URL.replace(
      /\/api\/?$/,
      ""
    );

  return `${backendUrl}${
    photoUrl.startsWith("/")
      ? ""
      : "/"
  }${photoUrl}`;
}

function formatJoinedDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getInitials(
  name: string
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return "TR";
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[
      parts.length - 1
    ].charAt(0)
  ).toUpperCase();
}

export default function TrainerProfilePage() {
  const [
    profile,
    setProfile,
  ] =
    useState<TrainerProfile | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploadingPhoto,
    setUploadingPhoto,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    photoError,
    setPhotoError,
  ] = useState("");

  const [
    draft,
    setDraft,
  ] = useState({
    name: "",
    phone: "",
    specialization: "",
  });

  const photoInputRef =
    useRef<HTMLInputElement>(
      null
    );

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }

      const response =
        await fetch(
          `${API_URL}/trainer/profile`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            cache: "no-store",
          }
        );

      const result: ProfileResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Unable to load trainer profile."
        );
      }

      setProfile(
        result.data
      );

      setDraft({
        name:
          result.data.name ||
          "",
        phone:
          result.data.phone ||
          "",
        specialization:
          result.data.specialization ||
          "",
      });
    } catch (err) {
      console.error(
        "Trainer profile loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load trainer profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  function startEdit() {
    if (!profile) {
      return;
    }

    setDraft({
      name:
        profile.name || "",
      phone:
        profile.phone || "",
      specialization:
        profile.specialization ||
        "",
    });

    setSaved(false);
    setError("");
    setEditing(true);
  }

  function cancelEdit() {
    if (profile) {
      setDraft({
        name:
          profile.name || "",
        phone:
          profile.phone || "",
        specialization:
          profile.specialization ||
          "",
      });
    }

    setEditing(false);
    setSaved(false);
    setError("");
  }

  async function saveProfile() {
    if (!profile) {
      return;
    }

    const name =
      draft.name.trim();

    const phone =
      draft.phone.trim();

    const specialization =
      draft.specialization.trim();

    if (name.length < 2) {
      setError(
        "Trainer name must contain at least 2 characters."
      );
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        throw new Error(
          "Your session has expired. Please login again."
        );
      }

      const response =
        await fetch(
          `${API_URL}/trainer/profile`,
          {
            method: "PATCH",
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name,
              phone:
                phone || null,
              specialization:
                specialization ||
                null,
            }),
          }
        );

      const result: ProfileResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Unable to update trainer profile."
        );
      }

      setProfile(
        result.data
      );

      setDraft({
        name:
          result.data.name ||
          "",
        phone:
          result.data.phone ||
          "",
        specialization:
          result.data.specialization ||
          "",
      });

      setEditing(false);
      setSaved(true);
    } catch (err) {
      console.error(
        "Trainer profile update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update trainer profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function openPhotoPicker() {
    setPhotoError("");
    photoInputRef.current?.click();
  }

  async function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setPhotoError("");

    const allowedTypes =
      new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ]);

    if (
      !allowedTypes.has(
        file.type
      )
    ) {
      setPhotoError(
        "Please select a JPG, PNG, WEBP, or GIF image."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setPhotoError(
        "Profile photo must be 5 MB or smaller."
      );

      event.target.value = "";
      return;
    }

    try {
      setUploadingPhoto(true);

      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        throw new Error(
          "Your session has expired. Please login again."
        );
      }

      const formData =
        new FormData();

      formData.append(
        "photo",
        file
      );

      const response =
        await fetch(
          `${API_URL}/profile/photo`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${token}`,
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
      } =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to upload profile photo."
        );
      }

      setProfile(
        (current) =>
          current
            ? {
                ...current,
                profilePhotoUrl:
                  result.data
                    ?.profilePhotoUrl ??
                  current.profilePhotoUrl,
              }
            : current
      );
    } catch (err) {
      console.error(
        "Trainer profile photo upload error:",
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1100px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Loading trainer profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1100px]">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-semibold text-red-700">
              {error ||
                "Unable to load trainer profile."}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadProfile()
              }
              className="mt-4 rounded-lg bg-[#173B67] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#102A4A]"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const photoUrl =
    getPhotoUrl(
      profile.profilePhotoUrl
    );

  const initials =
    getInitials(
      profile.name
    );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={
          handlePhotoChange
        }
      />

      <div className="mx-auto max-w-[1100px]">
        {/* Header */}

        <div className="mb-7 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-orange-300">
              <GraduationCap
                size={21}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">
                Trainer Portal
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Profile
              </h1>

              <p className="mt-1 text-sm text-blue-100">
                Manage your trainer account details.
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            <CheckCircle2
              size={17}
            />
            Profile updated successfully.
          </div>
        )}

        {photoError && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {photoError}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          {/* Profile overview */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`${profile.name} profile`}
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-orange-50"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-500 text-2xl font-bold text-white ring-4 ring-orange-50">
                    {initials}
                  </div>
                )}

                <button
                  type="button"
                  onClick={
                    openPhotoPicker
                  }
                  disabled={
                    uploadingPhoto
                  }
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#173B67] text-white shadow-sm transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Change profile photo"
                >
                  <Camera
                    size={16}
                  />
                </button>
              </div>

              {uploadingPhoto && (
                <p className="mt-3 text-xs font-medium text-slate-500">
                  Uploading photo...
                </p>
              )}

              <h2 className="mt-4 text-xl font-bold text-[#173B67]">
                {profile.name}
              </h2>

              <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <Mail
                  size={14}
                />
                {profile.email}
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#173B67]">
                <GraduationCap
                  size={14}
                />
                Trainer
              </span>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                  profile.status ===
                  "Active"
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {profile.status}
              </span>
            </div>

            <div className="mt-7 border-t border-slate-100 pt-5">
              <ProfileStat
                icon={
                  <BriefcaseBusiness
                    size={16}
                  />
                }
                label="Active batches"
                value={String(
                  profile.activeBatches
                )}
              />

              <ProfileStat
                icon={
                  <BriefcaseBusiness
                    size={16}
                  />
                }
                label="Total batches"
                value={String(
                  profile.totalBatches
                )}
              />

              <ProfileStat
                icon={
                  <User
                    size={16}
                  />
                }
                label="Joined"
                value={formatJoinedDate(
                  profile.joinedDate
                )}
              />
            </div>
          </div>

          {/* Details */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Account Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your trainer information and contact details.
                </p>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={
                    startEdit
                  }
                  className="inline-flex w-fit items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
                >
                  <Edit3
                    size={16}
                  />
                  Edit Profile
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
              {editing ? (
                <>
                  <EditField
                    label="Full Name"
                    value={
                      draft.name
                    }
                    onChange={(
                      value
                    ) =>
                      setDraft(
                        (
                          current
                        ) => ({
                          ...current,
                          name: value,
                        })
                      )
                    }
                  />

                  <ReadOnlyField
                    label="Email Address"
                    value={
                      profile.email
                    }
                  />

                  <EditField
                    label="Phone Number"
                    value={
                      draft.phone
                    }
                    onChange={(
                      value
                    ) =>
                      setDraft(
                        (
                          current
                        ) => ({
                          ...current,
                          phone: value,
                        })
                      )
                    }
                  />

                  <EditField
                    label="Specialization"
                    value={
                      draft.specialization
                    }
                    onChange={(
                      value
                    ) =>
                      setDraft(
                        (
                          current
                        ) => ({
                          ...current,
                          specialization:
                            value,
                        })
                      )
                    }
                  />

                  <ReadOnlyField
                    label="Experience"
                    value={
                      profile.experience !==
                      null
                        ? `${profile.experience} years`
                        : "Not provided"
                    }
                  />

                  <ReadOnlyField
                    label="Qualification"
                    value={
                      profile.qualification ||
                      "Not provided"
                    }
                  />

                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button
                      type="button"
                      onClick={() =>
                        void saveProfile()
                      }
                      disabled={
                        saving
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-[#173B67] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#102A4A] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save
                        size={16}
                      />
                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        cancelEdit
                      }
                      disabled={
                        saving
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X
                        size={16}
                      />
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <ReadOnlyField
                    label="Full Name"
                    value={
                      profile.name
                    }
                  />

                  <ReadOnlyField
                    label="Email Address"
                    value={
                      profile.email
                    }
                  />

                  <ReadOnlyField
                    label="Phone Number"
                    value={
                      profile.phone ||
                      "Not provided"
                    }
                  />

                  <ReadOnlyField
                    label="Specialization"
                    value={
                      profile.specialization ||
                      "Not provided"
                    }
                  />

                  <ReadOnlyField
                    label="Experience"
                    value={
                      profile.experience !==
                      null
                        ? `${profile.experience} years`
                        : "Not provided"
                    }
                  />

                  <ReadOnlyField
                    label="Qualification"
                    value={
                      profile.qualification ||
                      "Not provided"
                    }
                  />

                  <ReadOnlyField
                    label="Joined Date"
                    value={formatJoinedDate(
                      profile.joinedDate
                    )}
                  />

                  <ReadOnlyField
                    label="Account Status"
                    value={
                      profile.status
                    }
                  />
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between last:mb-0">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="text-orange-500">
          {icon}
        </span>
        {label}
      </div>

      <span className="text-sm font-bold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
        {value}
      </div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}