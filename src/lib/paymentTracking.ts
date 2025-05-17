import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { calculateUsedCredits } from './downloadTracking';
import { CreditTransactionType, validateUserCredits, recordCreditTransaction } from './creditTracking';

// Initialize DynamoDB clients
const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY as string,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Table name for payments
const PAYMENTS_TABLE = 'UserPaymentDB';

export interface PaymentRecord {
  id: string;           // Composite key: userId#paymentId
  userId: string;       // User's Firebase UID
  userEmail: string;    // User's email address
  planName: string;     // Name of the plan purchased
  priceType: string;    // 'one-time'
  priceAmount: number;  // Cost in dollars
  credits: number;      // Number of credits received
  purchaseTime: number; // Unix timestamp in milliseconds
  paymentMethod?: string; // Method used for payment (PayPal, Account Transfer, Polar.sh)
  transactionId?: string; // External transaction ID (e.g., PayPal transaction ID)
  paymentDetails?: any;  // Additional payment details
}

/**
 * Records a payment in DynamoDB
 */
export async function recordPayment(
  userId: string,
  userEmail: string,
  planName: string,
  priceType: string,
  priceAmount: number,
  credits: number,
  paymentMethod?: string,
  transactionId?: string,
  paymentDetails?: any
): Promise<string> {
  try {
    // Generate a unique payment ID (timestamp for uniqueness)
    const paymentId = `payment_${Date.now()}`;
    const timestamp = Date.now();

    // Create a composite primary key
    const id = `${userId}#${paymentId}`;

    // Create record
    const paymentRecord: PaymentRecord = {
      id,
      userId,
      userEmail,
      planName,
      priceType,
      priceAmount,
      credits,
      purchaseTime: timestamp,
      paymentMethod
    };

    // Add transaction ID if provided
    if (transactionId) {
      paymentRecord.transactionId = transactionId;
    }

    // Add payment details if provided
    if (paymentDetails) {
      paymentRecord.paymentDetails = paymentDetails;
    }

    // Record the credit transaction in the credit tracking system
    if (credits > 0) {
      try {
        await recordCreditTransaction(
          userId,
          userEmail,
          CreditTransactionType.PURCHASE,
          credits, // Positive for addition
          `Purchase of ${planName} for $${priceAmount}`,
          paymentId
        );
      } catch (trackingError) {
        console.error("[PaymentTracking] Error recording credit transaction:", trackingError);
        // Continue even if tracking fails - we still record the payment
      }
    }

    // Write to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: PAYMENTS_TABLE,
        Item: paymentRecord
      })
    );

    return paymentId;
  } catch (error) {
    console.error("[PaymentTracking] Error recording payment:", error);
    throw error;
  }
}

/**
 * Retrieves a user's payment history
 */
export async function getUserPaymentHistory(userId: string): Promise<PaymentRecord[]> {
  try {
    // Query all payments for this user
    try {
      // First try with the GSI approach
      const response = await docClient.send(
        new QueryCommand({
          TableName: PAYMENTS_TABLE,
          IndexName: "UserIdIndex", // Requires a GSI on the userId attribute
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          },
          ScanIndexForward: false // Most recent first
        })
      );

      return (response.Items || []) as PaymentRecord[];
    } catch (indexError: any) {
      // If GSI doesn't exist, fall back to scanning
      const scanResponse = await docClient.send(
        new ScanCommand({
          TableName: PAYMENTS_TABLE,
          FilterExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          }
        })
      );

      return (scanResponse.Items || []) as PaymentRecord[];
    }
  } catch (error) {
    console.error("[PaymentTracking] Error retrieving user payment history:", error);
    throw error;
  }
}

/**
 * Gets a specific payment record
 */
export async function getPaymentRecord(id: string): Promise<PaymentRecord | null> {
  try {
    const response = await docClient.send(
      new GetCommand({
        TableName: PAYMENTS_TABLE,
        Key: { id }
      })
    );

    return response.Item as PaymentRecord || null;
  } catch (error) {
    console.error("[PaymentTracking] Error retrieving payment record:", error);
    throw error;
  }
}

/**
 * Gets all payment records (admin only)
 */
export async function getAllPaymentRecords(limit: number = 100): Promise<PaymentRecord[]> {
  try {
    // Scan the table to get all records
    // Note: This is not efficient for large tables - would need pagination
    const response = await docClient.send(
      new ScanCommand({
        TableName: PAYMENTS_TABLE,
        Limit: limit
      })
    );

    return (response.Items || []) as PaymentRecord[];
  } catch (error) {
    console.error("[PaymentTracking] Error retrieving all payment records:", error);
    throw error;
  }
}

/**
 * Calculates the total credits a user has purchased
 */
export async function calculateUserCredits(userId: string): Promise<number> {
  try {
    // Get all user's payment records
    const payments = await getUserPaymentHistory(userId);

    // Sum up credits from all payment records
    const totalCredits = payments.reduce((sum, payment) => sum + payment.credits, 0);

    return totalCredits;
  } catch (error) {
    console.error("[PaymentTracking] Error calculating user credits:", error);
    return 0;
  }
}

/**
 * Groups payment records by plan name
 */
export function groupPaymentsByType(payments: PaymentRecord[]): Record<string, PaymentRecord[]> {
  const result: Record<string, PaymentRecord[]> = {};

  for (const payment of payments) {
    const key = payment.planName;
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(payment);
  }

  return result;
}

/**
 * Formats a timestamp into a readable date string
 */
export function formatPaymentDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Deducts credits from a user's balance
 */
export async function deductUserCredits(
  userId: string,
  userEmail: string,
  creditsToDeduct: number,
  reason: string
): Promise<boolean> {
  try {
    // Check if user has sufficient credits
    const hasEnoughCredits = await validateUserCredits(userId, creditsToDeduct);
    if (!hasEnoughCredits) {
      console.error(`[PaymentTracking] Cannot deduct ${creditsToDeduct} credits - insufficient balance`);
      return false;
    }

    // Record the deduction
      await recordCreditTransaction(
        userId,
        userEmail,
      CreditTransactionType.DOWNLOAD, // Use DOWNLOAD type for deductions
        -creditsToDeduct, // Negative for deduction
      reason
      );

    return true;
  } catch (error) {
    console.error("[PaymentTracking] Error deducting user credits:", error);
    return false;
  }
}