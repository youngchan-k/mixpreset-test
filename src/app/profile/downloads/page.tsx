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

  // New function to process download
  const processDownload = async (downloadUrl?: string, fileName?: string) => {
    try {
      // Check if downloadUrl is defined
      if (!downloadUrl) {
        console.error("[processDownload] Download URL is undefined");
        alert("Download URL is missing. Please try again or contact support.");
        return;
      }

      // Log download attempt for debugging
      console.log("[processDownload] Attempting to download:", { downloadUrl, fileName });

      // Generate a fresh direct URL
      let finalDownloadUrl = downloadUrl;
      try {
        // Fix URL format based on what we have
        if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
          // It's already a full URL, use it directly
          finalDownloadUrl = downloadUrl;
        } else {
          // It's likely just a path, prepend the S3 domain
          const cleanPath = downloadUrl.replace(/^\//, ''); // Remove leading slash if present
          finalDownloadUrl = `https://${presetS3Url}/${cleanPath}`;
        }

        console.log("[processDownload] Using URL:", finalDownloadUrl);

        // Use just one approach at a time - try the download attribute first
        try {
          const link = document.createElement('a');
          link.href = finalDownloadUrl;
          link.setAttribute('download', fileName || 'preset-download.zip');
          document.body.appendChild(link);
          link.click();

          // Clean up the link element after use
          setTimeout(() => {
            if (link.parentNode) {
              document.body.removeChild(link);
            }
          }, 100);
        } catch (e) {
          console.error("Error with download approach 1:", e);

          // Only if the first approach fails, try the new tab approach
          if (confirm("There was an issue starting your download. Would you like to try opening in a new tab instead?")) {
            window.open(finalDownloadUrl, '_blank');
          }
        }

                // We'll refresh the history after the download completes,
        // but we'll use the silent refresh to avoid UI flickering
        if (currentUser?.uid) {
          // Refresh without showing the loading spinner - use a longer delay
          setTimeout(() => {
            refreshHistorySilently();
          }, 3000);
        }
      } catch (error) {
        console.error("[processDownload] Error generating URL:", error);
        // If there's an error parsing the URL, try a different approach
        alert("There was an error processing your download. Opening file in a new tab.");
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error("[processDownload] Error:", error);
      alert("There was an error processing your download. Please try again.");
    }
  };

  // Handle re-download with memoization
  const handleRedownload = useCallback(async (downloadUrl?: string, presetId?: string, fileName?: string, presetName?: string, credits?: number) => {
    // Show loading state
    setRedownloadingPresetId(presetId || null);

    console.log("[handleRedownload] Starting download process:", { presetId, fileName });

    try {
      // First check if we have a direct URL to work with
      if (downloadUrl) {
        console.log("[handleRedownload] Using provided URL:", downloadUrl);
        await processDownload(downloadUrl, fileName);
        setRedownloadingPresetId(null);
        return;
      }

      console.log("[handleRedownload] No direct URL, attempting to find download information");

      // If the URL is missing, try to get it from the original S3 path
      if (presetId && currentUser?.uid) {
        try {
          const mostRecentDownload = await getMostRecentDownload(currentUser.uid, presetId);
          console.log("[handleRedownload] Found recent download:", mostRecentDownload);

          if (mostRecentDownload && mostRecentDownload.downloadUrl) {
            // Use the download URL from the history
            downloadUrl = mostRecentDownload.downloadUrl;

            // All preset files use the standard filename
            fileName = "full_preset.zip";

            // Try downloading with this URL
            await processDownload(downloadUrl, fileName);
            setRedownloadingPresetId(null);
            return;
          }
        } catch (findError) {
          console.error("[handleRedownload] Error finding recent download:", findError);
        }

        // If we get here but still have a presetId, try to construct a URL directly
        try {
          console.log("[handleRedownload] Constructing URL from preset ID:", presetId);

          // First check if we have a category directly from the download record
          let category = "premium"; // Default only as last resort

          // Find this preset in all downloads to get its category
          if (currentUser?.uid) {
            try {
              const allDownloads = Object.values(groupedDownloads).flat();
              const matchingDownload = allDownloads.find(d => d.presetId === presetId);

              // If we found a matching download with category info, use that
              if (matchingDownload && matchingDownload.presetCategory) {
                // Make sure to use underscore format for any categories (like "vocal_chain" not "Vocal Chain")
                category = matchingDownload.presetCategory.replace(/\s+/g, '_').toLowerCase();
                console.log("[handleRedownload] Found category from download record:", category);
              } else {
                // Fall back to extracting from the preset ID if needed
                const parts = presetId.split('_');
                const knownCategories = ["premium", "vocal_chain", "instrument"];

                // Check if the preset ID starts with a known category
                if (parts.length > 0 && knownCategories.includes(parts[0])) {
                  category = parts[0];
                  console.log("[handleRedownload] Extracted category from preset ID:", category);
                }
              }
            } catch (e) {
              console.error("[handleRedownload] Error finding category:", e);
            }
          }

          // Construct a direct URL to the S3 bucket - preserve spaces in the preset ID
          downloadUrl = `${category}/${presetId}/full_preset.zip`;
          console.log("[handleRedownload] Constructed URL path:", downloadUrl);

          // Try downloading with this constructed URL
          await processDownload(downloadUrl, "full_preset.zip");
          setRedownloadingPresetId(null);
          return;
        } catch (constructError) {
          console.error("[handleRedownload] Error constructing URL:", constructError);
        }
      }

      // If we get here, we couldn't find or construct a URL
      console.error("[handleRedownload] Failed to retrieve download URL");
      alert("Could not find the download file. Please contact support.");

    } catch (error) {
      console.error("[handleRedownload] General error:", error);
      alert("An error occurred while trying to download. Please try again.");
    } finally {
      setRedownloadingPresetId(null);
    }
  }, [currentUser, processDownload]);

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

    // First try to find the category in the download records
    let category = null;
    const allDownloads = Object.values(groupedDownloads).flat();
    const matchingDownload = allDownloads.find(d => d.presetId === presetId);

        if (matchingDownload && matchingDownload.presetCategory) {
      // Use the category from the download record, ensuring proper underscore format
      category = matchingDownload.presetCategory.replace(/\s+/g, '_').toLowerCase();
      console.log(`[navigateToPresetDetail] Using category from download record: ${category}`);

      // Use the new URL format
      router.push(`/presets/${category}/${urlSafeId}`);
    } else {
      // Fall back to extracting from the preset ID
      const parts = urlSafeId.split('_');
      const knownCategories = ["premium", "vocal_chain", "instrument"];

      // Try to extract category and preset ID
      if (parts.length > 1 && knownCategories.includes(parts[0])) {
        // Extract category and preset ID
        category = parts[0];
        const presetIdPart = parts.slice(1).join('_');

        // Use the new URL format
        router.push(`/presets/${category}/${presetIdPart}`);
      } else {
        // If we can't determine category, just use the premium category as default
        console.log(`[navigateToPresetDetail] Could not determine category, using default`);
        router.push(`/presets/premium/${urlSafeId}`);
      }
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
    const categoryOrder = ["premium", "vocal_chain", "instrument"];

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
                            <table className="w-full table-fixed">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Preset Name</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Credits</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Free Re-download</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Actions</th>
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
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        {download.credits ?? 'Free'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                          formatRemainingRedownloadTime(download.downloadTime) === "Expired"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-green-100 text-green-800"
                                        }`}>
                                          {formatRemainingRedownloadTime(download.downloadTime)}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                          onClick={() => handleRedownload(download.downloadUrl, download.presetId, undefined, download.presetName, download.credits)}
                                          className="inline-flex items-center justify-center w-full px-3 py-1 border border-purple-600 text-sm font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50 focus:outline-none"
                                          aria-label={`Re-download ${download.presetName}`}
                                          disabled={redownloadingPresetId === download.presetId}
                                        >
                                          {redownloadingPresetId === download.presetId ? (
                                            <>
                                              <div className="animate-spin h-4 w-4 mr-1 border-b-2 border-purple-600 rounded-full"></div>
                                              <span className="whitespace-nowrap">Downloading...</span>
                                            </>
                                          ) : (
                                            <>
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                              </svg>
                                              <span className="whitespace-nowrap">Download</span>
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