import { Polar } from "@polar-sh/sdk";

// Initialize the Polar API client
export const polarApi = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox', // Use sandbox for development, production for production
});