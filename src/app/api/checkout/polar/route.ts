import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.NEXT_PUBLIC_POLAR_ACCESS_TOKEN!,
  successUrl: "/profile/credits?checkout_id={CHECKOUT_ID}",
  // Use "sandbox" for testing
  server: "production",
});