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

  // 4. Create a unique Razorpay receipt
  const receipt = `SKCE-REG-${registrationIntent.id}-${Date.now()}`;

  // 5. Create Razorpay order
  const razorpayOrder =
    await createRazorpayOrder(
      amount,
      receipt
    );

  // 6. Store the Razorpay order against the registration intent
  await db.orm.public.RegistrationIntent
    .where({
      id: registrationIntent.id,
    })
    .update({
      razorpayOrderId: razorpayOrder.id,
      status: "CREATED",
    });

  // 7. Create our internal payment record
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