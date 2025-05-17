'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import HeroSection from '../HeroSection';
import { PaymentRecord as LocalPaymentRecord, addPaymentRecord, getUserProfile } from '@/services/userService';
import { recordPayment, formatPaymentDate, calculateUserCredits } from '@/lib/paymentTracking';
import { useAuth } from '@/contexts/AuthContext';
import LoginPromptModal from '@/components/modals/LoginPromptModal';
import PaymentMethodModal, { PaymentMethodType } from '@/components/modals/PaymentMethodModal';

// Plan types and data
type PlanCategory = 'Presets' | 'Courses' | 'Services';

interface Plan {
  id: string;
  name: string;
  description: string;
  category: PlanCategory;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

// Mock user data (in real implementation, this would come from auth context)
interface User {
  id: string;
  email: string;
  name: string;
}

const oneTimePurchases: Plan[] = [
  {
    id: 'basic-credit-pack',
    name: 'Basic Credit Pack',
    description: 'Perfect for trying out our premium presets.',
    category: 'Presets',
    price: 14.99,
    credits: 100,
    features: []
  },
  {
    id: 'pro-credit-pack',
    name: 'Pro Credit Pack',
    description: 'Great value for active producers.',
    category: 'Presets',
    price: 24.99,
    credits: 200,
    features: [],
    popular: true
  },
  {
    id: 'ultimate-credit-pack',
    name: 'Ultimate Credit Pack',
    description: 'Best value for serious producers and studios.',
    category: 'Presets',
    price: 44.99,
    credits: 500,
    features: []
  }
];

export default function PricingContent() {
  const router = useRouter();
  const [category] = useState<PlanCategory>('Presets');

  // Modal and login state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Get authentication context
  const { currentUser, loading: authLoading } = useAuth();

  // Load user credits when auth state changes
  useEffect(() => {
    if (currentUser) {
      const loadCredits = async () => {
        try {
          const credits = await calculateUserCredits(currentUser.uid);
          setUserCredits(credits);
        } catch (error) {
          console.error('[PricingContent] Error loading user credits:', error);
          setUserCredits(0);
        }
      };

      loadCredits();
    } else if (!authLoading) {
      // Reset credits when logged out
      setUserCredits(0);
    }
  }, [currentUser, authLoading, showSuccessModal]);

  // Filter plans by category
  const filteredPlans = oneTimePurchases;

  // Handle the "Get Started" button click
  const handleGetStarted = (plan: Plan) => {
    if (!currentUser) {
      setSelectedPlan(plan);
      setShowLoginModal(true);
      return;
    }

    // User is logged in, proceed with purchase flow
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  // Handle login modal close
  const handleLoginModalClose = () => {
    setShowLoginModal(false);
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    // Close the modal
    setShowLoginModal(false);

    // Redirect to login page using Next.js router
    router.push('/login');
  };

  // Handle purchase confirmation
  const handlePurchase = async () => {
    if (!currentUser || !selectedPlan) return;

    // Check for purchase error
    if (purchaseError) {
      setShowConfirmModal(false);
      return;
    }

    // Show payment method modal
    setShowConfirmModal(false);
    setShowPaymentModal(true);
  };

  // Handle payment completion
  const handlePaymentComplete = async (paymentMethod: PaymentMethodType, transactionDetails?: any) => {
    if (!currentUser || !selectedPlan) return;

    setShowPaymentModal(false);
    setIsProcessing(true);

    try {
      // Get the relevant plan details
      const planCredits = selectedPlan.credits;
      const priceAmount = selectedPlan.price;
      const priceType = 'one-time';

      try {
        // Record the payment in DynamoDB using the PaymentTracking service
        const paymentId = await recordPayment(
          currentUser.uid,
          currentUser.email || '',
          selectedPlan.name,
          priceType,
          priceAmount,
          planCredits,
          paymentMethod ? String(paymentMethod) : undefined,
          transactionDetails?.transactionId,
          paymentMethod === 'paypal' ? transactionDetails : undefined
        );

        // Also update the local record for immediate UI updates
        const record: Omit<LocalPaymentRecord, 'id'> = {
          userId: currentUser.uid,
          planName: selectedPlan.name,
          priceType,
          priceAmount,
          credits: planCredits,
          purchaseTime: new Date().toISOString(),
          confirmed: true,
          paymentMethod: paymentMethod || undefined
        };

        if (transactionDetails?.transactionId) {
          // Store PayPal transaction details in console for reference
          console.log("PayPal transaction completed:", transactionDetails);
        }

        // Save payment record locally
        const success = await addPaymentRecord(record);

        // Update credits immediately
        const updatedCredits = await calculateUserCredits(currentUser.uid);
        setUserCredits(updatedCredits);

        // Show success modal
        setShowSuccessModal(true);
      } catch (error) {
        console.error('[PurchaseConfirmation] Error processing payment:', error);
        setPurchaseError("Failed to process your payment. Please try again later.");
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('[PurchaseConfirmation] General error:', error);
      setPurchaseError("An unexpected error occurred. Please try again later.");
      setShowSuccessModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Hero Section */}
      <HeroSection
        title="Pricing Plans"
        subtitle="Choose the perfect plan for your preset needs."
        backgroundImage="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "FLEXIBLE OPTIONS" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-purple-800/90 to-purple-600/90"
      />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto mt-12 px-4 sm:px-6 md:px-8 mb-10 sm:mb-16">
            <div className="max-w-3xl mx-auto text-center mb-8 mt-6 sm:mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Credit Packs</h2>
              <p className="text-gray-600">
            Purchase credit packs to download presets. Credits never expire.
              </p>
            </div>

        {/* Credit Pack Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {oneTimePurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className={`rounded-lg overflow-hidden transition-all hover:shadow-lg border ${
                    purchase.popular ? 'border-purple-400 shadow-lg' : 'border-gray-200'
                  } bg-white group hover:bg-purple-600 hover:border-purple-300 hover:shadow-md relative`}
                >
                  {purchase.popular && (
                    <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1 rounded-bl-lg text-sm font-medium group-hover:bg-white group-hover:text-purple-600">
                      Most Popular
                    </div>
                  )}
                  <div className={`p-8 ${purchase.popular ? 'bg-purple-50 group-hover:bg-purple-600' : ''}`}>
                    <h3 className="text-2xl font-bold mb-2 text-gray-800 group-hover:text-white transition-colors">
                      {purchase.name}
                    </h3>
                    <div className="mb-6">
                      <p className="text-4xl font-bold text-gray-900 group-hover:text-white transition-colors">
                        ${purchase.price.toFixed(2)}
                      </p>
                      <div className="inline-block rounded-full px-3 py-1 text-sm font-medium mt-2 bg-purple-100 text-purple-800 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        {purchase.credits} credits
                      </div>
                    </div>
                    <button
                      onClick={() => handleGetStarted(purchase)}
                      className="w-full text-center py-3 px-6 rounded-lg font-medium transition-colors bg-white text-purple-600 border border-purple-600 hover:bg-purple-50 group-hover:bg-white group-hover:text-purple-600 group-hover:border-white"
                    >
                      Add Credits
                    </button>
                  </div>
                </div>
              ))}
            </div>
      </div>

      {/* Credit System Explanation */}
      <div className="container mx-auto px-8 py-6 mb-12">
        <div className="max-w-4xl mx-auto bg-purple-50 rounded-lg p-8 border border-purple-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">How Our System Works</h2>
          <p className="text-gray-700 mb-6">
            MIXPRESET uses a simple credit-based system that gives you flexibility in how you download and use our high-quality presets.
          </p>

          {/* Visual Flow Diagram */}
          <div className="bg-white rounded-lg shadow-md p-5 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Credit System Flow</h3>

            <div className="relative py-10">
              <div className="hidden md:block absolute top-1/2 left-8 right-8 h-1 bg-purple-200 -translate-y-1/2 z-0"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="flex flex-col items-center text-center w-48">
                  <div className="bg-purple-100 rounded-full h-16 w-16 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-1">Purchase Credits</h4>
                  <p className="text-sm text-gray-600">Buy credit packs that never expire</p>
                </div>

                <div className="hidden md:block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                <div className="flex flex-col items-center text-center w-48">
                  <div className="bg-purple-100 rounded-full h-16 w-16 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-1">Download Presets</h4>
                  <p className="text-sm text-gray-600">Use credits to download presets</p>
                </div>

                <div className="hidden md:block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                <div className="flex flex-col items-center text-center w-48">
                  <div className="bg-purple-100 rounded-full h-16 w-16 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-1">Free Re-downloads</h4>
                  <p className="text-sm text-gray-600">Re-download for free within 3 days of purchase</p>
                </div>
              </div>
            </div>
          </div>

          {/* Credits Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Credits
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="mb-2">
                  <span className="font-medium text-purple-800">No Expiration</span>
                </div>
                <p className="text-sm text-gray-600">Credits never expire. Once purchased, they remain in your account until used.</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="mb-2">
                  <span className="font-medium text-purple-800">One-Time Purchase</span>
                </div>
                <p className="text-sm text-gray-600">Add credits anytime with a one-time purchase that never expires.</p>
              </div>
            </div>
          </div>

          {/* Download System and Re-downloads & History Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Download System Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download System
              </h3>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-800">Full Preset Packages</span>
                </div>
                <p className="text-sm text-gray-600">Download complete packages, with credit cost determined by the preset's metadata</p>
              </div>
            </div>

            {/* Re-downloads & History Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Re-downloads & History
              </h3>

              <div className="flex items-start bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <svg className="h-5 w-5 text-blue-600 mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Free 3-Day Re-downloads:</span> After downloading a preset, you can download it again for free within 3 days.
                  </p>
                </div>
              </div>

              <div className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-200">
                <svg className="h-5 w-5 text-gray-600 mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Download History:</span> Your download history is visible in your profile for 3 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginPromptModal
          isOpen={showLoginModal}
          onClose={handleLoginModalClose}
          onLogin={handleLoginSuccess}
          message="Please log in to continue with your purchase."
        />
      )}

      {/* Confirm Purchase Modal */}
      {showConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirm Purchase</h2>

            {purchaseError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{purchaseError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-2">You are about to purchase:</p>
                <div className="bg-purple-50 p-4 rounded-lg mb-6">
                  <h3 className="font-bold text-gray-800">{selectedPlan.name}</h3>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="font-bold text-gray-800">
                      ${selectedPlan?.price.toFixed(2)}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedPlan ? (
                        `${selectedPlan.credits} credits`
                      ) : '0 credits'}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <p>This purchase will be recorded in your account history.</p>
                  <p className="mt-1">Purchasing as: {currentUser?.email}</p>
                </div>
              </>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex justify-center items-center"
                disabled={isProcessing || purchaseError !== null}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : purchaseError ? (
                  'Close'
                ) : (
                  'Confirm Purchase'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Success Modal */}
      {showSuccessModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="mx-auto rounded-full w-16 h-16 bg-green-100 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
                <h2 className="text-2xl font-bold text-gray-800">Credits Added Successfully!</h2>
                <p className="text-gray-600 mt-2">
                  {selectedPlan.credits} credits have been added to your account.
                </p>
            </div>

            {purchaseError ? (
              <div className="bg-yellow-50 border-yellow-200 text-yellow-700 border p-4 rounded-lg mb-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium">Warning</p>
                    <p className="text-sm">{purchaseError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium">Payment Processed Successfully</p>
                    <p className="text-sm mt-2">
                      {selectedPlan.credits} credits have been added to your account.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Show credit info */}
              <div className="bg-purple-50 p-4 rounded-lg mb-6">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-500">Plan Purchased</h3>
                  <p className="font-bold text-gray-800">{selectedPlan.name}</p>
                </div>

                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-500">Credits Added</h3>
                  <div className="flex items-center">
                    <p className="font-bold text-purple-600 text-lg">{selectedPlan.credits} credits</p>
                    <span className="ml-2 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">Added to account</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Current Balance</h3>
                  <p className="font-bold text-purple-600 text-lg">{userCredits} credits</p>
                </div>
              </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push('/presets');
                  }}
                  className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Browse Presets
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}