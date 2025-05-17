// User service for handling user profile and credits
import {
  getUserPaymentHistory as getDynamoDBPaymentHistory,
  PaymentRecord as DynamoDBPaymentRecord,
  calculateUserCredits
} from '@/lib/paymentTracking';
import { calculateUsedCredits } from '@/lib/downloadTracking';
import { getFirebaseAuth, getAuth } from '@/lib/firebase';
import { deleteUser } from 'firebase/auth';
import { getUserCreditBalance } from '@/lib/creditTracking';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  credits: number;
  paymentHistory: PaymentRecord[];
}

// New interface for creating user profile
export interface CreateUserProfileParams {
  id: string;
  email: string;
  name?: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  planName: string;
  priceType: string;
  priceAmount: number;
  credits: number;
  purchaseTime: string;
  confirmed: boolean;
  paymentMethod?: string;
}

// Function to create a new user profile after successful signup
export const createUserProfile = async (params: CreateUserProfileParams): Promise<UserProfile | null> => {
  try {
    // Create initial profile with default values
    const profile: UserProfile = {
      id: params.id,
      email: params.email,
      displayName: params.name || params.email.split('@')[0], // Default to username part of email if no name provided
      credits: 0, // New users start with 0 credits
      paymentHistory: []
    };

    // Save to localStorage for demo purposes
    localStorage.setItem(`user_profile_${params.id}`, JSON.stringify(profile));

    return profile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
};

// Function to simulate getting user profile from database and DynamoDB
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));

    let paymentHistory: PaymentRecord[] = [];

    // Try to get payment history from DynamoDB
    try {
      const dynamoPayments = await getDynamoDBPaymentHistory(userId);

      // Convert DynamoDB records to our PaymentRecord format
      paymentHistory = dynamoPayments.map(payment => ({
        id: payment.id.split('#')[1] || payment.id,
        userId: payment.userId,
        planName: payment.planName,
        priceType: payment.priceType,
        priceAmount: payment.priceAmount,
        credits: payment.credits,
        // Convert number timestamp to ISO string if needed
        purchaseTime: typeof payment.purchaseTime === 'number'
          ? new Date(payment.purchaseTime).toISOString()
          : String(payment.purchaseTime), // Use String() instead of toString()
        confirmed: true, // All DynamoDB records are considered confirmed
        paymentMethod: payment.paymentMethod || 'Unknown'
      }));

    } catch (dbError) {
      console.error('Error fetching from DynamoDB:', dbError);
      // If there's an error with DynamoDB, use empty array instead of localStorage fallback
      paymentHistory = [];
    }

    // Calculate total credits ONLY from confirmed payment history
    // And subtract used credits from UserDownloadDB
    let totalCredits = 0;
    try {
      // Use the new centralized credit calculation from creditTracking
      const creditData = await getUserCreditBalance(userId);
      totalCredits = creditData.available;
    } catch (error) {
      console.error('[UserService] Error calculating available credits:', error);
      // Fall back to frontend calculation if DB calculation fails
      totalCredits = paymentHistory
        .filter((payment: PaymentRecord) => payment.confirmed === true)
        .reduce((sum: number, payment: PaymentRecord) => sum + payment.credits, 0);
    }

    // Create user profile
    return {
      id: userId,
      email: `user_${userId.substring(0, 5)}@example.com`,
      displayName: `User ${userId.substring(0, 5)}`,
      credits: totalCredits,
      paymentHistory
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Add payment record and update user profile - removed localStorage functionality
export const addPaymentRecord = async (record: Omit<PaymentRecord, 'id'>): Promise<boolean> => {
  try {
    // This function is now mainly for tracking updates in the UI before page refresh
    // The actual record is stored in DynamoDB through the recordPayment function
    console.log('Payment record:', record);

    // Return success since the main storage happens in DynamoDB
    return true;
  } catch (error) {
    console.error('Error adding payment record:', error);
    return false;
  }
};

// Function to delete a user account
export const deleteUserAccount = async (userId: string): Promise<boolean> => {
  try {
    // Delete user profile from localStorage
    localStorage.removeItem(`user_profile_${userId}`);

    // In a real implementation, this would delete the user's data from the database

    // Delete Firebase auth user (must be recently authenticated)
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser && currentUser.uid === userId) {
      await deleteUser(currentUser);
    } else {
      console.warn('Cannot delete Firebase user: No matching authenticated user found');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting user account:', error);
    return false;
  }
};

// Clear all user data (for testing purposes)
export const clearUserData = (userId: string): void => {
  // No action needed since we're not using localStorage for payment history anymore
};