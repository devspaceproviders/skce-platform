import Razorpay from "razorpay";

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function createRazorpayOrder(
  amount: number,
  receipt: string
) {
  const razorpay = getRazorpayClient();

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt,
  });

  return order;
}