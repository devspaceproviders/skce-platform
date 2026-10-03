 "use client";



import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {

  ArrowLeft,

  BookOpen,

  Check,

  Loader2,

  ShieldCheck,

  UserRound,

} from "lucide-react";



const API_URL =

  process.env.NEXT_PUBLIC_API_URL ||

  "http\://localhost:5000/api";



type Trainer = {

  id: number;

  profileId?: number;

  name: string;

  email: string;

  specialization?: string | null;

  status?: string;

};



type Course = {

  id: number;

  title: string;

  mode?: string | null;

  duration?: string | null;

  isActive?: boolean;

};



type Permission = {

  id: number;

  trainerId: number;

  courseId: number;

  canTeach: boolean;

  canManageContent: boolean;

  canCreateAssessments: boolean;


};



type PermissionsForm = {

  canTeach: boolean;

  canManageContent: boolean;

  canCreateAssessments: boolean;


};



const DEFAULT_PERMISSIONS: PermissionsForm = {

  canTeach: true,

  canManageContent: false,

  canCreateAssessments: false,


};



function getTrainerId(trainer: Trainer): number {

  return trainer.profileId ?? trainer.id;

}



export default function TrainerPermissionsPage() {

  const router = useRouter();



  const [trainers, setTrainers] = useState<Trainer[]>([]);

  const [courses, setCourses] = useState<Course[]>([]);



  const [trainerId, setTrainerId] = useState("");

  const [courseId, setCourseId] = useState("");



  const [permissions, setPermissions] =

    useState<PermissionsForm>(DEFAULT_PERMISSIONS);



  const [existingPermission, setExistingPermission] =

    useState<Permission | null>(null);



  const [assignedPermissions, setAssignedPermissions] =

    useState<Permission[]>([]);



  const [loading, setLoading] = useState(true);

  const [loadingPermission, setLoadingPermission] =

    useState(false);

  const [saving, setSaving] = useState(false);



  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");



  const authenticatedFetch = async (

    url: string,

    options: RequestInit = {}

  ) => {

    const token = localStorage.getItem("token");



    if (!token) {

      router.push("/admin/login");

      throw new Error("Authentication required");

    }



    const headers = new Headers(options.headers);

    headers.set("Authorization", `Bearer ${token}`);

    headers.set("Content-Type", "application/json");



    const response = await fetch(url, {

      ...options,

      headers,

    });



    if (response.status === 401 || response.status === 403) {

      router.push("/admin/login");

      throw new Error("Unauthorized");

    }



    return response;

  };



  useEffect(() => {

    const loadData = async () => {

      try {

        setLoading(true);

        setError("");



        const [trainerResponse, courseResponse] =

          await Promise.all([

            authenticatedFetch(

              `${API_URL}/admin/trainers`

            ),

            authenticatedFetch(

              `${API_URL}/admin/courses`

            ),

          ]);



        if (!trainerResponse.ok) {

          throw new Error(

            "Unable to load trainers"

          );

        }



        if (!courseResponse.ok) {

          throw new Error(

            "Unable to load courses"

          );

        }



        const trainerJson =

          await trainerResponse.json();

        const courseJson =

          await courseResponse.json();



        setTrainers(

          Array.isArray(trainerJson.data)

            ? trainerJson.data

            : []

        );



        setCourses(

          Array.isArray(courseJson.data)

            ? courseJson.data

            : []

        );

      } catch (err) {

        if (

          err instanceof Error &&

          err.message !== "Unauthorized" &&

          err.message !== "Authentication required"

        ) {

          setError(err.message);

        }

      } finally {

        setLoading(false);

      }

    };



    loadData();

  }, []);



  const selectedTrainer = useMemo(

    () =>

      trainers.find(

        (trainer) =>

          String(getTrainerId(trainer)) === trainerId

      ),

    [trainers, trainerId]

  );



  const selectedCourse = useMemo(

    () =>

      courses.find(

        (course) =>

          String(course.id) === courseId

      ),

    [courses, courseId]

  );



  useEffect(() => {

    const loadAssignedPermissions = async () => {

      if (!trainerId) {

        setAssignedPermissions([]);

        return;

      }



      try {

        const response = await authenticatedFetch(

          `${API_URL}/admin/trainer-course-permissions`

        );



        if (!response.ok) {

          throw new Error(

            "Unable to load assigned course permissions"

          );

        }



        const json = await response.json();

        const allPermissions = Array.isArray(json.data)

          ? (json.data as Permission[])

          : [];



        setAssignedPermissions(

          allPermissions.filter(

            (permission) =>

              permission.trainerId === Number(trainerId)

          )

        );

      } catch (err) {

        if (

          err instanceof Error &&

          err.message !== "Unauthorized" &&

          err.message !== "Authentication required"

        ) {

          setError(err.message);

        }

      }

    };



    loadAssignedPermissions();

  }, [trainerId]);



  useEffect(() => {

    const loadExistingPermission = async () => {

      if (!trainerId || !courseId) {

        setExistingPermission(null);

        setPermissions(DEFAULT_PERMISSIONS);

        return;

      }



      try {

        setLoadingPermission(true);

        setError("");

        setSuccess("");



        const response = await authenticatedFetch(

          `${API_URL}/admin/trainer-course-permissions/${trainerId}/${courseId}`

        );



        if (response.status === 404) {

          setExistingPermission(null);

          setPermissions(DEFAULT_PERMISSIONS);

          return;

        }



        if (!response.ok) {

          throw new Error(

            "Unable to load existing permissions"

          );

        }



        const json = await response.json();

        const permission = json.data as Permission;



        setExistingPermission(permission);

        setPermissions({

          canTeach: Boolean(permission.canTeach),

          canManageContent: Boolean(

            permission.canManageContent

          ),

          canCreateAssessments: Boolean(

            permission.canCreateAssessments

          ),



        });

      } catch (err) {

        if (

          err instanceof Error &&

          err.message !== "Unauthorized" &&

          err.message !== "Authentication required"

        ) {

          setError(err.message);

        }

      } finally {

        setLoadingPermission(false);

      }

    };



    loadExistingPermission();

  }, [trainerId, courseId]);



  const updatePermissionField = (

    field: keyof PermissionsForm

  ) => {

    setPermissions((current) => ({

      ...current,

      [field]: !current[field],

    }));

    setSuccess("");

  };



  const handleSave = async () => {

    if (!trainerId || !courseId) {

      setError(

        "Please select both a trainer and a course."

      );

      return;

    }



    try {

      setSaving(true);

      setError("");

      setSuccess("");



      const url = existingPermission

        ? `${API_URL}/admin/trainer-course-permissions/${trainerId}/${courseId}`

        : `${API_URL}/admin/trainer-course-permissions`;



      const method = existingPermission

        ? "PATCH"

        : "POST";



      const body = existingPermission

        ? permissions

        : {

            trainerId: Number(trainerId),

            courseId: Number(courseId),

            ...permissions,

          };



      const response = await authenticatedFetch(

        url,

        {

          method,

          body: JSON.stringify(body),

        }

      );



      const json = await response.json();



      if (!response.ok) {

        throw new Error(

          json.message ||

            "Unable to save permissions"

        );

      }



      const savedPermission =

        (json.data as Permission | undefined) ?? {

          id: existingPermission?.id ?? 0,

          trainerId: Number(trainerId),

          courseId: Number(courseId),

          ...permissions,

        };



      setExistingPermission(savedPermission);



      setAssignedPermissions((current) => {

        const alreadyExists = current.some(

          (permission) =>

            permission.trainerId ===

              savedPermission.trainerId &&

            permission.courseId ===

              savedPermission.courseId

        );



        if (alreadyExists) {

          return current.map((permission) =>

            permission.trainerId ===

                savedPermission.trainerId &&

            permission.courseId ===

                savedPermission.courseId

              ? savedPermission

              : permission

          );

        }



        return [...current, savedPermission];

      });



      setSuccess(

        existingPermission

          ? "Trainer permissions updated successfully."

          : "Trainer permissions assigned successfully."

      );

    } catch (err) {

      if (

        err instanceof Error &&

        err.message !== "Unauthorized" &&

        err.message !== "Authentication required"

      ) {

        setError(err.message);

      }

    } finally {

      setSaving(false);

    }

  };



  const permissionOptions: {

    key: keyof PermissionsForm;

    title: string;

    description: string;

  }[] = [

    {

      key: "canTeach",

      title: "Can Teach",

      description:

        "Allows the trainer to teach the assigned course.",

    },

    {

      key: "canManageContent",

      title: "Can Manage Content",

      description:

        "Allows the trainer to create, edit, delete and reorder course modules and lessons.",

    },

    {

      key: "canCreateAssessments",

      title: "Can Create Assessments",

      description:

        "Allows the trainer to create and manage assessments for this course.",

    },



  ];



  return (

    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        <button

          type="button"

          onClick={() =>

            router.push("/dashboard/admin/trainers")

          }

          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"

        >

          <ArrowLeft className="h-4 w-4" />

          Back to Trainers

        </button>



        <div className="mb-8">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">

              <ShieldCheck className="h-6 w-6" />

            </div>



            <div>

              <h1 className="text-2xl font-bold text-slate-900">

                Trainer Course Permissions

              </h1>

              <p className="mt-1 text-sm text-slate-500">

                Assign course-specific permissions to trainers.

              </p>

            </div>

          </div>

        </div>



        {error && (

          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            {error}

          </div>

        )}



        {success && (

          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

            <Check className="h-4 w-4 shrink-0" />

            {success}

          </div>

        )}



        {loading ? (

          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">

            <div className="flex items-center gap-3 text-sm text-slate-500">

              <Loader2 className="h-5 w-5 animate-spin" />

              Loading trainers and courses...

            </div>

          </div>

        ) : (

          <div className="space-y-6">

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-5">

                <h2 className="text-lg font-semibold text-slate-900">

                  Assignment

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  Select the trainer and course for this permission set.

                </p>

              </div>



              <div className="grid gap-5 md:grid-cols-2">

                <div>

                  <label

                    htmlFor="trainer"

                    className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"

                  >

                    <UserRound className="h-4 w-4" />

                    Trainer

                  </label>



                  <select

                    id="trainer"

                    value={trainerId}

                    onChange={(event) => {

                      setTrainerId(event.target.value);

                      setSuccess("");

                      setError("");

                    }}

                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"

                  >

                    <option value="">

                      Select a trainer

                    </option>



                    {trainers.map((trainer) => (

                      <option

                        key={getTrainerId(trainer)}

                        value={getTrainerId(trainer)}

                      >

                        {trainer.name} — {trainer.email}

                      </option>

                    ))}

                  </select>

                </div>



                <div>

                  <label

                    htmlFor="course"

                    className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"

                  >

                    <BookOpen className="h-4 w-4" />

                    Course

                  </label>



                  <select

                    id="course"

                    value={courseId}

                    onChange={(event) => {

                      setCourseId(event.target.value);

                      setSuccess("");

                      setError("");

                    }}

                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"

                  >

                    <option value="">

                      Select a course

                    </option>



                    {courses.map((course) => (

                      <option

                        key={course.id}

                        value={course.id}

                      >

                        {course.title}

                        {!course.isActive

                          ? " (Inactive)"

                          : ""}

                      </option>

                    ))}

                  </select>

                </div>

              </div>



              {(selectedTrainer || selectedCourse) && (

                <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">

                  {selectedTrainer && (

                    <div>

                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">

                        Selected Trainer

                      </p>

                      <p className="mt-1 font-medium text-slate-900">

                        {selectedTrainer.name}

                      </p>

                      <p className="text-sm text-slate-500">

                        {selectedTrainer.email}

                      </p>

                    </div>

                  )}



                  {selectedCourse && (

                    <div>

                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">

                        Selected Course

                      </p>

                      <p className="mt-1 font-medium text-slate-900">

                        {selectedCourse.title}

                      </p>

                      {selectedCourse.mode && (

                        <p className="text-sm text-slate-500">

                          {selectedCourse.mode}

                          {selectedCourse.duration

                            ? ` • ${selectedCourse.duration}`

                            : ""}

                        </p>

                      )}

                    </div>

                  )}

                </div>

              )}

            </section>



            {trainerId && (

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">

                  <div>

                    <h2 className="text-lg font-semibold text-slate-900">

                      Assigned Courses

                    </h2>

                    <p className="mt-1 text-sm text-slate-500">

                      Saved course permissions for the selected trainer.

                    </p>

                  </div>



                  <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">

                    {assignedPermissions.length}{" "}

                    {assignedPermissions.length === 1

                      ? "course"

                      : "courses"}{" "}

                    assigned

                  </span>

                </div>



                {assignedPermissions.length === 0 ? (

                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">

                    No courses have been assigned to this trainer yet.

                  </div>

                ) : (

                  <div className="space-y-3">

                    {assignedPermissions.map((permission) => {

                      const course = courses.find(

                        (item) =>

                          item.id === permission.courseId

                      );



                      return (

                        <div

                          key={permission.id}

                          className="rounded-xl border border-slate-200 p-4"

                        >

                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div>

                              <h3 className="font-semibold text-slate-900">

                                {course?.title ??

                                  `Course #${permission.courseId}`}

                              </h3>



                              <div className="mt-2 flex flex-wrap gap-2">

                                {permission.canTeach && (

                                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">

                                    Can Teach

                                  </span>

                                )}



                                {permission.canManageContent && (

                                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">

                                    Manage Content

                                  </span>

                                )}



                                {permission.canCreateAssessments && (

                                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">

                                    Assessments

                                  </span>

                                )}




                              </div>

                            </div>



                            <button

                              type="button"

                              onClick={() => {

                                setCourseId(

                                  String(permission.courseId)

                                );

                                setError("");

                                setSuccess("");

                              }}

                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"

                            >

                              Edit Permissions

                            </button>

                          </div>

                        </div>

                      );

                    })}

                  </div>

                )}

              </section>

            )}



            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-5">

                <h2 className="text-lg font-semibold text-slate-900">

                  Permissions

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  These permissions apply only to the selected course.

                </p>

              </div>



              {!trainerId || !courseId ? (

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">

                  Select a trainer and course to configure permissions.

                </div>

              ) : loadingPermission ? (

                <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">

                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                  Loading existing permissions...

                </div>

              ) : (

                <div className="space-y-3">

                  {permissionOptions.map((option) => (

                    <label

                      key={option.key}

                      className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"

                    >

                      <input

                        type="checkbox"

                        checked={permissions[option.key]}

                        onChange={() =>

                          updatePermissionField(

                            option.key

                          )

                        }

                        className="mt-1 h-4 w-4 rounded border-slate-300"

                      />



                      <span>

                        <span className="block font-medium text-slate-900">

                          {option.title}

                        </span>

                        <span className="mt-1 block text-sm text-slate-500">

                          {option.description}

                        </span>

                      </span>

                    </label>

                  ))}

                </div>

              )}



              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button

                  type="button"

                  onClick={() => {

                    setTrainerId("");

                    setCourseId("");

                    setExistingPermission(null);

                    setPermissions(DEFAULT_PERMISSIONS);

                    setError("");

                    setSuccess("");

                  }}

                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"

                >

                  Clear

                </button>



                <button

                  type="button"

                  onClick={handleSave}

                  disabled={

                    !trainerId ||

                    !courseId ||

                    loadingPermission ||

                    saving

                  }

                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"

                >

                  {saving && (

                    <Loader2 className="h-4 w-4 animate-spin" />

                  )}

                  {existingPermission

                    ? "Update Permissions"

                    : "Save Permissions"}

                </button>

              </div>

            </section>

          </div>

        )}

      </div>

    </div>

  );

}
