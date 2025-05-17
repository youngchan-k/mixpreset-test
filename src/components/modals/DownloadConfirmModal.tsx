import React from 'react';

interface DownloadConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  creditsRequired: number;
  availableCredits: number;
  presetTitle: string;
  selectedCount?: number;
  onNavigateToPricing?: () => void;
  previouslyDownloadedCount?: number;
  totalItems?: number;
  freeRedownloadCount?: number;
  paidRedownloadCount?: number;
}

const DownloadConfirmModal: React.FC<DownloadConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  creditsRequired,
  availableCredits,
  presetTitle,
  selectedCount = 0,
  onNavigateToPricing,
  previouslyDownloadedCount = 0,
  totalItems = 0,
  freeRedownloadCount = 0,
  paidRedownloadCount = 0
}) => {
  if (!isOpen) return null;

  const hasEnoughCredits = availableCredits >= creditsRequired;
  const hasPreviousDownloads = previouslyDownloadedCount > 0;
  const hasFreeRedownloads = freeRedownloadCount > 0;
  const hasPaidRedownloads = paidRedownloadCount > 0;
  const remainingCredits = Math.max(0, availableCredits - creditsRequired);

  let purchaseText = 'full preset package';

  // If everything is free (new items = 0)
  const isCompletelyFree = creditsRequired === 0 && totalItems > 0;

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
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{hasEnoughCredits ? "Confirm Download" : "Insufficient Credits"}</h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            You are about to download the {purchaseText} for <span className="font-semibold">{presetTitle}</span>.
          </p>

          {hasPreviousDownloads && (
            <div className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">Download Status</h4>

              {hasFreeRedownloads && (
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-700 font-medium">
                    Free to re-download
                  </span>
                  <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    3-day period
                  </span>
                </div>
              )}

              {hasPaidRedownloads && (
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-amber-700 font-medium">
                    Requires payment to re-download
                  </span>
                  <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    After 3 days
                  </span>
                </div>
              )}

              {totalItems - previouslyDownloadedCount > 0 && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-purple-700 font-medium">
                    New preset package
                  </span>
                </div>
              )}

              <div className="mt-3 text-sm text-gray-600">
                <p>
                  <span className="font-semibold">Note:</span> Presets downloaded in the last 3 days are free to download again. After 3 days, you'll need to use credits for re-downloads.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-3">
            <span className="text-gray-700">Credits Required:</span>
            <span className="font-bold text-purple-700">
              {creditsRequired} {hasPreviousDownloads && <span className="text-sm text-gray-500">(for new and expired items)</span>}
            </span>
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-3">
            <span className="text-gray-700">Your balance:</span>
            <span className={`font-bold ${hasEnoughCredits || isCompletelyFree ? 'text-green-600' : 'text-red-600'}`}>
              {availableCredits} credits
            </span>
          </div>

          {!isCompletelyFree && (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-700">Remaining credits after download:</span>
              <span className={`font-bold ${remainingCredits > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {remainingCredits} credits
              </span>
            </div>
          )}

          {!hasEnoughCredits && !isCompletelyFree && (
            <div className="mt-3 text-red-600 bg-red-50 p-3 rounded-lg">
              <p className="text-sm">
                You don't have enough credits for this download. Please purchase more credits to continue.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row-reverse gap-3">
          {hasEnoughCredits || isCompletelyFree ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onConfirm();
              }}
              className="px-5 py-2.5 rounded-lg font-medium transition-colors bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isCompletelyFree ? "Download Again (Free)" : "Download Now"}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onNavigateToPricing) {
                  onNavigateToPricing();
                }
              }}
              className="px-5 py-2.5 rounded-lg font-medium transition-colors bg-purple-600 hover:bg-purple-700 text-white"
            >
              Buy Credits
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadConfirmModal;