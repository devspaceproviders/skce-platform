"use client";

import { useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  MoreVertical,
  Eye,
  Pencil,
  UserX,
  UserCheck,
  Users,
  X,
  Save,
  KeyRound,
  Activity,
  CheckCircle2,
  XCircle,
  Award,
  CalendarDays,
} from "lucide-react";

type TrainerStatus = "Active" | "Inactive";

type Trainer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  batches: number;
  joinedDate: string;
  status: TrainerStatus;
};

type TrainerForm = {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  password: string;
  status: TrainerStatus;
};

const EMPTY_FORM: TrainerForm = {
  name: "",
  email: "",
  phone: "",
  specialization: "",
  experience: "",
  password: "",
  status: "Active",
};

/*
 * Backend will replace this initial state later.
 * Until then, trainers created from this page exist
 * only in frontend state.
 */
const INITIAL_TRAINERS: Trainer[] = [];

export default function TrainersPage() {
  const [trainers, setTrainers] =
    useState<Trainer[]>(INITIAL_TRAINERS);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | TrainerStatus>("All");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedTrainer, setSelectedTrainer] =
    useState<Trainer | null>(null);

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const [form, setForm] =
    useState<TrainerForm>(EMPTY_FORM);

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredTrainers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return trainers.filter((trainer) => {
      const matchesSearch =
        !searchText ||
        trainer.name
          .toLowerCase()
          .includes(searchText) ||
        trainer.email
          .toLowerCase()
          .includes(searchText) ||
        trainer.id
          .toLowerCase()
          .includes(searchText) ||
        trainer.phone.includes(search) ||
        trainer.specialization
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        trainer.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [trainers, search, statusFilter]);

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const activeTrainers = trainers.filter(
    (trainer) =>
      trainer.status === "Active"
  ).length;

  const inactiveTrainers = trainers.filter(
    (trainer) =>
      trainer.status === "Inactive"
  ).length;

  const totalBatches = trainers.reduce(
    (total, trainer) =>
      total + trainer.batches,
    0
  );

  /* ==========================================================
     FORM
  ========================================================== */

  const updateForm = (
    field: keyof TrainerForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* ==========================================================
     CREATE TRAINER
  ========================================================== */

  const createTrainer = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter trainer name.");
      return;
    }

    if (!form.email.trim()) {
      alert("Please enter trainer email.");
      return;
    }

    if (!form.password.trim()) {
      alert("Please create a password.");
      return;
    }

    const newTrainer: Trainer = {
      id: `TR${String(
        trainers.length + 1
      ).padStart(3, "0")}`,

      name: form.name.trim(),

      email: form.email.trim(),

      phone: form.phone.trim(),

      specialization:
        form.specialization.trim(),

      experience:
        form.experience.trim(),

      batches: 0,

      joinedDate:
        new Date().toLocaleDateString(
          "en-IN"
        ),

      status: form.status,
    };

    setTrainers((current) => [
      ...current,
      newTrainer,
    ]);

    setForm(EMPTY_FORM);
    setShowAddModal(false);
  };

  /* ==========================================================
     EDIT TRAINER
  ========================================================== */

  const openEditModal = (
    trainer: Trainer
  ) => {
    setOpenMenuId(null);
    setSelectedTrainer(trainer);

    setForm({
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      specialization:
        trainer.specialization,
      experience:
        trainer.experience,
      password: "",
      status: trainer.status,
    });

    setShowEditModal(true);
  };

  const updateTrainer = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!selectedTrainer) {
      return;
    }

    if (!form.name.trim()) {
      alert("Please enter trainer name.");
      return;
    }

    setTrainers((current) =>
      current.map((trainer) =>
        trainer.id === selectedTrainer.id
          ? {
              ...trainer,
              name: form.name.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
              specialization:
                form.specialization.trim(),
              experience:
                form.experience.trim(),
              status: form.status,
            }
          : trainer
      )
    );

    setShowEditModal(false);
    setSelectedTrainer(null);
    setForm(EMPTY_FORM);
  };

  /* ==========================================================
     STATUS
  ========================================================== */

  const toggleStatus = (
    trainer: Trainer
  ) => {
    setOpenMenuId(null);

    setTrainers((current) =>
      current.map((item) =>
        item.id === trainer.id
          ? {
              ...item,
              status:
                item.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : item
      )
    );
  };

  /* ==========================================================
     VIEW
  ========================================================== */

  const openViewModal = (
    trainer: Trainer
  ) => {
    setOpenMenuId(null);
    setSelectedTrainer(trainer);
    setShowViewModal(true);
  };

  /* ==========================================================
     MORE MENU
  ========================================================== */

  const openMoreMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    trainerId: string
  ) => {
    const rect =
      e.currentTarget.getBoundingClientRect();

    const menuWidth = 235;
    const menuHeight = 170;
    const gap = 8;
    const padding = 12;

    let left =
      rect.right - menuWidth;

    if (left < padding) {
      left = padding;
    }

    if (
      left + menuWidth >
      window.innerWidth - padding
    ) {
      left =
        window.innerWidth -
        menuWidth -
        padding;
    }

    let top =
      rect.bottom + gap;

    if (
      top + menuHeight >
      window.innerHeight - padding
    ) {
      top =
        rect.top -
        menuHeight -
        gap;
    }

    if (top < padding) {
      top = padding;
    }

    setMenuPosition({
      top,
      left,
    });

    setOpenMenuId(
      openMenuId === trainerId
        ? null
        : trainerId
    );
  };

  /* ==========================================================
     MORE ACTIONS
  ========================================================== */

  const handleMoreAction = (
    action:
      | "reset-password"
      | "activity",
    trainer: Trainer
  ) => {
    setOpenMenuId(null);

    if (
      action === "reset-password"
    ) {
      alert(
        `Password reset for ${trainer.name} will be connected to the backend later.`
      );
      return;
    }

    alert(
      `Trainer activity for ${trainer.name} will be connected to the backend later.`
    );
  };

  /* ==========================================================
     CLOSE
  ========================================================== */

  const closeAll = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedTrainer(null);
    setOpenMenuId(null);
    setForm(EMPTY_FORM);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-500">
              Trainer Management
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#173B67] sm:text-3xl">
              Trainers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage trainers, specializations, batches and account status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowAddModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
          >
            <UserPlus size={18} />
            Add Trainer
          </button>
        </div>

        {/* ====================================================
            SUMMARY CARDS
        ==================================================== */}

        <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<Users size={21} />}
            value={trainers.length}
            title="Total Trainers"
            description="Trainers in the system"
          />

          <SummaryCard
            icon={
              <CheckCircle2 size={21} />
            }
            value={activeTrainers}
            title="Active Trainers"
            description="Currently active"
          />

          <SummaryCard
            icon={<XCircle size={21} />}
            value={inactiveTrainers}
            title="Inactive Trainers"
            description="Currently inactive"
          />

          <SummaryCard
            icon={
              <CalendarDays size={21} />
            }
            value={totalBatches}
            title="Assigned Batches"
            description="Across all trainers"
          />
        </div>

        {/* ====================================================
            TRAINER TABLE
        ==================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* SEARCH / FILTER */}

          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative w-full sm:max-w-xl">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by name, email, phone, ID or specialization..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "All"
                    | TrainerStatus
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="All">
                All Status
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>

          {/* TABLE */}

          {filteredTrainers.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                <Users
                  size={28}
                  className="text-orange-500"
                />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-[#173B67]">
                No trainers found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {search ||
                statusFilter !== "All"
                  ? "Try changing your search or status filter."
                  : 'Click "Add Trainer" to create the first trainer.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50">
                    <TableHeader>
                      Trainer
                    </TableHeader>

                    <TableHeader>
                      Trainer ID
                    </TableHeader>

                    <TableHeader>
                      Phone
                    </TableHeader>

                    <TableHeader>
                      Specialization
                    </TableHeader>

                    <TableHeader>
                      Experience
                    </TableHeader>

                    <TableHeader>
                      Batches
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    <TableHeader>
                      Actions
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {filteredTrainers.map(
                    (trainer) => (
                      <tr
                        key={trainer.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50/60"
                      >
                        {/* TRAINER */}

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                              <span className="text-sm font-bold">
                                {trainer.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800">
                                {trainer.name}
                              </p>

                              <p className="mt-1 max-w-[260px] truncate text-xs text-slate-500">
                                {trainer.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* ID */}

                        <TableCell>
                          <span className="font-semibold text-[#173B67]">
                            {trainer.id}
                          </span>
                        </TableCell>

                        {/* PHONE */}

                        <TableCell>
                          {trainer.phone ||
                            "Not provided"}
                        </TableCell>

                        {/* SPECIALIZATION */}

                        <TableCell>
                          <span className="inline-flex max-w-[190px] rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                            {trainer.specialization ||
                              "Not specified"}
                          </span>
                        </TableCell>

                        {/* EXPERIENCE */}

                        <TableCell>
                          {trainer.experience ||
                            "Not specified"}
                        </TableCell>

                        {/* BATCHES */}

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                              <CalendarDays
                                size={15}
                              />
                            </span>

                            <span className="font-medium">
                              {trainer.batches}
                            </span>
                          </div>
                        </TableCell>

                        {/* STATUS */}

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              trainer.status ===
                              "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {trainer.status}
                          </span>
                        </TableCell>

                        {/* ACTIONS */}

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <ActionButton
                              title="View trainer"
                              onClick={() =>
                                openViewModal(
                                  trainer
                                )
                              }
                            >
                              <Eye size={16} />
                            </ActionButton>

                            <ActionButton
                              title="Edit trainer"
                              onClick={() =>
                                openEditModal(
                                  trainer
                                )
                              }
                            >
                              <Pencil size={16} />
                            </ActionButton>

                            <ActionButton
                              title={
                                trainer.status ===
                                "Active"
                                  ? "Deactivate trainer"
                                  : "Activate trainer"
                              }
                              onClick={() =>
                                toggleStatus(
                                  trainer
                                )
                              }
                            >
                              {trainer.status ===
                              "Active" ? (
                                <UserX
                                  size={16}
                                />
                              ) : (
                                <UserCheck
                                  size={16}
                                />
                              )}
                            </ActionButton>

                            <ActionButton
                              title="More actions"
                              onClick={(e) =>
                                openMoreMenu(
                                  e,
                                  trainer.id
                                )
                              }
                            >
                              <MoreVertical
                                size={16}
                              />
                            </ActionButton>
                          </div>
                        </TableCell>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ====================================================
            DEVELOPMENT NOTICE
        ==================================================== */}

        <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
          <p className="text-xs font-semibold text-orange-800">
            Development Mode
          </p>

          <p className="mt-1 text-xs leading-5 text-orange-700/80">
            Trainer records are currently stored in frontend state.
            Trainer authentication, permanent storage, batch
            assignments and activity history will be connected
            when the backend is implemented.
          </p>
        </div>
      </div>

      {/* ======================================================
          FLOATING MORE MENU
      ====================================================== */}

      {openMenuId && (
        <div
          className="fixed z-[99999] w-[235px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          {(() => {
            const trainer =
              trainers.find(
                (item) =>
                  item.id === openMenuId
              );

            if (!trainer) {
              return null;
            }

            return (
              <>
                <MoreMenuItem
                  icon={
                    <KeyRound size={17} />
                  }
                  label="Reset Password"
                  onClick={() =>
                    handleMoreAction(
                      "reset-password",
                      trainer
                    )
                  }
                />

                <MoreMenuItem
                  icon={
                    <Activity size={17} />
                  }
                  label="View Trainer Activity"
                  onClick={() =>
                    handleMoreAction(
                      "activity",
                      trainer
                    )
                  }
                />

                <MoreMenuItem
                  icon={
                    trainer.status ===
                    "Active" ? (
                      <XCircle size={17} />
                    ) : (
                      <CheckCircle2
                        size={17}
                      />
                    )
                  }
                  label={
                    trainer.status ===
                    "Active"
                      ? "Deactivate Trainer"
                      : "Activate Trainer"
                  }
                  onClick={() =>
                    toggleStatus(
                      trainer
                    )
                  }
                />
              </>
            );
          })()}
        </div>
      )}

      {/* ======================================================
          ADD TRAINER
      ====================================================== */}

      {showAddModal && (
        <TrainerFormModal
          title="Add New Trainer"
          subtitle="Create a trainer account for SKCE."
          form={form}
          setForm={setForm}
          onClose={closeAll}
          onSubmit={createTrainer}
          submitLabel="Create Trainer"
        />
      )}

      {/* ======================================================
          EDIT TRAINER
      ====================================================== */}

      {showEditModal && (
        <TrainerFormModal
          title="Edit Trainer"
          subtitle="Update trainer information and account status."
          form={form}
          setForm={setForm}
          onClose={closeAll}
          onSubmit={updateTrainer}
          submitLabel="Save Changes"
          isEdit
        />
      )}

      {/* ======================================================
          VIEW TRAINER
      ====================================================== */}

      {showViewModal &&
        selectedTrainer && (
          <ModalOverlay onClose={closeAll}>
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              <ModalHeader
                title="Trainer Details"
                subtitle="Complete trainer information."
                onClose={closeAll}
              />

              <div className="p-6">

                {/* PROFILE HEADER */}

                <div className="mb-6 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    <span className="text-lg font-bold">
                      {selectedTrainer.name
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#173B67]">
                      {
                        selectedTrainer.name
                      }
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {
                        selectedTrainer.id
                      }
                    </p>
                  </div>

                  <span
                    className={`ml-auto shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedTrainer.status ===
                      "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {
                      selectedTrainer.status
                    }
                  </span>
                </div>

                {/* DETAILS */}

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailBox
                    label="Full Name"
                    value={
                      selectedTrainer.name
                    }
                  />

                  <DetailBox
                    label="Trainer ID"
                    value={
                      selectedTrainer.id
                    }
                  />

                  <DetailBox
                    label="Email"
                    value={
                      selectedTrainer.email
                    }
                  />

                  <DetailBox
                    label="Phone"
                    value={
                      selectedTrainer.phone ||
                      "Not provided"
                    }
                  />

                  <DetailBox
                    label="Specialization"
                    value={
                      selectedTrainer.specialization ||
                      "Not specified"
                    }
                  />

                  <DetailBox
                    label="Experience"
                    value={
                      selectedTrainer.experience ||
                      "Not specified"
                    }
                  />

                  <DetailBox
                    label="Assigned Batches"
                    value={String(
                      selectedTrainer.batches
                    )}
                  />

                  <DetailBox
                    label="Joined Date"
                    value={
                      selectedTrainer.joinedDate
                    }
                  />
                </div>

                {/* ACCOUNT INFO */}

                <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <Award
                      size={18}
                      className="text-orange-500"
                    />

                    <p className="text-sm font-semibold text-[#173B67]">
                      Trainer Account
                    </p>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Login credentials and trainer activity
                    will be connected to the backend when
                    trainer authentication is implemented.
                  </p>
                </div>
              </div>

              <ModalFooter
                onClose={closeAll}
              />
            </div>
          </ModalOverlay>
        )}
    </main>
  );
}

/* ============================================================
   TRAINER FORM MODAL
============================================================ */

function TrainerFormModal({
  title,
  subtitle,
  form,
  setForm,
  onClose,
  onSubmit,
  submitLabel,
  isEdit = false,
}: {
  title: string;
  subtitle: string;
  form: TrainerForm;
  setForm: React.Dispatch<
    React.SetStateAction<TrainerForm>
  >;
  onClose: () => void;
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>
  ) => void;
  submitLabel: string;
  isEdit?: boolean;
}) {
  const updateForm = (
    field: keyof TrainerForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <ModalHeader
          title={title}
          subtitle={subtitle}
          onClose={onClose}
        />

        <form onSubmit={onSubmit}>
          <div className="grid gap-5 p-6 sm:grid-cols-2">

            <FormField
              label="Full Name"
              required
              value={form.name}
              onChange={(value) =>
                updateForm(
                  "name",
                  value
                )
              }
              placeholder="Enter trainer name"
            />

            <FormField
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(value) =>
                updateForm(
                  "email",
                  value
                )
              }
              placeholder="trainer@skce.in"
            />

            <FormField
              label="Phone"
              value={form.phone}
              onChange={(value) =>
                updateForm(
                  "phone",
                  value
                )
              }
              placeholder="Enter phone number"
            />

            <FormField
              label="Experience"
              value={form.experience}
              onChange={(value) =>
                updateForm(
                  "experience",
                  value
                )
              }
              placeholder="Example: 5 Years"
            />

            <div className="sm:col-span-2">
              <FormField
                label="Specialization"
                value={
                  form.specialization
                }
                onChange={(value) =>
                  updateForm(
                    "specialization",
                    value
                  )
                }
                placeholder="Example: Java, Python, MS Office"
              />
            </div>

            <FormField
              label={
                isEdit
                  ? "New Password"
                  : "Password"
              }
              type="password"
              required={!isEdit}
              value={form.password}
              onChange={(value) =>
                updateForm(
                  "password",
                  value
                )
              }
              placeholder={
                isEdit
                  ? "Leave blank to keep current password"
                  : "Create login password"
              }
            />

            {/* STATUS */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                value={form.status}
                onChange={(e) =>
                  updateForm(
                    "status",
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              {isEdit ? (
                <Save size={17} />
              ) : (
                <UserPlus size={17} />
              )}

              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

/* ============================================================
   MODAL OVERLAY
============================================================ */

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (
          e.target ===
          e.currentTarget
        ) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   MODAL HEADER
============================================================ */

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
      <div>
        <h2 className="text-xl font-bold text-[#173B67]">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-orange-50 hover:text-orange-500"
      >
        <X size={18} />
      </button>
    </div>
  );
}

/* ============================================================
   MODAL FOOTER
============================================================ */

function ModalFooter({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="flex justify-end border-t border-slate-100 px-6 py-4">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      >
        Close
      </button>
    </div>
  );
}

/* ============================================================
   DETAIL BOX
============================================================ */

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  icon,
  value,
  title,
  description,
}: {
  icon: React.ReactNode;
  value: number;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-[#173B67]">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TABLE HEADER
============================================================ */

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </th>
  );
}

/* ============================================================
   TABLE CELL
============================================================ */

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-4 py-4 text-sm text-slate-600">
      {children}
    </td>
  );
}

/* ============================================================
   ACTION BUTTON
============================================================ */

function ActionButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
    >
      {children}
    </button>
  );
}

/* ============================================================
   MORE MENU ITEM
============================================================ */

function MoreMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-600"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}