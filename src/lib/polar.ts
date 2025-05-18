import { Polar } from "@polar-sh/sdk";

// Initialize the Polar API client
export const polarApi = new Polar({
  accessToken: process.env.NEXT_PUBLIC_POLAR_ACCESS_TOKEN!,
  server: "production", // Use "sandbox" for testing
});