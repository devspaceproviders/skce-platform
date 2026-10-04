"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  User,
  Mail,
  Phone,
  Award,
} from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <Loader2
            className="h-5 w-5 animate-spin"
          />
          Loading trainer engagement...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/admin/trainers"
            )
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trainers
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            Unable to load trainer engagement
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!trainer || !data) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/admin/trainers"
            )
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trainers
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            Trainer engagement data is not available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/admin/trainers"
            )
          }
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trainers
        </button>

        <button
          type="button"
          onClick={() =>
            void loadData(true)
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* Trainer Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 text-orange-500">
            {trainer.profilePhotoUrl ? (
              <img
                src={trainer.profilePhotoUrl}
                alt={`${trainer.name} profile`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold">
                {trainer.name
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {trainer.name}
              </h1>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  trainer.status ===
                  "Active"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {trainer.status}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {trainer.id} · Trainer Engagement & Progress
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {trainer.email}
              </span>

              {trainer.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {trainer.phone}
                </span>
              )}

              {trainer.specialization && (
                <span className="inline-flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  {trainer.specialization}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {trainer.experience ||
                  "Experience not specified"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Engagement Panel */}
      <TrainerEngagementPanel
        data={data}
        mode="admin"
      />
    </div>
  );
}