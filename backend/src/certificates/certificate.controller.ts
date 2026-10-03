import type { Response } from "express";
import fs from "node:fs";
import path from "node:path";

import type {
  AuthenticatedRequest,
} from "../auth/middleware/auth.middleware";

import { db } from "../prisma/db";
import { generateCertificatePdf } from "./certificate-pdf.service";

export async function getStudentCertificatesController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.userId;

    const certificates =
      await db.orm.public.Certificate.all();

    const userCertificates =
      certificates.filter(
        (certificate) =>
          certificate.userId === userId
      );

    const courses =
      await db.orm.public.Course.all();

    const packages =
      await db.orm.public.CoursePackage.all();

    const data = userCertificates
      .map((certificate) => {
        const course =
          certificate.courseId !== null
            ? courses.find(
                (item) =>
                  item.id ===
                  certificate.courseId
              )
            : null;

        const coursePackage =
          certificate.packageId !== null
            ? packages.find(
                (item) =>
                  item.id ===
                  certificate.packageId
              )
            : null;

        return {
          id: certificate.id,
          certificateNumber:
            certificate.certificateNumber,
          certificateType:
            certificate.certificateType,
          courseId:
            certificate.courseId,
          packageId:
            certificate.packageId,
          title:
            certificate.certificateType ===
            "PACKAGE"
              ? coursePackage?.title ??
                "Package Completion"
              : course?.title ??
                "Course Completion",
          issuedAt:
            certificate.issuedAt,
          certificateUrl:
            certificate.certificateUrl,
        };
      })
      .sort((a, b) => {
        return (
          new Date(
            String(b.issuedAt)
          ).getTime() -
          new Date(
            String(a.issuedAt)
          ).getTime()
        );
      });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get student certificates error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load certificates.",
    });
  }
}

/**
 * Regenerate an existing certificate PDF.
 *
 * IMPORTANT:
 * This does NOT create a new Certificate record.
 * It only regenerates the PDF for an existing
 * certificate belonging to the logged-in student.
 */
export async function regenerateStudentCertificateController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const certificateId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(certificateId) ||
      certificateId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid certificate ID.",
      });
    }

    const certificates =
      await db.orm.public.Certificate.all();

    const certificate =
      certificates.find(
        (item) =>
          item.id === certificateId &&
          item.userId ===
            req.user!.userId
      );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found.",
      });
    }

    const users =
      await db.orm.public.User.all();

    const user =
      users.find(
        (item) =>
          item.id ===
          certificate.userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Certificate owner not found.",
      });
    }

    const courses =
      await db.orm.public.Course.all();

    const packages =
      await db.orm.public.CoursePackage.all();

    const course =
      certificate.courseId !== null
        ? courses.find(
            (item) =>
              item.id ===
              certificate.courseId
          )
        : null;

    const coursePackage =
      certificate.packageId !== null
        ? packages.find(
            (item) =>
              item.id ===
              certificate.packageId
          )
        : null;

    const title =
      certificate.certificateType ===
      "PACKAGE"
        ? coursePackage?.title ??
          "Package Completion"
        : course?.title ??
          "Course Completion";

    const outputDirectory =
      path.join(
        process.cwd(),
        "uploads",
        "certificates"
      );

    fs.mkdirSync(outputDirectory, {
      recursive: true,
    });

    const fileName =
      `certificate-${certificate.id}.pdf`;

    const outputPath =
      path.join(
        outputDirectory,
        fileName
      );

    const pdfBuffer =
      await generateCertificatePdf({
        certificateNumber:
          certificate.certificateNumber,

        recipientName:
          user.name,

        courseTitle:
          title,

        issuedAt:
          String(certificate.issuedAt),
      });

    fs.writeFileSync(
      outputPath,
      pdfBuffer
    );

    const certificateUrl =
      `/uploads/certificates/${fileName}`;

    await db.orm.public.Certificate
      .where({
        id: certificate.id,
      })
      .update({
        certificateUrl,
      });

    return res.status(200).json({
      success: true,
      message:
        "Certificate PDF regenerated successfully.",
      data: {
        id: certificate.id,
        certificateNumber:
          certificate.certificateNumber,
        certificateUrl,
      },
    });
  } catch (error) {
    console.error(
      "Regenerate student certificate error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to regenerate certificate PDF.",
    });
  }
}