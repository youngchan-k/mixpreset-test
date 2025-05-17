import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  GetCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB clients
const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY as string,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Table name for favorites
const FAVORITES_TABLE = 'UserFavoriteDB';

export interface FavoriteRecord {
  id: string;           // Composite key: userId#presetId
  userId: string;       // User's Firebase UID
  userEmail: string;    // User's email address
  presetId: string;     // Preset ID
  presetName: string;   // Human readable preset name
  favoriteTime: number; // Unix timestamp in milliseconds
  category: string;     // Preset category
}

/**
 * Adds a preset to user's favorites in DynamoDB
 */
export async function addToFavorites(
  userId: string,
  presetId: string,
  presetName: string,
  category: string,
  userEmail?: string
): Promise<boolean> {
  try {
    if (!userId || !presetId) {
      console.error("[FavoritesTracking] Missing required userId or presetId");
      return false;
    }

    // Create a composite primary key
    const id = `${userId}#${presetId}`;
    const timestamp = Date.now();

    // Create record
    const favoriteRecord: FavoriteRecord = {
      id,
      userId,
      userEmail: userEmail || 'anonymous@user.com',
      presetId,
      presetName,
      favoriteTime: timestamp,
      category
    };

    // Write to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: FAVORITES_TABLE,
        Item: favoriteRecord
      })
    );

    return true;
  } catch (error) {
    console.error("[FavoritesTracking] Error adding to favorites:", error);
    return false;
  }
}

/**
 * Removes a preset from user's favorites in DynamoDB
 */
export async function removeFromFavorites(
  userId: string,
  presetId: string
): Promise<boolean> {
  try {
    if (!userId || !presetId) {
      console.error("[FavoritesTracking] Missing required userId or presetId");
      return false;
    }

    // Create the composite key
    const id = `${userId}#${presetId}`;

    // Delete from DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: FAVORITES_TABLE,
        Key: { id }
      })
    );

    return true;
  } catch (error) {
    console.error("[FavoritesTracking] Error removing from favorites:", error);
    return false;
  }
}

/**
 * Gets all favorite presets for a user
 */
export async function getUserFavorites(userId: string): Promise<FavoriteRecord[]> {
  try {
    if (!userId) {
      console.error("[FavoritesTracking] Missing required userId");
      return [];
    }

    // Query for all user's favorites using GSI
    try {
      const response = await docClient.send(
        new QueryCommand({
          TableName: FAVORITES_TABLE,
          IndexName: "UserIdIndex", // Requires a GSI on the userId attribute
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          }
        })
      );

      return (response.Items || []) as FavoriteRecord[];
    } catch (indexError: any) {
      // If GSI doesn't exist, fall back to scanning
      const scanResponse = await docClient.send(
        new ScanCommand({
          TableName: FAVORITES_TABLE,
          FilterExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          }
        })
      );

      return (scanResponse.Items || []) as FavoriteRecord[];
    }
  } catch (error) {
    console.error("[FavoritesTracking] Error getting user favorites:", error);
    return [];
  }
}

/**
 * Checks if a specific preset is in the user's favorites
 */
export async function isPresetFavorited(userId: string, presetId: string): Promise<boolean> {
  try {
    if (!userId || !presetId) {
      console.error("[FavoritesTracking] Missing required userId or presetId");
      return false;
    }

    // Create the composite key
    const id = `${userId}#${presetId}`;

    const response = await docClient.send(
      new GetCommand({
        TableName: FAVORITES_TABLE,
        Key: { id }
      })
    );

    return !!response.Item;
  } catch (error) {
    console.error("[FavoritesTracking] Error checking if preset is favorited:", error);
    return false;
  }
}

/**
 * Syncs favorites from DynamoDB to localStorage
 * This helps maintain compatibility with existing code
 */
export async function syncFavoritesToLocalStorage(userId: string): Promise<Record<string, boolean>> {
  try {
    if (!userId || typeof window === 'undefined') {
      return {};
    }

    const favorites = await getUserFavorites(userId);

    // Convert to the format used in localStorage: { presetId: true }
    const favoritesObj = favorites.reduce((acc, favorite) => {
      acc[favorite.presetId] = true;
      return acc;
    }, {} as Record<string, boolean>);

    // Update localStorage
    localStorage.setItem('user_favorites', JSON.stringify(favoritesObj));

    return favoritesObj;
  } catch (error) {
    console.error("[FavoritesTracking] Error syncing favorites to localStorage:", error);
    return {};
  }
}

/**
 * Sync existing localStorage favorites to DynamoDB (one-time migration)
 */
export async function migrateLocalStorageToDynamoDB(
  userId: string,
  presets: any[]
): Promise<boolean> {
  try {
    if (!userId || typeof window === 'undefined') {
      return false;
    }

    const savedFavorites = localStorage.getItem('user_favorites');
    if (!savedFavorites) {
      return true;
    }

    const favoritesObj = JSON.parse(savedFavorites);
    const favoriteIds = Object.keys(favoritesObj);

    if (favoriteIds.length === 0) {
      return true;
    }

    // Find preset details for each favorite
    for (const presetId of favoriteIds) {
      // Find preset in presets array
      const preset = presets.find(p => p.id === presetId);

      if (preset) {
        await addToFavorites(
          userId,
          presetId,
          preset.title || 'Unknown Preset',
          preset.category || 'unknown',
          preset.userEmail || 'anonymous@user.com'
        );
      } else {
        // If preset details not found, still add but with minimal info
        await addToFavorites(
          userId,
          presetId,
          'Unknown Preset',
          'unknown',
          'anonymous@user.com'
        );
      }
    }

    return true;
  } catch (error) {
    console.error("[FavoritesTracking] Error migrating localStorage favorites to DynamoDB:", error);
    return false;
  }
}