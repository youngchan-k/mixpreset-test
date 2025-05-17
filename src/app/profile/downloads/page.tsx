'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserDownloadHistory,
  groupDownloadsByCategory,
  DownloadRecord,
  getMostRecentDownload,
  formatPresetNameForDisplay,
  formatRemainingRedownloadTime,
  deleteExpiredUserDownloads
} from '@/lib/downloadTracking';
import { getUserCreditBalance } from '@/lib/creditTracking';
import { useRouter } from 'next/navigation';

// Custom hook for download history
const useDownloadHistory = (userId: string | undefined) => {
  const [downloadHistory, setDownloadHistory] = useState<DownloadRecord[]>([]);
  const [groupedDownloads, setGroupedDownloads] = useState<Record<string, DownloadRecord[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [removedExpiredCount, setRemovedExpiredCount] = useState<number>(0);

  const fetchDownloadHistory = useCallback(async (showLoading: boolean = true) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Only show loading spinner on initial load, not on refreshes
      if (showLoading) {
        setLoading(true);
      }

      // First, remove expired downloads from the database
      let expiredCount = 0;
      try {
        expiredCount = await deleteExpiredUserDownloads(userId);
        if (expiredCount > 0) {
          setRemovedExpiredCount(expiredCount);
        }
      } catch (expiredError) {
        return null;
      }

      // Then fetch the remaining (active) downloads
      const activeDownloads = await getUserDownloadHistory(userId);
      setDownloadHistory(activeDownloads);

      // Group downloads by preset category
      const grouped = groupDownloadsByCategory(activeDownloads);
      setGroupedDownloads(grouped);
    } catch (err) {
      setError('Failed to load your download history. Please try again later.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchDownloadHistory(true); // Show loading on initial load
  }, [fetchDownloadHistory]);

  const refreshHistorySilently = useCallback(() => {
    return fetchDownloadHistory(false); // Don't show loading on refresh
  }, [fetchDownloadHistory]);

  return {
    downloadHistory,
    groupedDownloads,
    loading,
    error,
    refreshHistory: fetchDownloadHistory,
    refreshHistorySilently,
    removedExpiredCount
  };
};

// Helper function to generate a direct URL for S3 objects
const getDirectS3Url = (objectKey: string, presetS3Url: string): string => {
  // Skip if the key is already a URL
  if (objectKey.startsWith('http')) {
    return objectKey;
  }

  // Clean the object key (remove leading slash if present)
  const cleanedKey = objectKey.startsWith('/') ? objectKey.substring(1) : objectKey;
  return `https://${presetS3Url}/${cleanedKey}`;
};

export default function DownloadsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  // Add state for S3 URL
  const [presetS3Url, setPresetS3Url] = useState("preset.mixpreset.com");

  // Change variable name to make it clear this is only for initial loading
  const {
    groupedDownloads,
    loading: initialLoading,
    error,
    refreshHistory,
    refreshHistorySilently,
    removedExpiredCount
  } = useDownloadHistory(currentUser?.uid);

  // Add state for credit tracking
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState<boolean>(true);

  // Add loading state for redownload button
  const [redownloadingPresetId, setRedownloadingPresetId] = useState<string | null>(null);

  // Set up the S3 URL properly once we're client-side
  useEffect(() => {
    // This will only run on the client
    setPresetS3Url(process.env.NEXT_PUBLIC_PRESET_S3_URL || "preset.mixpreset.com");
  }, []);

  // Load user credit information
  useEffect(() => {
    if (currentUser?.uid) {
      const loadCredits = async () => {
        try {
          setIsLoadingCredits(true);
          const creditData = await getUserCreditBalance(currentUser.uid);
          setUserCredits(creditData.available);
        } catch (error) {
          console.error('[DownloadsPage] Error loading user credits:', error);
        } finally {
          setIsLoadingCredits(false);
        }
      };

      loadCredits();
    }
  }, [currentUser]);

  // Handle re-download with memoization
  const handleRedownload = useCallback(async (downloadUrl?: string, presetId?: string, fileName?: string, presetName?: string, credits?: number) => {
    // Show loading state
    setRedownloadingPresetId(presetId || null);

    try {
      if (!downloadUrl) {
        // If the URL is missing, try to get it from the original S3 path
        if (presetId && currentUser?.uid) {
          const mostRecentDownload = await getMostRecentDownload(currentUser.uid, presetId);

          if (mostRecentDownload && mostRecentDownload.downloadUrl) {
            downloadUrl = mostRecentDownload.downloadUrl;
            presetName = mostRecentDownload.presetName;
            credits = mostRecentDownload.credits;
          } else {
            // Instead of redirecting, show an error message or alert
            console.error("[handleRedownload] Could not find download URL for preset");
            setRedownloadingPresetId(null);
            return;
          }
        } else {
          console.error("[handleRedownload] Missing presetId or currentUser");
          setRedownloadingPresetId(null);
          return;
        }

        // If still no URL, show error but don't redirect
        if (!downloadUrl) {
          console.error("[handleRedownload] Failed to retrieve download URL");
          setRedownloadingPresetId(null);
          return;
        }
      }

      // Skip credit check - just download the file directly
      await processDownload(downloadUrl, fileName);
    } catch (error) {
      console.error("[handleRedownload] General error:", error);
      // Don't redirect to presets page, just log the error
    } finally {
      setRedownloadingPresetId(null);
    }
  }, [currentUser, refreshHistorySilently]);

  // New function to process download
  const processDownload = async (downloadUrl?: string, fileName?: string) => {
    try {
      // Check if downloadUrl is defined
      if (!downloadUrl) {
        console.error("[processDownload] Download URL is undefined");
        return;
      }

      // Generate a fresh direct URL
      try {
        // Remove any http or https protocol if present
        let cleanKey = downloadUrl;
        if (cleanKey.startsWith('http://') || cleanKey.startsWith('https://')) {
          // Extract just the path portion if it's a full URL
          const url = new URL(cleanKey);
          const pathParts = url.pathname.split('/').filter(Boolean);
          cleanKey = pathParts.join('/');
        }

        // Use the custom URL for download
        downloadUrl = `https://${presetS3Url}/${cleanKey}`;
      } catch (error) {
        console.error("[processDownload] Error generating URL:", error);
        return;
      }

      // Fetch the file data
      try {
        const response = await fetch(downloadUrl);

        if (!response.ok) {
          throw new Error(`Failed to download: ${response.statusText}`);
        }

        // Get the file content as a blob
        const blob = await response.blob();

        // Create a URL for the blob
        const blobUrl = window.URL.createObjectURL(blob);

        // Create a link element and trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName || 'preset-download';
        document.body.appendChild(link);
        link.click();

        // Clean up
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);

        // We'll refresh the history after the download completes,
        // but we'll use the silent refresh to avoid UI flickering
        if (currentUser?.uid) {
          // Refresh without showing the loading spinner
          setTimeout(() => {
            refreshHistorySilently();
          }, 500);
        }
      } catch (fetchError) {
        console.error("[processDownload] Fetch error:", fetchError);
        // No redirection, just log the error
      }
    } catch (error) {
      console.error("[processDownload] Error:", error);
      // No redirection, just log the error
    }
  };

  // Handle navigation to preset detail page - memoized
  const navigateToPresetDetail = useCallback((presetId: string) => {
    // Check if this is a full preset (ends with "full")
    if (presetId.endsWith('_full')) {
      // Extract the base preset name
      const lastUnderscoreIndex = presetId.lastIndexOf('_');
      if (lastUnderscoreIndex > 0) {
        const baseName = presetId.substring(0, lastUnderscoreIndex);

        // Try to find the parent preset
        const allDownloads = Object.values(groupedDownloads).flat();
        const parentPreset = allDownloads.find(d => d.presetName === baseName);

        // If we found a parent preset, use its name and category
        if (parentPreset && parentPreset.presetCategory) {
          const urlSafeName = baseName.replace(/\s+/g, '_');

          // Navigate using the new URL format
          router.push(`/presets/${parentPreset.presetCategory}/${urlSafeName}`);
          return;
        }
      }
    }

    // For direct preset IDs, just use the ID without modification
    const urlSafeId = presetId.replace(/\s+/g, '_');

    // Split by underscore to see if first part is a known category
    const parts = urlSafeId.split('_');
    const knownCategories = ["vocal_chain", "vocal_fx", "instrument"];

    // Try to extract category and preset ID
    if (parts.length > 1 && knownCategories.includes(parts[0])) {
      // Extract category and preset ID
      const category = parts[0];
      const presetIdPart = parts.slice(1).join('_');

      // Use the new URL format
      router.push(`/presets/${category}/${presetIdPart}`);
    } else {
      // If we can't determine category, just use the premium category as default
      router.push(`/presets/premium/${urlSafeId}`);
    }
  }, [router, groupedDownloads]);

  // Get display name for preset - extract parent preset name if it's an individual preset
  const getDisplayPresetName = useCallback((download: DownloadRecord): string => {
    // If presetName doesn't include underscores, it's already in the correct format
    if (!download.presetName.includes('_')) {
      return download.presetName;
    }

    // Format the basic name first
    const displayName = formatPresetNameForDisplay(download.presetName);

    // Check if this is a full preset by checking for _full suffix
    if (download.presetId.endsWith('_full')) {
      // Extract the base name (everything before the last underscore)
      const lastUnderscoreIndex = download.presetId.lastIndexOf('_');
      if (lastUnderscoreIndex > 0) {
        const baseName = download.presetId.substring(0, lastUnderscoreIndex);
        return formatPresetNameForDisplay(baseName);
      }
    }

    return displayName;
  }, []);

  // Format the category name for display - memoized
  const formatCategoryName = useCallback((category: string): string => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }, []);

  // Memoize hero section props
  const heroSectionProps = useMemo(() => ({
    title: "Download History",
    subtitle: "Browse and manage your downloaded presets",
    backgroundImage: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    badge: { text: "MY DOWNLOADS" },
    height: "small" as const,
    shape: "curved" as const,
    customGradient: "bg-gradient-to-r from-purple-800/90 to-purple-600/90"
  }), []);

  // Memoize category order
  const orderedCategories = useMemo(() => {
    // Define the specific category order
    const categoryOrder = ["vocal_chain", "vocal_fx", "instrument"];

    // Get all categories from the grouped downloads
    const allCategories = Object.keys(groupedDownloads);

    // Create ordered list of categories (specified ones first, then any others)
    return [
      ...categoryOrder.filter(cat => allCategories.includes(cat)),
      ...allCategories.filter(cat => !categoryOrder.includes(cat))
    ];
  }, [groupedDownloads]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection {...heroSectionProps} />

      <div className="container mx-auto px-8 py-6 mb-16">
        <div className="max-w-5xl mx-auto">
          {/* Navigation Tabs */}
          <div className="flex mb-8 border-b border-gray-200">
            <Link href="/profile" className="px-6 py-3 font-medium text-gray-500 hover:text-purple-600 transition-colors">
              Profile Overview
            </Link>
            <div className="px-6 py-3 font-medium text-purple-600 border-b-2 border-purple-600">
              My Downloads
            </div>
            <Link href="/profile/credits" className="px-6 py-3 font-medium text-gray-500 hover:text-purple-600 transition-colors">
              Credit Management
            </Link>
            <Link href="/profile/favorites" className="px-6 py-3 font-medium text-gray-500 hover:text-purple-600 transition-colors">
              Favorite Presets
            </Link>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Download History</h2>
            </div>

            {/* Re-download information message */}
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p><span className="font-medium">Important:</span> Free re-download is available for only 3 days after your initial download. After this period, you'll need to use credits again to download the same preset.</p>

                {removedExpiredCount > 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded">
                    <p className="text-red-700">
                      <span className="font-medium">Auto-cleanup:</span> {removedExpiredCount} expired download{removedExpiredCount !== 1 ? 's have' : ' has'} been removed from your history.
                      {orderedCategories.length === 0 && (
                        <span className="block mt-1">All your downloads have expired. Visit the <Link href="/presets" className="underline hover:text-red-800">presets page</Link> to browse and download presets.</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {initialLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 bg-red-50 rounded-lg">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => refreshHistory()}
                  className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) :
              <div>
                {/* Download history sections by category */}
                {orderedCategories.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">You haven't downloaded any presets yet.</p>
                    <Link href="/presets" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                      Browse Presets
                    </Link>
                  </div>
                ) : (
                  <>
                    {orderedCategories.map(category => {
                      const downloads = groupedDownloads[category];
                      if (!downloads || downloads.length === 0) return null;

                      return (
                        <div key={category} className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                            {formatCategoryName(category)} ({downloads.length})
                          </h3>

                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preset Name</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Free Re-download</th>
                                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {/* Sort downloads by time, most recent first */}
                                {[...downloads]
                                  .sort((a, b) => b.downloadTime - a.downloadTime)
                                  .map((download, idx) => (
                                    <tr key={`${download.presetId}-${download.downloadTime}-${idx}`} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                          onClick={() => navigateToPresetDetail(download.presetId)}
                                          className="text-purple-600 font-medium hover:text-purple-700 hover:underline truncate max-w-[200px] text-left"
                                        >
                                          {getDisplayPresetName(download)}
                                        </button>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap truncate max-w-[150px]">
                                        {download.fileName}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        {download.credits ?? 'Free'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          formatRemainingRedownloadTime(download.downloadTime) === "Expired"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-green-100 text-green-800"
                                        }`}>
                                          {formatRemainingRedownloadTime(download.downloadTime)}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                          onClick={() => handleRedownload(download.downloadUrl, download.presetId, download.fileName, download.presetName, download.credits)}
                                          className="inline-flex items-center px-3 py-1 border border-purple-600 text-sm font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50 focus:outline-none"
                                          aria-label={`Re-download ${download.presetName}`}
                                          disabled={redownloadingPresetId === download.presetId}
                                        >
                                          {redownloadingPresetId === download.presetId ? (
                                            <>
                                              <div className="animate-spin h-4 w-4 mr-1 border-b-2 border-purple-600 rounded-full"></div>
                                              Downloading...
                                            </>
                                          ) : (
                                            <>
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                              </svg>
                                              Download
                                            </>
                                          )}
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}