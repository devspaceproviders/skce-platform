import type { Request, Response } from "express";
import { getAdminReports } from "../services/admin-reports.service";
import type { ReportRange } from "../services/admin-reports.service";
const VALID_RANGES: ReportRange[] = ["today", "this-week", "this-month", "last-month", "this-year", "all"];
export async function getAdminReportsController(req: Request, res: Response) {
  try {
    const requestedRange = typeof req.query.range === "string" ? req.query.range : "this-month";
    const range: ReportRange = VALID_RANGES.includes(requestedRange as ReportRange) ? requestedRange as ReportRange : "this-month";
    const courseId = typeof req.query.courseId === "string" && req.query.courseId.trim().length > 0 ? Number(req.query.courseId) : null;
    const packageId = typeof req.query.packageId === "string" && req.query.packageId.trim().length > 0 ? Number(req.query.packageId) : null;
    if (courseId !== null && (!Number.isInteger(courseId) || courseId <= 0)) return res.status(400).json({ success: false, message: "Invalid courseId" });
    if (packageId !== null && (!Number.isInteger(packageId) || packageId <= 0)) return res.status(400).json({ success: false, message: "Invalid packageId" });
    const data = await getAdminReports(range, courseId, packageId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Admin reports error:", error);
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load admin reports" });
  }
}
