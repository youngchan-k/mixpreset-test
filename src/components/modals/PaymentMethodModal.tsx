import React, { useState } from 'react';
import Image from 'next/image';
import {
  PayPalScriptProvider,
  PayPalButtons,
  FUNDING
} from '@paypal/react-paypal-js';

export type PaymentMethodType = 'paypal' | 'bank' | 'polar' | null;

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

  if (!isOpen) return null;

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
                    try {
                      // Capture the payment
                      const details = await actions.order?.capture();
                      console.log('Payment completed', details);

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
                      setIsProcessing(false);
                    }
                  }}
                  onCancel={() => {
                    console.log('Payment cancelled');
                    setShowPaypalButtons(false);
                  }}
                  onError={(err) => {
                    console.error('PayPal error', err);
                    setShowPaypalButtons(false);
                    setIsProcessing(false);
                  }}
                />
                <button
                  onClick={() => setShowPaypalButtons(false)}
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