import React, { useState } from 'react';
import Image from 'next/image';
import {
  PayPalScriptProvider,
  PayPalButtons,
  FUNDING
} from '@paypal/react-paypal-js';
import BankTransferDetails from '../payment/BankTransferDetails';
import PaymentSuccessModal from './PaymentSuccessModal';

export type PaymentMethodType = 'paypal' | 'bank' | 'polar' | 'test' | null;

interface BankDetails {
  referenceCode: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  expiresAt?: string;
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (method: PaymentMethodType, transactionDetails?: any) => void;
  amount: number;
  planName: string;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  amount,
  planName
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaypalButtons, setShowPaypalButtons] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [successData, setSuccessData] = useState<{
    isOpen: boolean;
    planName: string;
    amount: number;
    credits: number;
    transactionId: string;
  } | null>(null);

  // PayPal initial options
  const paypalInitialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "capture"
  };

  const handlePaymentSubmit = async () => {
    if (!selectedMethod) return;

    if (selectedMethod === 'paypal') {
      // Show PayPal buttons instead of redirecting immediately
      setShowPaypalButtons(true);
      return;
    }

    if (selectedMethod === 'polar') {
      setIsProcessing(true);

      try {
        // Get current user info from localStorage or create test data if not found
        let userData;
        const userDataStr = localStorage.getItem('userData');

        if (!userDataStr) {
          // Create temporary test user data
          userData = {
            uid: `test_user_${Date.now()}`,
            email: 'test@example.com',
            displayName: 'Test User'
          };
          console.log('Created temporary test user for Polar:', userData);
        } else {
          userData = JSON.parse(userDataStr);
        }

        // Redirect to Polar checkout with proper parameters
        const params = new URLSearchParams({
          price: (amount * 100).toString(), // Convert to cents
          currency: 'USD',
          success_url: window.location.origin + '/profile/credits?checkout_id={CHECKOUT_ID}&payment_success=true',
          cancel_url: window.location.origin + '/profile/credits?payment_cancelled=true',
          // Add metadata to identify the transaction later
          'metadata[userId]': userData.uid || '',
          'metadata[userEmail]': userData.email || '',
          'metadata[planName]': planName,
          'metadata[credits]': planName.includes('credits') ? planName.split(' ')[0] : '0'
        });

        // Use the main checkout route as per Polar documentation
        window.location.href = `/checkout?${params.toString()}`;
        return;
      } catch (error) {
        console.error('Error redirecting to Polar:', error);
        setIsProcessing(false);
      }
    }

    if (selectedMethod === 'bank') {
      setIsProcessing(true);

      try {
        // Get current user info from localStorage or create test data if not found
        let userData;
        const userDataStr = localStorage.getItem('userData');

        if (!userDataStr) {
          // Create temporary test user data
          userData = {
            uid: `test_user_${Date.now()}`,
            email: 'test@example.com',
            displayName: 'Test User'
          };
          console.log('Created temporary test user for bank transfer:', userData);
        } else {
          userData = JSON.parse(userDataStr);
        }

        // Determine credits from plan name
        const credits = planName.includes('credits')
          ? parseInt(planName.split(' ')[0], 10)
          : 0;

        // Initiate bank transfer process
        const response = await fetch('/api/payment/bank/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userData,
            planName,
            amount,
            credits
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to initiate bank transfer');
        }

        const data = await response.json();
        setBankDetails(data);
        setIsProcessing(false);

        // We don't call onPaymentComplete here because the payment
        // hasn't actually completed yet - it's pending bank transfer
        return;
      } catch (error) {
        console.error('Bank transfer error:', error);
        setPaymentError(error instanceof Error ? error.message : 'Failed to initiate bank transfer');
        setIsProcessing(false);
      }
    }

    if (selectedMethod === 'test') {
      setIsProcessing(true);

      try {
        // Get current user info from localStorage or create test data if not found
        let userData;
        const userDataStr = localStorage.getItem('userData');

        if (!userDataStr) {
          // Create temporary test user data
          userData = {
            uid: `test_user_${Date.now()}`,
            email: 'test@example.com',
            displayName: 'Test User'
          };
          console.log('Created temporary test user:', userData);
        } else {
          userData = JSON.parse(userDataStr);
        }

        // Determine credits from plan name
        const credits = planName.includes('credits')
          ? parseInt(planName.split(' ')[0], 10)
          : 100; // Default to 100 credits for testing

        // Process the test payment
        const response = await fetch('/api/payment/test/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userData,
            planName,
            amount,
            credits
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process test payment');
        }

        const data = await response.json();

        // Show success modal
        setSuccessData({
          isOpen: true,
          planName: data.planName || planName,
          amount: data.amount || amount,
          credits: data.credits || credits,
          transactionId: data.transactionId
        });

        // Call the onPaymentComplete callback with the selected method and transaction details
        onPaymentComplete('test', {
          transactionId: data.transactionId,
          paymentStatus: 'COMPLETED',
          paymentTime: new Date().toISOString(),
          credits: data.credits || credits
        });

        // Reset processing state
        setIsProcessing(false);
      } catch (error) {
        console.error('Test payment error:', error);
        setPaymentError(error instanceof Error ? error.message : 'Failed to process test payment');
        setIsProcessing(false);
      }

      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing for other methods
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Call the onPaymentComplete callback with the selected method
      onPaymentComplete(selectedMethod);

      // Reset state
      setSelectedMethod(null);
      setIsProcessing(false);
      setShowPaypalButtons(false);
    } catch (error) {
      console.error('Payment processing error:', error);
      setIsProcessing(false);
    }
  };

  // Function to handle closing the bank transfer details modal
  const handleCloseBankDetails = () => {
    setBankDetails(null);
    setSelectedMethod(null);
    onClose();
  };

  // Function to handle closing the success modal
  const handleCloseSuccessModal = () => {
    setSuccessData(null);
    setSelectedMethod(null);
    onClose();
  };

  if (!isOpen) return null;

  // If we're showing the success modal
  if (successData && successData.isOpen) {
    return (
      <PaymentSuccessModal
        isOpen={true}
        onClose={handleCloseSuccessModal}
        planName={successData.planName}
        amount={successData.amount}
        credits={successData.credits}
        transactionId={successData.transactionId}
      />
    );
  }

  // If we're showing bank transfer details, render that instead of the payment method selection
  if (bankDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseBankDetails}></div>
        <div className="relative max-w-md w-full mx-4">
          <BankTransferDetails
            referenceCode={bankDetails.referenceCode}
            bankDetails={bankDetails.bankDetails}
            amount={amount}
            onClose={handleCloseBankDetails}
          />
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={paypalInitialOptions}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Modal Content */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Select Payment Method</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-500">Plan</h3>
                <p className="font-bold text-gray-800">{planName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                <p className="font-bold text-purple-600 text-lg">${amount.toFixed(2)}</p>
              </div>
            </div>

            {paymentError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {paymentError}
              </div>
            )}

            {showPaypalButtons ? (
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-3">Complete your payment with PayPal</h3>
                <PayPalButtons
                  style={{ layout: "vertical" }}
                  fundingSource={FUNDING.PAYPAL}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [
                        {
                          description: `${planName} - Credits`,
                          amount: {
                            currency_code: "USD",
                            value: amount.toString(),
                          },
                        },
                      ],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    setIsProcessing(true);
                    setPaymentError(null);

                    try {
                      // Capture the payment with PayPal
                      const details = await actions.order?.capture();
                      console.log('Payment captured with PayPal', details);

                      // Get user data from localStorage or create test data if not found
                      let userData;
                      const userDataStr = localStorage.getItem('userData');

                      if (!userDataStr) {
                        // Create temporary test user data
                        userData = {
                          uid: `test_user_${Date.now()}`,
                          email: 'test@example.com',
                          displayName: 'Test User'
                        };
                        console.log('Created temporary test user for PayPal:', userData);
                      } else {
                        userData = JSON.parse(userDataStr);
                      }

                      // Determine credits from plan name
                      const credits = planName.includes('credits')
                        ? parseInt(planName.split(' ')[0], 10)
                        : 0;

                      // Server-side verification and recording of payment
                      const verifyResponse = await fetch('/api/payment/paypal/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          orderID: data.orderID,
                          transactionDetails: details,
                          userData,
                          planName,
                          amount,
                          credits
                        }),
                      });

                      if (!verifyResponse.ok) {
                        const errorData = await verifyResponse.json();
                        throw new Error(errorData.error || 'Payment verification failed');
                      }

                      // Call the onPaymentComplete callback with transaction details
                      onPaymentComplete('paypal', {
                        transactionId: details?.id || data.orderID,
                        paymentStatus: details?.status || 'COMPLETED',
                        payerEmail: details?.payer?.email_address,
                        paymentTime: new Date().toISOString(),
                        paymentDetails: details
                      });

                      // Reset state
                      setSelectedMethod(null);
                      setIsProcessing(false);
                      setShowPaypalButtons(false);
                    } catch (error) {
                      console.error('Payment error:', error);
                      setPaymentError(error instanceof Error ? error.message : 'Payment processing failed');
                      setIsProcessing(false);
                    }
                  }}
                  onCancel={() => {
                    console.log('Payment cancelled');
                    setShowPaypalButtons(false);
                  }}
                  onError={(err) => {
                    console.error('PayPal error', err);
                    setPaymentError('An error occurred with PayPal. Please try again.');
                    setShowPaypalButtons(false);
                    setIsProcessing(false);
                  }}
                />
                <button
                  onClick={() => {
                    setShowPaypalButtons(false);
                    setPaymentError(null);
                  }}
                  className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel and go back
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Please select your preferred payment method:
                </p>

                <div className="space-y-3">
                  {/* PayPal Option */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedMethod === 'paypal'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMethod('paypal')}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200">
                          <div className="relative w-7 h-7">
                            <Image
                              src="/pricing/paypal.svg"
                              alt="PayPal"
                              fill
                              style={{ objectFit: 'contain' }}
                              priority
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">PayPal</h3>
                        <p className="text-sm text-gray-500">
                          Pay securely using your PayPal account
                        </p>
                      </div>
                      <div className="ml-auto">
                        <div className={`w-5 h-5 border rounded-full flex items-center justify-center ${
                          selectedMethod === 'paypal' ? 'border-purple-500' : 'border-gray-300'
                        }`}>
                          {selectedMethod === 'paypal' && (
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Polar.sh Option */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedMethod === 'polar'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMethod('polar')}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200">
                          <div className="relative w-7 h-7">
                            <Image
                              src="/pricing/polar-sh.svg"
                              alt="Polar.sh"
                              fill
                              style={{ objectFit: 'contain' }}
                              priority
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Polar.sh</h3>
                        <p className="text-sm text-gray-500">
                          Pay using Polar.sh platform
                        </p>
                      </div>
                      <div className="ml-auto">
                        <div className={`w-5 h-5 border rounded-full flex items-center justify-center ${
                          selectedMethod === 'polar' ? 'border-purple-500' : 'border-gray-300'
                        }`}>
                          {selectedMethod === 'polar' && (
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Transfer Option */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedMethod === 'bank'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMethod('bank')}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-green-500 rounded-full text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Account Transfer</h3>
                        <p className="text-sm text-gray-500">
                          Pay via bank or wire transfer
                        </p>
                      </div>
                      <div className="ml-auto">
                        <div className={`w-5 h-5 border rounded-full flex items-center justify-center ${
                          selectedMethod === 'bank' ? 'border-purple-500' : 'border-gray-300'
                        }`}>
                          {selectedMethod === 'bank' && (
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test Payment Option */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedMethod === 'test'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMethod('test')}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-500 rounded-full text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Test Payment</h3>
                        <p className="text-sm text-gray-500">
                          For testing purposes only
                        </p>
                      </div>
                      <div className="ml-auto">
                        <div className={`w-5 h-5 border rounded-full flex items-center justify-center ${
                          selectedMethod === 'test' ? 'border-purple-500' : 'border-gray-300'
                        }`}>
                          {selectedMethod === 'test' && (
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {!showPaypalButtons && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                disabled={!selectedMethod || isProcessing}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  `Pay $${amount.toFixed(2)}`
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default PaymentMethodModal;