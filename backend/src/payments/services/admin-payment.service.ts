import { db } from "../../prisma/db";

export async function listAdminPayments(filters?: {
  search?: string;
  status?: string;
  method?: string;
}) {
  const [
    payments,
    users,
    studentProfiles,
    enrollments,
    courses,
    packages,
    registrationIntents,
  ] = await Promise.all([
    db.orm.public.Payment.all(),
    db.orm.public.User.all(),
    db.orm.public.StudentProfile.all(),
    db.orm.public.Enrollment.all(),
    db.orm.public.Course.all(),
    db.orm.public.CoursePackage.all(),
    db.orm.public.RegistrationIntent.all(),
  ]);

  const userMap = new Map(
    users.map((user) => [user.id, user])
  );

  const profileMap = new Map(
    studentProfiles.map((profile) => [
      profile.userId,
      profile,
    ])
  );

  const enrollmentMap = new Map(
    enrollments.map((enrollment) => [
      enrollment.id,
      enrollment,
    ])
  );

  const courseMap = new Map(
    courses.map((course) => [
      course.id,
      course,
    ])
  );

  const packageMap = new Map(
    packages.map((pkg) => [
      pkg.id,
      pkg,
    ])
  );

  const registrationMap = new Map(
    registrationIntents.map((intent) => [
      intent.id,
      intent,
    ])
  );

  /*
   * ----------------------------------------------------------
   * Convert backend payment status to the terminology
   * already used by the Admin Payments UI.
   * ----------------------------------------------------------
   */
  function mapStatus(status: string) {
    switch (status) {
      case "SUCCESS":
        return "Paid";

      case "PENDING":
      case "CREATED":
        return "Pending";

      case "FAILED":
        return "Failed";

      case "REFUNDED":
        return "Refunded";

      default:
        return "Pending";
    }
  }

  /*
   * ----------------------------------------------------------
   * Payment method
   *
   * The Payment table stores the payment provider/method,
   * not the actual Razorpay instrument such as UPI/Card.
   *
   * Therefore RAZORPAY is represented as Other in the
   * existing Admin Payments UI until provider-level
   * instrument information is stored.
   * ----------------------------------------------------------
   */
  function mapMethod(method: string) {
  switch (method) {
    case "UPI":
      return "UPI";

    case "OTHER":
      return "Other";

    case "RAZORPAY":
      return "Razorpay";

    case "STRIPE":
    default:
      return "Other";
  }
}

  const allPaymentRows = payments.map((payment) => {
    const enrollment = payment.enrollmentId
      ? enrollmentMap.get(payment.enrollmentId)
      : null;

    const user = payment.userId
      ? userMap.get(payment.userId)
      : null;

    const profile = payment.userId
      ? profileMap.get(payment.userId)
      : null;

    const registrationIntent =
      payment.registrationIntentId
        ? registrationMap.get(
            payment.registrationIntentId
          )
        : null;

    const course =
      enrollment?.courseId
        ? courseMap.get(enrollment.courseId)
        : null;

    const coursePackage =
      enrollment?.packageId
        ? packageMap.get(enrollment.packageId)
        : registrationIntent?.packageId
          ? packageMap.get(
              registrationIntent.packageId
            )
          : null;

    const studentName =
      user?.name ??
      registrationIntent?.name ??
      "Unknown Student";

    const studentId =
      profile?.studentId ??
      "—";

    const courseTitle =
      course?.title ??
      coursePackage?.title ??
      "Package Registration";

    const transactionId =
      payment.providerPaymentId ??
      payment.providerOrderId ??
      `PAY-${payment.id}`;

    const paymentDate =
      payment.paidAt ??
      payment.createdAt;

    return {
      id: String(payment.id),

      studentName,

      studentId,

      email:
        user?.email ??
        registrationIntent?.email ??
        null,

      phone:
        user?.phone ??
        registrationIntent?.phone ??
        null,

      course: courseTitle,

      package:
        coursePackage?.title ??
        null,

      amount: payment.amount,

      currency: payment.currency,

      method: mapMethod(payment.method),

      methodRaw: payment.method,

      transactionId,

      providerOrderId:
        payment.providerOrderId,

      providerPaymentId:
        payment.providerPaymentId,

      paymentDate,

      status: mapStatus(payment.status),

      statusRaw: payment.status,

      registrationIntentId:
        payment.registrationIntentId,

      enrollmentId:
        payment.enrollmentId,

      userId:
        payment.userId,

      paidAt:
        payment.paidAt,

      createdAt:
        payment.createdAt,

      updatedAt:
        payment.updatedAt,
    };
  });

  /*
   * ----------------------------------------------------------
   * Summary is calculated from ALL payments.
   * This keeps the Admin dashboard cards stable even when
   * search/filter values are changed.
   * ----------------------------------------------------------
   */
  const summary = {
    transactionCount:
      allPaymentRows.length,

    totalRevenue:
      allPaymentRows
        .filter(
          (payment) =>
            payment.status === "Paid"
        )
        .reduce(
          (total, payment) =>
            total + payment.amount,
          0
        ),

    pendingAmount:
      allPaymentRows
        .filter(
          (payment) =>
            payment.status === "Pending"
        )
        .reduce(
          (total, payment) =>
            total + payment.amount,
          0
        ),

    paidAmount:
      allPaymentRows
        .filter(
          (payment) =>
            payment.status === "Paid"
        )
        .reduce(
          (total, payment) =>
            total + payment.amount,
          0
        ),

    paidCount:
      allPaymentRows.filter(
        (payment) =>
          payment.status === "Paid"
      ).length,

    pendingCount:
      allPaymentRows.filter(
        (payment) =>
          payment.status === "Pending"
      ).length,

    failedCount:
      allPaymentRows.filter(
        (payment) =>
          payment.status === "Failed"
      ).length,

    refundedCount:
      allPaymentRows.filter(
        (payment) =>
          payment.status === "Refunded"
      ).length,
  };

  /*
   * ----------------------------------------------------------
   * Apply search/filtering
   * ----------------------------------------------------------
   */
  const searchText =
    filters?.search
      ?.trim()
      .toLowerCase() ?? "";

  const requestedStatus =
    filters?.status
      ?.trim()
      .toLowerCase() ?? "";

  const requestedMethod =
    filters?.method
      ?.trim()
      .toLowerCase() ?? "";

  const filteredPayments =
    allPaymentRows
      .filter((payment) => {
        if (!searchText) {
          return true;
        }

        return (
          payment.studentName
            .toLowerCase()
            .includes(searchText) ||

          payment.studentId
            .toLowerCase()
            .includes(searchText) ||

          (payment.email ?? "")
            .toLowerCase()
            .includes(searchText) ||

          payment.course
            .toLowerCase()
            .includes(searchText) ||

          payment.transactionId
            .toLowerCase()
            .includes(searchText)
        );
      })
      .filter((payment) => {
        if (
          !requestedStatus ||
          requestedStatus === "all"
        ) {
          return true;
        }

        return (
          payment.status.toLowerCase() ===
          requestedStatus
        );
      })
      .filter((payment) => {
        if (
          !requestedMethod ||
          requestedMethod === "all"
        ) {
          return true;
        }

        return (
          payment.method.toLowerCase() ===
          requestedMethod
        );
      })
      .sort(
        (a, b) =>
          new Date(b.paymentDate).getTime() -
          new Date(a.paymentDate).getTime()
      );

  return {
    payments: filteredPayments,
    summary,
    total: filteredPayments.length,
  };
}




