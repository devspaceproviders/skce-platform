"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Megaphone,
  Save,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type MediaType = "IMAGE" | "VIDEO";

type HomepagePopup = {
  id: number;
  title: string;
  message: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  mediaType: MediaType;
  buttonText: string | null;
  buttonLink: string | null;
  isActive: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export default function HomepagePopupPage() {
  const imageFileInputRef =
    useRef<HTMLInputElement | null>(null);

  const videoFileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [isActive, setIsActive] = useState(false);

  const [mediaType, setMediaType] =
    useState<MediaType>("IMAGE");

  const [imageUrl, setImageUrl] =
    useState<string | null>(null);

  const [videoUrl, setVideoUrl] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [status, setStatus] = useState<
    "success" | "error" | ""
  >("");

  const [statusMessage, setStatusMessage] =
    useState("");

  useEffect(() => {
    loadPopup();
  }, []);

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

    window.location.href = "/admin/login";
  }

  function getMediaSource(url: string) {
    if (url.startsWith("http")) {
      return url;
    }

    return `${API_URL.replace(/\/api$/, "")}${url}`;
  }

  async function loadPopup() {
    const token = getToken();

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    setLoading(true);
    setStatus("");
    setStatusMessage("");

    try {
      const response = await fetch(
        `${API_URL}/admin/homepage-popup`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      const result =
        (await response.json()) as ApiResponse<
          HomepagePopup | null
        >;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to load homepage popup."
        );
      }

      const popup = result.data;

      if (popup) {
        setTitle(popup.title || "");
        setMessage(popup.message || "");
        setButtonText(
          popup.buttonText || ""
        );
        setButtonLink(
          popup.buttonLink || ""
        );
        setIsActive(
          Boolean(popup.isActive)
        );

        setMediaType(
          popup.mediaType === "VIDEO"
            ? "VIDEO"
            : "IMAGE"
        );

        setImageUrl(
          popup.imageUrl || null
        );

        setVideoUrl(
          popup.videoUrl || null
        );
      } else {
        setTitle("");
        setMessage("");
        setButtonText("");
        setButtonLink("");
        setIsActive(false);
        setMediaType("IMAGE");
        setImageUrl(null);
        setVideoUrl(null);
      }
    } catch (error) {
      console.error(
        "Load homepage popup error:",
        error
      );

      setStatus("error");

      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to load homepage popup."
      );
    } finally {
      setLoading(false);
    }
  }

  async function savePopup() {
    const token = getToken();

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    if (!title.trim()) {
      setStatus("error");
      setStatusMessage(
        "Popup title is required."
      );
      return;
    }

    setSaving(true);
    setStatus("");
    setStatusMessage("");

    try {
      const response = await fetch(
        `${API_URL}/admin/homepage-popup`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            message:
              message.trim() || null,
            buttonText:
              buttonText.trim() || null,
            buttonLink:
              buttonLink.trim() || null,
            isActive,
          }),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      const result =
        (await response.json()) as ApiResponse<HomepagePopup>;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to save homepage popup."
        );
      }

      if (result.data) {
        setTitle(result.data.title || "");
        setMessage(
          result.data.message || ""
        );
        setButtonText(
          result.data.buttonText || ""
        );
        setButtonLink(
          result.data.buttonLink || ""
        );
        setIsActive(
          Boolean(result.data.isActive)
        );

        setMediaType(
          result.data.mediaType === "VIDEO"
            ? "VIDEO"
            : "IMAGE"
        );

        setImageUrl(
          result.data.imageUrl || null
        );

        setVideoUrl(
          result.data.videoUrl || null
        );
      }

      setStatus("success");

      setStatusMessage(
        isActive
          ? "Homepage popup saved and activated."
          : "Homepage popup saved. It is currently inactive."
      );
    } catch (error) {
      console.error(
        "Save homepage popup error:",
        error
      );

      setStatus("error");

      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to save homepage popup."
      );
    } finally {
      setSaving(false);
    }
  }

  async function savePopupBeforeUpload(
    token: string,
    uploadType: "image" | "video"
  ) {
    const saveResponse = await fetch(
      `${API_URL}/admin/homepage-popup`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          message:
            message.trim() || null,
          buttonText:
            buttonText.trim() || null,
          buttonLink:
            buttonLink.trim() || null,
          isActive,
        }),
      }
    );

    if (
      saveResponse.status === 401 ||
      saveResponse.status === 403
    ) {
      handleUnauthorized();
      return false;
    }

    const saveResult =
      (await saveResponse.json()) as ApiResponse<HomepagePopup>;

    if (
      !saveResponse.ok ||
      !saveResult.success
    ) {
      throw new Error(
        saveResult.message ||
          `Please save the popup title before uploading an ${uploadType}.`
      );
    }

    return true;
  }

  async function uploadImage(
    file: File | undefined
  ) {
    if (!file) {
      return;
    }

    const token = getToken();

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    setUploading(true);
    setStatus("");
    setStatusMessage("");

    try {
      const saved =
        await savePopupBeforeUpload(
          token,
          "image"
        );

      if (!saved) {
        return;
      }

      const formData = new FormData();

      formData.append(
        "image",
        file
      );

      const response = await fetch(
        `${API_URL}/admin/homepage-popup/image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      const result =
        (await response.json()) as ApiResponse<HomepagePopup>;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to upload popup image."
        );
      }

      setMediaType("IMAGE");

      setImageUrl(
        result.data?.imageUrl || null
      );

      if (result.data?.videoUrl) {
        setVideoUrl(
          result.data.videoUrl
        );
      }

      setStatus("success");

      setStatusMessage(
        "Popup image uploaded successfully."
      );
    } catch (error) {
      console.error(
        "Upload homepage popup image error:",
        error
      );

      setStatus("error");

      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload popup image."
      );
    } finally {
      setUploading(false);

      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = "";
      }
    }
  }

  async function uploadVideo(
    file: File | undefined
  ) {
    if (!file) {
      return;
    }

    const token = getToken();

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    setUploading(true);
    setStatus("");
    setStatusMessage("");

    try {
      const saved =
        await savePopupBeforeUpload(
          token,
          "video"
        );

      if (!saved) {
        return;
      }

      const formData = new FormData();

      formData.append(
        "video",
        file
      );

      const response = await fetch(
        `${API_URL}/admin/homepage-popup/video`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      const result =
        (await response.json()) as ApiResponse<HomepagePopup>;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to upload popup video."
        );
      }

      setMediaType("VIDEO");

      setVideoUrl(
        result.data?.videoUrl || null
      );

      if (result.data?.imageUrl) {
        setImageUrl(
          result.data.imageUrl
        );
      }

      setStatus("success");

      setStatusMessage(
        "Popup video uploaded successfully."
      );
    } catch (error) {
      console.error(
        "Upload homepage popup video error:",
        error
      );

      setStatus("error");

      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload popup video."
      );
    } finally {
      setUploading(false);

      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = "";
      }
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="animate-pulse">
              <div className="h-7 w-64 rounded bg-slate-200" />

              <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />

              <div className="mt-8 h-48 rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* HEADER */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-500">
              System
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
              Homepage Popup
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Manage the single announcement popup displayed
              on the SKCE homepage.
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold ${
              isActive
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isActive
                  ? "bg-green-500"
                  : "bg-slate-300"
              }`}
            />

            {isActive
              ? "Popup Active"
              : "Popup Inactive"}
          </div>
        </div>

        {/* STATUS */}
        {status && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              status === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {status === "success" ? (
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />
            )}

            <p>{statusMessage}</p>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* FORM */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Megaphone size={21} />
                </div>

                <div>
                  <h2 className="text-base font-bold text-[#173B67]">
                    Announcement Details
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Update what visitors should see on the homepage.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {/* TITLE */}
              <Field
                label="Popup Title"
                required
                value={title}
                onChange={setTitle}
                placeholder="e.g. Happy Diwali"
              />

              {/* MESSAGE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Message / Information
                </label>

                <textarea
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  rows={5}
                  placeholder="Enter the announcement or information you want visitors to read..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Optional. Keep the message concise for a clean popup.
                </p>
              </div>

              {/* BUTTON */}
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Button Text"
                  value={buttonText}
                  onChange={setButtonText}
                  placeholder="e.g. Explore Courses"
                />

                <Field
                  label="Button Link"
                  value={buttonLink}
                  onChange={setButtonLink}
                  placeholder="e.g. /courses"
                />
              </div>

              {/* ACTIVE */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Show popup on homepage
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      When disabled, visitors will not see the popup.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setIsActive(
                        (current) => !current
                      )
                    }
                    aria-pressed={isActive}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      isActive
                        ? "bg-orange-500"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                        isActive
                          ? "left-6"
                          : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* SAVE */}
              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={savePopup}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />

                  {saving
                    ? "Saving..."
                    : "Save Popup"}
                </button>
              </div>
            </div>
          </section>

          {/* MEDIA + PREVIEW */}
          <aside className="space-y-6">
            {/* MEDIA TYPE */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <p className="text-sm font-bold text-[#173B67]">
                  Popup Media
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Choose the media displayed in the homepage popup.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setMediaType("IMAGE")
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    mediaType === "IMAGE"
                      ? "border-orange-300 bg-orange-50 text-orange-600"
                      : "border-slate-200 bg-white text-slate-600 hover:border-orange-200"
                  }`}
                >
                  <ImagePlus size={17} />
                  Image
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMediaType("VIDEO")
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    mediaType === "VIDEO"
                      ? "border-orange-300 bg-orange-50 text-orange-600"
                      : "border-slate-200 bg-white text-slate-600 hover:border-orange-200"
                  }`}
                >
                  <Video size={17} />
                  Video
                </button>
              </div>
            </section>

            {/* IMAGE */}
            {mediaType === "IMAGE" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ImagePlus size={20} />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-[#173B67]">
                      Popup Image
                    </h2>

                    <p className="text-xs text-slate-500">
                      JPG, PNG or WEBP · Max 5 MB
                    </p>
                  </div>
                </div>

                {imageUrl ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <div className="relative aspect-[16/10] w-full">
                      <Image
                        src={getMediaSource(imageUrl)}
                        alt="Homepage popup"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                    <ImagePlus
                      size={28}
                      className="text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      No popup image
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Add an image to make the announcement more visual.
                    </p>
                  </div>
                )}

                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) =>
                    uploadImage(
                      event.target.files?.[0]
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    imageFileInputRef.current?.click()
                  }
                  disabled={uploading}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#173B67] transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload size={16} />

                  {uploading
                    ? "Uploading..."
                    : imageUrl
                      ? "Replace Image"
                      : "Upload Image"}
                </button>
              </section>
            )}

            {/* VIDEO */}
            {mediaType === "VIDEO" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Video size={20} />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-[#173B67]">
                      Popup Video
                    </h2>

                    <p className="text-xs text-slate-500">
                      MP4 or WEBM · Max 50 MB
                    </p>
                  </div>
                </div>

                {videoUrl ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
                    <div className="relative aspect-[16/10] w-full">
                      <video
                        src={getMediaSource(videoUrl)}
                        className="absolute inset-0 h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                    <Video
                      size={28}
                      className="text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      No popup video
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Add an MP4 or WEBM video for the announcement.
                    </p>
                  </div>
                )}

                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/mp4,video/webm"
                  className="hidden"
                  onChange={(event) =>
                    uploadVideo(
                      event.target.files?.[0]
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    videoFileInputRef.current?.click()
                  }
                  disabled={uploading}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#173B67] transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload size={16} />

                  {uploading
                    ? "Uploading..."
                    : videoUrl
                      ? "Replace Video"
                      : "Upload Video"}
                </button>
              </section>
            )}

            {/* INFO */}
            <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
              <div className="flex items-start gap-3">
                <Sparkles
                  size={19}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <div>
                  <p className="text-sm font-bold text-[#173B67]">
                    Homepage behavior
                  </p>

                  <p className="mt-1.5 text-xs leading-5 text-slate-600">
                    Only one popup configuration is managed.
                    Activating this announcement makes it available
                    to homepage visitors. Deactivating it hides the
                    popup without deleting your content.
                  </p>
                </div>
              </div>
            </section>

            {/* LIVE SUMMARY */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Current Configuration
              </p>

              <div className="mt-4 space-y-3 text-sm">
                <SummaryRow
                  label="Title"
                  value={
                    title || "Not configured"
                  }
                />

                <SummaryRow
                  label="Media"
                  value={
                    mediaType === "VIDEO"
                      ? videoUrl
                        ? "Video configured"
                        : "Video not configured"
                      : imageUrl
                        ? "Image configured"
                        : "Image not configured"
                  }
                />

                <SummaryRow
                  label="Button"
                  value={
                    buttonText
                      ? buttonText
                      : "No button"
                  }
                />

                <SummaryRow
                  label="Status"
                  value={
                    isActive
                      ? "Active"
                      : "Inactive"
                  }
                  valueClassName={
                    isActive
                      ? "text-green-600"
                      : "text-slate-500"
                  }
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-orange-500">
            *
          </span>
        )}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName = "text-slate-700",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-slate-500">
        {label}
      </span>

      <span
        className={`max-w-[210px] truncate text-right font-semibold ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}