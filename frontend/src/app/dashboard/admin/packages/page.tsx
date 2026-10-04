"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Pencil,
  Check,
  X,
  Loader2,
  BookOpen,
  Save,
  Search,
  Plus,
  Power,
  PowerOff,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type Course = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  mode?: string | null;
  isActive?: boolean;
};

type PackageItem = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  isActive: boolean;
  courses: Course[];
};

type AdminPackage = PackageItem & {
  availableCourses: Course[];
};

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingPackage, setEditingPackage] =
    useState<AdminPackage | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] =
    useState("");
  const [editPrice, setEditPrice] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] =
    useState<number[]>([]);

  const [courseSearch, setCourseSearch] =
    useState("");

  const [saving, setSaving] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [createSelectedCourseIds, setCreateSelectedCourseIds] = useState<number[]>([]);
  const [createCourseSearch, setCreateCourseSearch] = useState("");
  const [createAvailableCourses, setCreateAvailableCourses] = useState<Course[]>([]);

  /*
   * ---------------------------------------------------------
   * LOAD PACKAGES
   * ---------------------------------------------------------
   */

  async function loadPackages() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/admin/packages`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/admin/login";
          return;
        }

        throw new Error(
          result?.message ||
            "Failed to load packages."
        );
      }

      setPackages(result?.data ?? []);
    } catch (err) {
      console.error("Load packages error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load packages."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPackages();
  }, []);

  /*
   * ---------------------------------------------------------
   * OPEN EDIT
   * ---------------------------------------------------------
   */

  async function openEditPackage(packageId: number) {
    const token =
      localStorage.getItem("token");

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/admin/packages/${packageId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          window.location.href = "/admin/login";
          return;
        }

        throw new Error(
          result?.message ||
            "Failed to load package."
        );
      }

      const data: AdminPackage = result.data;

      setEditingPackage(data);

      setEditTitle(data.title);
      setEditDescription(
        data.description || ""
      );
      setEditPrice(String(data.price));

      setSelectedCourseIds(
        data.courses.map(
          (course) => course.id
        )
      );

      setCourseSearch("");
    } catch (err) {
      console.error(
        "Open package error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load package."
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * ACTIVATE / DEACTIVATE PACKAGE
   * ---------------------------------------------------------
   */

  async function togglePackageStatus(item: PackageItem) {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/admin/packages/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isActive: !item.isActive,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/admin/login";
          return;
        }

        throw new Error(
          result?.message ||
            `Failed to ${item.isActive ? "deactivate" : "activate"} package.`
        );
      }

      await loadPackages();
    } catch (err) {
      console.error("Toggle package status error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update package status."
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * CREATE PACKAGE
   * ---------------------------------------------------------
   */

  async function openCreatePackage() {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/admin/courses`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/admin/login";
          return;
        }

        throw new Error(result?.message || "Failed to load courses.");
      }

      const courseData = Array.isArray(result?.data) ? result.data : [];
      setCreateAvailableCourses(
        courseData.filter((course: Course) => course.isActive !== false)
      );
      setCreateTitle("");
      setCreateDescription("");
      setCreatePrice("");
      setCreateSelectedCourseIds([]);
      setCreateCourseSearch("");
      setCreating(true);
    } catch (err) {
      console.error("Load create-package courses error:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load courses."
      );
    }
  }

  function closeCreatePackage() {
    if (saving) return;

    setCreating(false);
    setCreateTitle("");
    setCreateDescription("");
    setCreatePrice("");
    setCreateSelectedCourseIds([]);
    setCreateCourseSearch("");
  }

  function toggleCreateCourse(courseId: number) {
    setCreateSelectedCourseIds((current) => {
      if (current.includes(courseId)) {
        return current.filter((id) => id !== courseId);
      }

      return [...current, courseId];
    });
  }

  async function createPackage() {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    const title = createTitle.trim();

    if (!title) {
      setError("Package title is required.");
      return;
    }

    const price = Number(createPrice);

    if (!Number.isInteger(price) || price < 0) {
      setError("Please enter a valid package amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/packages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description: createDescription.trim() || null,
            price,
            courseIds: createSelectedCourseIds,
            isActive: true,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/admin/login";
          return;
        }

        throw new Error(
          result?.message || "Failed to create package."
        );
      }

      await loadPackages();
      closeCreatePackage();
    } catch (err) {
      console.error("Create package error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create package."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredCreateCourses = useMemo(() => {
    const search = createCourseSearch.trim().toLowerCase();

    if (!editingPackage && !creating) {
      return [];
    }

    const source = editingPackage?.availableCourses ?? createAvailableCourses;

    if (!search) {
      return source;
    }

    return source.filter(
      (course) =>
        course.title.toLowerCase().includes(search) ||
        course.slug.toLowerCase().includes(search)
    );
  }, [editingPackage, creating, createCourseSearch, createAvailableCourses]);

  /*
   * ---------------------------------------------------------
   * CLOSE EDIT
   * ---------------------------------------------------------
   */

  function closeEditPackage() {
    if (saving) return;

    setEditingPackage(null);
    setEditTitle("");
    setEditDescription("");
    setEditPrice("");
    setSelectedCourseIds([]);
    setCourseSearch("");
  }

  /*
   * ---------------------------------------------------------
   * COURSE SELECTION
   * ---------------------------------------------------------
   */

  function toggleCourse(courseId: number) {
    setSelectedCourseIds((current) => {
      if (current.includes(courseId)) {
        return current.filter(
          (id) => id !== courseId
        );
      }

      return [...current, courseId];
    });
  }

  /*
   * ---------------------------------------------------------
   * FILTER AVAILABLE COURSES
   * ---------------------------------------------------------
   */

  const filteredCourses = useMemo(() => {
    if (!editingPackage) {
      return [];
    }

    const search =
      courseSearch.trim().toLowerCase();

    if (!search) {
      return editingPackage.availableCourses;
    }

    return editingPackage.availableCourses.filter(
      (course) =>
        course.title
          .toLowerCase()
          .includes(search) ||
        course.slug
          .toLowerCase()
          .includes(search)
    );
  }, [
    editingPackage,
    courseSearch,
  ]);

  /*
   * ---------------------------------------------------------
   * SAVE PACKAGE
   * ---------------------------------------------------------
   */

  async function savePackage() {
    if (!editingPackage) {
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    const title = editTitle.trim();

    if (!title) {
      setError(
        "Package title is required."
      );
      return;
    }

    const price = Number(editPrice);

    if (
      !Number.isInteger(price) ||
      price < 0
    ) {
      setError(
        "Please enter a valid package amount."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/packages/${editingPackage.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description:
              editDescription.trim() ||
              null,
            price,
            courseIds:
              selectedCourseIds,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          window.location.href =
            "/admin/login";
          return;
        }

        throw new Error(
          result?.message ||
            "Failed to update package."
        );
      }

      /*
       * Refresh the package list from DB.
       */
      await loadPackages();

      closeEditPackage();
    } catch (err) {
      console.error(
        "Save package error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update package."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading packages...
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Package size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Packages
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage package pricing and the
                  courses included in each package.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreatePackage}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
            >
              <Plus size={17} />
              Add New Package
            </button>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                Active Packages
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {
                  packages.filter(
                    (item) => item.isActive
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <X
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        {/* Package List */}
        {packages.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Package
              size={42}
              className="mx-auto mb-4 text-slate-300"
            />

            <h2 className="text-lg font-semibold text-slate-800">
              No packages found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              No active packages are available.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                {/* Package title */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <Package size={20} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-slate-900">
                          {item.title}
                        </h2>

                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {item.slug}
                        </p>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      item.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                {/* Price */}
                <div className="mt-6 rounded-xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-medium text-slate-500">
                    Package Amount
                  </p>

                  <p className="mt-1 text-2xl font-extrabold text-orange-600">
                    ₹
                    {item.price.toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>

                {/* Description */}
                <p className="mt-4 min-h-[40px] text-sm leading-5 text-slate-500">
                  {item.description ||
                    "No description available."}
                </p>

                {/* Courses */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <BookOpen size={16} />
                      Courses
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {item.courses?.length || 0}
                    </span>
                  </div>

                  <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
                    {item.courses?.length ? (
                      item.courses.map(
                        (course) => (
                          <span
                            key={course.id}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600"
                          >
                            {course.title}
                          </span>
                        )
                      )
                    ) : (
                      <span className="text-xs text-slate-400">
                        No courses assigned.
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit button */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      openEditPackage(
                        item.id
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Pencil size={16} />
                    Edit Package
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePackageStatus(item)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      item.isActive
                        ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {item.isActive ? (
                      <>
                        <PowerOff size={16} />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power size={16} />
                        Activate
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          CREATE PACKAGE MODAL
          ===================================================== */}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add New Package
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create a package and select the courses it includes.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreatePackage}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Package Name
                  </label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    placeholder="Package name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>
                  <textarea
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    placeholder="Package description"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Package Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={createPrice}
                      onChange={(e) => setCreatePrice(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      placeholder="3999"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Selected Courses
                  </label>
                  <div className="flex h-[46px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <BookOpen size={17} className="mr-2 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700">
                      {createSelectedCourseIds.length} selected
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <div className="mb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Courses Included
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Select active courses for this package.
                  </p>
                </div>

                <div className="relative mb-4">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={createCourseSearch}
                    onChange={(e) => setCreateCourseSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    placeholder="Search courses..."
                  />
                </div>

                <div className="rounded-xl border border-slate-200">
                  {filteredCreateCourses.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <BookOpen
                        size={34}
                        className="mx-auto mb-3 text-slate-300"
                      />
                      <p className="text-sm font-medium text-slate-600">
                        No courses found
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Courses are loaded when creating a package.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[330px] overflow-y-auto p-2">
                      {filteredCreateCourses.map((course) => {
                        const selected = createSelectedCourseIds.includes(course.id);

                        return (
                          <label
                            key={course.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition ${
                              selected ? "bg-orange-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleCreateCourse(course.id)}
                              className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800">
                                {course.title}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                {course.slug}
                              </p>
                            </div>
                            {selected && (
                              <Check size={17} className="shrink-0 text-orange-500" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeCreatePackage}
                disabled={saving}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createPackage}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    Create Package
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          EDIT PACKAGE MODAL
          ===================================================== */}

      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Package
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update package details, amount and
                  included courses.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditPackage}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto px-6 py-6">

              {/* Package Details */}
              <div className="grid gap-5 md:grid-cols-2">

                {/* Title */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Package Name
                  </label>

                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) =>
                      setEditTitle(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    placeholder="Package name"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={editDescription}
                    onChange={(e) =>
                      setEditDescription(
                        e.target.value
                      )
                    }
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    placeholder="Package description"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Package Amount
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={editPrice}
                      onChange={(e) =>
                        setEditPrice(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      placeholder="3999"
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    This is the amount used for
                    the package.
                  </p>
                </div>

                {/* Current count */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Selected Courses
                  </label>

                  <div className="flex h-[46px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <BookOpen
                      size={17}
                      className="mr-2 text-slate-500"
                    />

                    <span className="text-sm font-semibold text-slate-700">
                      {selectedCourseIds.length}{" "}
                      selected
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Selection */}
              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Courses Included
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Select the courses that belong
                      to this package.
                    </p>
                  </div>

                  <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600">
                    {selectedCourseIds.length} selected
                  </span>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) =>
                      setCourseSearch(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    placeholder="Search courses..."
                  />
                </div>

                {/* Courses */}
                <div className="rounded-xl border border-slate-200">
                  {filteredCourses.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <BookOpen
                        size={34}
                        className="mx-auto mb-3 text-slate-300"
                      />

                      <p className="text-sm font-medium text-slate-600">
                        No courses found
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[330px] overflow-y-auto p-2">
                      {filteredCourses.map(
                        (course) => {
                          const selected =
                            selectedCourseIds.includes(
                              course.id
                            );

                          return (
                            <label
                              key={course.id}
                              className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition ${
                                selected
                                  ? "bg-orange-50"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selected
                                }
                                onChange={() =>
                                  toggleCourse(
                                    course.id
                                  )
                                }
                                className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                              />

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">
                                  {course.title}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  {course.slug}
                                </p>
                              </div>

                              {selected && (
                                <Check
                                  size={17}
                                  className="shrink-0 text-orange-500"
                                />
                              )}
                            </label>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeEditPackage}
                disabled={saving}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={savePackage}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
