"use client";

import { useState } from "react";
import type { ReactNode } from "react";
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
} from "lucide-react";

type Profile = {
  name: string;
  email: string;
  specialization: string;
  activeBatches: number;
  joined: string;
  phone: string;
};

const INITIAL_PROFILE: Profile = {
  name: "Rajesh Kumar",
  email: "trainer@skce.in",
  specialization: "Full Stack Development",
  activeBatches: 3,
  joined: "12 Jan 2025",
  phone: "+91 98765 11111",
};

export default function TrainerProfilePage() {
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [draft, setDraft] = useState<Profile>(INITIAL_PROFILE);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const startEdit = () => {
    setDraft(profile);
    setSaved(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setSaved(false);
    setEditing(false);
  };

  const saveProfile = () => {
    if (!draft.name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!draft.phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

    if (!draft.specialization.trim()) {
      alert("Please enter your specialization.");
      return;
    }

    setProfile({
      ...draft,
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      specialization: draft.specialization.trim(),
    });

    setEditing(false);
    setSaved(true);
  };

  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="mb-7 rounded-2xl bg-[#173B67] p-5 text-white shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-orange-300">
              <GraduationCap size={21} />
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

        {/* Development notice */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-700">
          <User size={18} className="mt-0.5 shrink-0 text-orange-500" />
          <div>
            <p className="font-semibold text-slate-900">Development Mode</p>
            <p className="mt-0.5 leading-6">
              Profile details are currently managed in frontend state. They
              will be loaded and saved through the trainer account API after
              backend authentication is connected.
            </p>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          {/* Profile overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-xl font-bold text-white shadow-sm">
                {initials || "TR"}
              </div>

              <h2 className="mt-4 text-xl font-bold text-[#173B67]">
                {profile.name}
              </h2>

              <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <Mail size={14} />
                {profile.email}
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#173B67]">
                <GraduationCap size={14} />
                Trainer
              </span>
            </div>

            <div className="mt-7 border-t border-slate-100 pt-5">
              <ProfileStat
                icon={<BriefcaseBusiness size={16} />}
                label="Active batches"
                value={String(profile.activeBatches)}
              />
              <ProfileStat
                icon={<User size={16} />}
                label="Joined"
                value={profile.joined}
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
                  onClick={startEdit}
                  className="inline-flex w-fit items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
              {editing ? (
                <>
                  <EditField
                    label="Full Name"
                    value={draft.name}
                    onChange={(value) =>
                      setDraft((current) => ({ ...current, name: value }))
                    }
                  />

                  <ReadOnlyField label="Email Address" value={draft.email} />

                  <EditField
                    label="Specialization"
                    value={draft.specialization}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        specialization: value,
                      }))
                    }
                  />

                  <EditField
                    label="Phone"
                    value={draft.phone}
                    onChange={(value) =>
                      setDraft((current) => ({ ...current, phone: value }))
                    }
                  />

                  <ReadOnlyField
                    label="Active Batches"
                    value={String(draft.activeBatches)}
                  />

                  <ReadOnlyField label="Joined" value={draft.joined} />
                </>
              ) : (
                <>
                  <DetailCard
                    icon={<User size={17} />}
                    label="Full Name"
                    value={profile.name}
                  />

                  <DetailCard
                    icon={<Mail size={17} />}
                    label="Email Address"
                    value={profile.email}
                  />

                  <DetailCard
                    icon={<GraduationCap size={17} />}
                    label="Specialization"
                    value={profile.specialization}
                  />

                  <DetailCard
                    icon={<Phone size={17} />}
                    label="Phone"
                    value={profile.phone}
                  />

                  <DetailCard
                    icon={<BriefcaseBusiness size={17} />}
                    label="Active Batches"
                    value={String(profile.activeBatches)}
                  />

                  <DetailCard
                    icon={<CheckCircle2 size={17} />}
                    label="Joined"
                    value={profile.joined}
                  />
                </>
              )}
            </div>

            {editing && (
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  onClick={cancelEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <X size={16} />
                  Cancel
                </button>

                <button
                  onClick={saveProfile}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#173B67] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#123052]"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </section>

        {saved && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            <CheckCircle2 size={17} />
            Profile changes saved successfully.
          </div>
        )}
      </div>
    </main>
  );
}

function ProfileStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <span className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </span>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span className="text-orange-500">{icon}</span>
        {label}
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
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
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </label>
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
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-500">
        {value}
      </div>
    </div>
  );
}
