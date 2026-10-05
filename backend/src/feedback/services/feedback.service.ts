import { db } from "../../prisma/db";

export type FeedbackStatus =

  | "PENDING"

  | "APPROVED"

  | "REJECTED";

export class FeedbackError extends Error {

  statusCode: number;

  constructor(message: string, statusCode = 400) {

    super(message);

    this.name = "FeedbackError";

    this.statusCode = statusCode;

  }

}

function getInitials(name: string): string {

  const parts = name

    .trim()

    .split(/\s+/)

    .filter(Boolean);

  if (parts.length === 0) return "S";

  const first = parts[0];

  if (!first) return "S";

  if (parts.length === 1) {

    return first.substring(0, 2).toUpperCase();

  }

  const last = parts[parts.length - 1];

  if (!last) {

    return first.substring(0, 2).toUpperCase();

  }

  return (

    first.charAt(0) + last.charAt(0)

  ).toUpperCase();

}

function validateRating(value: unknown): number {

  const rating =

    typeof value === "number" ? value : Number(value);

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

function validatePackageId(value: unknown): number {

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

function validateComment(value: unknown): string {

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

/**

 * Returns the packages that the student is currently

 * enrolled in and is therefore eligible to review.

 */

export async function getStudentEligiblePackages(

  userId: number

) {

  const user = await db.orm.public.User

    .where({ id: userId })

    .first();

  if (!user || user.role !== "STUDENT") {

    throw new FeedbackError(

      "Student account not found.",

      404

    );

  }

  const enrollments =

    await db.orm.public.Enrollment.all();

  const packages =

    await db.orm.public.CoursePackage.all();

  const studentEnrollments = enrollments.filter(

    (enrollment) =>

      enrollment.userId === userId &&

      (enrollment.status === "ACTIVE" ||

        enrollment.status === "COMPLETED") &&

      enrollment.packageId

  );

  const enrolledPackageIds = new Set<number>();

  for (const enrollment of studentEnrollments) {

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

      a.title.localeCompare(b.title)

    )

    .map((pkg) => ({

      id: pkg.id,

      title: pkg.title,

      slug: pkg.slug,

      imageUrl: pkg.imageUrl,

    }));

}

/**

 * Returns eligible packages together with the

 * student's previously submitted feedback.

 */

export async function getStudentFeedback(

  userId: number

) {

  const packages =

    await getStudentEligiblePackages(userId);

  const feedback =

    await db.orm.public.StudentFeedback.all();

  const packageIds = new Set(

    packages.map((pkg) => pkg.id)

  );

  const studentFeedback = feedback

    .filter(

      (item) =>

        item.userId === userId &&

        packageIds.has(item.packageId)

    )

    .sort(

      (a, b) =>

        new Date(b.createdAt).getTime() -

        new Date(a.createdAt).getTime()

    );

  return {

    packages,

    feedback: studentFeedback,

  };

}

/**

 * Creates overall package / learning-experience feedback.

 *

 * Rules:

 * - No previous feedback -> create a new PENDING row.

 * - PENDING exists -> cannot submit again.

 * - APPROVED exists -> cannot submit again.

 * - Only REJECTED history exists -> create a new PENDING row.

 * - Previous REJECTED rows are never modified or deleted.

 */

export async function createStudentFeedback(

  userId: number,

  input: {

    packageId?: unknown;

    rating?: unknown;

    comment?: unknown;

  }

) {

  const packageId = validatePackageId(

    input.packageId

  );

  const rating = validateRating(

    input.rating

  );

  const comment = validateComment(

    input.comment

  );

  const eligiblePackages =

    await getStudentEligiblePackages(userId);

  const pkg = eligiblePackages.find(

    (item) => item.id === packageId

  );

  if (!pkg) {

    throw new FeedbackError(

      "You can only submit feedback for a package you are enrolled in.",

      403

    );

  }

  /*

   * A student can have multiple feedback records for the same

   * package so rejected submissions remain part of the

   * moderation history.

   *

   * Rules:

   * - Any PENDING record -> block a new submission.

   * - Any APPROVED record -> block a new submission.

   * - If all previous records are REJECTED -> create a new row.

   * - Never modify or delete a previous REJECTED row.

   */

  /*

   * A student can have multiple feedback records for the same

   * package so rejected submissions remain part of the

   * moderation history.

   *

   * Submission rules:

   * - Any PENDING record -> block a new submission.

   * - Any APPROVED record -> block a new submission.

   * - If all previous records are REJECTED -> create a new row.

   * - Never modify or delete a previous REJECTED row.

   */

  const existingFeedback =

    await db.orm.public.StudentFeedback

      .where({

        userId,

        packageId,

      })

      .all();

  const hasPendingFeedback = existingFeedback.some(

    (item) => item.status === "PENDING"

  );

  if (hasPendingFeedback) {

    throw new FeedbackError(

      "Your feedback for this package is already under review."

    );

  }

  const hasApprovedFeedback = existingFeedback.some(

    (item) => item.status === "APPROVED"

  );

  if (hasApprovedFeedback) {

    throw new FeedbackError(

      "Your feedback for this package has already been approved."

    );

  }

  /*

   * No PENDING or APPROVED record exists.

   *

   * This means the student either has no previous feedback

   * or all previous submissions were REJECTED.

   *

   * Always create a new row so previous moderation history

   * remains unchanged.

   */

  return await db.orm.public.StudentFeedback.create({

    userId,

    packageId,

    rating,

    comment,

    status: "PENDING",

  });

}

/**

 * Returns only approved feedback for the public

 * homepage testimonials section.

 */

export async function getApprovedTestimonials() {

  const feedback =

    await db.orm.public.StudentFeedback.all();

  const approvedFeedback = feedback.filter(

    (item) => item.status === "APPROVED"

  );

  const users =

    await db.orm.public.User.all();

  const packages =

    await db.orm.public.CoursePackage.all();

  return approvedFeedback

    .sort(

      (a, b) =>

        new Date(b.createdAt).getTime() -

        new Date(a.createdAt).getTime()

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

        initials: getInitials(user.name),

        profilePhotoUrl: user.profilePhotoUrl ?? null,

        // Kept as "course" so the existing

        // TestimonialCard continues to work.

        // The displayed value is now the package title.

        course: pkg.title,

        rating: item.rating,

        quote: item.comment,

      };

    })

    .filter(

      (

        item

      ): item is NonNullable<typeof item> =>

        item !== null

    );

}

/**

 * Returns all feedback for Admin review.

 */

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

        new Date(b.createdAt).getTime() -

        new Date(a.createdAt).getTime()

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

        profilePhotoUrl:

          user?.profilePhotoUrl ?? null,

        packageId: item.packageId,

        packageName:

          pkg?.title ?? "Unknown Package",

        rating: item.rating,

        comment: item.comment,

        status: item.status,

        createdAt: item.createdAt,

        updatedAt: item.updatedAt,

      };

    });

}

/**

 * Admin changes feedback moderation status.

 */

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

      .where({ id })

      .first();

  if (!existing) {

    throw new FeedbackError(

      "Feedback not found.",

      404

    );

  }

  const updated =

    await db.orm.public.StudentFeedback

      .where({ id })

      .update({ status });

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
