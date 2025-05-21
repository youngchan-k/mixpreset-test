'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import { UserProfile, getUserProfile, PaymentRecord as LocalPaymentRecord } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCreditBalance } from '@/lib/creditTracking';
import PaymentMethodModal, { PaymentMethodType } from '@/components/modals/PaymentMethodModal';

// Mock credit plans for quick purchase
const creditPlans = [
  {
    id: 'basic-credit-pack',
    name: 'Basic Credit Pack',
    price: 14.99,
    credits: 100,
  },
  {
    id: 'pro-credit-pack',
    name: 'Pro Credit Pack',
    price: 24.99,
    credits: 200,
  },
  {
    id: 'ultimate-credit-pack',
    name: 'Ultimate Credit Pack',
    price: 44.99,
    credits: 500,
  }
];

// Extend the UserProfile type to include the properties we need
interface ExtendedUserProfile extends UserProfile {
  creditHistory?: Array<{
    id: string;
    transactionType: string;
    amount: number;
    reason: string;
    timestamp: number;
  }>;
}

// Custom hook for credit data
const useCreditData = (userId: string | undefined, authLoading: boolean) => {
  const [profile, setProfile] = useState<ExtendedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);

  // Load profile and credits data
  useEffect(() => {
    // Don't set error if auth is still loading
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!userId) {
      setLoading(false);
      setError('Please log in to view credit information');
      return;
    }

    const loadProfileAndCredits = async () => {
      try {
        setLoading(true);

        // Load profile info
        const userProfile = await getUserProfile(userId);
        if (userProfile) {
          // Cast to our extended type
          setProfile(userProfile as ExtendedUserProfile);
          setError(null);
        } else {
          setError('Could not load credit information');
        }

        // Load credits using the centralized credit tracking system
        const creditData = await getUserCreditBalance(userId);
        setUserCredits(creditData.available);
      } catch (err) {
        setError('Error loading credit information');
      } finally {
        setLoading(false);
      }
    };

    loadProfileAndCredits();
  }, [userId, authLoading]);

  return {
    profile,
    loading,
    error,
    userCredits
  };
};

export default function CreditsPage() {
  const { currentUser, loading: authLoading } = useAuth();

  const {
    profile,
    loading: dataLoading,
    error,
    userCredits
  } = useCreditData(currentUser?.uid, authLoading);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof creditPlans[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Determine the overall loading state
  const isLoading = authLoading || dataLoading;

  // Format date function - memoized
  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Handle buying credits
  const handleBuyCredits = () => {
    // Default to the Pro pack
    const defaultPlan = creditPlans.find(plan => plan.id === 'pro-credit-pack') || creditPlans[0];
    setSelectedPlan(defaultPlan);
    setShowPaymentModal(true);
  };

  // Handle payment completion
  const handlePaymentComplete = async (paymentMethod: PaymentMethodType) => {
    if (!currentUser || !selectedPlan) return;

    setShowPaymentModal(false);
    setIsProcessing(true);

    try {
      // Get the relevant plan details
      const planCredits = selectedPlan.credits;
      const priceAmount = selectedPlan.price;
      const priceType = 'one-time';

      try {
        // Record the payment method used
        // const paymentMethodName = paymentMethod === 'paypal' ? 'PayPal' :
        //                          paymentMethod === 'bank' ? 'Account Transfer' :
        //                          paymentMethod === 'polar' ? 'Polar.sh' : 'Unknown';
        const paymentMethodName = paymentMethod === 'paypal' ? 'PayPal' :
                                 paymentMethod === 'bank' ? 'Account Transfer' :
                                 paymentMethod === 'test' ? 'Test' : 'Unknown';

        // Also update the local record for immediate UI updates
        const record: Omit<LocalPaymentRecord, 'id'> = {
          userId: currentUser.uid,
          planName: selectedPlan.name,
          priceType,
          priceAmount,
          credits: planCredits,
          purchaseTime: new Date().toISOString(),
          confirmed: true,
          paymentMethod: paymentMethodName // Add the payment method to the record
        };

        // Update credits immediately - refresh the page to show updated credits
        window.location.reload();

        // Show success message
        setShowSuccessMessage(true);

        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);
      } catch (error) {
        console.error('[PurchaseConfirmation] Error processing payment:', error);
        setPurchaseError("Failed to process your payment. Please try again later.");
      }
    } catch (error) {
      console.error('[PurchaseConfirmation] General error:', error);
      setPurchaseError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Memoize hero section props
  const heroSectionProps = useMemo(() => ({
    title: "Credit Management",
    subtitle: "Manage your credit balance and purchase history",
    backgroundImage: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    badge: { text: "MY CREDITS" },
    height: "small" as const,
    shape: "curved" as const,
    customGradient: "bg-gradient-to-r from-purple-800/90 to-purple-600/90"
  }), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection {...heroSectionProps} />

      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 shadow-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Credits added successfully!</span>
          </div>
        </div>
      )}

      <main className="container mx-auto max-w-5xl px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex mb-8 border-b border-gray-200">
          <Link href="/profile" className="px-6 py-3 font-medium text-gray-500 hover:text-purple-600 transition-colors">
            Profile Overview
          </Link>
          <Link href="/profile/downloads" className="px-6 py-3 font-medium text-gray-500 hover:text-purple-600 transition-colors">
            My Downloads
          </Link>
          <div className="px-6 py-3 font-medium text-purple-600 border-b-2 border-purple-600">
            Credit Management
          </div>
          <Link href="/profile/favorites" className="px-6 py-3 font-medium text-gray-500 hover:text-purple-600 transition-colors">
            Favorite Presets
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p>{error}</p>
            <p className="mt-2">Please try refreshing the page or log in again.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="font-medium text-gray-500 text-sm mb-1">Credit Balance</h2>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-purple-600">{userCredits}</span>
                  <span className="text-gray-600 mb-1">credits</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="font-medium text-gray-500 text-sm mb-1">Purchase Credits</h2>
                <p className="text-gray-600 mb-3">Need more credits? Purchase credit packs to download more presets.</p>
                <button
                  onClick={handleBuyCredits}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Buy Credits
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Credit Transactions</h2>
              </div>

              <div className="p-6">
                {!profile?.creditHistory || profile.creditHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No credit transactions found</p>
                    <p className="text-gray-400 text-sm mt-1">Your credit transaction history will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transaction Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Method
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {profile.creditHistory.map(transaction => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(transaction.timestamp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                transaction.amount > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}>
                                {transaction.transactionType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {transaction.reason}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {transaction.transactionType === 'PURCHASE' && transaction.reason.includes('via') ?
                                transaction.reason.split('via ')[1].split(' for')[0] :
                                transaction.transactionType === 'PURCHASE' ? 'Unknown' : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Payment Method Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
          amount={selectedPlan.price}
          planName={selectedPlan.name}
        />
      )}
    </div>
  );
}