"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  CheckCircle2,
  Mail,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type AdminProfile = {
  name: string;
  email: string;
  role: string;
  profilePhotoUrl: string | null;
};

type CeoProfile = {
  id: number;
  userId: number;

  name: string;
  displayName: string;

  email: string;

  designation: string;

  profilePhotoUrl: string | null;

  bioParagraph1: string;
  bioParagraph2: string;

  highlight1: string;
  highlight2: string;

  limits?: {
    displayName: number;
    designation: number;
    bioParagraph: number;
    highlight: number;
    maxBioLines: number;
    maxHighlightLines: number;
  };
};

const INITIAL_PROFILE: AdminProfile = {
  name: "Administrator",
  email: "Admin Account",
  role: "ADMIN",
  profilePhotoUrl: null,
};

const INITIAL_CEO: CeoProfile = {
  id: 0,
  userId: 0,

  name: "",
  displayName: "",

  email: "",

  designation: "Founder & CEO",

  profilePhotoUrl: null,

  bioParagraph1: "",
  bioParagraph2: "",

  highlight1: "",
  highlight2: "",
};

const CEO_LIMITS = {
  displayName: 80,
  designation: 80,
  bioParagraph: 500,
  highlight: 120,
  maxBioLines: 5,
  maxHighlightLines: 2,
};

export default function AdminProfilePage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<AdminProfile>(INITIAL_PROFILE);

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  const [photoError, setPhotoError] =
    useState("");

  const [ceo, setCeo] =
    useState<CeoProfile>(INITIAL_CEO);

  const [loadingCeo, setLoadingCeo] =
    useState(true);

  const [savingCeo, setSavingCeo] =
    useState(false);

  const [ceoError, setCeoError] =
    useState("");

  const [ceoSuccess, setCeoSuccess] =
    useState("");

  const photoInputRef =
    useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadCeoProfile();
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

    const backendUrl =
      API_URL.replace(/\/api\/?$/, "");

    return `${backendUrl}${
      photoUrl.startsWith("/")
        ? ""
        : "/"
    }${photoUrl}`;
  }

  function getToken() {
    return localStorage.getItem("token");
  }

  function handleUnauthorized() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem(
      "skce_admin_logged_in"
    );

    router.push("/admin/login");
  }

  async function loadCeoProfile() {
    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      setLoadingCeo(true);
      setCeoError("");

      const response = await fetch(
        `${API_URL}/admin/ceo`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result: {
        success: boolean;
        data?: CeoProfile;
        message?: string;
      } = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Unable to load CEO information."
        );
      }

      setCeo(result.data);

      setProfile((current) => ({
        ...current,
        name:
          result.data?.name ||
          current.name,
        email:
          result.data?.email ||
          current.email,
        profilePhotoUrl:
          result.data?.profilePhotoUrl ??
          current.profilePhotoUrl,
      }));
    } catch (error) {
      console.error(
        "Admin CEO profile load error:",
        error
      );

      setCeoError(
        error instanceof Error
          ? error.message
          : "Unable to load CEO information."
      );
    } finally {
      setLoadingCeo(false);
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

    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      setUploadingPhoto(true);

      const formData = new FormData();

      formData.append(
        "photo",
        file
      );

      const response = await fetch(
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
      } = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to upload profile photo."
        );
      }

      const newPhotoUrl =
        result.data?.profilePhotoUrl ??
        null;

      setProfile((current) => ({
        ...current,
        profilePhotoUrl:
          newPhotoUrl,
      }));

      setCeo((current) => ({
        ...current,
        profilePhotoUrl:
          newPhotoUrl,
      }));
    } catch (err) {
      console.error(
        "Admin profile photo upload error:",
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

  function countLines(value: string) {
    return value
      .replace(/\r\n/g, "\n")
      .split("\n")
      .length;
  }

  function validateCeoField(
    value: string,
    maxLength: number,
    maxLines: number,
    fieldName: string
  ): string {
    if (!value.trim()) {
      return `${fieldName} cannot be empty.`;
    }

    if (value.length > maxLength) {
      return `${fieldName} cannot exceed ${maxLength} characters.`;
    }

    if (countLines(value) > maxLines) {
      return `${fieldName} cannot exceed ${maxLines} lines.`;
    }

    return "";
  }

  function updateCeoField(
    field:
      | "displayName"
      | "designation"
      | "bioParagraph1"
      | "bioParagraph2"
      | "highlight1"
      | "highlight2",
    value: string
  ) {
    setCeo((current) => ({
      ...current,
      [field]: value,
    }));

    setCeoError("");
    setCeoSuccess("");
  }

  function validateCeoForm(): string {
    const displayNameError =
      validateCeoField(
        ceo.displayName,
        CEO_LIMITS.displayName,
        1,
        "CEO Name"
      );

    if (displayNameError) {
      return displayNameError;
    }

    const designationError =
      validateCeoField(
        ceo.designation,
        CEO_LIMITS.designation,
        1,
        "Designation"
      );

    if (designationError) {
      return designationError;
    }

    const bio1Error =
      validateCeoField(
        ceo.bioParagraph1,
        CEO_LIMITS.bioParagraph,
        CEO_LIMITS.maxBioLines,
        "Bio Paragraph 1"
      );

    if (bio1Error) {
      return bio1Error;
    }

    const bio2Error =
      validateCeoField(
        ceo.bioParagraph2,
        CEO_LIMITS.bioParagraph,
        CEO_LIMITS.maxBioLines,
        "Bio Paragraph 2"
      );

    if (bio2Error) {
      return bio2Error;
    }

    const highlight1Error =
      validateCeoField(
        ceo.highlight1,
        CEO_LIMITS.highlight,
        CEO_LIMITS.maxHighlightLines,
        "Highlight 1"
      );

    if (highlight1Error) {
      return highlight1Error;
    }

    const highlight2Error =
      validateCeoField(
        ceo.highlight2,
        CEO_LIMITS.highlight,
        CEO_LIMITS.maxHighlightLines,
        "Highlight 2"
      );

    if (highlight2Error) {
      return highlight2Error;
    }

    return "";
  }

  async function handleSaveCeo() {
    const validationError =
      validateCeoForm();

    if (validationError) {
      setCeoError(validationError);
      setCeoSuccess("");
      return;
    }

    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      setSavingCeo(true);
      setCeoError("");
      setCeoSuccess("");

      const response = await fetch(
        `${API_URL}/admin/ceo`,
        {
          method: "PATCH",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            displayName:
              ceo.displayName,

            designation:
              ceo.designation,

            bioParagraph1:
              ceo.bioParagraph1,

            bioParagraph2:
              ceo.bioParagraph2,

            highlight1:
              ceo.highlight1,

            highlight2:
              ceo.highlight2,
          }),
        }
      );

      const result: {
        success: boolean;
        data?: CeoProfile;
        message?: string;
      } = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Unable to update CEO information."
        );
      }

      setCeo(result.data);

      setCeoSuccess(
        "CEO information updated successfully."
      );
    } catch (error) {
      console.error(
        "Admin CEO profile update error:",
        error
      );

      setCeoError(
        error instanceof Error
          ? error.message
          : "Unable to update CEO information."
      );
    } finally {
      setSavingCeo(false);
    }
  }

  const initials =
    profile.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part
          .charAt(0)
          .toUpperCase()
      )
      .join("") || "A";

  const photoUrl =
    getPhotoUrl(
      profile.profilePhotoUrl
    );

  const bio1Lines =
    countLines(ceo.bioParagraph1);

  const bio2Lines =
    countLines(ceo.bioParagraph2);

  const highlight1Lines =
    countLines(ceo.highlight1);

  const highlight2Lines =
    countLines(ceo.highlight2);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1100px]">

        {/* Header */}
        <div className="mb-7 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6">
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-orange-300">
              <ShieldCheck size={21} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">
                Administration Portal
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Admin Profile
              </h1>

              <p className="mt-1 text-sm text-blue-100">
                Manage your administrator profile.
              </p>
            </div>

          </div>
        </div>

        {/* Profile section */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">

          {/* Profile overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col items-center text-center">

              {/* Profile photo */}
              <div className="relative">

                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-orange-500 text-3xl font-bold text-white shadow-md">

                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={`${profile.name} profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}

                </div>

                {/* Camera button */}
                <button
                  type="button"
                  onClick={openPhotoPicker}
                  disabled={uploadingPhoto}
                  className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#173B67] text-white shadow-md transition hover:bg-[#123052] disabled:cursor-not-allowed disabled:opacity-60"
                  title="Change profile photo"
                >
                  <Camera size={17} />
                </button>

              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoChange}
              />

              <button
                type="button"
                onClick={openPhotoPicker}
                disabled={uploadingPhoto}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Camera size={16} />

                {uploadingPhoto
                  ? "Uploading..."
                  : "Change Profile Photo"}
              </button>

              {photoError && (
                <p className="mt-3 max-w-[250px] text-center text-xs font-medium text-red-600">
                  {photoError}
                </p>
              )}

              <h2 className="mt-5 text-xl font-bold text-[#173B67]">
                {profile.name}
              </h2>

              <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <Mail size={14} />
                {profile.email}
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#173B67]">
                <ShieldCheck size={14} />
                Administrator
              </span>

            </div>

          </div>

          {/* Account details */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Account Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your administrator account information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">

              <DetailCard
                icon={<User size={17} />}
                label="Name"
                value={profile.name}
              />

              <DetailCard
                icon={<Mail size={17} />}
                label="Email"
                value={profile.email}
              />

              <DetailCard
                icon={<ShieldCheck size={17} />}
                label="Role"
                value={profile.role}
              />

              <DetailCard
                icon={<CheckCircle2 size={17} />}
                label="Profile Photo"
                value={
                  profile.profilePhotoUrl
                    ? "Uploaded"
                    : "Not uploaded"
                }
              />

            </div>

          </div>

        </section>

        {/* CEO Information */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Founder & CEO Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the information displayed in the public Founder & CEO section.
                </p>
              </div>

              <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#173B67]">
                Admin Only
              </span>

            </div>
          </div>

          {loadingCeo ? (
            <div className="p-6">
              <div className="rounded-xl bg-slate-50 p-5 text-center text-sm font-medium text-slate-500">
                Loading CEO information...
              </div>
            </div>
          ) : (
            <div className="space-y-6 p-5 sm:p-6">

              {/* Basic information */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* CEO Name */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="ceo-name"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      CEO Name
                    </label>

                    <span className="text-xs text-slate-400">
                      {ceo.displayName.length}/
                      {CEO_LIMITS.displayName}
                    </span>
                  </div>

                  <input
                    id="ceo-name"
                    type="text"
                    value={ceo.displayName}
                    maxLength={CEO_LIMITS.displayName}
                    onChange={(event) =>
                      updateCeoField(
                        "displayName",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Public CEO name. This is separate from the administrator account name.
                  </p>
                </div>

                {/* Designation */}
                <div>
                  <label
                    htmlFor="ceo-designation"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Designation
                  </label>

                  <input
                    id="ceo-designation"
                    type="text"
                    value={ceo.designation}
                    maxLength={CEO_LIMITS.designation}
                    onChange={(event) =>
                      updateCeoField(
                        "designation",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                  />

                  <div className="mt-1.5 flex justify-end text-xs text-slate-400">
                    {ceo.designation.length}/
                    {CEO_LIMITS.designation}
                  </div>
                </div>

              </div>

              {/* Bio Paragraph 1 */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="ceo-bio-1"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Bio Paragraph 1
                  </label>

                  <span className="text-xs text-slate-400">
                    {ceo.bioParagraph1.length}/
                    {CEO_LIMITS.bioParagraph}
                  </span>
                </div>

                <textarea
                  id="ceo-bio-1"
                  value={ceo.bioParagraph1}
                  maxLength={CEO_LIMITS.bioParagraph}
                  rows={5}
                  onChange={(event) =>
                    updateCeoField(
                      "bioParagraph1",
                      event.target.value
                    )
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                />

                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span
                    className={
                      bio1Lines >
                      CEO_LIMITS.maxBioLines
                        ? "font-semibold text-red-600"
                        : "text-slate-400"
                    }
                  >
                    {bio1Lines}/
                    {CEO_LIMITS.maxBioLines} lines
                  </span>

                  <span className="text-slate-400">
                    Maximum 500 characters
                  </span>
                </div>
              </div>

              {/* Bio Paragraph 2 */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="ceo-bio-2"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Bio Paragraph 2
                  </label>

                  <span className="text-xs text-slate-400">
                    {ceo.bioParagraph2.length}/
                    {CEO_LIMITS.bioParagraph}
                  </span>
                </div>

                <textarea
                  id="ceo-bio-2"
                  value={ceo.bioParagraph2}
                  maxLength={CEO_LIMITS.bioParagraph}
                  rows={5}
                  onChange={(event) =>
                    updateCeoField(
                      "bioParagraph2",
                      event.target.value
                    )
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                />

                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span
                    className={
                      bio2Lines >
                      CEO_LIMITS.maxBioLines
                        ? "font-semibold text-red-600"
                        : "text-slate-400"
                    }
                  >
                    {bio2Lines}/
                    {CEO_LIMITS.maxBioLines} lines
                  </span>

                  <span className="text-slate-400">
                    Maximum 500 characters
                  </span>
                </div>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* Highlight 1 */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="ceo-highlight-1"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Highlight 1
                    </label>

                    <span className="text-xs text-slate-400">
                      {ceo.highlight1.length}/
                      {CEO_LIMITS.highlight}
                    </span>
                  </div>

                  <textarea
                    id="ceo-highlight-1"
                    value={ceo.highlight1}
                    maxLength={CEO_LIMITS.highlight}
                    rows={3}
                    onChange={(event) =>
                      updateCeoField(
                        "highlight1",
                        event.target.value
                      )
                    }
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                  />

                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span
                      className={
                        highlight1Lines >
                        CEO_LIMITS.maxHighlightLines
                          ? "font-semibold text-red-600"
                          : "text-slate-400"
                      }
                    >
                      {highlight1Lines}/
                      {CEO_LIMITS.maxHighlightLines} lines
                    </span>

                    <span className="text-slate-400">
                      Maximum 120 characters
                    </span>
                  </div>
                </div>

                {/* Highlight 2 */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="ceo-highlight-2"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Highlight 2
                    </label>

                    <span className="text-xs text-slate-400">
                      {ceo.highlight2.length}/
                      {CEO_LIMITS.highlight}
                    </span>
                  </div>

                  <textarea
                    id="ceo-highlight-2"
                    value={ceo.highlight2}
                    maxLength={CEO_LIMITS.highlight}
                    rows={3}
                    onChange={(event) =>
                      updateCeoField(
                        "highlight2",
                        event.target.value
                      )
                    }
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#173B67] focus:ring-2 focus:ring-[#173B67]/10"
                  />

                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span
                      className={
                        highlight2Lines >
                        CEO_LIMITS.maxHighlightLines
                          ? "font-semibold text-red-600"
                          : "text-slate-400"
                      }
                    >
                      {highlight2Lines}/
                      {CEO_LIMITS.maxHighlightLines} lines
                    </span>

                    <span className="text-slate-400">
                      Maximum 120 characters
                    </span>
                  </div>
                </div>

              </div>

              {/* Error */}
              {ceoError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {ceoError}
                </div>
              )}

              {/* Success */}
              {ceoSuccess && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {ceoSuccess}
                </div>
              )}

              {/* Save */}
              <div className="flex justify-end border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={handleSaveCeo}
                  disabled={
                    savingCeo ||
                    loadingCeo
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#173B67] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#123052] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />

                  {savingCeo
                    ? "Saving..."
                    : "Save CEO Information"}
                </button>

              </div>

            </div>
          )}

        </section>

        {/* Information */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">

          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-[#173B67]"
          />

          <div>
            <p className="font-semibold text-slate-900">
              Profile & CEO Information
            </p>

            <p className="mt-0.5 leading-6">
              Your profile photo and Founder & CEO information are stored in the SKCE backend and can be displayed across the website.
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">

      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">

        <span className="text-orange-500">
          {icon}
        </span>

        {label}

      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>

    </div>
  );
}