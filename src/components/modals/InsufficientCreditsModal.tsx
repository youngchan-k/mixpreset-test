import React from 'react';

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPricing: () => void;
  presetTitle: string;
  creditsRequired: number;
  availableCredits: number;
}

const InsufficientCreditsModal: React.FC<InsufficientCreditsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPricing,
  presetTitle,
  creditsRequired,
  availableCredits,
}) => {
  if (!isOpen) return null;

  const creditsNeeded = creditsRequired - availableCredits;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl z-10 relative">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Insufficient Credits</h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            You don't have enough credits to download <span className="font-semibold">{presetTitle}</span>.
          </p>

          <div className="bg-red-50 p-4 rounded-lg text-red-800 mb-4">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">You need {creditsNeeded} more credit{creditsNeeded !== 1 ? 's' : ''}</span>
            </div>
            <p className="ml-7 text-sm">
              Visit the pricing page to purchase more credits and unlock this preset.
            </p>
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-3">
            <span className="text-gray-700">Credits Required:</span>
            <span className="font-bold text-purple-700">{creditsRequired}</span>
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-700">Your balance:</span>
            <span className="font-bold text-red-600">{availableCredits} credits</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={onNavigateToPricing}
            className="px-5 py-2.5 rounded-lg font-medium transition-colors bg-purple-600 hover:bg-purple-700 text-white"
          >
            Buy Credits
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsufficientCreditsModal;