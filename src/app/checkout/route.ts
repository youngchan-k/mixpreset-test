import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: "/profile/credits?checkout_id={CHECKOUT_ID}&payment_success=true",
  server: "production",
});