import React from 'react';

interface BankTransferDetailsProps {
  referenceCode: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  amount: number;
  onClose: () => void;
}

const BankTransferDetails: React.FC<BankTransferDetailsProps> = ({
  referenceCode,
  bankDetails,
  amount,
  onClose,
}) => {
  // Copy text to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Bank Transfer Details</h2>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Amount to Transfer</h3>
          <p className="font-bold text-gray-800">${amount.toFixed(2)} USD</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Bank Name</h3>
          <p className="font-medium text-gray-800">{bankDetails.bankName}</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Account Name</h3>
          <p className="font-medium text-gray-800">{bankDetails.accountName}</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Account Number</h3>
          <div className="flex justify-between items-center">
            <p className="font-medium text-gray-800">{bankDetails.accountNumber}</p>
            <button
              className="text-sm text-purple-600 hover:text-purple-800"
              onClick={() => copyToClipboard(bankDetails.accountNumber)}
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-6">
        <p>After making the transfer, please allow 1-3 business days for processing and verification. You'll receive an email confirmation once your payment is verified.</p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default BankTransferDetails;