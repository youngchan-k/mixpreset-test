import { calculateUserCredits, getUserPaymentHistory, PaymentRecord } from './paymentTracking';
import { calculateUsedCredits, getUserDownloadHistory, DownloadRecord } from './downloadTracking';


// Types of credit transactions (enum kept for function signature compatibility)
export enum CreditTransactionType {
  PURCHASE = 'PURCHASE',      // Credits added from purchasing a plan
  DOWNLOAD = 'DOWNLOAD',      // Credits deducted from downloading a preset
  ADJUSTMENT = 'ADJUSTMENT',  // Manual adjustment by admin
  EXPIRY = 'EXPIRY',          // Credits expired
  REFUND = 'REFUND'           // Credits refunded
}

// Interface kept for compatibility with existing code
export interface CreditTransaction {
  id: string;                     // Composite key: userId#transactionId
  userId: string;                 // User's Firebase UID
  userEmail: string;              // User's email address
  transactionType: CreditTransactionType; // Type of transaction
  amount: number;                 // Positive for additions, negative for deductions
  timestamp: number;              // When transaction occurred
  relatedId?: string;             // Related entity ID (preset/payment)
  description: string;            // Human-readable description
  balanceAfter?: number;          // Optional: User balance after this transaction
  verificationStatus?: boolean;   // Whether this transaction is verified against records
}

/**
 * Records a credit transaction by directly updating the appropriate table
 * For PURCHASE transactions, the actual recording happens in paymentTracking.recordPayment
 * For DOWNLOAD transactions, the actual recording happens in downloadTracking.recordDownload
 *
 * This function now serves as a pass-through for compatibility with existing code
 */
export async function recordCreditTransaction(
  userId: string,
  userEmail: string,
  transactionType: CreditTransactionType,
  amount: number,
  description: string,
  relatedId?: string
): Promise<string> {
  try {
    // Generate a unique transaction ID for return value compatibility
    const transactionId = `transaction_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return transactionId;
  } catch (error) {
    console.error("[CreditTracking] Error processing transaction:", error);
    throw error;
  }
}

/**
 * Retrieves a user's credit transaction history by querying both tables
 * This is a synthetic view created by combining payment and download records
 */
export async function getUserCreditHistory(userId: string): Promise<CreditTransaction[]> {
  try {
    // Get payment records (credits added)
    const paymentRecords = await getUserPaymentHistory(userId);

    // Get download records (credits used)
    const downloadRecords = await getUserDownloadHistory(userId);

    // Combine and sort all records chronologically
    const combinedHistory = [
      ...paymentRecords.map((record: PaymentRecord) => ({
        id: `${userId}#payment_${record.id}`,
        userId,
        userEmail: record.userEmail,
        transactionType: CreditTransactionType.PURCHASE,
        amount: record.credits,
        timestamp: record.purchaseTime,
        relatedId: record.id,
        description: `Purchase of ${record.planName} plan (${record.priceType})${record.paymentMethod ? ` via ${record.paymentMethod}` : ''} for $${record.priceAmount}`,
        verificationStatus: true
      })),
      ...downloadRecords.map((record: DownloadRecord) => ({
        id: `${userId}#download_${record.id}`,
        userId,
        userEmail: record.userEmail,
        transactionType: CreditTransactionType.DOWNLOAD,
        amount: -(record.credits || 0),
        timestamp: record.downloadTime,
        relatedId: record.id,
        description: `Download of ${record.presetName} (${record.presetCategory})`,
        verificationStatus: true
      }))
    ].sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp (newest first)

    return combinedHistory as CreditTransaction[];
  } catch (error) {
    console.error("[CreditTracking] Error retrieving credit history:", error);
    throw error;
  }
}

/**
 * Gets the current credit balance for a user by calculating purchased minus used credits
 * This is the recommended way to get the most accurate credit balance
 */
export async function getUserCreditBalance(userId: string): Promise<{
  available: number;
  purchased: number;
  used: number;
}> {
  try {
    // Get purchased credits from UserPaymentDB
    const purchasedCredits = await calculateUserCredits(userId);

    // Get used credits from UserDownloadDB
    const usedCredits = await calculateUsedCredits(userId);

    // Calculate available credits (never negative)
    const availableCredits = Math.max(0, purchasedCredits - usedCredits);

    return {
      available: availableCredits,
      purchased: purchasedCredits,
      used: usedCredits
    };
  } catch (error) {
    console.error("[CreditTracking] Error calculating user credit balance:", error);
    throw error;
  }
}

/**
 * Validates if a user has enough credits for a given operation
 * Returns true if sufficient credits available, false otherwise
 */
export async function validateUserCredits(
  userId: string,
  requiredCredits: number
): Promise<boolean> {
  if (requiredCredits <= 0) {
    return true; // No credits needed
  }

  try {
    const { available } = await getUserCreditBalance(userId);
    const hasEnoughCredits = available >= requiredCredits;

    if (!hasEnoughCredits) {
      console.error(`[CreditTracking] Credit validation failed: User ${userId} has ${available} credits, needs ${requiredCredits}`);
    }

    return hasEnoughCredits;
  } catch (error) {
    console.error("[CreditTracking] Error validating user credits:", error);
    return false; // Fail safely
  }
}

/**
 * Reconciles credit transactions against actual download and payment records
 * Used for admin verification and fixing inconsistencies
 */
export async function reconcileUserCredits(userId: string): Promise<{
  isConsistent: boolean;
  calculatedBalance: number;
  transactionBalance: number;
  diff: number;
}> {
  try {
    // Get the calculated balance directly from payment and download records
    const { available: calculatedBalance } = await getUserCreditBalance(userId);

    // For the transaction balance, we'll use the same calculation since there's no separate transactions table
    const transactionBalance = calculatedBalance;

    // Since we're using the same data source, these should always be consistent
    const diff = 0;
    const isConsistent = true;

    return {
      isConsistent,
      calculatedBalance,
      transactionBalance,
      diff
    };
  } catch (error) {
    console.error("[CreditTracking] Error reconciling user credits:", error);
    throw error;
  }
}