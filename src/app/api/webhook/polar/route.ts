import { Webhooks } from "@polar-sh/nextjs";
import { recordPayment } from "@/lib/paymentTracking";

// Define interface for Polar.sh order payload
interface PolarOrderPayload {
  metadata?: Record<string, string>;
  amount?: number;
  [key: string]: any; // Allow other properties
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET || '',
  onOrderCreated: async (order) => {
    // Handle successful order
    try {
      console.log("Polar webhook - order created:", order);

      // Type assertion to use our interface
      const polarOrder = order as unknown as PolarOrderPayload;

      // Extract user info from order metadata
      if (polarOrder.metadata && typeof polarOrder.metadata === 'object') {
        const metadata = polarOrder.metadata;
        const userId = metadata.userId;
        const userEmail = metadata.userEmail;
        const planName = metadata.planName;
        const credits = Number(metadata.credits || 0);

        if (userId && userEmail && planName && credits) {
          // Record payment in your system
          await recordPayment(
            userId,
            userEmail,
            planName,
            'one-time',
            polarOrder.amount ? Number(polarOrder.amount) / 100 : 0, // Convert from cents to dollars
            credits,
            'Polar.sh'
          );
        }
      }
    } catch (error) {
      console.error("Error processing Polar webhook:", error);
    }
  },
});