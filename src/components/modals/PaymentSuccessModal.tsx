import React from 'react';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  amount: number;
  credits: number;
  transactionId: string;
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  planName,
  amount,
  credits,
  transactionId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 text-center mb-4">Payment Successful!</h2>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-500">Plan</h3>
            <p className="font-bold text-gray-800">{planName}</p>
          </div>
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-500">Amount</h3>
            <p className="font-bold text-gray-800">${amount.toFixed(2)}</p>
          </div>
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-500">Credits Added</h3>
            <p className="font-bold text-green-600">{credits}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Transaction ID</h3>
            <p className="text-sm text-gray-800 break-all">{transactionId}</p>
          </div>
        </div>

        <p className="text-center text-gray-600 mb-6">
          Your credits have been successfully added to your account and are ready to use.
        </p>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;