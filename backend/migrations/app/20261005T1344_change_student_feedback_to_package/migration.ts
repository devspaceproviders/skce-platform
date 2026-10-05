import { db } from "../../prisma/db";

export type FeedbackStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export class FeedbackError extends Error {
  statusCode: number;

  constructor(
    message: string,
    statusCode = 400
  ) {
    super(message);
    this.name = "FeedbackError";
    this.statusCode = statusCode;
  }
}

/* ============================================================
   HELPERS
   ============================================================ */

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "S";
  }

  const first = parts[0];

  if (!first) {
    return "S";
  }

  if (parts.length === 1) {
    return first.substring(0, 2).toUpperCase();
  }

  const last = parts[parts.length - 1];

  if (!last) {
    return first.substring(0, 2).toUpperCase();
  }

  return (
    first.charAt(0) +
    last.charAt(0)
  ).toUpperCase();
}

function validateRating(value: unknown): number {
  const rating =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new FeedbackError(
      "Rating must be a whole number between 1 and 5."
    );
  }

  return rating;
}

function validatePackageId(
  value: unknown
): number {
  const packageId = Number(value);

  if (
    !Number.isInteger(packageId) ||
    packageId <= 0
  ) {
    throw new FeedbackError(
      "A valid package must be selected."
    );
  }

  return packageId;
}

function validateComment(
  value: unknown
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new FeedbackError(
      "Feedback comment is required."
    );
  }

  const comment = value.trim();

  if (comment.length < 5) {
    throw new FeedbackError(
      "Feedback must contain at least 5 characters."
    );
  }

  if (comment.length > 1000) {
    throw new FeedbackError(
      "Feedback cannot exceed 1000 characters."
    );
  }

  return comment;
}

/* ============================================================
   ENROLLED PACKAGES
   ============================================================ */

export async function getStudentEligiblePackages(
  userId: number
) {
  const user =
    await db.orm.public.User
      .where({
        id: userId,
      })
      .first();

  if (
    !user ||
    user.role !== "STUDENT"
  ) {
    throw new FeedbackError(
      "Student account not found.",
      404
    );
  }

  const enrollments =
    await db.orm.public.Enrollment.all();

  const packages =
    await db.orm.public.CoursePackage.all();

  const studentEnrollments =
    enrollments.filter(
      (enrollment) =>
        enrollment.userId === userId &&
        (
          enrollment.status === "ACTIVE" ||
          enrollment.status === "COMPLETED"
        ) &&
        enrollment.packageId
    );

  const enrolledPackageIds =
    new Set<number>();

  for (
    const enrollment of studentEnrollments
  ) {
    if (enrollment.packageId) {
      enrolledPackageIds.add(
        enrollment.packageId
      );
    }
  }

  return packages
    .filter((pkg) =>
      enrolledPackageIds.has(pkg.id)
    )
    .filter((pkg) => pkg.isActive)
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    .map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      imageUrl: pkg.imageUrl,
    }));
}

/* ============================================================
   STUDENT FEEDBACK
   ============================================================ */

export async function getStudentFeedback(
  userId: number
) {
  const packages =
    await getStudentEligiblePackages(
      userId
    );

  const feedback =
    await db.orm.public.StudentFeedback.all();

  const packageIds = new Set(
    packages.map((pkg) => pkg.id)
  );

  const studentFeedback =
    feedback
      .filter(
        (item) =>
          item.userId === userId &&
          packageIds.has(item.packageId)
      )
      .sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );

  return {
    packages,
    feedback: studentFeedback,
  };
}

export async function createStudentFeedback(
  userId: number,
  input: {
    packageId?: unknown;
    rating?: unknown;
    comment?: unknown;
  }
) {
  const packageId =
    validatePackageId(input.packageId);

  const rating =
    validateRating(input.rating);

  const comment =
    validateComment(input.comment);

  const eligiblePackages =
    await getStudentEligiblePackages(
      userId
    );

  const pkg = eligiblePackages.find(
    (item) => item.id === packageId
  );

  if (!pkg) {
    throw new FeedbackError(
      "You can only submit feedback for a package you are enrolled in.",
      403
    );
  }

  const existingFeedback =
    await db.orm.public.StudentFeedback
      .where({
        userId,
        packageId,
      })
      .first();

  if (existingFeedback) {
    throw new FeedbackError(
      "You have already submitted feedback for this package."
    );
  }

  const created =
    await db.orm.public.StudentFeedback.create(
      {
        userId,
        packageId,
        rating,
        comment,
        status: "PENDING",
      }
    );

  return created;
}

/* ============================================================
   PUBLIC TESTIMONIALS
   ============================================================ */

export async function getApprovedTestimonials() {
  const feedback =
    await db.orm.public.StudentFeedback.all();

  const approvedFeedback =
    feedback.filter(
      (item) =>
        item.status === "APPROVED"
    );

  const users =
    await db.orm.public.User.all();

  const packages =
    await db.orm.public.CoursePackage.all();

  return approvedFeedback
    .sort(
      (a, b) =>
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
    )
    .map((item) => {
      const user = users.find(
        (candidate) =>
          candidate.id === item.userId
      );

      const pkg = packages.find(
        (candidate) =>
          candidate.id === item.packageId
      );

      if (!user || !pkg) {
        return null;
      }

      return {
        id: item.id,
        studentName: user.name,
        initials: getInitials(
          user.name
        ),
        course: pkg.name,
        rating: item.rating,
        quote: item.comment,
      };
    })
    .filter(
      (
        item
      ): item is NonNullable<
        typeof item
      > => item !== null
    );
}

/* ============================================================
   ADMIN
   ============================================================ */

export async function getAdminFeedback() {
  const feedback =
    await db.orm.public.StudentFeedback.all();

  const users =
    await db.orm.public.User.all();

  const packages =
    await db.orm.public.CoursePackage.all();

  return feedback
    .sort(
      (a, b) =>
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
    )
    .map((item) => {
      const user = users.find(
        (candidate) =>
          candidate.id === item.userId
      );

      const pkg = packages.find(
        (candidate) =>
          candidate.id === item.packageId
      );

      return {
        id: item.id,
        userId: item.userId,
        studentName:
          user?.name ?? "Unknown Student",
        studentEmail:
          user?.email ?? null,
        packageId: item.packageId,
        packageName:
          pkg?.name ?? "Unknown Package",
        rating: item.rating,
        comment: item.comment,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
}

export async function updateFeedbackStatus(
  feedbackId: number,
  status: unknown
) {
  const id = Number(feedbackId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new FeedbackError(
      "Invalid feedback ID."
    );
  }

  if (
    status !== "PENDING" &&
    status !== "APPROVED" &&
    status !== "REJECTED"
  ) {
    throw new FeedbackError(
      "Invalid feedback status."
    );
  }

  const existing =
    await db.orm.public.StudentFeedback
      .where({
        id,
      })
      .first();

  if (!existing) {
    throw new FeedbackError(
      "Feedback not found.",
      404
    );
  }

  const updated =
    await db.orm.public.StudentFeedback
      .where({
        id,
      })
      .update({
        status,
      });

  if (!updated) {
    throw new FeedbackError(
      "Feedback status could not be updated.",
      500
    );
  }

  return {
    ...existing,
    status,
  };
}