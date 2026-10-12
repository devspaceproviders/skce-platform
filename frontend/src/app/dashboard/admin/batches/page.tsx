"use client";



import { useEffect, useMemo, useState } from "react";

import { createPortal } from "react-dom";

import {


  Plus,

  MoreVertical,

  Eye,

  Pencil,

  Users,

  UserCog,

  CheckCircle2,

  Clock3,

  XCircle,

  CalendarDays,

  X,

  Save,

  UserPlus,

  Trash2,

  Loader2,

  AlertCircle,

} from "lucide-react";



const API_URL =

  process.env.NEXT_PUBLIC_API_URL ||

  "http://localhost:5000/api";



type BatchStatus =

  | "Upcoming"

  | "Active"

  | "Completed"

  | "Inactive";



type BatchMode =

  | "Online"

  | "Offline"

  | "Hybrid";



type CourseOption = {

  id: number;

  slug: string;

  title: string;

};



type TrainerOption = {

  id: number;

  userId: number;

  name: string;

  email: string;

  isActive: boolean;

};



type StudentOption = {

  id: number;

  studentId: string;

  name: string;

  email: string;

  phone: string | null;

  isActive: boolean;

};



type Batch = {

  id: number;

  displayId: string;

  name: string;

  courseId: number;

  trainerId: number | null;

  startDate: string;

  endDate: string;

  mode: string;

  maxStudents: number;

  status: string;

  course: CourseOption | null;

  trainer: TrainerOption | null;

  studentCount: number;

};



type BatchColumnFilters = {
  name: string;
  id: string;
  course: string;
  trainer: string;
  students: string;
  schedule: string;
  mode: string;
  status: string;
};

const EMPTY_BATCH_FILTERS: BatchColumnFilters = {
  name: "All",
  id: "All",
  course: "All",
  trainer: "All",
  students: "All",
  schedule: "All",
  mode: "All",
  status: "All",
};

type BatchStudent = {

  id: number;

  studentId: number;

  assignedAt: string;

  completedAt: string | null;

  student: StudentOption | null;

};



type BatchForm = {

  name: string;

  courseId: string;

  trainerId: string;

  startDate: string;

  endDate: string;

  mode: BatchMode;

  maxStudents: string;

  status: BatchStatus;

};



type ModalType =

  | "add"

  | "edit"

  | "view"

  | "students"

  | null;



const EMPTY_FORM: BatchForm = {

  name: "",

  courseId: "",

  trainerId: "",

  startDate: "",

  endDate: "",

  mode: "Offline",

  maxStudents: "30",

  status: "Upcoming",

};



function getToken() {

  if (typeof window === "undefined") {

    return null;

  }



  return localStorage.getItem("token");

}



function backendModeToUi(

  mode: string

): BatchMode {

  switch (mode?.toUpperCase()) {

    case "ONLINE":

      return "Online";



    case "HYBRID":

      return "Hybrid";



    default:

      return "Offline";

  }

}



function uiModeToBackend(

  mode: BatchMode

) {

  return mode.toUpperCase();

}



function backendStatusToUi(

  status: string

): BatchStatus {

  switch (status?.toUpperCase()) {

    case "ACTIVE":

      return "Active";



    case "COMPLETED":

      return "Completed";



    case "INACTIVE":

      return "Inactive";



    default:

      return "Upcoming";

  }

}



function uiStatusToBackend(

  status: BatchStatus

) {

  return status.toUpperCase();

}



function formatDate(

  value: string

) {

  if (!value) {

    return "Not set";

  }



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) {

    return value;

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



function dateForInput(

  value: string

) {

  if (!value) {

    return "";

  }



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) {

    return value.slice(0, 10);

  }



  const year =

    date.getFullYear();



  const month = String(

    date.getMonth() + 1

  ).padStart(2, "0");



  const day = String(

    date.getDate()

  ).padStart(2, "0");



  return `${year}-${month}-${day}`;

}



export default function BatchesPage() {

  const [

    batches,

    setBatches,

  ] = useState<Batch[]>([]);



  const [

    courses,

    setCourses,

  ] = useState<CourseOption[]>([]);



  const [

    trainers,

    setTrainers,

  ] = useState<TrainerOption[]>([]);



  const [

    students,

    setStudents,

  ] = useState<StudentOption[]>([]);



  const [

    batchStudents,

    setBatchStudents,

  ] = useState<BatchStudent[]>([]);



  const [columnFilters, setColumnFilters] =
    useState<BatchColumnFilters>(EMPTY_BATCH_FILTERS);



  const [

    modal,

    setModal,

  ] = useState<ModalType>(null);



  const [

    selected,

    setSelected,

  ] = useState<Batch | null>(

    null

  );



  const [

    menu,

    setMenu,

  ] = useState<number | null>(

    null

  );



  const [

    menuPosition,

    setMenuPosition,

  ] = useState<{

    top: number;

    left: number;

  } | null>(null);



  const [

    form,

    setForm,

  ] = useState<BatchForm>(

    EMPTY_FORM

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

    error,

    setError,

  ] = useState("");



  const [

    studentLoading,

    setStudentLoading,

  ] = useState(false);



  const [

    studentSaving,

    setStudentSaving,

  ] = useState(false);



  const [

    selectedStudentId,

    setSelectedStudentId,

  ] = useState("");



  async function apiFetch(

    path: string,

    options: RequestInit = {}

  ) {

    const token = getToken();



    if (!token) {

      throw new Error(

        "Authentication token not found. Please log in again."

      );

    }



    const headers = new Headers(

      options.headers

    );



    headers.set(

      "Authorization",

      `Bearer ${token}`

    );



    if (

      options.body &&

      !headers.has(

        "Content-Type"

      )

    ) {

      headers.set(

        "Content-Type",

        "application/json"

      );

    }



    const response =

      await fetch(

        `${API_URL}${path}`,

        {

          ...options,

          headers,

        }

      );



    const result =

      await response.json();



    if (

      response.status === 401 ||

      response.status === 403

    ) {

      throw new Error(

        result?.message ||

          "You are not authorized to perform this action."

      );

    }



    if (!response.ok) {

      throw new Error(

        result?.message ||

          "Request failed."

      );

    }



    return result;

  }



  async function loadData() {

    try {

      setLoading(true);

      setError("");



      const [

        batchResult,

        optionsResult,

      ] = await Promise.all([

        apiFetch(

          "/admin/batches"

        ),

        apiFetch(

          "/admin/batches/options"

        ),

      ]);



      const batchData =

        Array.isArray(

          batchResult?.data

        )

          ? batchResult.data

          : [];



      setBatches(

        batchData.map(

          (batch: any) => ({

            ...batch,

            studentCount:

              Number(

                batch.studentCount || 0

              ),

          })

        )

      );



      setCourses(

        Array.isArray(

          optionsResult?.data

            ?.courses

        )

          ? optionsResult.data.courses

          : []

      );



      setTrainers(

        Array.isArray(

          optionsResult?.data

            ?.trainers

        )

          ? optionsResult.data.trainers

          : []

      );



      setStudents(

        Array.isArray(

          optionsResult?.data

            ?.students

        )

          ? optionsResult.data.students

          : []

      );

    } catch (err) {

      console.error(

        "Load admin batches error:",

        err

      );



      setError(

        err instanceof Error

          ? err.message

          : "Unable to load batches."

      );

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    loadData();

  }, []);



  const uniqueOptions = (values: Array<string | number | null | undefined>) =>
    Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  const nameOptions = uniqueOptions(batches.map((batch) => batch.name));
  const idOptions = uniqueOptions(batches.map((batch) => batch.displayId));
  const courseOptions = uniqueOptions(batches.map((batch) => batch.course?.title || "Not assigned"));
  const trainerOptions = uniqueOptions(batches.map((batch) => batch.trainer?.name || "Not assigned"));
  const studentOptions = uniqueOptions(batches.map((batch) => batch.studentCount));
  const scheduleOptions = uniqueOptions(batches.map((batch) => {
    if (!batch.startDate) return "Not set";
    const date = new Date(batch.startDate);
    return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }));
  const modeOptions = uniqueOptions(batches.map((batch) => backendModeToUi(batch.mode)));
  const statusOptions = ["Upcoming", "Active", "Completed", "Inactive"];

  const filtered = useMemo(
    () => batches.filter((batch) => {
      const status = backendStatusToUi(batch.status);
      const course = batch.course?.title || "Not assigned";
      const trainer = batch.trainer?.name || "Not assigned";
      const mode = backendModeToUi(batch.mode);
      const studentCount = String(batch.studentCount ?? 0);
      const schedule = (() => {
        if (!batch.startDate) return "Not set";
        const date = new Date(batch.startDate);
        return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      })();

      return (
        (columnFilters.name === "All" || batch.name === columnFilters.name) &&
        (columnFilters.id === "All" || batch.displayId === columnFilters.id) &&
        (columnFilters.course === "All" || course === columnFilters.course) &&
        (columnFilters.trainer === "All" || trainer === columnFilters.trainer) &&
        (columnFilters.students === "All" || studentCount === columnFilters.students) &&
        (columnFilters.schedule === "All" || schedule === columnFilters.schedule) &&
        (columnFilters.mode === "All" || mode === columnFilters.mode) &&
        (columnFilters.status === "All" || status === columnFilters.status)
      );
    }),
    [batches, columnFilters]
  );

  const hasActiveFilters = Object.values(columnFilters).some((value) => value !== "All");

  function clearColumnFilters() {
    setColumnFilters(EMPTY_BATCH_FILTERS);
  }

  const upcoming =

    batches.filter(

      (batch) =>

        backendStatusToUi(

          batch.status

        ) === "Upcoming"

    ).length;



  const active =

    batches.filter(

      (batch) =>

        backendStatusToUi(

          batch.status

        ) === "Active"

    ).length;



  const completed =

    batches.filter(

      (batch) =>

        backendStatusToUi(

          batch.status

        ) === "Completed"

    ).length;



  function close() {

    setModal(null);

    setSelected(null);

    setMenu(null);

    setMenuPosition(null);

    setBatchStudents([]);

    setSelectedStudentId("");

    setForm(

      EMPTY_FORM

    );

  }



  function toggleMenu(

    event: React.MouseEvent<HTMLButtonElement>,

    batchId: number

  ) {

    if (menu === batchId) {

      setMenu(null);

      setMenuPosition(null);

      return;

    }



    const rect =

      event.currentTarget.getBoundingClientRect();



    const menuWidth = 224;

    const menuHeight = 190;

    const gap = 8;

    const viewportPadding = 8;



    const spaceBelow =

      window.innerHeight - rect.bottom;



    const top =

      spaceBelow >= menuHeight + gap

        ? rect.bottom + gap

        : Math.max(

            viewportPadding,

            rect.top - menuHeight - gap

          );



    const left = Math.min(

      Math.max(

        viewportPadding,

        rect.right - menuWidth

      ),

      Math.max(

        viewportPadding,

        window.innerWidth -

          menuWidth -

          viewportPadding

      )

    );



    setMenu(batchId);

    setMenuPosition({

      top,

      left,

    });

  }



  useEffect(() => {

    if (menu === null) {

      return;

    }



    function handleOutsideClick(

      event: MouseEvent

    ) {

      const target = event.target;



      if (

        target instanceof Element &&

        target.closest(

          "[data-batch-menu], [data-batch-menu-trigger]"

        )

      ) {

        return;

      }



      setMenu(null);

      setMenuPosition(null);

    }



    function handleViewportChange() {

      setMenu(null);

      setMenuPosition(null);

    }



    document.addEventListener(

      "mousedown",

      handleOutsideClick

    );

    window.addEventListener(

      "resize",

      handleViewportChange

    );

    window.addEventListener(

      "scroll",

      handleViewportChange,

      true

    );



    return () => {

      document.removeEventListener(

        "mousedown",

        handleOutsideClick

      );

      window.removeEventListener(

        "resize",

        handleViewportChange

      );

      window.removeEventListener(

        "scroll",

        handleViewportChange,

        true

      );

    };

  }, [menu]);



  function openAdd() {

    setForm(

      EMPTY_FORM

    );

    setSelected(null);

    setModal("add");

  }



  function openEdit(

    batch: Batch

  ) {

    setSelected(batch);



    setForm({

      name: batch.name,

      courseId:

        String(

          batch.courseId

        ),

      trainerId:

        batch.trainerId

          ? String(

              batch.trainerId

            )

          : "",

      startDate:

        dateForInput(

          batch.startDate

        ),

      endDate:

        dateForInput(

          batch.endDate

        ),

      mode:

        backendModeToUi(

          batch.mode

        ),

      maxStudents:

        String(

          batch.maxStudents

        ),

      status:

        backendStatusToUi(

          batch.status

        ),

    });



    setMenu(null);

    setModal("edit");

  }



  async function createBatch(

    e: React.FormEvent<HTMLFormElement>

  ) {

    e.preventDefault();



    if (!form.name.trim()) {

      alert(

        "Please enter batch name."

      );

      return;

    }



    if (!form.courseId) {

      alert(

        "Please select a course."

      );

      return;

    }



    if (!form.startDate) {

      alert(

        "Please select a start date."

      );

      return;

    }



    if (!form.endDate) {

      alert(

        "Please select an end date."

      );

      return;

    }



    const maxStudents =

      Number(

        form.maxStudents

      );



    if (

      !Number.isInteger(

        maxStudents

      ) ||

      maxStudents <= 0

    ) {

      alert(

        "Maximum students must be a positive number."

      );

      return;

    }



    try {

      setSaving(true);

      setError("");



      await apiFetch(

        "/admin/batches",

        {

          method: "POST",

          body: JSON.stringify({

            name:

              form.name.trim(),

            courseId:

              Number(

                form.courseId

              ),

            trainerId:

              form.trainerId

                ? Number(

                    form.trainerId

                  )

                : null,

            startDate:

              form.startDate,

            endDate:

              form.endDate,

            mode:

              uiModeToBackend(

                form.mode

              ),

            maxStudents,

            status:

              uiStatusToBackend(

                form.status

              ),

          }),

        }

      );



      close();



      await loadData();

    } catch (err) {

      console.error(

        "Create batch error:",

        err

      );



      setError(

        err instanceof Error

          ? err.message

          : "Unable to create batch."

      );

    } finally {

      setSaving(false);

    }

  }



  async function updateBatch(

    e: React.FormEvent<HTMLFormElement>

  ) {

    e.preventDefault();



    if (!selected) {

      return;

    }



    if (!form.name.trim()) {

      alert(

        "Please enter batch name."

      );

      return;

    }



    if (!form.courseId) {

      alert(

        "Please select a course."

      );

      return;

    }



    if (!form.startDate) {

      alert(

        "Please select a start date."

      );

      return;

    }



    if (!form.endDate) {

      alert(

        "Please select an end date."

      );

      return;

    }



    const maxStudents =

      Number(

        form.maxStudents

      );



    if (

      !Number.isInteger(

        maxStudents

      ) ||

      maxStudents <= 0

    ) {

      alert(

        "Maximum students must be a positive number."

      );

      return;

    }



    try {

      setSaving(true);

      setError("");



      await apiFetch(

        `/admin/batches/${selected.id}`,

        {

          method: "PATCH",

          body: JSON.stringify({

            name:

              form.name.trim(),

            courseId:

              Number(

                form.courseId

              ),

            trainerId:

              form.trainerId

                ? Number(

                    form.trainerId

                  )

                : null,

            startDate:

              form.startDate,

            endDate:

              form.endDate,

            mode:

              uiModeToBackend(

                form.mode

              ),

            maxStudents,

            status:

              uiStatusToBackend(

                form.status

              ),

          }),

        }

      );



      close();



      await loadData();

    } catch (err) {

      console.error(

        "Update batch error:",

        err

      );



      setError(

        err instanceof Error

          ? err.message

          : "Unable to update batch."

      );

    } finally {

      setSaving(false);

    }

  }



  async function toggleBatch(

    batch: Batch

  ) {

    setMenu(null);



    const currentStatus =

      backendStatusToUi(

        batch.status

      );



    const nextStatus =

      currentStatus ===

      "Inactive"

        ? "Active"

        : "Inactive";



    try {

      setSaving(true);

      setError("");



      await apiFetch(

        `/admin/batches/${batch.id}`,

        {

          method: "PATCH",

          body: JSON.stringify({

            status:

              uiStatusToBackend(

                nextStatus

              ),

          }),

        }

      );



      await loadData();

    } catch (err) {

      console.error(

        "Toggle batch error:",

        err

      );



      setError(

        err instanceof Error

          ? err.message

          : "Unable to update batch."

      );

    } finally {

      setSaving(false);

    }

  }



  async function deleteBatch(

    batch: Batch

  ) {

    setMenu(null);



    const confirmed =

      window.confirm(

        `Are you sure you want to delete "${batch.name}"?`

      );



    if (!confirmed) {

      return;

    }



    try {

      setSaving(true);

      setError("");



      await apiFetch(

        `/admin/batches/${batch.id}`,

        {

          method: "DELETE",

        }

      );



      await loadData();

    } catch (err) {

      console.error(

        "Delete batch error:",

        err

      );



      setError(

        err instanceof Error

          ? err.message

          : "Unable to delete batch."

      );

    } finally {

      setSaving(false);

    }

  }



  async function openStudents(

    batch: Batch

  ) {

    setSelected(batch);

    setMenu(null);

    setModal("students");

    setStudentLoading(true);

    setBatchStudents([]);

    setSelectedStudentId("");



    try {

      const result =

        await apiFetch(

          `/admin/batches/${batch.id}/students`

        );



      setBatchStudents(

        Array.isArray(

          result?.data

        )

          ? result.data

          : []

      );

    } catch (err) {

      console.error(

        "Load batch students error:",

        err

      );



      setError(

        err instanceof Error

          ? err.message

          : "Unable to load batch students."

      );

    } finally {

      setStudentLoading(false);

    }

  }



  async function addStudent() {

    if (

      !selected ||

      !selectedStudentId

    ) {

      return;

    }



    try {

      setStudentSaving(true);

      setError("");



      await apiFetch(

        `/admin/batches/${selected.id}/students`,

        {

          method: "POST",

          body: JSON.stringify({

            studentId:

              Number(

                selectedStudentId

              ),

          }),

        }

      );



      setSelectedStudentId("");



      await openStudents(

        selected

      );



      await loadData();

    } catch (err) {

      console.error(

        "Add student error:",

        err

      );



      setError(

        err instanceof Error

          ? err.message

          : "Unable to assign student."

      );

    } finally {

      setStudentSaving(false);

    }

  }



  async function removeStudent(

    studentProfileId: number

  ) {

    if (!selected) {

      return;

    }



    const confirmed =

      window.confirm(

        "Remove this student from the batch?"

      );



    if (!confirmed) {

      return;

    }



    try {

      setStudentSaving(true);

      setError("");



      await apiFetch(

        `/admin/batches/${selected.id}/students/${studentProfileId}`,

        {

          method: "DELETE",

        }

      );



      await openStudents(

        selected

      );



      await loadData();

    } catch (err) {

      console.error(

        "Remove student error:",

        err

      );



      setError(

        err instanceof Error

          ? err.message

          : "Unable to remove student."

      );

    } finally {

      setStudentSaving(false);

    }

  }



  const assignedStudentIds =

    new Set(

      batchStudents.map(

        (item) =>

          item.studentId

      )

    );



  const availableStudents =

    students.filter(

      (student) =>

        !assignedStudentIds.has(

          student.id

        )

    );



  return (

    <main className="min-h-screen bg-[#F4F7FB] p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-[1600px]">

        {/* SKCE branded hero banner */}
        <header className="relative isolate mb-6 overflow-hidden rounded-[26px] border border-[#244B78] bg-gradient-to-r from-[#102E52] via-[#173B67] to-[#28527F] px-5 py-5 text-white shadow-[0_16px_36px_-22px_rgba(23,59,103,0.65)] sm:px-7 sm:py-6">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-28 h-72 w-72 rounded-full border border-[#F59E0B]/30" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-20 h-56 w-56 rounded-full border-[18px] border-white/[0.035]" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-1 w-44 bg-gradient-to-r from-[#F97316] via-[#FDBA32] to-transparent" />
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
            
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#FDBA32]/25 bg-[#FDBA32]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#FDBA32]">
                  <CalendarDays size={13} />
                  Administration Portal <span className="text-white/40">·</span> Batch Management
                </div>
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">Batches</h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-5 text-blue-100/90 sm:text-[15px]">
                  Manage course batches, trainers, students and schedules in one place.
                </p>
              </div>
            </div>
            <button
              onClick={openAdd}
              className="relative z-10 inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-[#FDBA32]/50 bg-gradient-to-r from-[#F97316] to-[#FB8500] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-[#EA580C] hover:to-[#F97316] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-300/30 md:self-center"
            >
              <Plus size={18} />
              Add Batch
            </button>
          </div>
        </header>



        {/* Error */}

        {error && (

          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <AlertCircle

              className="mt-0.5 shrink-0"

              size={18}

            />



            <div>

              <p className="font-semibold">

                Batch operation failed

              </p>



              <p className="mt-1">

                {error}

              </p>

            </div>



            <button

              onClick={() =>

                setError("")

              }

              className="ml-auto rounded p-1 hover:bg-red-100"

            >

              <X size={16} />

            </button>

          </div>

        )}



        {/* Summary */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <Summary

            icon={

              <Users size={20} />

            }

            title="Total Batches"

            value={

              batches.length

            }

          />



          <Summary

            icon={

              <Clock3 size={20} />

            }

            title="Upcoming Batches"

            value={upcoming}

          />



          <Summary

            icon={

              <CheckCircle2

                size={20}

              />

            }

            title="Active Batches"

            value={active}

          />



          <Summary

            icon={

              <XCircle size={20} />

            }

            title="Completed Batches"

            value={completed}

          />

        </div>



        {/* Batch table */}

        <section className="overflow-visible rounded-2xl border border-[#D6E2F0] bg-white shadow-[0_8px_24px_-20px_rgba(23,59,103,0.5)] transition-shadow duration-200 hover:shadow-lg">

          <div className="flex flex-col gap-3 border-b border-[#E2EAF4] bg-gradient-to-r from-[#F7FAFE] via-white to-orange-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#173B67]">Filter batches</p>
              <p className="mt-0.5 text-xs text-slate-500">Choose a value under each column to filter the table instantly.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Showing <strong className="text-[#173B67]">{filtered.length}</strong> of <strong className="text-[#173B67]">{batches.length}</strong></span>
              <button type="button" onClick={clearColumnFilters} disabled={!hasActiveFilters}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D7E2EF] bg-white px-4 text-xs font-semibold text-[#456384] transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-45">
                Clear Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] text-sm">

              <thead className="bg-gradient-to-r from-[#EEF4FB] via-[#F7FAFE] to-[#FFF7ED]">

                <tr>

                  {[

                    "Batch",

                    "Batch ID",

                    "Course",

                    "Trainer",

                    "Students",

                    "Schedule",

                    "Mode",

                    "Status",

                    "Actions",

                  ].map(

                    (heading) => (

                      <th

                        key={heading}

                        className="border-b border-[#DCE6F2] px-4 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.09em] text-[#456384]"

                      >

                        {heading}

                      </th>

                    )

                  )}

                </tr>
                <tr className="bg-white">
                  {[
                    { key: "name", label: "Batch", options: nameOptions },
                    { key: "id", label: "Batch ID", options: idOptions },
                    { key: "course", label: "Course", options: courseOptions },
                    { key: "trainer", label: "Trainer", options: trainerOptions },
                    { key: "students", label: "Students", options: studentOptions },
                    { key: "schedule", label: "Schedule", options: scheduleOptions },
                    { key: "mode", label: "Mode", options: modeOptions },
                    { key: "status", label: "Status", options: statusOptions },
                    { key: "actions", label: "Actions", options: [] },
                  ].map((filter) => (
                    <th key={filter.key} className="border-b border-[#DCE6F2] px-3 py-2 align-top">
                      {filter.key === "actions" ? <span className="sr-only">No filter for actions</span> : (
                        <select
                          aria-label={`Filter by ${filter.label}`}
                          value={columnFilters[filter.key as keyof BatchColumnFilters]}
                          onChange={(event) => setColumnFilters((current) => ({ ...current, [filter.key as keyof BatchColumnFilters]: event.target.value }))}
                          className="h-9 w-full min-w-[90px] cursor-pointer rounded-lg border border-[#D7E2EF] bg-[#F8FAFD] px-2 text-xs font-medium text-[#173B67] outline-none transition hover:border-[#A8BDD5] focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-orange-100"
                        >
                          <option value="All">{filter.key === "id" ? "All IDs" : filter.key === "students" ? "All Counts" : filter.key === "schedule" ? "All Dates" : filter.key === "mode" ? "All Modes" : filter.key === "status" ? "All Statuses" : filter.key === "course" ? "All Courses" : filter.key === "trainer" ? "All Trainers" : "All Batches"}</option>
                          {filter.options.map((option) => <option key={option} value={option}>{filter.key === "students" ? `${option} assigned` : option}</option>)}
                        </select>
                      )}
                    </th>
                  ))}
                </tr>


              </thead>



              <tbody>

                {loading ? (

                  <tr>

                    <td

                      colSpan={9}

                      className="px-5 py-20 text-center"

                    >

                      <Loader2

                        className="mx-auto animate-spin text-orange-500"

                        size={30}

                      />



                      <p className="mt-3 text-sm text-slate-500">

                        Loading batches...

                      </p>

                    </td>

                  </tr>

                ) : filtered.length ===

                  0 ? (

                  <tr>

                    <td

                      colSpan={9}

                      className="px-5 py-20 text-center"

                    >

                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">

                        <CalendarDays

                          size={27}

                        />

                      </div>



                      <h3 className="text-lg font-semibold text-slate-800">

                        No batches found

                      </h3>



                      <p className="relative z-10 mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">

                        Click “Add Batch” to

                        create the first batch.

                      </p>

                    </td>

                  </tr>

                ) : (

                  filtered.map(

                    (batch) => {

                      const status =

                        backendStatusToUi(

                          batch.status

                        );



                      return (

                        <tr

                          key={

                            batch.id

                          }

                          className="transition-colors duration-150 hover:bg-orange-50/40"

                        >

                          <td className="border-b border-slate-100 px-4 py-4 font-bold text-[#173B67]">

                            {

                              batch.name

                            }

                          </td>



                          <td className="border-b border-slate-100 px-4 py-4 text-sm font-medium text-slate-500">

                            {

                              batch.displayId

                            }

                          </td>



                          <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">

                            {

                              batch.course

                                ?.title ||

                              "Course not available"

                            }

                          </td>



                          <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">

                            {

                              batch.trainer

                                ?.name ||

                              "Not Assigned"

                            }

                          </td>



                          <td className="border-b border-slate-100 px-4 py-4 text-sm font-bold text-slate-700">

                            {

                              batch.studentCount

                            }{" "}

                            /{" "}

                            {

                              batch.maxStudents

                            }

                          </td>



                          <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">

                            {formatDate(

                              batch.startDate

                            )}



                            <div className="mt-1 text-xs text-slate-400">

                              to{" "}

                              {formatDate(

                                batch.endDate

                              )}

                            </div>

                          </td>



                          <td className="border-b border-slate-100 px-4 py-4">

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">

                              {backendModeToUi(

                                batch.mode

                              )}

                            </span>

                          </td>



                          <td className="border-b border-slate-100 px-4 py-4">

                            <Status

                              status={

                                status

                              }

                            />

                          </td>



                          <td className="relative border-b border-slate-100 px-4 py-4">

                            <div className="flex gap-1.5">

                              <Action

                                title="View"

                                onClick={() => {

                                  setSelected(

                                    batch

                                  );

                                  setModal(

                                    "view"

                                  );

                                }}

                              >

                                <Eye

                                  size={16}

                                />

                              </Action>



                              <Action

                                title="Edit"

                                onClick={() =>

                                  openEdit(

                                    batch

                                  )

                                }

                              >

                                <Pencil

                                  size={16}

                                />

                              </Action>



                              <Action

                                title="More"

                                dataMenuTrigger

                                onClick={(event) =>

                                  toggleMenu(

                                    event,

                                    batch.id

                                  )

                                }

                              >

                                <MoreVertical

                                  size={16}

                                />

                              </Action>

                            </div>

                          </td>

                        </tr>

                      );

                    }

                  )

                )}

              </tbody>

            </table>

          </div>

        </section>



        {menu !== null &&

          menuPosition &&

          (() => {

            const menuBatch =

              batches.find(

                (batch) =>

                  batch.id === menu

              );



            if (!menuBatch) {

              return null;

            }



            const menuStatus =

              backendStatusToUi(

                menuBatch.status

              );



            return createPortal(

              <div

                data-batch-menu

                className="fixed z-[2000] w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl"

                style={{

                  top: menuPosition.top,

                  left: menuPosition.left,

                }}

              >

                <Menu

                  icon={

                    <Users size={17} />

                  }

                  label="Manage Students"

                  onClick={() =>

                    openStudents(

                      menuBatch

                    )

                  }

                />



                <Menu

                  icon={

                    <UserCog size={17} />

                  }

                  label="Edit Trainer"

                  onClick={() =>

                    openEdit(

                      menuBatch

                    )

                  }

                />



                <Menu

                  icon={

                    menuStatus ===

                    "Inactive" ? (

                      <CheckCircle2

                        size={17}

                      />

                    ) : (

                      <XCircle size={17} />

                    )

                  }

                  label={

                    menuStatus ===

                    "Inactive"

                      ? "Activate Batch"

                      : "Deactivate Batch"

                  }

                  onClick={() =>

                    toggleBatch(

                      menuBatch

                    )

                  }

                />



                <Menu

                  icon={

                    <Trash2 size={17} />

                  }

                  label="Delete Batch"

                  onClick={() =>

                    deleteBatch(

                      menuBatch

                    )

                  }

                  danger

                />

              </div>,

              document.body

            );

          })()}



        {/* Add/Edit */}

        {modal === "add" && (

          <FormModal

            title="Add New Batch"

            form={form}

            setForm={setForm}

            courses={courses}

            trainers={trainers}

            onClose={close}

            onSubmit={

              createBatch

            }

            submit={

              saving

                ? "Creating..."

                : "Create Batch"

            }

            saving={saving}

          />

        )}



        {modal === "edit" &&

          selected && (

            <FormModal

              title="Edit Batch"

              form={form}

              setForm={setForm}

              courses={courses}

              trainers={trainers}

              onClose={close}

              onSubmit={

                updateBatch

              }

              submit={

                saving

                  ? "Saving..."

                  : "Save Changes"

              }

              edit

              saving={saving}

            />

          )}



        {/* View */}

        {modal === "view" &&

          selected && (

            <Modal

              title="Batch Details"

              subtitle="Complete batch information."

              close={close}

            >

              <div className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">

                  <Users

                    size={23}

                  />

                </div>



                <div>

                  <h3 className="font-bold">

                    {

                      selected.name

                    }

                  </h3>



                  <p className="text-xs text-slate-500">

                    {

                      selected.displayId

                    }

                  </p>

                </div>



                <div className="ml-auto">

                  <Status

                    status={backendStatusToUi(

                      selected.status

                    )}

                  />

                </div>

              </div>



              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <Detail

                  label="Batch Name"

                  value={

                    selected.name

                  }

                />



                <Detail

                  label="Batch ID"

                  value={

                    selected.displayId

                  }

                />



                <Detail

                  label="Course"

                  value={

                    selected.course

                      ?.title ||

                    "Not available"

                  }

                />



                <Detail

                  label="Trainer"

                  value={

                    selected.trainer

                      ?.name ||

                    "Not Assigned"

                  }

                />



                <Detail

                  label="Students"

                  value={`${selected.studentCount} / ${selected.maxStudents}`}

                />



                <Detail

                  label="Mode"

                  value={backendModeToUi(

                    selected.mode

                  )}

                />



                <Detail

                  label="Start Date"

                  value={formatDate(

                    selected.startDate

                  )}

                />



                <Detail

                  label="End Date"

                  value={formatDate(

                    selected.endDate

                  )}

                />

              </div>

            </Modal>

          )}



        {/* Students */}

        {modal ===

          "students" &&

          selected && (

            <Modal

              title="Manage Students"

              subtitle={`Manage students assigned to ${selected.name}.`}

              close={close}

            >

              {studentLoading ? (

                <div className="py-10 text-center">

                  <Loader2

                    className="mx-auto animate-spin text-orange-500"

                    size={28}

                  />



                  <p className="mt-3 text-sm text-slate-500">

                    Loading students...

                  </p>

                </div>

              ) : (

                <>

                  <div className="rounded-xl border bg-slate-50 p-4">

                    <div className="flex gap-3">

                      <UserPlus className="shrink-0 text-orange-500" />



                      <div>

                        <p className="font-semibold">

                          Assign Student

                        </p>



                        <p className="text-sm text-slate-500">

                          {

                            batchStudents.length

                          }{" "}

                          students assigned out of{" "}

                          {

                            selected.maxStudents

                          }{" "}

                          seats.

                        </p>

                      </div>

                    </div>



                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">

                      <select

                        value={

                          selectedStudentId

                        }

                        onChange={(e) =>

                          setSelectedStudentId(

                            e.target.value

                          )

                        }

                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-orange-400"

                      >

                        <option value="">

                          Select student

                        </option>



                        {availableStudents.map(

                          (

                            student

                          ) => (

                            <option

                              key={

                                student.id

                              }

                              value={

                                student.id

                              }

                            >

                              {

                                student.name

                              }{" "}

                              —{" "}

                              {

                                student.studentId

                              }

                            </option>

                          )

                        )}

                      </select>



                      <button

                        onClick={

                          addStudent

                        }

                        disabled={

                          !selectedStudentId ||

                          studentSaving

                        }

                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"

                      >

                        {studentSaving ? (

                          <Loader2

                            size={17}

                            className="animate-spin"

                          />

                        ) : (

                          <UserPlus

                            size={17}

                          />

                        )}



                        Assign

                      </button>

                    </div>

                  </div>



                  <div className="mt-5 space-y-2">

                    {batchStudents.length ===

                    0 ? (

                      <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">

                        <Users

                          className="mx-auto text-slate-300"

                          size={28}

                        />



                        <p className="mt-2 text-sm font-semibold text-slate-600">

                          No students assigned

                        </p>

                      </div>

                    ) : (

                      batchStudents.map(

                        (

                          assignment

                        ) => (

                          <div

                            key={

                              assignment.id

                            }

                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"

                          >

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-slate-800">

                                {

                                  assignment

                                    .student

                                    ?.name

                                }

                              </p>



                              <p className="text-xs text-slate-500">

                                {

                                  assignment

                                    .student

                                    ?.studentId

                                }{" "}

                                ·{" "}

                                {

                                  assignment

                                    .student

                                    ?.email

                                }

                              </p>

                            </div>



                            <button

                              onClick={() =>

                                removeStudent(

                                  assignment.studentId

                                )

                              }

                              disabled={

                                studentSaving

                              }

                              className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"

                            >

                              Remove

                            </button>

                          </div>

                        )

                      )

                    )}

                  </div>

                </>

              )}

            </Modal>

          )}

      </div>

    </main>

  );

}



function FormModal({

  title,

  form,

  setForm,

  courses,

  trainers,

  onClose,

  onSubmit,

  submit,

  edit = false,

  saving = false,

}: {

  title: string;

  form: BatchForm;

  setForm: React.Dispatch<

    React.SetStateAction<BatchForm>

  >;

  courses: CourseOption[];

  trainers: TrainerOption[];

  onClose: () => void;

  onSubmit: (

    e: React.FormEvent<HTMLFormElement>

  ) => void;

  submit: string;

  edit?: boolean;

  saving?: boolean;

}) {

  function updateField(

    key: keyof BatchForm,

    value: string

  ) {

    setForm(

      (current) => ({

        ...current,

        [key]: value,

      })

    );

  }



  return (

    <Modal

      title={title}

      subtitle="Manage batch details and schedule."

      close={onClose}

    >

      <form

        onSubmit={onSubmit}

      >

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <Field

            label="Batch Name"

            value={form.name}

            onChange={(value) =>

              updateField(

                "name",

                value

              )

            }

            required

            placeholder="Example: Java Morning Batch"

          />



          <Select

            label="Course"

            value={

              form.courseId

            }

            onChange={(value) =>

              updateField(

                "courseId",

                value

              )

            }

            options={courses.map(

              (course) => ({

                value:

                  String(

                    course.id

                  ),

                label:

                  course.title,

              })

            )}

            required

          />



          <Select

            label="Trainer"

            value={

              form.trainerId

            }

            onChange={(value) =>

              updateField(

                "trainerId",

                value

              )

            }

            options={trainers.map(

              (trainer) => ({

                value:

                  String(

                    trainer.id

                  ),

                label:

                  trainer.name,

              })

            )}

            allowEmpty

            emptyLabel="Not Assigned"

          />



          <Field

            label="Maximum Students"

            type="number"

            value={

              form.maxStudents

            }

            onChange={(value) =>

              updateField(

                "maxStudents",

                value

              )

            }

          />



          <Field

            label="Start Date"

            type="date"

            value={

              form.startDate

            }

            onChange={(value) =>

              updateField(

                "startDate",

                value

              )

            }

            required

          />



          <Field

            label="End Date"

            type="date"

            value={

              form.endDate

            }

            onChange={(value) =>

              updateField(

                "endDate",

                value

              )

            }

            required

          />



          <Select

            label="Mode"

            value={form.mode}

            onChange={(value) =>

              updateField(

                "mode",

                value

              )

            }

            options={[

              {

                value:

                  "Offline",

                label:

                  "Offline",

              },

              {

                value:

                  "Online",

                label:

                  "Online",

              },

              {

                value:

                  "Hybrid",

                label:

                  "Hybrid",

              },

            ]}

          />



          <Select

            label="Status"

            value={form.status}

            onChange={(value) =>

              updateField(

                "status",

                value

              )

            }

            options={[

              {

                value:

                  "Upcoming",

                label:

                  "Upcoming",

              },

              {

                value:

                  "Active",

                label:

                  "Active",

              },

              {

                value:

                  "Completed",

                label:

                  "Completed",

              },

              {

                value:

                  "Inactive",

                label:

                  "Inactive",

              },

            ]}

          />

        </div>



        <div className="mt-6 flex justify-end gap-3 border-t pt-5">

          <button

            type="button"

            onClick={onClose}

            disabled={saving}

            className="rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"

          >

            Cancel

          </button>



          <button

            type="submit"

            disabled={saving}

            className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"

          >

            {saving ? (

              <Loader2

                size={17}

                className="animate-spin"

              />

            ) : edit ? (

              <Save size={17} />

            ) : (

              <Plus size={17} />

            )}



            {submit}

          </button>

        </div>

      </form>

    </Modal>

  );

}



function Modal({

  title,

  subtitle,

  children,

  close,

}: {

  title: string;

  subtitle: string;

  children: React.ReactNode;

  close: () => void;

}) {

  return (

    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4">

      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b p-5 sm:p-6">

          <div>

            <h2 className="text-xl font-bold text-[#173B67]">

              {title}

            </h2>



            <p className="relative z-10 mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">

              {subtitle}

            </p>

          </div>



          <button

            onClick={close}

            className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200"

          >

            <X size={18} />

          </button>

        </div>



        <div className="p-5 sm:p-6">

          {children}

        </div>

      </div>

    </div>

  );

}



function Field({

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

      <label className="mb-2 block text-sm font-semibold">

        {label}



        {required && (

          <span className="text-red-500">

            {" "}

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

        placeholder={

          placeholder

        }

        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"

      />

    </div>

  );

}



function Select({

  label,

  value,

  onChange,

  options,

  required = false,

  allowEmpty = false,

  emptyLabel,

}: {

  label: string;

  value: string;

  onChange: (

    value: string

  ) => void;

  options: {

    value: string;

    label: string;

  }[];

  required?: boolean;

  allowEmpty?: boolean;

  emptyLabel?: string;

}) {

  return (

    <div>

      <label className="mb-2 block text-sm font-semibold">

        {label}



        {required && (

          <span className="text-red-500">

            {" "}

            *

          </span>

        )}

      </label>



      <select

        required={

          required &&

          !allowEmpty

        }

        value={value}

        onChange={(e) =>

          onChange(

            e.target.value

          )

        }

        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"

      >

        {allowEmpty && (

          <option value="">

            {emptyLabel ||

              `Select ${label.toLowerCase()}`}

          </option>

        )}



        {!allowEmpty &&

          !required && (

            <option value="">

              Select{" "}

              {label.toLowerCase()}

            </option>

          )}



        {options.map(

          (option) => (

            <option

              key={

                option.value

              }

              value={

                option.value

              }

            >

              {

                option.label

              }

            </option>

          )

        )}

      </select>

    </div>

  );

}



function Summary({

  icon,

  title,

  value,

}: {

  icon: React.ReactNode;

  title: string;

  value: number;

}) {

  return (

    <div className="group relative isolate flex min-h-[102px] items-center gap-4 overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-[0_4px_14px_-12px_rgba(23,59,103,0.45)] transition-all duration-200 hover:-translate-y-1 hover:border-[#FDBA32]/70 hover:shadow-[0_16px_28px_-20px_rgba(23,59,103,0.45)] sm:p-5">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#173B67] via-[#2563A6] to-[#F97316] opacity-80 transition-opacity group-hover:opacity-100" />
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 text-[#F97316] shadow-sm transition-all duration-200 group-hover:border-[#F97316] group-hover:from-[#F97316] group-hover:to-[#FB923C] group-hover:text-white group-hover:shadow-md">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold leading-none tracking-tight text-[#173B67] sm:text-[28px]">{value}</div>
        <div className="mt-2 text-sm font-medium text-slate-500">{title}</div>
      </div>
    </div>

  );

}



function Status({

  status,

}: {

  status: BatchStatus;

}) {

  const classes: Record<

    BatchStatus,

    string

  > = {

    Upcoming:

      "bg-amber-50 text-amber-700",

    Active:

      "bg-emerald-50 text-emerald-700",

    Completed:

      "bg-indigo-50 text-indigo-700",

    Inactive:

      "bg-red-50 text-red-700",

  };



  return (

    <span

      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}

    >

      {status}

    </span>

  );

}



function Action({

  children,

  title,

  onClick,

  dataMenuTrigger = false,

}: {

  children: React.ReactNode;

  title: string;

  onClick: (

    event: React.MouseEvent<HTMLButtonElement>

  ) => void;

  dataMenuTrigger?: boolean;

}) {

  return (

    <button

      type="button"

      title={title}

      onClick={onClick}

      {...(dataMenuTrigger

        ? { "data-batch-menu-trigger": true }

        : {})}

      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:shadow"

    >

      {children}

    </button>

  );

}



function Menu({

  icon,

  label,

  onClick,

  danger = false,

}: {

  icon: React.ReactNode;

  label: string;

  onClick: () => void;

  danger?: boolean;

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${

        danger

          ? "text-red-600 hover:bg-red-50"

          : "text-slate-700 hover:bg-slate-50"

      }`}

    >

      {icon}

      {label}

    </button>

  );

}



function Detail({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div className="rounded-xl border p-3">

      <p className="text-xs font-semibold text-slate-400">

        {label}

      </p>



      <p className="mt-1 break-words text-sm font-medium text-slate-800">

        {value}

      </p>

    </div>

  );

}