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
Image as ImageIcon,
Trash2,
RotateCcw,
} from "lucide-react";
import {
AdminPageShell,
AdminPageHeader,
ADMIN_BTN_PRIMARY,
} from "@/components/dashboard/admin/AdminPageHeader";
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
imageUrl?: string | null;
courses: Course[];
};
type AdminPackage = PackageItem & {
availableCourses: Course[];
};
export default function AdminPackagesPage() {
const [packages, setPackages] = useState<PackageItem[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [deletePackageTarget, setDeletePackageTarget] = useState<PackageItem | null>(null);
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
const [createImageFile, setCreateImageFile] = useState<File | null>(null);
const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
const [editImageFile, setEditImageFile] = useState<File | null>(null);
const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
const [listSearch, setListSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("");
const [coursesFilter, setCoursesFilter] = useState("");
const hasListFilters = Boolean(listSearch.trim() || statusFilter || coursesFilter);
function clearListFilters() {
setListSearch("");
setStatusFilter("");
setCoursesFilter("");
}
const visiblePackages = useMemo(() => {
const q = listSearch.trim().toLowerCase();
return packages.filter((item) => {
if (statusFilter === "active" && !item.isActive) return false;
if (statusFilter === "inactive" && item.isActive) return false;
const count = item.courses?.length || 0;
if (coursesFilter === "with" && count === 0) return false;
if (coursesFilter === "without" && count > 0) return false;
if (!q) return true;
return (
item.title.toLowerCase().includes(q) ||
item.slug.toLowerCase().includes(q) ||
(item.description || "").toLowerCase().includes(q) ||
String(item.price).includes(q) ||
(item.courses || []).some((course) => course.title.toLowerCase().includes(q))
);
});
}, [packages, listSearch, statusFilter, coursesFilter]);
/*
* ---------------------------------------------------------
* LOAD PACKAGES
* ---------------------------------------------------------
*/
function getImageUrl(imageUrl?: string | null) {
if (!imageUrl) {
return null;
}
if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
return imageUrl;
}
return `${API_URL.replace(/\/api\/?$/, "")}${imageUrl}`;
}
function validateImageFile(file: File) {
const allowedTypes = new Set([
"image/jpeg",
"image/png",
"image/webp",
]);
if (!allowedTypes.has(file.type)) {
setError("Only JPG, PNG, and WEBP images are allowed.");
return false;
}
if (file.size > 5 * 1024 * 1024) {
setError("Package image must be 5 MB or smaller.");
return false;
}
return true;
}
async function uploadPackageImage(
packageId: number,
file: File,
token: string
) {
const formData = new FormData();
formData.append("image", file);
const response = await fetch(
`${API_URL}/admin/packages/${packageId}/image`,
{
method: "POST",
headers: {
Authorization: `Bearer ${token}`,
},
body: formData,
}
);
const result = await response.json();
if (!response.ok) {
if (response.status === 401 || response.status === 403) {
window.location.href = "/admin/login";
throw new Error("Authentication required.");
}
throw new Error(
result?.message || "Failed to upload package image."
);
}
return result?.data;
}
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
setEditImageFile(null);
setEditImagePreview(getImageUrl(data.imageUrl));
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
* DELETE PACKAGE
* ---------------------------------------------------------
*/
function requestDeletePackage(item: PackageItem) {
setError("");
setDeletePackageTarget(item);
}
async function deletePackage(item: PackageItem) {
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
method: "DELETE",
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
result?.message || "Failed to delete package."
);
}
setDeletePackageTarget(null);
await loadPackages();
} catch (err) {
console.error("Delete package error:", err);
setError(
err instanceof Error
? err.message
: "Unable to delete package."
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
setCreateImageFile(null);
setCreateImagePreview(null);
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
setCreateImageFile(null);
setCreateImagePreview(null);
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
const createdPackageId = Number(result?.data?.id);
if (
createImageFile &&
Number.isInteger(createdPackageId) &&
createdPackageId > 0
) {
await uploadPackageImage(
createdPackageId,
createImageFile,
token
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
setEditImageFile(null);
setEditImagePreview(null);
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
if (editImageFile) {
await uploadPackageImage(
editingPackage.id,
editImageFile,
token
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
<AdminPageShell>
<div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
<div className="flex items-center gap-3 text-sm font-medium text-slate-500" role="status">
<Loader2
size={20}
className="animate-spin motion-reduce:animate-none"
/>
Loading packages...
</div>
</div>
</AdminPageShell>
);
}
/*
* ---------------------------------------------------------
* PAGE
* ---------------------------------------------------------
*/
return (
<>
<AdminPageShell>
<AdminPageHeader
label="SK Computer Education · Package Management"
title="Packages"
subtitle="Manage package pricing, course bundles and learning options in one place."
icon={Package}
chips={[
{ label: "Active packages", value: packages.filter((item) => item.isActive).length },
{ label: "Total", value: packages.length },
]}
actions={
<button type="button" onClick={openCreatePackage} className={ADMIN_BTN_PRIMARY}>
<Plus size={18} strokeWidth={2.5} />
Add New Package
</button>
}
/>
{/* Error */}
{error && (
<div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
<X
size={18}
className="mt-0.5 shrink-0"
/>
<span>{error}</span>
</div>
)}
{/* Search + filters */}
<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
<div className="relative min-w-0 flex-1">
<Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
<input
type="search"
value={listSearch}
onChange={(e) => setListSearch(e.target.value)}
placeholder="Search packages by name, slug, amount or course..."
aria-label="Search packages"
className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
/>
</div>
<div className="flex flex-wrap items-center gap-3">
<select
value={statusFilter}
onChange={(e) => setStatusFilter(e.target.value)}
aria-label="Filter by status"
className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
>
<option value="">All status</option>
<option value="active">Active</option>
<option value="inactive">Inactive</option>
</select>
<select
value={coursesFilter}
onChange={(e) => setCoursesFilter(e.target.value)}
aria-label="Filter by courses"
className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
>
<option value="">All bundles</option>
<option value="with">With courses</option>
<option value="without">No courses</option>
</select>
<button
type="button"
onClick={clearListFilters}
disabled={!hasListFilters}
className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0F2F5F] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
>
<RotateCcw size={15} />
Clear filters
</button>
</div>
</div>
<p className="mt-3 text-xs font-medium text-slate-500" aria-live="polite">
Showing <span className="font-bold text-[#0F2F5F]">{visiblePackages.length}</span> of {packages.length} packages
</p>
</section>
{/* Package List */}
{packages.length === 0 ? (
<div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
<Package size={42} className="mx-auto mb-4 text-slate-300" />
<h2 className="text-lg font-semibold text-slate-800">No packages found</h2>
<p className="mt-2 text-sm text-slate-500">No active packages are available.</p>
</div>
) : visiblePackages.length === 0 ? (
<div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
<Search size={42} className="mx-auto mb-4 text-slate-300" />
<h2 className="text-lg font-semibold text-slate-800">No matching packages</h2>
<p className="mt-2 text-sm text-slate-500">Try a different search or clear the filters.</p>
</div>
) : (
<div className="grid items-stretch gap-5 md:grid-cols-2 2xl:grid-cols-3">
{visiblePackages.map((item) => (
<article
key={item.id}
className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
>
{/* Package image */}
<div className="relative h-44 overflow-hidden bg-slate-100">
{getImageUrl(item.imageUrl) ? (
<img
src={getImageUrl(item.imageUrl) ?? ""}
alt={item.title}
className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
/>
) : (
<div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-50 via-white to-slate-100">
<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#F97316] shadow-sm ring-1 ring-orange-100">
<Package size={30} />
</div>
</div>
)}
<span
className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur ${
item.isActive
? "bg-emerald-50/95 text-emerald-700"
: "bg-white/95 text-slate-500"
}`}
>
{item.isActive ? "Active" : "Inactive"}
</span>
</div>
<div className="flex flex-1 flex-col p-5">
<div className="flex items-start gap-3">
<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF4E8] text-[#F97316]">
<Package size={19} />
</div>
<div className="min-w-0 flex-1">
<h2 className="truncate text-lg font-bold text-slate-900">
{item.title}
</h2>
<p className="mt-0.5 truncate text-xs text-slate-400">
{item.slug}
</p>
</div>
</div>
<div className="mt-4 flex items-end justify-between rounded-xl border border-orange-100 bg-gradient-to-r from-[#FFF7ED] to-white px-4 py-3">
<div>
<p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
Package Amount
</p>
<p className="mt-0.5 text-2xl font-extrabold tracking-tight text-[#E96300]">
₹{item.price.toLocaleString("en-IN")}
</p>
</div>
<span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
{item.courses?.length || 0} courses
</span>
</div>
<p className="mt-4 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-500">
{item.description || "No description available."}
</p>
<div className="mt-4">
<div className="mb-2 flex items-center justify-between">
<div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
<BookOpen size={15} className="text-slate-500" />
Courses
</div>
<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
{item.courses?.length || 0}
</span>
</div>
<div className="flex h-24 flex-wrap content-start gap-1.5 overflow-y-auto pr-1">
{item.courses?.length ? (
item.courses.map((course) => (
<span
key={course.id}
className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600"
>
{course.title}
</span>
))
) : (
<span className="text-xs text-slate-400">
No courses assigned.
</span>
)}
</div>
</div>
<div className="mt-auto grid grid-cols-[1.15fr_1fr_auto] gap-2 pt-5">
<button
type="button"
onClick={() => openEditPackage(item.id)}
className="flex items-center justify-center gap-2 rounded-xl bg-[#0F2F5F] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#173B67]"
>
<Pencil size={14} />
Edit
</button>
<button
type="button"
onClick={() => togglePackageStatus(item)}
title={item.isActive ? "Deactivate package" : "Activate package"}
className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
item.isActive
? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
: "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
}`}
>
{item.isActive ? <PowerOff size={14} /> : <Power size={14} />}
{item.isActive ? "Deactivate" : "Activate"}
</button>
<button
type="button"
onClick={() => requestDeletePackage(item)}
title="Delete package"
aria-label={`Delete ${item.title}`}
className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
>
<Trash2 size={15} />
</button>
</div>
</div>
</article>
))}
</div>
)}
</AdminPageShell>
{/* DELETE PACKAGE CONFIRMATION */}
{deletePackageTarget && (
<div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
<div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
<div className="flex items-start gap-4">
<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
<Trash2 size={20} />
</div>
<div className="min-w-0">
<h2 className="text-lg font-bold text-slate-900">Delete Package?</h2>
<p className="mt-2 text-sm leading-6 text-slate-500">
Are you sure you want to permanently delete <span className="font-semibold text-slate-800">{deletePackageTarget.title}</span>? This action cannot be undone.
</p>
</div>
</div>
<div className="mt-6 flex justify-end gap-3">
<button type="button" onClick={() => setDeletePackageTarget(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
<button type="button" onClick={() => deletePackage(deletePackageTarget)} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
<Trash2 size={15} />
Delete Package
</button>
</div>
</div>
</div>
)}
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
className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
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
className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
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
className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
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
<div className="mt-6">
<label className="mb-2 block text-sm font-semibold text-slate-700">
Package Image
</label>
<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
<div className="flex h-32 w-full max-w-[220px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
{createImagePreview ? (
<img
src={createImagePreview}
alt="Package preview"
className="h-full w-full object-cover"
/>
) : (
<ImageIcon size={32} className="text-slate-300" />
)}
</div>
<div className="flex-1">
<input
type="file"
accept="image/jpeg,image/png,image/webp"
onChange={(e) => {
const file = e.target.files?.[0] ?? null;
if (!file) {
return;
}
if (!validateImageFile(file)) {
e.target.value = "";
return;
}
setError("");
setCreateImageFile(file);
setCreateImagePreview(URL.createObjectURL(file));
}}
className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#E96300] hover:file:bg-orange-100"
/>
<p className="mt-2 text-xs text-slate-400">
JPG, PNG or WEBP. Maximum 5 MB.
</p>
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
className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
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
className="h-4 w-4 rounded border-slate-300 text-[#F97316] focus:ring-[#F97316]"
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
className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
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
className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
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
className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
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
{/* Package Image */}
<div className="mt-6">
<label className="mb-2 block text-sm font-semibold text-slate-700">
Package Image
</label>
<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
<div className="flex h-32 w-full max-w-[220px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
{editImagePreview ? (
<img
src={editImagePreview}
alt="Package preview"
className="h-full w-full object-cover"
/>
) : (
<ImageIcon size={32} className="text-slate-300" />
)}
</div>
<div className="flex-1">
<input
type="file"
accept="image/jpeg,image/png,image/webp"
onChange={(e) => {
const file = e.target.files?.[0] ?? null;
if (!file) {
return;
}
if (!validateImageFile(file)) {
e.target.value = "";
return;
}
setError("");
setEditImageFile(file);
setEditImagePreview(URL.createObjectURL(file));
}}
className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#E96300] hover:file:bg-orange-100"
/>
<p className="mt-2 text-xs text-slate-400">
JPG, PNG or WEBP. Maximum 5 MB.
</p>
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
<span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-[#E96300]">
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
className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
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
className="h-4 w-4 rounded border-slate-300 text-[#F97316] focus:ring-[#F97316]"
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
</>
);
}
