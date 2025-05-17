'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import HeroSection from '@/components/HeroSection';
import { useAuth } from '@/contexts/AuthContext';
import PresetSync from '@/components/presets/PresetSync';
import { Preset, PresetsProvider } from '@/components/presets/PresetsContext';
import {
  getUserFavorites,
  removeFromFavorites,
  syncFavoritesToLocalStorage,
  migrateLocalStorageToDynamoDB
} from '@/lib/favoritesTracking';
import { getUserCreditBalance } from '@/lib/creditTracking';

// Custom hook for managing favorites
const useFavorites = (userId: string | undefined) => {
  const [favorites, setFavorites] = useState<{[key: string]: boolean}>({});
  const [allPresets, setAllPresets] = useState<Preset[]>([]);
  const [favoritePresets, setFavoritePresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorizedPresets, setCategorizedPresets] = useState<{
    vocal_chain: Preset[];
    vocal_fx: Preset[];
    instrument: Preset[];
  }>({
    vocal_chain: [],
    vocal_fx: [],
    instrument: []
  });

  // Load favorites from storage
  useEffect(() => {
    if (userId) {
      setLoading(true);

      // First load from localStorage for immediate UI response
      if (typeof window !== 'undefined') {
        const savedFavorites = localStorage.getItem('user_favorites');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }
      }

      // Then get favorites from DynamoDB
      getUserFavorites(userId)
        .then(favoriteRecords => {
          // Convert to the format used in state: { presetId: true }
          const favoritesObj = favoriteRecords.reduce((acc, favorite) => {
            acc[favorite.presetId] = true;
            return acc;
          }, {} as Record<string, boolean>);

          setFavorites(favoritesObj);

          // Update localStorage to ensure it's in sync with DynamoDB
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_favorites', JSON.stringify(favoritesObj));
          }

          // Update favorite presets immediately if we already have allPresets loaded
          if (allPresets.length > 0) {
            updateFavoritePresets(allPresets, favoritesObj);
          }
        })
        .catch(error => {
          return null;
        });
    } else {
      // For non-authenticated users, just use localStorage
      if (typeof window !== 'undefined') {
        const savedFavorites = localStorage.getItem('user_favorites');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }
      }
    }
  }, [userId, allPresets]);

  // Add a helper function to update favorite presets
  const updateFavoritePresets = useCallback((presets: Preset[], favoritesObj: Record<string, boolean>) => {
    // Find favorited presets
    const favPresets = presets.filter(preset => favoritesObj[preset.id]);
    setFavoritePresets(favPresets);

    // Categorize by preset type with specific order: vocal chain, vocal fx, instrument
    const categorized = {
      vocal_chain: favPresets.filter(p => p.category === 'vocal_chain'),
      vocal_fx: favPresets.filter(p => p.category === 'vocal_fx'),
      instrument: favPresets.filter(p => p.category === 'instrument')
    };

    setCategorizedPresets(categorized);
    setLoading(false);
  }, []);

  // Handle preset data update
  const handlePresetsUpdate = useCallback((presets: Preset[], count: number) => {
    setAllPresets(presets);

    // Find favorited presets based on current favorites state
    updateFavoritePresets(presets, favorites);

    // Run a one-time migration from localStorage to DynamoDB if needed
    if (userId && typeof window !== 'undefined') {
      migrateLocalStorageToDynamoDB(userId, presets)
        .catch(error => {
          return null;
        });
    }
  }, [favorites, userId, updateFavoritePresets]);

  // Remove from favorites
  const handleRemoveFavorite = useCallback((e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    e.preventDefault();

    // Update state
    const newFavorites = { ...favorites };
    delete newFavorites[presetId];
    setFavorites(newFavorites);

    // Remove from displayed presets
    setFavoritePresets(prev => prev.filter(p => p.id !== presetId));

    // Update categorized presets in the right order
    setCategorizedPresets({
      vocal_chain: categorizedPresets.vocal_chain.filter(p => p.id !== presetId),
      vocal_fx: categorizedPresets.vocal_fx.filter(p => p.id !== presetId),
      instrument: categorizedPresets.instrument.filter(p => p.id !== presetId)
    });

    // Update localStorage and DynamoDB
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_favorites', JSON.stringify(newFavorites));

      // Also remove from DynamoDB if user is authenticated
      if (userId) {
        removeFromFavorites(userId, presetId)
          .catch(error => {
            return null;
          });
      }
    }
  }, [favorites, categorizedPresets, userId]);

  return {
    favorites,
    allPresets,
    favoritePresets,
    categorizedPresets,
    loading,
    handlePresetsUpdate,
    handleRemoveFavorite
  };
};

export default function FavoritesPage() {
  return (
    <PresetsProvider>
      <FavoritesContent />
    </PresetsProvider>
  );
}

function FavoritesContent() {
  const { currentUser } = useAuth();
  const router = useRouter();

  const {
    favoritePresets,
    categorizedPresets,
    loading,
    handlePresetsUpdate,
    handleRemoveFavorite
  } = useFavorites(currentUser?.uid);

  // Add state for credit tracking
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState<boolean>(true);

  // Load user credit information
  useEffect(() => {
    if (currentUser?.uid) {
      const loadCredits = async () => {
        try {
          setIsLoadingCredits(true);
          const creditData = await getUserCreditBalance(currentUser.uid);
          setUserCredits(creditData.available);
        } catch (error) {
          console.error('[FavoritesPage] Error loading user credits:', error);
        } finally {
          setIsLoadingCredits(false);
        }
      };

      loadCredits();
    }
  }, [currentUser]);

  // Handle navigation to preset detail page - memoized
  const handlePresetSelect = useCallback((preset: Preset) => {
    try {
      // Format preset ID for URL
      const presetId = preset.id.replace(/\s+/g, '_');
      const category = preset.category;

      // New URL format: /presets/{category}/{presetId}
      const targetUrl = `/presets/${category}/${presetId}`;

      // Try direct navigation first for immediate feedback
      if (typeof window !== 'undefined') {
        window.location.href = targetUrl;
        return;
      }

      // Fallback to Next.js router navigation
      router.push(targetUrl);
    } catch (error) {
      // Ultimate fallback
      if (typeof window !== 'undefined') {
        window.location.href = `/presets`;
      }
    }
  }, [router]);

  // Get category title for display - memoized
  const getCategoryTitle = useCallback((category: string): string => {
    switch(category) {
      case 'vocal_fx': return 'Vocal FX';
      case 'vocal_chain': return 'Vocal Chain';
      case 'instrument': return 'Instrument';
      default: return category.replace('_', ' ');
    }
  }, []);

  // Memoize hero section props
  const heroSectionProps = useMemo(() => ({
    title: "Favorite Presets",
    subtitle: "Your collection of favorite presets, organized by category",
    backgroundImage: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    badge: { text: "MY FAVORITES" },
    height: "small" as const,
    shape: "curved" as const,
    customGradient: "bg-gradient-to-r from-purple-800/90 to-purple-600/90"
  }), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection {...heroSectionProps} />

      {/* Hidden PresetSync component to load data */}
      <div className="hidden">
        <PresetSync
          activeFilters={{}}
          onResultsUpdate={handlePresetsUpdate}
        />
      </div>

      <div className="container mx-auto px-8 py-6 mb-16">
        <div className="max-w-5xl mx-auto">
          {/* Remove breadcrumb and keep only tabs for consistent UI */}
          {/* Navigation Tabs */}
          <div className="flex mb-8 border-b border-gray-200">
            <Link href="/profile" className="px-6 py-3 font-medium text-gray-500 hover:text-purple-600 transition-colors">
              Profile Overview
            </Link>
            <Link href="/profile/downloads" className="px-6 py-3 font-medium text-gray-500 hover:text-purple-600 transition-colors">
              My Downloads
            </Link>
            <Link href="/profile/credits" className="px-6 py-3 font-medium text-gray-500 hover:text-purple-600 transition-colors">
              Credit Management
            </Link>
            <div className="px-6 py-3 font-medium text-purple-600 border-b-2 border-purple-600">
              Favorite Presets
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <p className="ml-4 text-purple-600">Loading your favorites...</p>
              </div>
            ) : favoritePresets.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700">No favorites yet</h3>
                <p className="text-gray-500 mb-6 mt-2">
                  Browse our preset collection and add some to your favorites
                </p>
                <Link
                  href="/presets"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
                >
                  Browse Presets
                </Link>
              </div>
            ) : (
              <div>
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Favorite Presets</h2>
                  <Link
                    href="/presets"
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    Browse More
                  </Link>
                </div>

                {/* Display favorites by category */}
                {Object.entries(categorizedPresets).map(([category, presets]) => {
                  if (presets.length === 0) return null;

                  return (
                    <div key={category} className="mb-10">
                      <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                        {getCategoryTitle(category)} ({presets.length})
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {presets.map(preset => (
                          <div
                            key={preset.id}
                            className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200
                            hover:border-purple-500 hover:shadow-purple-300/30 transition-all duration-300
                            hover:-translate-y-1 cursor-pointer"
                            onClick={() => handlePresetSelect(preset)}
                          >
                            <div className="relative h-36 bg-gradient-to-r from-purple-800 to-purple-600 overflow-hidden">
                              {/* Plugin Badge */}
                              {preset.filters.plugin && typeof preset.filters.plugin === 'string' && preset.filters.plugin === 'Professional' && (
                                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                  Professional
                                </div>
                              )}
                              {preset.filters.plugin && typeof preset.filters.plugin === 'string' && preset.filters.plugin === 'Stock' && (
                                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-purple-600 to-purple-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                  Stock
                                </div>
                              )}
                              {preset.filters.plugin && typeof preset.filters.plugin === 'string' && preset.filters.plugin === 'Waves' && (
                                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                  Waves
                                </div>
                              )}
                              {/* Plugin badge - additional support for other values */}
                              {preset.filters.plugin && typeof preset.filters.plugin === 'string' &&
                               !['Professional', 'Stock', 'Waves', 'Any'].includes(preset.filters.plugin) && (
                                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-gray-600 to-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                  {preset.filters.plugin}
                                </div>
                              )}
                              {/* Plugin badge for array type */}
                              {preset.filters.plugin && Array.isArray(preset.filters.plugin) && preset.filters.plugin.length > 0 && preset.filters.plugin[0] !== 'Any' && (
                                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-gray-600 to-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                  {preset.filters.plugin[0]}
                                  {preset.filters.plugin.length > 1 && (
                                    <span className="ml-1 bg-white/20 px-1.5 rounded-full text-[10px]">
                                      +{preset.filters.plugin.length - 1}
                                    </span>
                                  )}
                                </div>
                              )}

                              {preset.image ? (
                                <>
                                  <div className="absolute inset-0">
                                    <Image
                                      src={preset.image}
                                      alt={preset.title}
                                      fill
                                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                                      loading="lazy"
                                      placeholder="blur"
                                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjE0MGI1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg=="
                                    />
                                  </div>
                                </>
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <span className="text-2xl text-white">{getCategoryTitle(preset.category)}</span>
                                </div>
                              )}

                              {/* Remove from favorites button */}
                              {/* <button
                                onClick={(e) => handleRemoveFavorite(e, preset.id)}
                                className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-md text-red-500 hover:text-red-600 transition-all transform hover:scale-105 z-10"
                                aria-label={`Remove ${preset.title} from favorites`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </button> */}

                            </div>

                            <div className="p-4">
                              <h4 className="font-medium text-gray-800 mb-1 truncate">{preset.title}</h4>

                              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                {preset.description || `A professional ${preset.filters.genre} preset for ${preset.filters.gender} vocals using ${preset.filters.daw}.`}
                              </p>

                              {/* Filter tags section matching the presets page design */}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {/* {preset.category && (
                                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                                    {getCategoryTitle(preset.category)}
                                  </span>
                                )} */}

                                {preset.filters.daw && (
                                  <div className="filter-badge-group group/daw relative">
                                    <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium flex items-center max-w-[140px] truncate hover:bg-blue-100 transition-colors">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                      </svg>
                                      <span className="truncate">
                                        {Array.isArray(preset.filters.daw)
                                          ? preset.filters.daw[0]
                                          : preset.filters.daw}
                                      </span>
                                      {Array.isArray(preset.filters.daw) && preset.filters.daw.length > 1 && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded-full text-[10px] font-semibold flex-shrink-0">
                                          +{preset.filters.daw.length - 1}
                                        </span>
                                      )}
                                    </div>

                                    {/* Tooltip for multiple values */}
                                    {Array.isArray(preset.filters.daw) && preset.filters.daw.length > 1 && (
                                      <div className="absolute left-0 bottom-full mb-2 bg-white rounded-lg shadow-lg p-2 w-max max-w-[200px] z-10 invisible group-hover/daw:visible opacity-0 group-hover/daw:opacity-100 transition-all duration-200 pointer-events-none">
                                        <div className="text-xs font-medium text-gray-700 mb-1">Compatible DAWs:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {preset.filters.daw.map((daw, index) => (
                                            <span key={index} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px]">
                                              {daw}
                                            </span>
                                          ))}
                                        </div>
                                        <div className="absolute h-2 w-2 bg-white transform rotate-45 left-6 -bottom-1"></div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {preset.filters.genre && preset.filters.genre !== 'Any' && (
                                  <div className="filter-badge-group group/genre relative">
                                    <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium flex items-center max-w-[140px] truncate hover:bg-purple-100 transition-colors">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                      </svg>
                                      <span className="truncate">
                                        {Array.isArray(preset.filters.genre)
                                          ? preset.filters.genre[0]
                                          : preset.filters.genre}
                                      </span>
                                      {Array.isArray(preset.filters.genre) && preset.filters.genre.length > 1 && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-purple-200 text-purple-800 rounded-full text-[10px] font-semibold flex-shrink-0">
                                          +{preset.filters.genre.length - 1}
                                        </span>
                                      )}
                                    </div>

                                    {/* Tooltip for multiple values */}
                                    {Array.isArray(preset.filters.genre) && preset.filters.genre.length > 1 && (
                                      <div className="absolute left-0 bottom-full mb-2 bg-white rounded-lg shadow-lg p-2 w-max max-w-[200px] z-10 invisible group-hover/genre:visible opacity-0 group-hover/genre:opacity-100 transition-all duration-200 pointer-events-none">
                                        <div className="text-xs font-medium text-gray-700 mb-1">Genres:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {preset.filters.genre.map((genre, index) => (
                                            <span key={index} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px]">
                                              {genre}
                                            </span>
                                          ))}
                                        </div>
                                        <div className="absolute h-2 w-2 bg-white transform rotate-45 left-6 -bottom-1"></div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {preset.filters.gender && (
                                  <div className="filter-badge-group group/gender relative">
                                    <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium flex items-center max-w-[140px] truncate hover:bg-green-100 transition-colors">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="truncate">
                                        {Array.isArray(preset.filters.gender)
                                          ? preset.filters.gender[0]
                                          : preset.filters.gender}
                                      </span>
                                      {Array.isArray(preset.filters.gender) && preset.filters.gender.length > 1 && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-green-200 text-green-800 rounded-full text-[10px] font-semibold flex-shrink-0">
                                          +{preset.filters.gender.length - 1}
                                        </span>
                                      )}
                                    </div>

                                    {/* Tooltip for multiple values */}
                                    {Array.isArray(preset.filters.gender) && preset.filters.gender.length > 1 && (
                                      <div className="absolute left-0 bottom-full mb-2 bg-white rounded-lg shadow-lg p-2 w-max max-w-[200px] z-10 invisible group-hover/gender:visible opacity-0 group-hover/gender:opacity-100 transition-all duration-200 pointer-events-none">
                                        <div className="text-xs font-medium text-gray-700 mb-1">Vocal Types:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {preset.filters.gender.map((gender, index) => (
                                            <span key={index} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px]">
                                              {gender}
                                            </span>
                                          ))}
                                        </div>
                                        <div className="absolute h-2 w-2 bg-white transform rotate-45 left-6 -bottom-1"></div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}