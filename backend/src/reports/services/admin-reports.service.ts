import { db } from "../../prisma/db";

export type ReportRange = "today" | "this-week" | "this-month" | "last-month" | "this-year" | "all";
type DateRange = { start: Date | null; end: Date | null };
function getRange(range: ReportRange): DateRange {
  const now = new Date();
  if (range === "all") return { start: null, end: null };
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === "today") return { start, end: now };
  if (range === "this-week") {
    const day = start.getDay();
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
    return { start, end: now };
  }
  if (range === "this-month") {
    start.setDate(1);
    return { start, end: now };
  }
  if (range === "last-month") {
    return { start: new Date(start.getFullYear(), start.getMonth() - 1, 1), end: new Date(start.getFullYear(), start.getMonth(), 1) };
  }
  return { start: new Date(start.getFullYear(), 0, 1), end: now };
}
function inRange(value: unknown, range: DateRange) {
  if (!range.start && !range.end) return true;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return false;
  if (range.start && date < range.start) return false;
  if (range.end && date >= range.end) return false;
  return true;
}
function uniqueNumbers(values: number[]) { return Array.from(new Set(values)); }
function startOfDay(date: Date) { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; }
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function addDays(date: Date, count: number) { const value = new Date(date); value.setDate(value.getDate() + count); return value; }
function addMonths(date: Date, count: number) { return new Date(date.getFullYear(), date.getMonth() + count, 1); }
function buildBuckets(range: ReportRange, dateRange: DateRange) {
  const now = new Date();
  const mode = range === "this-year" || range === "all" ? "month" : "day";
  let cursor = dateRange.start ? (mode === "month" ? startOfMonth(dateRange.start) : startOfDay(dateRange.start)) : startOfMonth(new Date(now.getFullYear(), now.getMonth() - 11, 1));
  const end = dateRange.end ?? addMonths(startOfMonth(now), 1);
  const buckets: Array<{ start: Date; end: Date; label: string }> = [];
  let guard = 0;
  while (cursor < end && guard < 400) {
    const next = mode === "month" ? addMonths(cursor, 1) : addDays(cursor, 1);
    buckets.push({ start: new Date(cursor), end: next, label: cursor.toLocaleDateString("en-IN", mode === "month" ? { month: "short", year: "numeric" } : { day: "2-digit", month: "short" }) });
    cursor = next;
    guard++;
  }
  return range === "all" && buckets.length > 12 ? buckets.slice(-12) : buckets;
}
export async function getAdminReports(range: ReportRange = "this-month", courseId: number | null = null, packageId: number | null = null) {
  const dateRange = getRange(range);
  const [users, courses, packages, packageCourses, enrollments, payments, certificates, trainerProfiles, permissions, availability] = await Promise.all([
    db.orm.public.User.all(),
    db.orm.public.Course.all(),
    db.orm.public.CoursePackage.all(),
    db.orm.public.PackageCourse.all(),
    db.orm.public.Enrollment.all(),
    db.orm.public.Payment.all(),
    db.orm.public.Certificate.all(),
    db.orm.public.TrainerProfile.all(),
    db.orm.public.TrainerCoursePermission.all(),
    db.orm.public.TrainerAvailability.all(),
  ]);
  const students = users.filter((user) => user.role === "STUDENT");
  const trainerUsers = new Map(users.filter((user) => user.role === "TRAINER").map((user) => [user.id, user]));
  const selectedPackage = packageId == null ? null : packages.find((item) => item.id === packageId) ?? null;
  const packageCourseIds = packageId == null ? null : packageCourses.filter((item) => item.packageId === packageId).map((item) => item.courseId);
  const filteredEnrollments = enrollments.filter((enrollment) => inRange(enrollment.enrolledAt, dateRange) && (!courseId || enrollment.courseId === courseId) && (!packageId || enrollment.packageId === packageId));
  const filteredPayments = payments.filter((payment) => {
    if (!inRange(payment.paidAt ?? payment.createdAt, dateRange)) return false;
    if (!courseId && !packageId) return true;
    if (!payment.enrollmentId) return false;
    const enrollment = enrollments.find((item) => item.id === payment.enrollmentId);
    if (!enrollment) return false;
    if (courseId && enrollment.courseId !== courseId) return false;
    if (packageId && enrollment.packageId !== packageId) return false;
    return true;
  });
  const filteredCertificates = certificates.filter((certificate) => inRange(certificate.issuedAt, dateRange) && (!courseId || certificate.courseId == null || certificate.courseId === courseId) && (!packageId || certificate.packageId === packageId));
  const scopedStudentIds = courseId || packageId ? uniqueNumbers(filteredEnrollments.map((item) => item.userId)) : students.map((student) => student.id);
  const scopedStudents = students.filter((student) => scopedStudentIds.includes(student.id));
  const newStudents = students.filter((student) => inRange(student.createdAt, dateRange) && (!courseId && !packageId || scopedStudentIds.includes(student.id)));
  const paidPayments = filteredPayments.filter((payment) => payment.status === "SUCCESS");
  const pendingPayments = filteredPayments.filter((payment) => payment.status === "PENDING" || payment.status === "CREATED");
  const failedPayments = filteredPayments.filter((payment) => payment.status === "FAILED");
  const refundedPayments = filteredPayments.filter((payment) => payment.status === "REFUNDED");
  const createdPayments = filteredPayments.filter((payment) => payment.status === "CREATED");
  const revenue = paidPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const allowedCourseIds = packageCourseIds == null ? null : new Set(packageCourseIds);
  const courseRows = courses.filter((course) => (!courseId || course.id === courseId) && (!allowedCourseIds || allowedCourseIds.has(course.id))).map((course) => ({ id: course.id, title: course.title, isActive: course.isActive, mode: course.mode, enrollments: filteredEnrollments.filter((enrollment) => enrollment.courseId === course.id).length }));
  const trainerRows = trainerProfiles.map((trainer) => {
    const user = trainerUsers.get(trainer.userId);
    const trainerPermissions = permissions.filter((permission) => permission.trainerId === trainer.id);
    const teachPermissions = trainerPermissions.filter((permission) => permission.canTeach);
    const trainerAvailability = availability.filter((slot) => slot.trainerId === trainer.id && slot.isActive);
    return { id: trainer.id, userId: trainer.userId, name: user?.name ?? "Unnamed Trainer", email: user?.email ?? "", isActive: user?.isActive ?? false, specialization: trainer.specialization ?? "", qualification: trainer.qualification ?? "", experience: trainer.experience ?? null, assignedCourses: teachPermissions.length, totalCoursePermissions: trainerPermissions.length, availabilitySlots: trainerAvailability.length, hasAvailability: trainerAvailability.length > 0 };
  });
  const buckets = buildBuckets(range, dateRange);
  const trend = buckets.map((bucket) => {
    const bucketEnrollments = filteredEnrollments.filter((item) => { const date = new Date(String(item.enrolledAt)); return date >= bucket.start && date < bucket.end; });
    const bucketPayments = filteredPayments.filter((item) => { const date = new Date(String(item.paidAt ?? item.createdAt)); return date >= bucket.start && date < bucket.end; });
    const bucketCertificates = filteredCertificates.filter((item) => { const date = new Date(String(item.issuedAt)); return date >= bucket.start && date < bucket.end; });
    return { label: bucket.label, students: uniqueNumbers(bucketEnrollments.map((item) => item.userId)).length, enrollments: bucketEnrollments.length, revenue: bucketPayments.filter((item) => item.status === "SUCCESS").reduce((total, item) => total + Number(item.amount || 0), 0), certificates: bucketCertificates.length };
  });
  const coursePerformance = courseRows.map((course) => ({ id: String(course.id), title: course.title, enrollments: course.enrollments, revenue: filteredPayments.filter((payment) => { if (payment.status !== "SUCCESS" || !payment.enrollmentId) return false; return enrollments.find((item) => item.id === payment.enrollmentId)?.courseId === course.id; }).reduce((total, payment) => total + Number(payment.amount || 0), 0) })).sort((a, b) => b.enrollments - a.enrollments || b.revenue - a.revenue).slice(0, 6);
  const recentActivity = [
    ...filteredEnrollments.map((item) => ({ type: "Enrollment", label: "New enrollment", date: new Date(String(item.enrolledAt)), amount: null as number | null })),
    ...filteredPayments.map((item) => ({ type: "Payment", label: item.status === "SUCCESS" ? "Payment received" : `Payment ${String(item.status).toLowerCase()}`, date: new Date(String(item.paidAt ?? item.createdAt)), amount: Number(item.amount || 0) })),
    ...filteredCertificates.map((item) => ({ type: "Certificate", label: "Certificate issued", date: new Date(String(item.issuedAt)), amount: null as number | null })),
  ].filter((item) => !Number.isNaN(item.date.getTime())).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8).map((item) => ({ type: item.type, label: item.label, date: item.date.toISOString(), amount: item.amount }));
  return {
    range,
    courseId,
    packageId,
    generatedAt: new Date().toISOString(),
    packages: packages.map((item) => ({ id: item.id, title: item.title, isActive: item.isActive, price: item.price })),
    selectedPackage: selectedPackage ? { id: selectedPackage.id, title: selectedPackage.title, isActive: selectedPackage.isActive, price: selectedPackage.price } : null,
    overview: { totalStudents: scopedStudents.length, activeStudents: scopedStudents.filter((student) => student.isActive).length, totalCourses: courseRows.length, activeCourses: courseRows.filter((course) => course.isActive).length, totalTrainers: trainerRows.length, activeTrainers: trainerRows.filter((trainer) => trainer.isActive).length, newStudents: newStudents.length, newEnrollments: filteredEnrollments.length, revenue, successfulPayments: paidPayments.length, certificatesIssued: filteredCertificates.length },
    students: { total: scopedStudents.length, active: scopedStudents.filter((student) => student.isActive).length, inactive: scopedStudents.filter((student) => !student.isActive).length, newThisPeriod: newStudents.length },
    courses: { total: courseRows.length, active: courseRows.filter((course) => course.isActive).length, inactive: courseRows.filter((course) => !course.isActive).length, enrollments: filteredEnrollments.length, rows: courseRows },
    trainers: { total: trainerRows.length, active: trainerRows.filter((trainer) => trainer.isActive).length, inactive: trainerRows.filter((trainer) => !trainer.isActive).length, withPermissions: trainerRows.filter((trainer) => trainer.assignedCourses > 0).length, withAvailability: trainerRows.filter((trainer) => trainer.hasAvailability).length, totalAssignments: trainerRows.reduce((total, trainer) => total + trainer.assignedCourses, 0), rows: trainerRows },
    payments: { revenue, paid: paidPayments.length, pending: pendingPayments.length, failed: failedPayments.length, refunded: refundedPayments.length, transactions: filteredPayments.length, statusCounts: { SUCCESS: paidPayments.length, PENDING: pendingPayments.length - createdPayments.length, CREATED: createdPayments.length, FAILED: failedPayments.length, REFUNDED: refundedPayments.length } },
    certificates: { total: filteredCertificates.length, issued: filteredCertificates.length },
    enrollments: { total: filteredEnrollments.length, active: filteredEnrollments.filter((item) => item.status === "ACTIVE").length, completed: filteredEnrollments.filter((item) => item.status === "COMPLETED").length, pending: filteredEnrollments.filter((item) => item.status === "PENDING").length, cancelled: filteredEnrollments.filter((item) => item.status === "CANCELLED").length, rows: filteredEnrollments.map((item) => ({ status: item.status, userId: item.userId, courseId: item.courseId, packageId: item.packageId, enrolledAt: item.enrolledAt })) },
    analytics: { trend, paymentStatus: [{ label: "Paid", value: paidPayments.length, status: "SUCCESS" }, { label: "Pending", value: pendingPayments.length, status: "PENDING" }, { label: "Failed", value: failedPayments.length, status: "FAILED" }, { label: "Refunded", value: refundedPayments.length, status: "REFUNDED" }], coursePerformance, recentActivity },
  };
}
