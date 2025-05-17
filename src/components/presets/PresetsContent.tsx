import React, { useState, useEffect, useRef, useCallback } from 'react';
import PresetSync from './PresetSync';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  FavoriteRecord
} from '@/lib/favoritesTracking';
import HeroSection from '../HeroSection';
import { useRouter } from 'next/navigation';

interface Preset {
  id: string;
  title: string;
  description: string;
  image: string | null;
  category: string;
  filters: {
    daw: string | string[];
    gender: string | string[];
    genre: string | string[];
    plugin: string | string[];
    [key: string]: string | string[];
  };
  mp3s: {
    before: string | null;
    after: string | null;
  };
  fullPreset: string | null;
  uploader: {
    name: string;
    avatar: string;
  };
}

interface Filters {
  daw: string | null;
  gender: string | null;
  genre: string | null;
  plugin: string | null;
  category: string | null;
  instrument?: string | null;
  complexity?: string | null;
  effect?: string | null;
  style?: string | null;
}

interface Favorites {
  [key: string]: boolean;
}

interface AudioPlaying {
  audio: HTMLAudioElement;
  presetId: string;
}

interface PresetsPageProps {
  onNavigate: (page: string, presetId?: string) => void;
  onAuthRequired: (callback: () => void) => void;
  initialTab?: 'premium' | 'vocal-chain' | 'instrument';
}


function PresetsPage({ onNavigate, onAuthRequired, initialTab = 'premium' }: PresetsPageProps) {
  // Add useEffect to load favorites from DynamoDB
  const { currentUser } = useAuth();
  const router = useRouter();

  // Initialize with initialTab or default to premium
  const [activeTab, setActiveTab] = useState<'premium' | 'vocal-chain' | 'instrument'>(initialTab || 'premium');

  // Track category counts for display
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    premium: 0,
    vocal_chain: 0,
    instrument: 0
  });

  // Add immediateDisplayCount state
  const [immediateDisplayCount, setImmediateDisplayCount] = useState<number>(0);

  const [filters, setFilters] = useState<Filters>({
    daw: null,
    gender: null,
    genre: null,
    plugin: null,
    category: 'premium' // Ensure premium is the default category
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [favorites, setFavorites] = useState<Favorites>(() => {
    // Only load favorites from localStorage if user is authenticated
    if (typeof window !== 'undefined' && currentUser?.uid) {
      const savedFavorites = localStorage.getItem('user_favorites');
      return savedFavorites ? JSON.parse(savedFavorites) : {};
    }
    return {};
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [playingAudio, setPlayingAudio] = useState<AudioPlaying | null>(null);
  const [filteredPresets, setFilteredPresets] = useState<Preset[]>([]);
  const [totalPresets, setTotalPresets] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const presetsPerPage = 9;

  // Add state for tracking which dropdown is open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // At the beginning of the component, add a state for tracking initial tab load
  const [initialTabLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [isLoadingTab, setIsLoadingTab] = useState<boolean>(true);

  // Modified: Initialize tab from prop and localStorage
  useEffect(() => {
    // If initialTab is provided, use it
    if (initialTab) {
      setActiveTab(initialTab);
      // Convert dash to underscore for the category format
      const categoryId = initialTab.replace(/-/g, '_');
      setFilters(prev => ({
        ...prev,
        category: categoryId
      }));
    }
    // If not, check localStorage
    else if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('activePresetTab') as 'premium' | 'vocal-chain' | 'instrument' || 'premium';
      setActiveTab(savedTab);
      const categoryId = savedTab.replace(/-/g, '_');
      setFilters(prev => ({
        ...prev,
        category: categoryId
      }));
    }
  }, [initialTab]);

  // Track clicks outside dropdowns to close them
  useEffect(() => {
    const closeDropdowns = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If click is outside a dropdown button or dropdown content
      if (!target.closest('.dropdown-button') && !target.closest('.dropdown-content')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  // Function to toggle dropdown
  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  // Add a state to trigger PresetSync re-fetch
  const [presetSyncTrigger, setPresetSyncTrigger] = useState(0);

  // Update favorites when auth state changes
  useEffect(() => {
    if (currentUser?.uid) {
      // Get favorites from DynamoDB for the authenticated user
      getUserFavorites(currentUser.uid)
        .then(favoriteRecords => {
          // Convert to the format used in state: { presetId: true }
          const favoritesObj = favoriteRecords.reduce((acc, favorite) => {
            acc[favorite.presetId] = true;
            return acc;
          }, {} as Record<string, boolean>);

          // Use requestAnimationFrame for smoother UI updates
          requestAnimationFrame(() => {
            setFavorites(favoritesObj);
          });

          // Sync with localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_favorites', JSON.stringify(favoritesObj));
          }
        })
        .catch(error => {
          return null;
        });
    } else {
      // Clear favorites when user is not authenticated
      setFavorites({});
    }
  }, [currentUser]);

  // Save favorites to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser?.uid && Object.keys(favorites).length > 0) {
      localStorage.setItem('user_favorites', JSON.stringify(favorites));
    }

    // If we're in favorites-only mode, update the filtered presets without resetting to page 1
    if (showFavoritesOnly && !loading) {
      const allFilteredPresets = filteredPresets.filter(preset => favorites[preset.id]);
      setFilteredPresets(allFilteredPresets);
      setTotalPresets(allFilteredPresets.length);

      // Make sure we don't show an empty page if the current page would be empty after filter
      const newTotalPages = Math.ceil(allFilteredPresets.length / presetsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    }
  }, [favorites, currentUser]);

  const handleFilterChange = (category: keyof Filters, value: string) => {
    setFilters({
      ...filters,
      [category]: filters[category] === value ? null : value
    });
    setCurrentPage(1);
  };

  const handlePresetSelect = (presetId: string, category: string) => {
    try {
      // Replace spaces with underscores for URL compatibility
      const urlSafePresetId = presetId.replace(/\s+/g, '_');

      // Use the new URL structure: /presets/{category}/{presetId}
      const targetPath = `/presets/${category}/${urlSafePresetId}`;

      // Try direct navigation first
      if (typeof window !== 'undefined') {
        window.location.href = targetPath;
        return;
      }

      // Fallback to router navigation
      router.push(targetPath);
    } catch (error) {
      return null;
    }
  };

  const handleTabChange = (tab: 'premium' | 'vocal-chain' | 'instrument') => {
    // Don't do anything if we're already on this tab and it's loaded
    if (tab === activeTab) {
      return;
    }

    // Set loading states
    setLoading(true);
    setIsLoadingTab(true);
    setInitialLoadComplete(false);

    // Clear filtered presets immediately to prevent showing old data during loading
    setFilteredPresets([]);
    setTotalPresets(0);

    // Store selection in local storage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('activePresetTab', tab);
    }

    // Update active tab state
    setActiveTab(tab);

    // Update filters.category to match the new tab
    const categoryMapping: Record<string, string> = {
      'premium': 'premium',
      'vocal-chain': 'vocal_chain',
      'instrument': 'instrument'
    };

    // Set the filters to match the new tab category
    setFilters({
      ...filters,
      category: categoryMapping[tab] || tab
    });

    // Trigger a preset refresh
    setPresetSyncTrigger(prev => prev + 1);

    // Navigate to the category page URL
    const categoryForUrl = categoryMapping[tab] || tab;
    router.push(`/presets/${categoryForUrl}`);
  };

  // Handle favorite toggling with auth check
  const handleFavoriteToggle = (presetId: string) => {
    onAuthRequired(() => {
      // First, prevent default behavior to stop event propagation
      // Only execute if user is authenticated
      const newFavoriteState = !favorites[presetId];

      // Find the preset to get its details
      const preset = filteredPresets.find(p => p.id === presetId);
      if (!preset) return;

      // Use optimistic UI update - set state immediately before API call
      // Create a new object reference to ensure React detects the change
      const newFavorites = { ...favorites, [presetId]: newFavoriteState };
      setFavorites(newFavorites);

      // Update DynamoDB if user is authenticated
      if (currentUser?.uid) {
        // Store currentUser outside to avoid closure issues
        const uid = currentUser.uid;
        const email = currentUser.email || 'anonymous@user.com';

        // Separate state update from API call to prevent UI flickering
        if (newFavoriteState) {
          // Add to favorites in DynamoDB
          addToFavorites(
            uid,
            presetId,
            preset.title,
            preset.category,
            email
          ).catch(error => {
            // Revert state on error
            console.error("[Favorite Error]", error);
            setFavorites(prevFavorites => ({ ...prevFavorites, [presetId]: !newFavoriteState }));
          });
        } else {
          // Remove from favorites in DynamoDB
          removeFromFavorites(
            uid,
            presetId
          ).catch(error => {
            // Revert state on error
            console.error("[Favorite Error]", error);
            setFavorites(prevFavorites => ({ ...prevFavorites, [presetId]: !newFavoriteState }));
          });
        }
      }
    });
  };

  const handlePlayAudio = (audioUrl: string, presetId: string) => {
    if (playingAudio?.presetId === presetId) {
      playingAudio.audio.pause();
      setPlayingAudio(null);
    } else {
      if (playingAudio) {
        playingAudio.audio.pause();
      }
      const audio = new Audio(audioUrl);
      audio.play();
      setPlayingAudio({ audio, presetId });

      audio.addEventListener('ended', () => {
        setPlayingAudio(null);
      });
    }
  };

  // Handler for category counts update from PresetSync
  const handleCategoryCountsUpdate = (counts: Record<string, number>) => {
    setCategoryCounts(counts);

    // Update the immediate display count based on the current active tab
    const categoryId = activeTab.replace(/-/g, '_');

    // Set immediate display count even if it's 0
    setImmediateDisplayCount(counts[categoryId] || 0);

    // Set loading to false regardless of whether presets exist or not
    setLoading(false);
  };

  // Update when tab changes to immediately show the count for that category
  useEffect(() => {
    const categoryId = activeTab.replace(/-/g, '_');
    setImmediateDisplayCount(categoryCounts[categoryId] || 0);

    // Make sure the active tab's category is set in filters
    if (filters.category !== categoryId) {
      setFilters(prev => ({
        ...prev,
        category: categoryId
      }));
    }
  }, [activeTab, categoryCounts]);

  // Modify the handlePresetsUpdate function
  const handlePresetsUpdate = (presets: Preset[], count: number) => {
    // Use requestAnimationFrame for smoother UI updates
    requestAnimationFrame(() => {
      // Only update if we actually have presets
      if (presets && Array.isArray(presets)) {
        // Batch state updates to prevent multiple renders
        // First set the filtered presets
        setFilteredPresets(presets);
        // Set the total count and immediate display count
        setTotalPresets(count);
        setImmediateDisplayCount(count);

        // After a small delay to ensure the DOM has updated, turn off loading state
        // Using a longer timeout to ensure everything is loaded
        setTimeout(() => {
          setLoading(false);
          setIsLoadingTab(false);
        }, 200);
      } else if (!loading && initialTabLoadComplete) {
        // If we have no presets but loading is done, show empty state
        setLoading(false);
        setIsLoadingTab(false);
      }
    });
  };

  // useEffect for search term changes
  useEffect(() => {
    // Reset initialLoadComplete when search changes
    setInitialLoadComplete(false);

    // Set loading to true when starting a new search
    setLoading(true);

    // Set a small delay for typing
    const timeoutId = setTimeout(() => {
      // Ensure we keep the current category when searching
      if (!filters.category) {
        setFilters({
          ...filters,
          category: activeTab.replace(/-/g, '_')
        });
      }

      // Trigger a re-fetch of presets with updated search term
      setPresetSyncTrigger(prev => prev + 1);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeTab]);

  // useEffect to handle filter changes
  useEffect(() => {
    // Reset initialLoadComplete when filters change
    setInitialLoadComplete(false);

    // Set loading to true when starting a new filter
    setLoading(true);

    // Trigger a re-fetch when filters change
    setPresetSyncTrigger(prev => prev + 1);
  }, [filters]);

  // useEffect for favorites filter changes
  useEffect(() => {
    if (!loading) {
      // Reset initialLoadComplete when favorites filter changes
      setInitialLoadComplete(false);

      // Set loading to true when applying favorites filter
      setLoading(true);

      // Apply favorites filter to the current filtered presets
      if (showFavoritesOnly) {
        // Get original presets from PresetSync
        const allFilteredPresets = filteredPresets.filter(preset => favorites[preset.id]);
        setFilteredPresets(allFilteredPresets);
        setTotalPresets(allFilteredPresets.length);

        // Mark initial load as complete after favorites filtering
        setTimeout(() => {
          setInitialLoadComplete(true);
          setLoading(false);
        }, 300);
      } else {
        // Reset to full filtered set by triggering a re-fetch
        setPresetSyncTrigger(prev => prev + 1);
      }
      setCurrentPage(1);
    }
  }, [showFavoritesOnly]); // Only react to showFavoritesOnly toggle, not favorites changes

  // Filter options for the UI

  // Category-specific filter options based on tabs
  const vocalChainFilters = {
    daw: ['Ableton', 'FL Studio', 'Pro Tools', 'Logic Pro', 'GarageBand', 'Studio One', 'Cubase', 'REAPER', 'Bigwig Studio'],
    gender: ['Male', 'Female'],
    genre: ['Hip Hop', 'Pop', 'Rock', 'Soul', 'R&B', 'House', 'EDM', 'Reggaeton', 'Country', 'Jazz'],
    plugin: ['Stock', 'Waves', 'Professional']
  };

  // const vocalFxFilters = {
  //   daw: ['Ableton', 'FL Studio', 'Pro Tools', 'Logic Pro', 'GarageBand', 'Studio One'],
  //   effect: ['AutoTune', 'Reverb', 'Delay', 'Chorus', 'Distortion', 'Vocoder', 'Harmonizer', 'Compression'],
  //   genre: ['Hip Hop', 'Pop', 'EDM', 'Rock', 'Experimental'],
  //   style: ['Subtle', 'Moderate', 'Extreme']
  // };

  const instrumentFilters = {
    daw: ['Ableton', 'FL Studio', 'Pro Tools', 'Logic Pro', 'GarageBand', 'Studio One', 'Cubase'],
    instrument: ['Piano', 'Guitar', 'Drums', 'Bass', 'Synth', 'Strings', 'Brass', 'Woodwinds', 'Percussion'],
    genre: ['Hip Hop', 'Pop', 'Rock', 'Soul', 'R&B', 'House', 'EDM', 'Reggaeton', 'Country', 'Jazz', 'Classical', 'Experimental'],
    complexity: ['Basic', 'Intermediate', 'Advanced']
  };

  // Get current filter options based on active tab
  const getFilterOptions = () => {
    switch(activeTab) {
      case 'premium':
        return vocalChainFilters; // Use the same filters as vocal-chain for premium
      case 'vocal-chain':
        return vocalChainFilters;
      case 'instrument':
        return instrumentFilters;
      default:
        return vocalChainFilters;
    }
  };

  const filterOptions = getFilterOptions();

  // Calculate pagination
  const totalPages = Math.ceil(totalPresets / presetsPerPage);
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to the top of the page when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get current presets for the current page
  const indexOfLastPreset = currentPage * presetsPerPage;
  const indexOfFirstPreset = indexOfLastPreset - presetsPerPage;
  const currentPresets = filteredPresets.slice(indexOfFirstPreset, indexOfLastPreset);

  // Create activeFilters object for PresetSync
  const activeFilters = {
    ...filters
  };

  // Function to clear all filters except category
  const clearFilters = () => {
    setFilters({
      ...filters,
      daw: null,
      gender: null,
      genre: null,
      plugin: null,
      instrument: null,
      complexity: null,
      effect: null,
      style: null,
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* This is our data provider component - it doesn't render anything visible */}
      <PresetSync
        activeFilters={activeFilters}
        searchQuery={searchTerm}
        onResultsUpdate={handlePresetsUpdate}
        onCategoryCountsUpdate={handleCategoryCountsUpdate}
        triggerRefresh={presetSyncTrigger}
        onInitialLoadComplete={() => {
          // Set initialLoadComplete state to true to show "No presets" state if needed
          setInitialLoadComplete(true);

          // If we still don't have presets after the loading is complete, set loading to false
          if (filteredPresets.length === 0) {
            setLoading(false);
            setIsLoadingTab(false);
          }
        }}
        key={`preset-sync-${activeTab}`}
      />

      <HeroSection
        title="Find Your Perfect Sound"
        subtitle="Browse our premium collection of professionally crafted audio presets for all your production needs."
        backgroundImage="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "PREMIUM PRESETS" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-purple-800/90 to-purple-600/90"
      />

      <div className="container mx-auto max-w-7xl px-6 pb-20">
        {/* Enhanced Category Navigation with Icons */}
        <div className="mb-8 -mt-12 relative z-20">
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-5">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex flex-wrap gap-3">
                {/* Premium tab */}
                <button
                  onClick={() => handleTabChange('premium')}
                  className={`py-3 px-5 rounded-xl font-medium text-lg transition-all flex items-center gap-2 ${
                    activeTab === 'premium'
                      ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-lg shadow-amber-300/30 scale-105'
                      : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                  disabled={isLoadingTab && activeTab === 'premium'}
                >
                  {activeTab === 'premium' && isLoadingTab ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  )}
                  <span>Premium</span>
                </button>
                <button
                  onClick={() => handleTabChange('vocal-chain')}
                  className={`py-3 px-5 rounded-xl font-medium text-lg transition-all flex items-center gap-2 ${
                    activeTab === 'vocal-chain'
                      ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-lg shadow-purple-300/30 scale-105'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                  disabled={isLoadingTab && activeTab === 'vocal-chain'}
                >
                  {activeTab === 'vocal-chain' && isLoadingTab ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                  <span>Vocal Chain</span>
                  {categoryCounts['vocal_chain'] > 0 && (
                    <span className="ml-1 bg-white/20 text-xs rounded-full px-2 py-0.5">
                      {categoryCounts['vocal_chain']}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange('instrument')}
                  className={`py-3 px-5 rounded-xl font-medium text-lg transition-all flex items-center gap-2 ${
                    activeTab === 'instrument'
                      ? 'bg-gradient-to-r from-green-700 to-green-600 text-white shadow-lg shadow-green-300/30 scale-105'
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                  disabled={isLoadingTab && activeTab === 'instrument'}
                >
                  {activeTab === 'instrument' && isLoadingTab ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  )}
                  <span>Instruments</span>
                  {categoryCounts['instrument'] > 0 && (
                    <span className="ml-1 bg-white/20 text-xs rounded-full px-2 py-0.5">
                      {categoryCounts['instrument']}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center ml-auto mt-3 md:mt-0 space-x-3">
                <button
                  onClick={() => onAuthRequired(() => setShowFavoritesOnly(!showFavoritesOnly))}
                  className={`flex items-center space-x-2 border rounded-lg px-4 py-2 transition-all ${
                    showFavoritesOnly
                      ? 'bg-purple-100 border-purple-500 text-purple-700 shadow-md'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg
                    className={`h-5 w-5 ${showFavoritesOnly ? 'text-purple-600' : 'text-gray-500'}`}
                    fill={showFavoritesOnly ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>Favorites</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Horizontal Filter Bar */}
          <div className="w-full">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="relative flex-grow max-w-xl">
                  <input
                    type="text"
                    placeholder="Search presets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="absolute left-3 top-3.5">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* Applied Filters Display */}
                <div className="flex flex-wrap gap-2">
                  {filters.daw && (
                    <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg flex items-center gap-2">
                      <span>DAW: {filters.daw}</span>
                      <button
                        onClick={() => handleFilterChange('daw', filters.daw || '')}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {filters.gender && (
                    <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg flex items-center gap-2">
                      <span>Gender: {filters.gender}</span>
                      <button
                        onClick={() => handleFilterChange('gender', filters.gender || '')}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {filters.genre && (
                    <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg flex items-center gap-2">
                      <span>Genre: {filters.genre}</span>
                      <button
                        onClick={() => handleFilterChange('genre', filters.genre || '')}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {filters.plugin && (
                    <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg flex items-center gap-2">
                      <span>Plugin: {filters.plugin}</span>
                      <button
                        onClick={() => handleFilterChange('plugin', filters.plugin || '')}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {(filters.daw !== null || filters.gender !== null || filters.genre !== null || filters.plugin !== null) && (
                    <button
                      onClick={clearFilters}
                      className="text-purple-600 text-sm font-medium hover:text-purple-800 px-3 py-2 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* DAW Filter - always shown for all categories */}
                <div className="dropdown relative">
                  <button
                    className="dropdown-button w-full flex justify-between items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                    onClick={() => toggleDropdown('daw')}
                  >
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                      <span>{filters.daw || 'Select DAW'}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`dropdown-content absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-30 py-2 ${openDropdown === 'daw' ? 'block' : 'hidden'}`}>
                    {filterOptions.daw.map((daw) => (
                      <button
                        key={daw}
                        onClick={() => {
                          handleFilterChange('daw', daw);
                          setOpenDropdown(null);
                        }}
                        className={`flex items-center w-full px-4 py-2 hover:bg-gray-100 ${
                          filters.daw === daw ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                        }`}
                      >
                        <span className={`mr-2 inline-block h-3 w-3 rounded-full ${
                          filters.daw === daw ? 'bg-purple-600' : 'border border-gray-300'
                        }`}></span>
                        {daw}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Genre Filter - shown for all categories */}
                <div className="dropdown relative">
                  <button
                    className="dropdown-button w-full flex justify-between items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                    onClick={() => toggleDropdown('genre')}
                  >
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      <span>{filters.genre || 'Select Genre'}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`dropdown-content absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-30 py-2 ${openDropdown === 'genre' ? 'block' : 'hidden'}`}>
                    {filterOptions.genre.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => {
                          handleFilterChange('genre', genre);
                          setOpenDropdown(null);
                        }}
                        className={`flex items-center w-full px-4 py-2 hover:bg-gray-100 ${
                          filters.genre === genre ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                        }`}
                      >
                        <span className={`mr-2 inline-block h-3 w-3 rounded-full ${
                          filters.genre === genre ? 'bg-purple-600' : 'border border-gray-300'
                        }`}></span>
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Third Filter - different for each category */}
                {(activeTab === 'vocal-chain' || activeTab === 'premium') && (
                <div className="dropdown relative">
                  <button
                    className="dropdown-button w-full flex justify-between items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                    onClick={() => toggleDropdown('gender')}
                  >
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{filters.gender || 'Select Gender'}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`dropdown-content absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-30 py-2 ${openDropdown === 'gender' ? 'block' : 'hidden'}`}>
                      {(filterOptions as typeof vocalChainFilters).gender.map((gender) => (
                      <button
                        key={gender}
                        onClick={() => {
                          handleFilterChange('gender', gender);
                          setOpenDropdown(null);
                        }}
                        className={`flex items-center w-full px-4 py-2 hover:bg-gray-100 ${
                          filters.gender === gender ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                        }`}
                      >
                        <span className={`mr-2 inline-block h-3 w-3 rounded-full ${
                          filters.gender === gender ? 'bg-purple-600' : 'border border-gray-300'
                        }`}></span>
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {activeTab === 'instrument' && (
                  <div className="dropdown relative">
                    <button
                      className="dropdown-button w-full flex justify-between items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                      onClick={() => toggleDropdown('instrument')}
                    >
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        <span>{filters.instrument || 'Select Instrument'}</span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className={`dropdown-content absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-30 py-2 ${openDropdown === 'instrument' ? 'block' : 'hidden'}`}>
                      {(filterOptions as typeof instrumentFilters).instrument.map((instrument) => (
                        <button
                          key={instrument}
                          onClick={() => {
                            handleFilterChange('instrument', instrument);
                            setOpenDropdown(null);
                          }}
                          className={`flex items-center w-full px-4 py-2 hover:bg-gray-100 ${
                            filters.instrument === instrument ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                          }`}
                        >
                          <span className={`mr-2 inline-block h-3 w-3 rounded-full ${
                            filters.instrument === instrument ? 'bg-purple-600' : 'border border-gray-300'
                          }`}></span>
                          {instrument}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fourth/Final Filter - different for each category */}
                {(activeTab === 'vocal-chain' || activeTab === 'premium') && (
                <div className="dropdown relative">
                  <button
                    className="dropdown-button w-full flex justify-between items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                    onClick={() => toggleDropdown('plugin')}
                  >
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <span>{filters.plugin || 'Select Plugin'}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`dropdown-content absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-30 py-2 ${openDropdown === 'plugin' ? 'block' : 'hidden'}`}>
                      {(filterOptions as typeof vocalChainFilters).plugin.map((plugin: string) => (
                      <button
                        key={plugin}
                        onClick={() => {
                          handleFilterChange('plugin', plugin);
                          setOpenDropdown(null);
                        }}
                        className={`flex items-center w-full px-4 py-2 hover:bg-gray-100 ${
                          filters.plugin === plugin ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                        }`}
                      >
                        <span className={`mr-2 inline-block h-3 w-3 rounded-full ${
                          filters.plugin === plugin ? 'bg-purple-600' : 'border border-gray-300'
                        }`}></span>
                        {plugin}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {activeTab === 'instrument' && (
                  <div className="dropdown relative">
                    <button
                      className="dropdown-button w-full flex justify-between items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                      onClick={() => toggleDropdown('complexity')}
                    >
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <span>{filters.complexity || 'Select Complexity'}</span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className={`dropdown-content absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-30 py-2 ${openDropdown === 'complexity' ? 'block' : 'hidden'}`}>
                      {(filterOptions as typeof instrumentFilters).complexity.map((complexity: string) => (
                        <button
                          key={complexity}
                          onClick={() => {
                            handleFilterChange('complexity', complexity);
                            setOpenDropdown(null);
                          }}
                          className={`flex items-center w-full px-4 py-2 hover:bg-gray-100 ${
                            filters.complexity === complexity ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                          }`}
                        >
                          <span className={`mr-2 inline-block h-3 w-3 rounded-full ${
                            filters.complexity === complexity ? 'bg-purple-600' : 'border border-gray-300'
                          }`}></span>
                          {complexity}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Results Summary */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-lg text-left">
                  <span className="font-medium">
                    {searchTerm ||
                     Object.values(filters).some(v => v !== null && v !== '' && v !== filters.category) ||
                     showFavoritesOnly ?
                      totalPresets : immediateDisplayCount} {(searchTerm ||
                     Object.values(filters).some(v => v !== null && v !== '' && v !== filters.category) ||
                     showFavoritesOnly ?
                      totalPresets : immediateDisplayCount) === 1 ? 'result' : 'results'}
                  </span>
                  {searchTerm && <span className="text-gray-600"> matching "<span className="text-purple-600">{searchTerm}</span>"</span>}
                  {showFavoritesOnly && <span className="text-purple-600 ml-1 font-medium"> in favorites</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Presets grid */}
          <div className="w-full">
            <div className="text-gray-800">
              {loading ? (
                <div>
                  {/* Show skeleton loaders while loading instead of just a spinner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {[...Array(6)].map((_, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 animate-pulse"
                      >
                        <div className="w-full h-48 bg-gray-200"></div>
                        <div className="p-5">
                          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Only show "No presets" message when loading is definitely complete and we have confirmation of no results */}
                  {filteredPresets.length === 0 && initialTabLoadComplete && !loading && (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                      <div className="bg-purple-50 rounded-full p-6 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">No presets match your search</h3>
                      <p className="text-gray-600 max-w-md mx-auto mb-6">
                        No presets match your current filters. Try adjusting your search criteria or clearing filters.
                      </p>
                      {Object.values(filters).some(v => v !== null && v !== filters.category) && (
                        <button
                          onClick={clearFilters}
                          className="py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  )}

                  {/* Only show the grid if we have presets */}
                  {filteredPresets.length > 0 && (
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
                      style={{
                        opacity: 1,
                        transition: 'opacity 0.3s ease-in-out',
                        willChange: 'contents',
                        position: 'relative'
                      }}
                    >
                      {currentPresets.map((preset, index) => (
                        <div
                          key={`${preset.id}-${index}`}
                          className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200
                            hover:border-purple-500 hover:shadow-purple-300/30 transition-all duration-300
                            hover:-translate-y-1 cursor-pointer"
                          onClick={() => handlePresetSelect(preset.id, preset.category)}
                        >
                          <div className="relative">
                            {/* Badge */}
                            {preset.filters.plugin === 'Professional' && (
                              <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                Professional
                              </div>
                            )}
                            {preset.filters.plugin === 'Stock' && (
                              <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-purple-600 to-purple-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                Stock
                              </div>
                            )}
                            {preset.filters.plugin === 'Waves' && (
                              <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                Waves
                              </div>
                            )}
                            {preset.filters.plugin && typeof preset.filters.plugin === 'string' &&
                              !['Professional', 'Stock', 'Waves'].includes(preset.filters.plugin) &&
                              preset.filters.plugin !== 'Any' && (
                              <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-gray-600 to-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                {preset.filters.plugin}
                              </div>
                            )}
                            {Array.isArray(preset.filters.plugin) && preset.filters.plugin.length > 0 && preset.filters.plugin[0] !== 'Any' && (
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
                              <div className="w-full h-48 relative bg-gray-100">
                                {/* Use either Image or img tag based on environment */}
                                <div className="hidden md:block">
                                  <Image
                                    src={preset.image}
                                    alt={preset.title}
                                    className="transition-transform duration-700 group-hover:scale-110"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 300px"
                                    loading="eager"
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjE0MGI1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg=="
                                    style={{objectFit: 'cover'}}
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
                                        // If all formats fail, show fallback
                                        const imgElement = target.parentElement?.parentElement;
                                        if (imgElement) {
                                          imgElement.classList.add('hidden');
                                          const fallbackElement = imgElement.nextElementSibling;
                                          if (fallbackElement) fallbackElement.classList.remove('hidden');
                                        }
                                      }
                                    }}
                                  />
                                </div>
                                <div className="block md:hidden">
                                  <img
                                    src={preset.image}
                                    alt={preset.title}
                                    className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="eager"
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
                                        // If all formats fail, switch to fallback gradient
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          // Create gradient div
                                          const fallback = document.createElement('div');
                                          fallback.className = 'w-full h-48 bg-gradient-to-r from-purple-600 to-indigo-600 flex flex-col items-center justify-center';
                                          fallback.innerHTML = `
                                            <span class="text-2xl text-white opacity-70">${preset.category.replace('_', ' ')}</span>
                                            <span class="text-sm text-purple-200 mt-2">${Array.isArray(preset.filters.genre)
                                              ? preset.filters.genre[0]
                                              : preset.filters.genre}</span>
                                          `;
                                          parent.appendChild(fallback);
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              ) : (
                              <div className="w-full h-48 bg-gradient-to-r from-purple-600 to-indigo-600 flex flex-col items-center justify-center">
                                  <span className="text-3xl text-white opacity-70">{preset.category.replace('_', ' ')}</span>
                                  <span className="text-sm text-purple-200 mt-2">{preset.filters.genre}</span>
                                </div>
                              )}

                              {/* Favorite Button - Improved Design */}
                              <div className="absolute top-4 right-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleFavoriteToggle(preset.id);
                                    return false; // Ensure no further propagation
                                  }}
                                  className={`rounded-full p-3 shadow-lg backdrop-blur-sm transition-transform transition-colors transition-bg duration-300 transform-gpu will-change-transform ${
                                    favorites[preset.id]
                                      ? 'bg-red-500/90 text-white scale-110'
                                      : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                                  }`}
                                  aria-label={favorites[preset.id] ? "Remove from favorites" : "Add to favorites"}
                                >
                                  {favorites[preset.id] ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform-gpu" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform-gpu" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                  )}
                                </button>
                              </div>

                              {/* Play Button - Improved Design */}
                              {preset.mp3s.after && (
                                <div className="absolute bottom-4 right-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePlayAudio(preset.mp3s.after as string, preset.id);
                                    }}
                                    className={`rounded-full p-3.5 shadow-lg backdrop-blur-sm transition-all duration-300 ${
                                      playingAudio?.presetId === preset.id
                                        ? 'bg-purple-600 text-white scale-110 ring-4 ring-purple-300/50'
                                        : 'bg-white/80 text-purple-700 hover:bg-white hover:scale-105'
                                    }`}
                                  >
                                    {playingAudio?.presetId === preset.id ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              )}
                          </div>

                          <div className="p-5">
                            <div className="flex flex-col h-full">
                              <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-purple-700 transition-colors">
                                {preset.title}
                              </h3>

                              <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                                {preset.description || `A professional ${preset.filters.genre} preset for ${preset.filters.gender} vocals using ${preset.filters.daw}.`}
                              </p>

                              {/* Filter tags section with improved design */}
                              <div className="flex flex-wrap gap-2 mt-4">
                                {preset.filters.daw && (
                                  <div className="filter-badge-group group/daw relative">
                                    <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium flex items-center max-w-[140px] truncate hover:bg-blue-100 transition-colors">
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

                                {/* Genre tag - improved design */}
                                <div className="filter-badge-group group/genre relative">
                                  <div className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium flex items-center max-w-[140px] truncate hover:bg-purple-100 transition-colors">
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

                                {/* Gender tag - improved design */}
                                <div className="filter-badge-group group/gender relative">
                                  <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium flex items-center max-w-[140px] truncate hover:bg-green-100 transition-colors">
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
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination only visible when not loading and we have results to paginate */}
                  {filteredPresets.length > 0 && totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                      <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => paginate(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-4 py-2 rounded-l-md text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 ${
                            currentPage === 1
                              ? 'cursor-not-allowed'
                              : 'text-purple-600 hover:bg-purple-50'
                          }`}
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => paginate(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 ${
                                currentPage === pageNum
                                  ? 'text-purple-600'
                                  : 'text-gray-500'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-4 py-2 rounded-r-md text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 ${
                            currentPage === totalPages
                              ? 'cursor-not-allowed'
                              : 'text-purple-600 hover:bg-purple-50'
                          }`}
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PresetsPage;