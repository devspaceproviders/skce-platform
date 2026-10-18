"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
} from "lucide-react";

import {
  AdminPageShell,
  AdminPageHeader,
  ADMIN_BTN_GHOST,
} from "@/components/dashboard/admin/AdminPageHeader";
import TrainerEngagementPanel, {
  type TrainerEngagementData,
} from "@/components/dashboard/TrainerEngagementPanel";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type TrainerDetails = {
  profileId: number;
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  batches: number;
  joinedDate: string;
  status: "Active" | "Inactive";
  profilePhotoUrl: string | null;
};

export default function AdminTrainerEngagementsPage() {
  const params = useParams();
  const router = useRouter();

  const trainerId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [trainer, setTrainer] =
    useState<TrainerDetails | null>(null);

  const [data, setData] =
    useState<TrainerEngagementData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken")
    );
  };

  const authenticatedFetch = async (
    url: string
  ) => {
    const token = getToken();

    if (!token) {
      router.push("/admin/login");
      throw new Error(
        "Authentication required."
      );
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      router.push("/admin/login");

      throw new Error(
        "Authentication required."
      );
    }

    return response;
  };

  const loadData = async (
    showRefreshState = false
  ) => {
    if (!trainerId) {
      setError("Trainer ID is missing.");
      setLoading(false);
      return;
    }

    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [
        trainerResponse,
        engagementResponse,
      ] = await Promise.all([
        authenticatedFetch(
          `${API_URL}/admin/trainers/${trainerId}`
        ),
        authenticatedFetch(
          `${API_URL}/admin/trainers/${trainerId}/engagements`
        ),
      ]);

      const trainerJson =
        await trainerResponse.json();

      const engagementJson =
        await engagementResponse.json();

      if (
        !trainerResponse.ok ||
        !trainerJson?.success
      ) {
        throw new Error(
          trainerJson?.message ||
            "Unable to load trainer details."
        );
      }

      if (
        !engagementResponse.ok ||
        !engagementJson?.success
      ) {
        throw new Error(
          engagementJson?.message ||
            "Unable to load trainer engagements."
        );
      }

      const trainerData =
        trainerJson.data;

      setTrainer({
        profileId: Number(
          trainerData.profileId ??
            trainerData.id
        ),
        id:
          trainerData.displayId ||
          `TR${String(
            trainerData.profileId ??
              trainerData.id
          ).padStart(3, "0")}`,
        name:
          trainerData.name || "",
        email:
          trainerData.email || "",
        phone:
          trainerData.phone || "",
        specialization:
          trainerData.specialization || "",
        experience:
          trainerData.experience === null ||
          trainerData.experience ===
            undefined ||
          trainerData.experience === ""
            ? ""
            : `${trainerData.experience} Years`,
        batches: Number(
          trainerData.batches || 0
        ),
        joinedDate:
          trainerData.joinedDate
            ? new Date(
                trainerData.joinedDate
              ).toLocaleDateString(
                "en-IN"
              )
            : "",
        status:
          trainerData.status ===
          "Active"
            ? "Active"
            : "Inactive",
        profilePhotoUrl:
          trainerData.profilePhotoUrl ||
          null,
      });

      setData(
        engagementJson.data as TrainerEngagementData
      );
    } catch (err) {
      console.error(
        "Load admin trainer engagement error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load trainer engagements."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [trainerId]);

  const backButton = (
    <button
      type="button"
      onClick={() => router.push("/dashboard/admin/trainers")}
      className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0F2F5F] shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Trainers
    </button>
  );

  if (loading) {
    return (
      <AdminPageShell>
        <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-orange-600 motion-reduce:animate-none" />
            Loading trainer engagement...
          </div>
        </div>
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell>
        <div>{backButton}</div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="font-semibold text-red-800">
            Unable to load trainer engagement
          </h2>

          <p className="mt-2 text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </AdminPageShell>
    );
  }

  if (!trainer || !data) {
    return (
      <AdminPageShell>
        <div>{backButton}</div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Trainer engagement data is not available.
          </p>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <div>{backButton}</div>

      <AdminPageHeader
        label="Trainer Engagement & Progress"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 text-lg font-bold text-orange-300">
              {trainer.profilePhotoUrl ? (
                <img
                  src={trainer.profilePhotoUrl}
                  alt={`${trainer.name} profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                trainer.name.charAt(0).toUpperCase()
              )}
            </span>
            <span className="break-words">{trainer.name}</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                trainer.status === "Active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {trainer.status}
            </span>
          </span>
        }
        subtitle={`${trainer.id} · Trainer Engagement & Progress`}
        chips={[
          { label: trainer.email },
          ...(trainer.phone ? [{ label: trainer.phone }] : []),
          ...(trainer.specialization ? [{ label: trainer.specialization }] : []),
          { label: trainer.experience || "Experience not specified" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => void loadData(true)}
            disabled={refreshing}
            className={ADMIN_BTN_GHOST}
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin motion-reduce:animate-none" : ""
              }`}
            />
            Refresh
          </button>
        }
      />

      {/* Detailed Engagement Panel */}
      <TrainerEngagementPanel data={data} mode="admin" />
    </AdminPageShell>
  );
}
