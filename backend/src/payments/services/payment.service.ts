import { db } from "../../prisma/db";
import { createRazorpayOrder } from "./razorpay.service";

export async function createPaymentOrder(
  registrationIntentId: number
) {
  // 1. Find the registration intent
  const registrationIntent =
    await db.orm.public.RegistrationIntent.first({
      id: registrationIntentId,
    });

  if (!registrationIntent) {
    throw new Error("Registration intent not found");
  }

  // 2. Make sure this intent has not already been paid
  if (registrationIntent.status === "PAID") {
    throw new Error(
      "This registration has already been completed"
    );
  }

  // 3. Find the selected package
  const coursePackage =
    await db.orm.public.CoursePackage.first({
      id: registrationIntent.packageId,
    });

  if (!coursePackage || !coursePackage.isActive) {
    throw new Error("Package not found");
  }

  const amount = coursePackage.price;

  // 4. Check whether an internal payment already exists
  //    for this registration intent.
  //
  //    Payment.registrationIntentId is unique in the database,
  //    so we must reuse the existing payment/order instead
  //    of creating another Payment record.
  const existingPayment =
    await db.orm.public.Payment.first({
      registrationIntentId:
        registrationIntent.id,
    });

  if (
    existingPayment &&
    existingPayment.status === "SUCCESS"
  ) {
    throw new Error(
      "This registration has already been completed"
    );
  }

  // 5. If a previous Razorpay order already exists,
  //    reuse it instead of creating another Razorpay order.
  //
  //    This allows the student to close Checkout and try again
  //    without creating duplicate Payment records/orders.
  if (
    existingPayment &&
    existingPayment.status === "CREATED" &&
    existingPayment.providerOrderId &&
    registrationIntent.razorpayOrderId ===
      existingPayment.providerOrderId
  ) {
    return {
      payment: existingPayment,

      order: {
        id: existingPayment.providerOrderId,
        amount: existingPayment.amount * 100,
        currency: existingPayment.currency,
      },

      registrationIntent: {
        id: registrationIntent.id,
        name: registrationIntent.name,
        email: registrationIntent.email,
        phone: registrationIntent.phone,
      },

      package: {
        id: coursePackage.id,
        slug: coursePackage.slug,
        title: coursePackage.title,
        price: coursePackage.price,
      },
    };
  }

  // 6. Create a unique Razorpay receipt
  const receipt = `SKCE-REG-${registrationIntent.id}-${Date.now()}`;

  // 7. Create Razorpay order
  const razorpayOrder =
    await createRazorpayOrder(
      amount,
      receipt
    );

  // 8. Store the Razorpay order against the registration intent
  await db.orm.public.RegistrationIntent
    .where({
      id: registrationIntent.id,
    })
    .update({
      razorpayOrderId: razorpayOrder.id,
      status: "CREATED",
    });

  // 9. Create our internal payment record
  //
  //    This happens only when there isn't already
  //    a reusable CREATED payment.
  const payment =
    await db.orm.public.Payment.create({
      registrationIntentId:
        registrationIntent.id,

      amount,
      currency: "INR",

      method: "RAZORPAY",
      status: "CREATED",

      providerOrderId:
        razorpayOrder.id,
    });

  return {
    payment,
    order: razorpayOrder,

    registrationIntent: {
      id: registrationIntent.id,
      name: registrationIntent.name,
      email: registrationIntent.email,
      phone: registrationIntent.phone,
    },

    package: {
      id: coursePackage.id,
      slug: coursePackage.slug,
      title: coursePackage.title,
      price: coursePackage.price,
    },
  };
}