import Razorpay from "razorpay";

export function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured."
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}