'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { recordDownload, isFreeRedownloadEligible } from '@/lib/downloadTracking';
import { deductUserCredits } from '@/lib/paymentTracking';
import { getUserCreditBalance } from '@/lib/creditTracking';
import { PresetDownloadProps, DownloadItem } from './types';
import DownloadConfirmModal from '../../modals/DownloadConfirmModal';
import InsufficientCreditsModal from '../../modals/InsufficientCreditsModal';

// Set the S3 custom URL with proper server-side rendering support
const PRESET_S3_URL = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_PRESET_S3_URL || "preset.mixpreset.com"
  : "preset.mixpreset.com";

/**
 * NOTE: This component is currently not used in the main PresetDetail view.
 * It's kept for reference or potential reuse elsewhere in the application.
 */
const PresetDownload: React.FC<PresetDownloadProps> = ({
  preset,
  downloadHistory,
  onAuthRequired,
  presets,
  onNavigate
}) => {
  const { currentUser } = useAuth();

  const [selectedPurchaseOption, setSelectedPurchaseOption] = useState<'full'>('full');
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState<boolean>(false);
  const [processingDownload, setProcessingDownload] = useState<boolean>(false);
  const [freeRedownload, setFreeRedownload] = useState<boolean>(false);

  // Check if current preset was previously downloaded and still eligible for free redownload
  useEffect(() => {
    const checkFreeDownloadStatus = async () => {
      if (!currentUser || !preset) return;

      const isFreeDownload = await isFreeRedownloadEligible(
        currentUser.uid,
        preset.id
      );

      setFreeRedownload(isFreeDownload);
    };

    if (currentUser && preset) {
      checkFreeDownloadStatus();
    }
  }, [currentUser, preset, downloadHistory]);

  // Load user credits when component mounts or user changes
  useEffect(() => {
    const loadUserCredits = async () => {
      if (!currentUser) {
        setAvailableCredits(0);
        return;
      }

      try {
        const creditBalance = await getUserCreditBalance(currentUser.uid);
        setAvailableCredits(creditBalance.available);
      } catch (error) {
        console.error("Error fetching user credits:", error);
        setAvailableCredits(0);
      }
    };

    loadUserCredits();
  }, [currentUser]);

  // Check if the user has enough credits to download this preset
  const hasEnoughCredits = freeRedownload || availableCredits >= (preset.credit_cost || 1);

  // Get preset file URL
  const getPresetFileUrl = async (objectKey: string): Promise<string> => {
    try {
      // Validate the objectKey
      if (!objectKey || typeof objectKey !== 'string' || objectKey.trim() === '') {
        console.error("[getPresetFileUrl] Invalid objectKey:", objectKey);
        throw new Error("Invalid object key");
      }

      // Try to find the preset and file in already fetched data
      // Parse the object key to identify the preset and file type
      let cleanKey = objectKey;
      if (cleanKey.startsWith('http://') || cleanKey.startsWith('https://')) {
        try {
          const url = new URL(cleanKey);
          const pathParts = url.pathname.split('/');
          pathParts.shift(); // Remove the first empty element
          cleanKey = pathParts.join('/');
        } catch (urlError) {
          console.error("[getPresetFileUrl] Error parsing URL:", urlError);
        }
      }

      // Extract category and preset ID from path
      const pathParts = cleanKey.split('/');
      if (pathParts.length >= 2) {
        const category = pathParts[0];
        const presetFolderId = pathParts[1];

        // Find matching preset in our data
        const matchingPreset = presets.find(p =>
          p.category === category &&
          (p.id.replace(/\s+/g, '_') === presetFolderId || p.id === presetFolderId)
        );

        if (matchingPreset) {
          // Check which type of file is being requested
          if (cleanKey.endsWith('full_preset.zip') && matchingPreset.fullPreset) {
            return matchingPreset.fullPreset;
          }

          // If we have the preset but not the specific file, construct URL
          console.log("[getPresetFileUrl] File not found in preset data, using direct S3 URL");
        }
      }

      // Fallback to traditional S3 URL construction if we couldn't find the URL in our data
      return `https://${PRESET_S3_URL}/${cleanKey}`;
    } catch (error) {
      console.error("[getPresetFileUrl] Error getting file URL:", error);
      // Fallback to traditional S3 URL
      return `https://${PRESET_S3_URL}/${objectKey.replace(/^https?:\/\/[^\/]+\//, '')}`;
    }
  };

  // Handle download button click
  const handleDownload = () => {
    onAuthRequired(() => {
      if (!currentUser) {
        return false;
      }

      // Check credits and show appropriate modal
      if (hasEnoughCredits || freeRedownload) {
        // Add a small delay to ensure state updates correctly
        setTimeout(() => {
          setShowConfirmModal(true);
        }, 0);
      } else {
        setTimeout(() => {
          setShowInsufficientCreditsModal(true);
        }, 0);
      }

      return true;
    });
  };

  // Process the download
  const processDownload = async () => {
    if (!currentUser || processingDownload) return;

    try {
      setProcessingDownload(true);

      // Helper function to trigger download
      const triggerDownload = (url: string, filename: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      // Determine what files to download based on selected option
      const downloadItems: DownloadItem[] = [];

      // Construct the file URL - full preset
      if (preset.fullPreset) {
        const filenameParts = preset.fullPreset.split('/');
        const filename = filenameParts[filenameParts.length - 1];

        downloadItems.push({
          url: preset.fullPreset,
          filename: filename || `${preset.title.replace(/\s+/g, '_')}.zip`
        });
      } else {
        // Fallback to constructing URL
        const s3Key = `${preset.category}/${preset.id.replace(/\s+/g, '_')}/full_preset.zip`;
        const url = await getPresetFileUrl(s3Key);

        downloadItems.push({
          url,
          filename: `${preset.title.replace(/\s+/g, '_')}.zip`
        });
      }

      // Trigger downloads
      for (const item of downloadItems) {
        triggerDownload(item.url, item.filename);
      }

      // If we got this far, the download was successful
      // Record download in DynamoDB
      await recordDownload(
        currentUser.uid,
        preset.id,
        preset.title,
        preset.category,
        undefined,  // downloadUrl
        currentUser.email || 'anonymous@user.com'
      );

      // If it's not a free redownload, deduct credits
      if (!freeRedownload) {
        await deductUserCredits(
          currentUser.uid,
          currentUser.email || 'anonymous@user.com',
          preset.credit_cost || 1,
          `Download of ${preset.title} (${preset.id})`
        );

        // Update the UI with new credit balance
        const newBalance = await getUserCreditBalance(currentUser.uid);
        setAvailableCredits(newBalance.available);
      }

      // Update the free redownload status
      setFreeRedownload(true);

    } catch (error) {
      console.error("Error processing download:", error);
      alert("There was an error processing your download. Please try again.");
    } finally {
      setProcessingDownload(false);
      setShowConfirmModal(false);
    }
  };

  // Handle cancel of confirmation modal
  const handleCancelDownload = () => {
    setShowConfirmModal(false);
  };

  // Handle navigation to pricing page
  const handleNavigateToPricing = () => {
    if (onNavigate) {
      onNavigate('pricing');
    }
  };

  // Handle closing the insufficient credits modal
  const handleCloseInsufficientCreditsModal = () => {
    setShowInsufficientCreditsModal(false);
  };

  // Simplified minimal UI since component is not currently being used in the main view
  return (
    <>
      {/* Modals */}
      <DownloadConfirmModal
        isOpen={showConfirmModal}
        onConfirm={processDownload}
        onClose={handleCancelDownload}
        creditsRequired={freeRedownload ? 0 : (preset.credit_cost || 1)}
        availableCredits={availableCredits}
        presetTitle={preset.title}
        onNavigateToPricing={handleNavigateToPricing}
        freeRedownloadCount={freeRedownload ? 1 : 0}
      />

      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={handleCloseInsufficientCreditsModal}
        onNavigateToPricing={handleNavigateToPricing}
        presetTitle={preset.title}
        creditsRequired={preset.credit_cost || 1}
        availableCredits={availableCredits}
      />
    </>
  );
};

export default PresetDownload;