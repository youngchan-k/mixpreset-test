'use client';

import { useState, useEffect } from 'react';
import { usePresets } from '../PresetsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserDownloadHistory, DownloadRecord } from '@/lib/downloadTracking';

import PresetHeader from './PresetHeader';
import PresetAudio from './PresetAudio';
import RelatedPresets from './RelatedPresets';
import PresetSync from '../PresetSync';

// Types
import { Preset } from './types';

interface PresetDetailProps {
  onNavigate: (page: string, param?: string | null) => void;
  presetId: string | null;
  onAuthRequired: (callback: () => void) => boolean;
}

function PresetDetail({ onNavigate, presetId, onAuthRequired }: PresetDetailProps) {
  const { currentUser } = useAuth();
  const { getPresetById } = usePresets();
  // Add state for S3 URL
  const [presetS3Url, setPresetS3Url] = useState("preset.mixpreset.com");

  // URL decode the presetId if it's encoded
  const decodedPresetId = presetId ? decodeURIComponent(presetId) : null;

  // Extract category from ID if present (e.g., vocal_chain_Preset_Name)
  const splitId = decodedPresetId ? decodedPresetId.split('_') : [];
  const categories = ['premium', 'vocal_chain', 'instrument'];
  const possibleCategory = splitId[0];

  // Extract base preset ID (without category)
  const actualPresetId = categories.includes(possibleCategory) && splitId.length > 1
    ? splitId.slice(1).join('_')
    : decodedPresetId;

  // Store the category separately if valid
  const detectedCategory = categories.includes(possibleCategory) ? possibleCategory : null;

  // State
  const [preset, setPreset] = useState<Preset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingRetryCount, setLoadingRetryCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [allPresets, setAllPresets] = useState<Preset[]>([]);
  const [presetsLoaded, setPresetsLoaded] = useState<boolean>(false);
  const [downloadHistory, setDownloadHistory] = useState<DownloadRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    premium: 0,
    vocal_chain: 0,
    instrument: 0
  });

  // Set up the S3 URL properly once we're client-side
  useEffect(() => {
    // This will only run on the client
    setPresetS3Url(process.env.NEXT_PUBLIC_PRESET_S3_URL || "preset.mixpreset.com");
  }, []);

  // Function to retry loading the preset
  const retryLoadingPreset = () => {
    if (!isOnline) {
      setError('You appear to be offline. Please check your internet connection.');
      return;
    }

    setError(null);
    setLoadingError(null);
    setLoading(true);
    setLoadingRetryCount(prev => prev + 1);
  };

  // Fetch user's download history when the component mounts
  useEffect(() => {
    const fetchDownloadHistory = async () => {
      if (!currentUser) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        const history = await getUserDownloadHistory(currentUser.uid);
        setDownloadHistory(history);
      } catch (error) {
        console.error("Error fetching download history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchDownloadHistory();
  }, [currentUser]);

  // Simplify the preset search logic
  const findPresetById = (presets: Preset[], searchId: string | null): Preset | null => {
    if (!searchId) return null;

    // Check if we already have the category extracted
    const hasCategory = detectedCategory !== null;
    const baseId = hasCategory ? actualPresetId : searchId;

    // Ensure baseId is not null before comparing
    if (!baseId) return null;

    // Go through all presets and find the best match
    for (const p of presets) {
      // If we already know the category, check if it matches
      if (hasCategory && p.category !== detectedCategory) continue;

      // Check direct match on the base ID (without category prefix)
      if (p.id === baseId) return p;

      // Check case-insensitive match
      if (p.id.toLowerCase() === baseId.toLowerCase()) return p;

      // Check with space/underscore variations
      if (p.id.replace(/\s+/g, '_') === baseId ||
          p.id.replace(/_/g, ' ') === baseId) return p;

      // Check reconstructed full ID match
      const fullId = `${p.category}_${p.id.replace(/\s+/g, '_')}`;
      if (fullId === searchId) return p;
    }

    return null;
  };

  // Handle preset sync results
  const handleResultsUpdate = (presets: Preset[], count: number) => {
    setAllPresets(presets);
    setPresetsLoaded(true);

    if (loading && decodedPresetId) {
      // First try using the context utility
      const contextPreset = getPresetById(decodedPresetId) ||
                           (actualPresetId ? getPresetById(actualPresetId) : null);

      if (contextPreset) {
        setPreset(contextPreset);
        setLoading(false);
        return;
      }

      // If not found via context, use our helper function
      const foundPreset = findPresetById(presets, decodedPresetId);

      if (foundPreset) {
        setPreset(foundPreset);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Load preset data
  useEffect(() => {
    const loadPreset = async () => {
      if (!decodedPresetId) {
        setLoading(false);
        return;
      }

      try {
        // First try with the context utility
        const contextPreset = getPresetById(decodedPresetId) ||
                             (actualPresetId ? getPresetById(actualPresetId) : null);

        if (contextPreset) {
          setPreset(contextPreset);
          setLoading(false);
          return;
        }

        // Then try with our search function if presets are loaded
        if (allPresets.length > 0) {
          const foundPreset = findPresetById(allPresets, decodedPresetId);

          if (foundPreset) {
            setPreset(foundPreset);
            setLoading(false);
            return;
          }
        }

        // Only show error if presets are loaded and we've tried everything
        if (presetsLoaded) {
          // Try one more time with full search before showing error
          const lastAttemptPreset = findPresetById(allPresets, decodedPresetId);
          if (lastAttemptPreset) {
            setPreset(lastAttemptPreset);
            setLoading(false);
            return;
          }

          // Keep loading until we find the preset or a certain timeout is reached
          setTimeout(() => {
            const retryPreset = findPresetById(allPresets, decodedPresetId);

            if (retryPreset) {
              setPreset(retryPreset);
              setLoading(false);
            } else {
              // Don't set error message here to prevent flash of "Preset not found"
              // Just keep loading state true until timeout
              setTimeout(() => {
                const finalAttempt = findPresetById(allPresets, decodedPresetId);
                if (finalAttempt) {
                  setPreset(finalAttempt);
                }
                setLoading(false);
              }, 1000);
            }
          }, 500);
        } else {
          // Wait for presets to load before giving up, but don't show error
          setTimeout(() => {
            if (allPresets.length > 0) {
              const retryPreset = findPresetById(allPresets, decodedPresetId);

              if (retryPreset) {
                setPreset(retryPreset);
                setLoading(false);
              } else {
                // Don't set error message, just complete loading
                setLoading(false);
              }
            } else {
              // Don't show error message, just stay in loading state longer
              setTimeout(() => {
                const finalAttempt = findPresetById(allPresets, decodedPresetId);
                if (finalAttempt) {
                  setPreset(finalAttempt);
                }
                setLoading(false);
              }, 1000);
            }
          }, 1500);
        }
      } catch (err) {
        // Even on error, don't show error message to prevent flash
        setLoading(false);
      }
    };

    loadPreset();
  }, [decodedPresetId, getPresetById, allPresets, presetsLoaded, actualPresetId, detectedCategory]);

  // Handle category counts update
  const handleCategoryCountsUpdate = (counts: Record<string, number>) => {
    setCategoryCounts(counts);
  };

  const handleRelatedPresetClick = (relatedPreset: Preset) => {
    // Clean the preset ID for URL
    const cleanedId = relatedPreset.id.replace(/\s+/g, '_');

    // Use new URL structure
    onNavigate('preset-detail', `${relatedPreset.category}/${cleanedId}`);
  };

  // Wrapper function to adapt the interface for RelatedPresets component
  const handleRelatedNavigate = (page: string, param?: string | null) => {
    onNavigate(page, param);
  };

  return (
    <>
      {/* Hidden PresetSync component to fetch data */}
      <PresetSync
        onResultsUpdate={handleResultsUpdate}
        onCategoryCountsUpdate={handleCategoryCountsUpdate}
        activeFilters={{}}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-500">Loading preset...</p>
        </div>
      ) : !preset ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-red-50 text-red-800 p-6 rounded-lg mb-6 max-w-md">
            <h3 className="text-xl font-bold mb-2">Preset Not Found</h3>
            <p className="mb-4">The preset you're looking for doesn't exist or couldn't be loaded.</p>
            <button
              onClick={retryLoadingPreset}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
          <button
            onClick={() => onNavigate('presets')}
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            ? Back to All Presets
          </button>
        </div>
      ) : (
        <div className="flex flex-col min-h-screen">
          <PresetHeader
            preset={preset}
            isFavorite={isFavorite}
            setIsFavorite={setIsFavorite}
            onAuthRequired={onAuthRequired}
          />

          <div className="container mx-auto px-6 py-2">
            <div className="max-w-6xl mx-auto">
              {/* Unified layout without boxed separation */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 mb-6">
                {/* Top section with image and stacked columns */}
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Square Image */}
                  <div className="md:w-1/3">
                    <div className="aspect-square rounded-xl flex items-center justify-center overflow-hidden shadow-lg border border-gray-100">
                      {preset.image ? (
                        <img
                          src={preset.image}
                          alt={preset.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Try alternative image formats if JPEG fails
                            const target = e.currentTarget;

                            // Extract the base URL without the extension
                            const currentSrc = target.src;
                            const baseUrl = currentSrc.substring(0, currentSrc.lastIndexOf('.'));

                            // Try different extensions in order
                            if (currentSrc.endsWith('jpeg')) {
                              target.src = `${baseUrl.substring(0, baseUrl.length)}.png`;
                            } else if (currentSrc.endsWith('png')) {
                              target.src = `${baseUrl.substring(0, baseUrl.length)}.jpg`;
                            } else if (currentSrc.endsWith('jpg')) {
                              target.src = `${baseUrl.substring(0, baseUrl.length)}.webp`;
                            } else {
                              // If all formats fail, try constructing a more reliable path
                              const category = preset.category;
                              const presetId = preset.id.replace(/\s+/g, '_');
                              target.src = `https://${presetS3Url}/${category}/${presetId}/image.png`;

                              // Set up one more fallback for the last attempt
                              target.onerror = () => {
                                // If standard formats fail, replace with gradient background
                                const imgContainer = target.parentElement;
                                if (imgContainer) {
                                  target.style.display = 'none';
                                  imgContainer.style.background = "linear-gradient(to right, #7e3af2, #6366f1)";
                                  imgContainer.style.display = "flex";
                                  imgContainer.style.alignItems = "center";
                                  imgContainer.style.justifyContent = "center";

                                  const placeholder = document.createElement('div');
                                  placeholder.className = "text-center";
                                  placeholder.innerHTML = `
                                    <div class="text-2xl text-white opacity-70">${preset.category === 'vocal_chain' ? 'Vocal Chain' : preset.category.charAt(0).toUpperCase() + preset.category.slice(1)}</div>
                                    <div class="text-sm text-white/70 mt-2">${
                                      Array.isArray(preset.filters.genre) ? preset.filters.genre[0] : preset.filters.genre
                                    }</div>
                                  `;
                                  imgContainer.appendChild(placeholder);
                                }
                              };
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-purple-800 to-purple-600 flex items-center justify-center">
                          <span className="text-2xl text-white opacity-50">{preset.category === 'vocal_chain' ? 'Vocal Chain' : preset.category.charAt(0).toUpperCase() + preset.category.slice(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Two vertically stacked columns */}
                  <div className="md:w-2/3 flex flex-col justify-between h-full">
                    {/* Description Column */}
                    <div className="bg-gray-50 rounded-xl p-4 flex-1 mb-4 border border-gray-100 shadow-sm">
                      <h3 className="text-sm text-purple-600 font-semibold uppercase mb-2">Description</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {preset.description || `This preset is designed for ${Array.isArray(preset.filters.daw)
                          ? preset.filters.daw.join(' or ')
                          : preset.filters.daw}
                          and works best with ${Array.isArray(preset.filters.gender)
                          ? preset.filters.gender.join(' or ')
                          : preset.filters.gender}
                          vocals in the ${Array.isArray(preset.filters.genre)
                          ? preset.filters.genre.join(' or ')
                          : preset.filters.genre} genre.`}
                      </p>
                    </div>

                    {/* Filters moved up */}
                    <div className="bg-gray-50 rounded-xl p-4 flex-1 mb-4 border border-gray-100 shadow-sm">
                      <div className="grid grid-cols-1 gap-3">
                        {/* DAW */}
                        {preset.filters.daw && (
                          <div className="flex flex-row bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-center text-sm text-purple-600 font-semibold uppercase min-w-[100px] p-2 flex-shrink-0 bg-gray-50 border-r border-gray-100">DAW</div>
                            <div className="flex-1 p-2">
                              {Array.isArray(preset.filters.daw) ? (
                                <div className="flex flex-wrap gap-1">
                                  {preset.filters.daw.map((item, index) => (
                                    <span key={index} className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium inline-block bg-blue-100 text-blue-700">
                                  {preset.filters.daw}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Genre */}
                        {preset.filters.genre && (
                          <div className="flex flex-row bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-center text-sm text-purple-600 font-semibold uppercase min-w-[100px] p-2 flex-shrink-0 bg-gray-50 border-r border-gray-100">GENRE</div>
                            <div className="flex-1 p-2">
                              {Array.isArray(preset.filters.genre) ? (
                                <div className="flex flex-wrap gap-1">
                                  {preset.filters.genre.map((item, index) => (
                                    <span key={index} className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium inline-block bg-purple-100 text-purple-700">
                                  {preset.filters.genre}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Gender */}
                        {preset.filters.gender && (
                          <div className="flex flex-row bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-center text-sm text-purple-600 font-semibold uppercase min-w-[100px] p-2 flex-shrink-0 bg-gray-50 border-r border-gray-100">GENDER</div>
                            <div className="flex-1 p-2">
                              {Array.isArray(preset.filters.gender) ? (
                                <div className="flex flex-wrap gap-1">
                                  {preset.filters.gender.map((item, index) => (
                                    <span key={index} className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium inline-block bg-green-100 text-green-700">
                                  {preset.filters.gender}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Plugin */}
                        {preset.filters.plugin && preset.filters.plugin !== 'Any' && (
                          <div className="flex flex-row bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-center text-sm text-purple-600 font-semibold uppercase min-w-[100px] p-2 flex-shrink-0 bg-gray-50 border-r border-gray-100">PLUGINS</div>
                            <div className="flex-1 p-2">
                              {Array.isArray(preset.filters.plugin) ? (
                                <div className="flex flex-wrap gap-1">
                                  {preset.filters.plugin.map((item, index) => (
                                    <span key={index} className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium inline-block bg-amber-100 text-amber-700">
                                  {preset.filters.plugin}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Audio Preview moved within the filters box */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm text-purple-600 font-semibold uppercase mb-2">Audio Preview</div>
                          <PresetAudio
                            preset={preset}
                            presets={allPresets}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rest of the content */}
                <div className="flex flex-col gap-6">
                  {/* Remove the stand-alone Audio Preview section */}

                  {/* Full Download Section - Removed */}
                </div>
              </div>

              {/* Related Presets - enhanced styling */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Related Presets</h3>
                <RelatedPresets
                  currentPreset={preset}
                  allPresets={allPresets}
                  onNavigate={handleRelatedNavigate}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PresetDetail;