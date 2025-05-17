import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  ScanCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { CreditTransactionType, recordCreditTransaction } from './creditTracking';

// Initialize DynamoDB clients
const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY as string,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Table name for downloads
const DOWNLOADS_TABLE = 'UserDownloadDB';

// Free re-download window in milliseconds (3 days)
export const FREE_REDOWNLOAD_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export interface DownloadRecord {
  id: string;           // Composite key: userId#downloadId
  userId: string;       // User's Firebase UID
  userEmail: string;    // User's email address
  presetId: string;     // Preset ID
  presetName: string;   // Human readable preset name
  presetCategory: string; // Premium, Vocal Chain, Instrument
  downloadTime: number; // Unix timestamp in milliseconds
  downloadUrl?: string; // Optional signed URL for re-download
  fileName: string;     // Name of the downloaded file
  expiryTime?: number;  // Optional URL expiry time
  credits?: number;     // Number of credits spent for the download
}

/**
 * Checks if a preset was downloaded within the free re-download window
 */
export function isWithinFreeRedownloadWindow(downloadTime: number): boolean {
  const now = Date.now();
  const timeDiff = now - downloadTime;

  return timeDiff <= FREE_REDOWNLOAD_WINDOW_MS;
}

/**
 * Gets the most recent download of a preset by a user
 */
export async function getMostRecentDownload(userId: string, presetId: string): Promise<DownloadRecord | null> {
  try {
    const downloads = await getUserDownloadHistory(userId);

    // Filter by presetId
    const presetDownloads = downloads.filter(download => download.presetId === presetId);

    if (presetDownloads.length === 0) {
      return null;
    }

    // Sort by download time (most recent first)
    presetDownloads.sort((a, b) => b.downloadTime - a.downloadTime);

    return presetDownloads[0];
  } catch (error) {
    console.error("[DownloadTracking] Error getting most recent download:", error);
    return null;
  }
}

/**
 * Checks if a preset is eligible for free re-download
 */
export async function isFreeRedownloadEligible(userId: string, presetId: string): Promise<boolean> {
  try {
    // Get the most recent download of this preset
    const mostRecentDownload = await getMostRecentDownload(userId, presetId);

    if (!mostRecentDownload) {
      return false; // No previous download, so not eligible
    }

    // Check if the download is within the free re-download window
    const isEligible = isWithinFreeRedownloadWindow(mostRecentDownload.downloadTime);

    return isEligible;
  } catch (error) {
    console.error("[DownloadTracking] Error checking free re-download eligibility:", error);
    return false;
  }
}

/**
 * Deletes a download record by ID
 */
export async function deleteDownloadRecord(id: string): Promise<boolean> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: DOWNLOADS_TABLE,
        Key: { id }
      })
    );
    return true;
  } catch (error) {
    console.error("[DownloadTracking] Error deleting download record:", error);
    return false;
  }
}

/**
 * Records a preset download in DynamoDB
 */
export async function recordDownload(
  userId: string,
  presetId: string,
  presetName: string,
  presetCategory: string,
  downloadUrl?: string,
  userEmail?: string,
  fileName?: string,
  expiryTime?: number,
  credits?: number,
  recordForPricing: boolean = false
): Promise<string> {
  try {
    // Skip recording free downloads in download history
    const creditValue = credits !== undefined && typeof credits === 'number' ? credits : 1;
    if (creditValue === 0 && !recordForPricing) {
      // Return a dummy ID for free downloads that aren't recorded
      return `free_download_${Date.now()}`;
    }

    // Generate a unique download ID (timestamp for uniqueness)
    const downloadId = `download_${Date.now()}`;
    const timestamp = Date.now();

    // Create a composite primary key
    const id = `${userId}#${downloadId}`;

    // Ensure downloadUrl is stored safely - if it's a URL,
    // we'll extract and store just the S3 key to avoid storing full URLs
    let storedDownloadUrl = downloadUrl;

    if (downloadUrl) {
      if (downloadUrl.startsWith('http')) {
        // This is a URL, extract just the key part
        try {
          // Parse the URL
          const url = new URL(downloadUrl);

          // If it's from S3, extract the key
          if (url.host && url.host.includes('s3')) {
            // Extract the key from the pathname
            // Format is usually /bucket-name/key or just /key
            const pathnameParts = url.pathname.split('/').filter(Boolean);

            // If we can identify the bucket name in the path, remove it
            if (pathnameParts.length > 1) {
              // Just store the path without bucket dependency
              storedDownloadUrl = pathnameParts.join('/');
            }
          } else {
            // For non-S3 URLs, we store the original URL
            // But truncate very long URLs
            if (downloadUrl.length > 1000) {
              storedDownloadUrl = downloadUrl.substring(0, 1000);
            }
          }
        } catch (urlError) {
          console.error(`[DownloadTracking] Error parsing URL: ${urlError}`);
          // Still store something useful
          storedDownloadUrl = downloadUrl.substring(0, 1000); // Truncate very long URLs
        }
      }
    }

    // Check if this is potentially an individual preset download or a full preset
    // If so, get the proper name from the parent preset
    let finalPresetName = presetName;
    let basePresetId = presetId;

    // For individual preset or full preset, extract the base preset ID (without suffix)
    if (presetId.endsWith('_full') || /.*_\d+$/.test(presetId)) {
      // Extract the base name (everything before the last underscore)
      const lastUnderscoreIndex = presetId.lastIndexOf('_');
      if (lastUnderscoreIndex > 0) {
        basePresetId = presetId.substring(0, lastUnderscoreIndex);
      }
    }

    // Try to get the parent preset download record for consistent naming
    try {
      // Get all downloads for this user
      const userDownloads = await getUserDownloadHistory(userId);

      // Look for the parent preset or any preset with this base ID
      const parentPreset = userDownloads.find(download =>
        download.presetId === basePresetId ||
        (download.presetId.startsWith(basePresetId) &&
         !download.presetId.endsWith('_full') &&
         !(/.*_\d+$/.test(download.presetId)))
      );

      if (parentPreset) {
        finalPresetName = parentPreset.presetName;
      }
    } catch (error) {
      console.error(`[DownloadTracking] Error finding parent preset name:`, error);
      // Continue with the original name
    }

    // Create record - ensure credits are always tracked
    // If credits parameter is not provided, default to 1 for a standard download
    // Make sure we're dealing with a number
    const finalCredits = recordForPricing ? 0 : (credits !== undefined && typeof credits === 'number' ? credits : 1);

    // Validate preset category - ensure it's one of the allowed categories
    let validatedCategory = presetCategory;
    if (!['Premium', 'Vocal Chain', 'Instrument'].includes(presetCategory)) {
      // Default to Premium if the category isn't recognized
      validatedCategory = 'Premium';
    }

    // Log credit information clearly
    if (finalCredits > 0) {
      // Record the credit transaction in the credit tracking system
      try {
        await recordCreditTransaction(
          userId,
          userEmail || 'anonymous@user.com',
          CreditTransactionType.DOWNLOAD,
          -finalCredits, // Negative for deduction
          `Download of ${presetName} (${presetId})`,
          downloadId
        );
      } catch (trackingError) {
        console.error("[DownloadTracking] Error recording credit transaction:", trackingError);
        // Continue even if tracking fails - we still record the download
      }
    }

    const downloadRecord: DownloadRecord = {
      id,
      userId,
      userEmail: userEmail || 'anonymous@user.com',
      presetId,
      presetName: finalPresetName,
      presetCategory: validatedCategory,
      downloadTime: timestamp,
      downloadUrl: storedDownloadUrl,
      fileName: fileName || finalPresetName,
      expiryTime,
      credits: finalCredits
    };

    // Write to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: DOWNLOADS_TABLE,
        Item: downloadRecord
      })
    );

    return downloadId;
  } catch (error) {
    console.error("[DownloadTracking] Error recording download:", error);
    throw error;
  }
}

/**
 * Retrieves a user's download history
 */
export async function getUserDownloadHistory(userId: string): Promise<DownloadRecord[]> {
  try {
    // Query all downloads for this user
    try {
      // First try with the GSI approach
      const response = await docClient.send(
        new QueryCommand({
          TableName: DOWNLOADS_TABLE,
          IndexName: "UserIdIndex", // Requires a GSI on the userId attribute
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          },
          ScanIndexForward: false // Most recent first
        })
      );

      return (response.Items || []) as DownloadRecord[];
    } catch (indexError: any) {
      // If GSI doesn't exist, fall back to scanning
      const scanResponse = await docClient.send(
        new ScanCommand({
          TableName: DOWNLOADS_TABLE,
          FilterExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          }
        })
      );

      return (scanResponse.Items || []) as DownloadRecord[];
    }
  } catch (error) {
    console.error("[DownloadTracking] Error retrieving user download history:", error);
    throw error;
  }
}

/**
 * Gets a specific download record
 */
export async function getDownloadRecord(id: string): Promise<DownloadRecord | null> {
  try {
    const response = await docClient.send(
      new GetCommand({
        TableName: DOWNLOADS_TABLE,
        Key: { id }
      })
    );

    return response.Item as DownloadRecord || null;
  } catch (error) {
    console.error("[DownloadTracking] Error retrieving download record:", error);
    throw error;
  }
}

/**
 * Groups downloads by preset category
 */
export function groupDownloadsByCategory(downloads: DownloadRecord[]): Record<string, DownloadRecord[]> {
  return downloads.reduce((grouped, download) => {
    const category = download.presetCategory;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(download);
    return grouped;
  }, {} as Record<string, DownloadRecord[]>);
}

/**
 * Gets all download records (admin only)
 */
export async function getAllDownloadRecords(limit: number = 100): Promise<DownloadRecord[]> {
  try {
    // Scan the table to get all records
    // Note: This is not efficient for large tables - would need pagination
    const response = await docClient.send(
      new ScanCommand({
        TableName: DOWNLOADS_TABLE,
        Limit: limit
      })
    );

    return (response.Items || []) as DownloadRecord[];
  } catch (error) {
    console.error("[DownloadTracking] Error retrieving all download records:", error);
    throw error;
  }
}

/**
 * Formats a download timestamp
 */
export function formatDownloadDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Calculates and formats the remaining time for free re-download
 * Returns a formatted string or "Expired" if the free re-download period has ended
 */
export function formatRemainingRedownloadTime(downloadTime: number): string {
  const now = Date.now();
  const timeDiff = now - downloadTime;

  // If already expired
  if (timeDiff >= FREE_REDOWNLOAD_WINDOW_MS) {
    return "Expired";
  }

  // Calculate remaining time
  const remainingMs = FREE_REDOWNLOAD_WINDOW_MS - timeDiff;
  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  // Format based on time remaining
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m remaining`;
  } else {
    return "Less than 1m remaining";
  }
}

/**
 * Formats a preset name for display
 * Makes sure the name matches the preset.title format used in PresetSync.tsx
 */
export function formatPresetNameForDisplay(presetName: string): string {
  // If presetName is undefined or null, return a default value
  if (!presetName) {
    return 'Untitled Preset';
  }

  // If the name is already properly formatted (e.g., obtained from metadata), return it as is
  if (!presetName.includes('_')) {
    return presetName;
  }

  // Handle special cases based on preset ID format
  const parts = presetName.split('_');

  // For instrument presets, format them specially
  if (parts[0] === 'instrument' && parts.length >= 3) {
    // For instrument presets, we want to format as "Type Name" (e.g., "Synth Serum")
    return `${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)} ${parts[2].charAt(0).toUpperCase() + parts[2].slice(1)}`;
  }

  // For vocal presets with proper structure, format them nicely
  if (parts[0] === 'vocal' && parts.length >= 3) {
    // For vocal_chain, use a proper format
    if (parts[1] === 'chain') {
      // Extract the meaningful part (after chain_)
      const meaningfulParts = parts.slice(2);
      if (meaningfulParts.length > 0) {
        return meaningfulParts
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }
  }

  // Otherwise, attempt to format it nicely
  return presetName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Deletes all expired download records for a user
 * Returns the number of records deleted
 */
export async function deleteExpiredUserDownloads(userId: string): Promise<number> {
  try {
    const downloads = await getUserDownloadHistory(userId);

    if (downloads.length === 0) {
      return 0;
    }

    // Calculate which downloads are expired
    const now = Date.now();
    const expiredDownloads = downloads.filter(download => {
      const timeSince = now - download.downloadTime;
      return timeSince > FREE_REDOWNLOAD_WINDOW_MS;
    });

    if (expiredDownloads.length === 0) {
      return 0;
    }

    // Delete each expired download record
    const deletePromises = expiredDownloads.map(download => deleteDownloadRecord(download.id));
    await Promise.all(deletePromises);

    return expiredDownloads.length;
  } catch (error) {
    console.error("[DownloadTracking] Error deleting expired user downloads:", error);
    return 0;
  }
}

/**
 * Calculate total credits used from UserDownloadDB
 * This is the primary implementation that should be used throughout the application
 * for consistent credit calculations.
 */
export async function calculateUsedCredits(userId: string): Promise<number> {
  try {
    // Get all downloads for this user directly
    const downloads = await getUserDownloadHistory(userId);

    // Group by presetId to detect and handle potential duplicates
    const presetCredits = new Map<string, number>();

    // First pass: collect all credit usages by preset
    downloads.forEach(download => {
      // Make sure we're dealing with a number and not counting records for pricing only
      const creditAmount = typeof download.credits === 'number' ? download.credits : 0;

      // Skip records with 0 credits (free downloads or for pricing only)
      if (creditAmount > 0) {
        const presetId = download.presetId;
        // Keep track of the highest credit amount for each preset (in case of duplicates)
        const currentAmount = presetCredits.get(presetId) || 0;
        presetCredits.set(presetId, Math.max(currentAmount, creditAmount));
      }
    });

    // Calculate total by summing up the credits for each unique preset
    let totalCredits = 0;
    presetCredits.forEach((credits, presetId) => {
      totalCredits += credits;
    });

    return totalCredits;
  } catch (error) {
    console.error("[DownloadTracking] Error calculating used credits:", error);
    console.error("[DownloadTracking] Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    // Return 0 in case of error to avoid blocking downloads
    return 0;
  }
}