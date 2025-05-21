import { useState, useEffect, useRef, useMemo } from 'react';
import { usePresets, Preset } from './PresetsContext';

// Configure optimal values for performance
const CATEGORIES = ['premium', 'vocal_chain', 'instrument'];

interface PresetSyncProps {
  activeFilters: {
    category?: string | null;
    daw?: string | null;
    gender?: string | null;
    genre?: string | null;
    plugin?: string | null;
    [key: string]: string | null | undefined;
  };
  searchQuery?: string;
  onResultsUpdate?: (presets: Preset[], count: number) => void;
  onCategoryCountsUpdate?: (categoryCounts: Record<string, number>) => void;
  triggerRefresh?: number;
  onInitialLoadComplete?: () => void;
}

const PresetSync = ({
  activeFilters = {},
  searchQuery = '',
  onResultsUpdate,
  onCategoryCountsUpdate,
  triggerRefresh = 0,
  onInitialLoadComplete
}: PresetSyncProps) => {
  const { setPresets, setFilteredPresets, setTotalPresets, setLoading, updatePresetsState } = usePresets();
  const [retryCount, setRetryCount] = useState(0);
  // Add state for S3 URL
  const [presetS3Url, setPresetS3Url] = useState("preset.mixpreset.com");

  // Add ref for preset cache to maintain across renders
  const presetsCache = useRef<Map<string, Preset[]>>(new Map());
  // Add a flag to track initial load
  const initialLoadComplete = useRef(false);
  // Add a ref to store all fetched presets
  const allPresetsRef = useRef<Preset[]>([]);
  // Add timestamp for last successful fetch
  const lastSuccessfulFetch = useRef<number>(0);

  // Set up the S3 URL properly once we're client-side
  useEffect(() => {
    // This will only run on the client
    setPresetS3Url(process.env.NEXT_PUBLIC_PRESET_S3_URL || "preset.mixpreset.com");
  }, []);

  // Stable version of active filters that won't change on every render
  const stableActiveFilters = useMemo(() => ({
    category: activeFilters.category || null,
    daw: activeFilters.daw || null,
    gender: activeFilters.gender || null,
    genre: activeFilters.genre || null,
    plugin: activeFilters.plugin || null
  }), [
    activeFilters.category,
    activeFilters.daw,
    activeFilters.gender,
    activeFilters.genre,
    activeFilters.plugin
  ]);

  // Extract search terms for filtering
  const searchTerms = useMemo(() =>
    searchQuery.trim().toLowerCase().split(/\s+/).filter(term => term.length > 0),
    [searchQuery]
  );

  // Core sync function that handles everything
  const syncPresets = async () => {
    // Set loading state
    setLoading(true);

    // Reset cache if refresh is triggered
    if (triggerRefresh > 0) {
      presetsCache.current.clear();
      initialLoadComplete.current = false;
      lastSuccessfulFetch.current = 0;
    }

    try {
      // Check if we can use cached data
      const cachedPresets = presetsCache.current.get('all');
      const cacheIsValid = cachedPresets &&
                           lastSuccessfulFetch.current > 0 &&
                           (Date.now() - lastSuccessfulFetch.current < 5 * 60 * 1000); // 5 minutes

      // Use cache if it's valid
      if (cacheIsValid && !triggerRefresh) {
        console.log('Using cached presets');
        allPresetsRef.current = cachedPresets;
        applyFiltersAndUpdateState(cachedPresets);
        markLoadingComplete();
        return;
      }

      // If specifically filtering by category, only fetch that category
      if (stableActiveFilters.category) {
        const category = stableActiveFilters.category;
        await fetchCategoryData(category);
      } else {
        // Otherwise fetch all categories in parallel
        await fetchAllCategoriesData();
      }

      // Update category counts for UI
      updateCategoryCounts();

    } catch (error) {
      console.error("Error syncing presets:", error);
      markLoadingComplete();
    }
  };

  // Helper to fetch data for a specific category
  const fetchCategoryData = async (category: string) => {
    try {
      // Discover all preset folders for this category
      const presetFolders = await discoverFolders(category);
      if (!presetFolders.length) {
        console.warn(`No preset folders found for category: ${category}`);
        markLoadingComplete();
        return;
      }

      // Fetch each preset's data in parallel
      const presetPromises = presetFolders.map(folder => fetchPresetData(folder, category));
      const presets = (await Promise.all(presetPromises)).filter(Boolean) as Preset[];

      // Store the results
      allPresetsRef.current = presets;
      presetsCache.current.set(`category_${category}`, presets);

      // Use batch update if available
      if (typeof updatePresetsState === 'function') {
        // We'll set filtered presets later in applyFiltersAndUpdateState
        updatePresetsState(presets, [], 0, true);
      } else {
        setPresets(presets);
      }

      // Filter and update UI
      applyFiltersAndUpdateState(presets);
      markLoadingComplete();
    } catch (error) {
      console.error(`Error fetching category ${category}:`, error);

      // Retry logic
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        presetsCache.current.delete(`category_${category}`);
      } else {
        markLoadingComplete();
      }
    }
  };

  // Helper to fetch all categories
  const fetchAllCategoriesData = async () => {
    try {
      const allPresets: Preset[] = [];

      // Load categories in parallel
      const categoryPromises = CATEGORIES.map(async (category) => {
        const presetFolders = await discoverFolders(category);
        if (!presetFolders.length) return [];

        const presetPromises = presetFolders.map(folder => fetchPresetData(folder, category));
        return (await Promise.all(presetPromises)).filter(Boolean) as Preset[];
      });

      const categoryResults = await Promise.all(categoryPromises);

      // Combine all presets
      for (const presets of categoryResults) {
        allPresets.push(...presets);
      }

      if (allPresets.length === 0 && retryCount < 3) {
        setTimeout(() => setRetryCount(prev => prev + 1), 1000);
        return;
      }

      // Store results
      allPresetsRef.current = allPresets;
      presetsCache.current.set('all', allPresets);
      lastSuccessfulFetch.current = Date.now();

      // Use batch update if available
      if (typeof updatePresetsState === 'function') {
        // We'll set filtered presets later in applyFiltersAndUpdateState
        updatePresetsState(allPresets, [], 0, true);
      } else {
        setPresets(allPresets);
      }

      // Filter and update UI
      applyFiltersAndUpdateState(allPresets);
      markLoadingComplete();
    } catch (error) {
      console.error("Error fetching all categories:", error);
      markLoadingComplete();
    }
  };

  // Helper to discover preset folders in a category
  const discoverFolders = async (category: string): Promise<string[]> => {
    try {
      // First try to check if an index file exists
      const indexUrl = `https://${presetS3Url}/index.json`;

      try {
        const indexResponse = await fetch(indexUrl);
        if (indexResponse.ok) {
          const indexData = await indexResponse.json();

          if (indexData[category] && Array.isArray(indexData[category])) {
            return indexData[category].map((preset: string | { id: string }) => {
              const folderName = typeof preset === 'string' ? preset : preset.id;
              // Keep original folderName for path (no encoding yet, as we'll encode when constructing URLs)
              return `${category}/${folderName}/`;
            });
          }
        }
      } catch (error) {
        console.warn("No index file found, trying direct folder discovery");
      }

      // Fallback to querying the directory
      const folderUrl = `https://${presetS3Url}/${encodeURIComponent(category)}/`;

      try {
        const response = await fetch(folderUrl);
        if (response.ok) {
          const text = await response.text();
          const folderMatches = text.match(/<Key>(.*?)\/<\/Key>/g);

          if (folderMatches) {
            return folderMatches
              .map(match => match.replace(/<Key>|<\/Key>/g, ''))
              .filter(folder => folder.startsWith(`${category}/`) && folder.endsWith('/'));
          }
        }
      } catch (error) {
        console.warn("Error listing directory contents:", error);
      }

      return [];
    } catch (error) {
      console.error("Error discovering folders:", error);
      return [];
    }
  };

  // Helper to fetch a single preset's data
  const fetchPresetData = async (folderPath: string, category: string): Promise<Preset | null> => {
    try {
      // Extract preset name from folder path
      const presetName = folderPath.split('/')[1];
      if (!presetName) return null;

      // Create basic preset structure
      const presetId = presetName.replace(/_+/g, ' ');
      let presetData: Preset = {
        id: presetId,
        title: presetName.replace(/_/g, ' '),
        description: `A professional ${category.replace('_', ' ')} preset.`,
        category: category,
        image: null,
        fullPreset: null,
        mp3s: {
          before: null,
          after: null
        },
        filters: {
          daw: 'Any',
          gender: 'All',
          genre: 'Any',
          plugin: 'Any'
        },
        uploader: {
          name: 'Audio Creator',
          avatar: 'AC',
          email: null
        },
        metadata: {},
        credit_cost: 0
      };

      // Construct encoded URL path by encoding each path segment individually
      const encodedPath = folderPath.split('/').map(segment =>
        segment ? encodeURIComponent(segment) : ''
      ).join('/');

      // Try to fetch metadata
      const metaUrl = `https://${presetS3Url}/${encodedPath}meta.json`;
      try {
        const metaResponse = await fetch(metaUrl);
        if (metaResponse.ok) {
          const metaData = await metaResponse.json();

          // Update from metadata
          if (metaData.preset) {
            // Basic info
            if (metaData.preset.id) presetData.id = metaData.preset.id;
            if (metaData.preset.preset_name) presetData.title = metaData.preset.preset_name;
            if (metaData.preset.description) presetData.description = metaData.preset.description;
            if (metaData.preset.credit_cost !== undefined) presetData.credit_cost = metaData.preset.credit_cost;

            // Filters
            if (metaData.preset.filters) {
              presetData.filters = {
                daw: metaData.preset.filters.daw !== undefined ? metaData.preset.filters.daw : 'Any',
                gender: metaData.preset.filters.gender !== undefined ? metaData.preset.filters.gender : 'All',
                genre: metaData.preset.filters.genre !== undefined ? metaData.preset.filters.genre : 'Any',
                plugin: metaData.preset.filters.plugin !== undefined ? metaData.preset.filters.plugin : 'Any'
              };
            }

            // Store full metadata
            presetData.metadata = metaData.preset;
          }

          // Update uploader info
          if (metaData.user) {
            presetData.uploader = {
              name: metaData.user.user_name || 'Audio Creator',
              avatar: metaData.user.user_name ?
                metaData.user.user_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) :
                'AC',
              email: metaData.user.email || null
            };
          }
        }
      } catch (error) {
        // Log the error to help debug metadata issues
        console.error(`Error fetching or parsing metadata for ${folderPath}:`, error);
      }

      // Set image URLs directly without HEAD requests - UI will handle fallbacks
      // Try JPEG first as it's most common
      presetData.image = `https://${presetS3Url}/${encodedPath}image.jpeg`;

      // Set MP3 URLs directly - UI will handle fallbacks if they don't exist
      presetData.mp3s = {
        before: `https://${presetS3Url}/${encodedPath}mp3/before.mp3`,
        after: `https://${presetS3Url}/${encodedPath}mp3/after.mp3`
      };

      // Set full preset URL directly
      presetData.fullPreset = `https://${presetS3Url}/${encodedPath}full_preset.zip`;

      // Add full preset ID to metadata
      presetData.metadata = presetData.metadata || {};
      presetData.metadata.fullPresetId = `${presetData.title}_full`;

      return presetData;
    } catch (error) {
      return null;
    }
  };

  // Helper to filter presets based on current filters
  const getFilteredPresets = (presets: Preset[]) => {
    if (!presets || presets.length === 0) {
      return [];
    }

    // If no filters and no search terms, return all presets
    if (
      !stableActiveFilters.category &&
      !stableActiveFilters.daw &&
      !stableActiveFilters.gender &&
      !stableActiveFilters.genre &&
      !stableActiveFilters.plugin &&
      searchTerms.length === 0
    ) {
      return presets;
    }

    // Apply category filter first
    let results = [...presets];
    if (stableActiveFilters.category) {
      results = results.filter(preset => preset.category === stableActiveFilters.category);
    }

    // Apply other filters
    return results.filter(preset => {
      // DAW filter
      if (stableActiveFilters.daw && preset.filters.daw !== 'Any') {
        if (Array.isArray(preset.filters.daw)) {
          if (!preset.filters.daw.includes(stableActiveFilters.daw)) {
            return false;
          }
        } else if (preset.filters.daw !== stableActiveFilters.daw) {
          return false;
        }
      }

      // Gender filter
      if (stableActiveFilters.gender && preset.filters.gender !== 'All') {
        if (Array.isArray(preset.filters.gender)) {
          if (!preset.filters.gender.includes(stableActiveFilters.gender)) {
            return false;
          }
        } else if (preset.filters.gender !== stableActiveFilters.gender) {
          return false;
        }
      }

      // Genre filter
      if (stableActiveFilters.genre && preset.filters.genre !== 'Any') {
        if (Array.isArray(preset.filters.genre)) {
          if (!preset.filters.genre.includes(stableActiveFilters.genre)) {
            return false;
          }
        } else if (preset.filters.genre !== stableActiveFilters.genre) {
          return false;
        }
      }

      // Plugin filter
      if (stableActiveFilters.plugin &&
          preset.filters.plugin !== stableActiveFilters.plugin &&
          preset.filters.plugin !== 'Any') {
        return false;
      }

      // Search query
      if (searchTerms.length > 0) {
        const presetTitle = preset.title.toLowerCase();
        const titleWords = presetTitle.split(/\s+/);

        return searchTerms.every(term => {
          return titleWords.some(word => word.startsWith(term));
        });
      }

      return true;
    });
  };

  // Improve the applyFiltersAndUpdateState function
  const applyFiltersAndUpdateState = (presets: Preset[]) => {
    try {
      // Apply filters and search all at once
      const filtered = getFilteredPresets(presets);

      // Reduce flickering by using a short timeout before updating state
      // This creates a more smooth transition between states
      setTimeout(() => {
        // Use the new batch update function if available
        if (typeof updatePresetsState === 'function') {
          updatePresetsState(presets, filtered, filtered.length, false);
        } else {
          // Fallback to individual updates
          setFilteredPresets(filtered);
          setTotalPresets(filtered.length);
        }

        // Call the results update callback with filtered data
        if (onResultsUpdate) {
          onResultsUpdate(filtered, filtered.length);
        }
      }, 50); // Short enough to be imperceptible but gives browser time to batch updates

      // Don't turn off loading here - let the parent component decide
      // This prevents the UI from flickering between loading states
    } catch (error) {
      console.error("Error applying filters:", error);
      // Even on error, update the UI to avoid being stuck in loading state
      setFilteredPresets([]);
      setTotalPresets(0);
      if (onResultsUpdate) {
        onResultsUpdate([], 0);
      }
    }
  };

  // Helper to update category counts
  const updateCategoryCounts = async () => {
    try {
      const categoryCounts: Record<string, number> = {};

      for (const category of CATEGORIES) {
        const categoryPresets = presetsCache.current.get(`category_${category}`);
        if (categoryPresets) {
          categoryCounts[category] = categoryPresets.length;
        } else {
          const folders = await discoverFolders(category);
          categoryCounts[category] = folders.length;
        }
      }

      if (onCategoryCountsUpdate) {
        // Add a small delay to prevent UI flickering
        setTimeout(() => {
          onCategoryCountsUpdate(categoryCounts);
        }, 50);
      }
    } catch (error) {
      console.error("Error updating category counts:", error);
    }
  };

  // Improve the markLoadingComplete function
  const markLoadingComplete = () => {
    // Use a small delay to ensure all state updates have been processed
    // This reduces flickering by batching state updates
    setTimeout(() => {
      // Only update these once all data operations are complete
      setLoading(false);

      // Call the onInitialLoadComplete callback if provided
      if (onInitialLoadComplete) {
        onInitialLoadComplete();
      }

      initialLoadComplete.current = true;
    }, 100);
  };

  // Effect for filtering presets when search terms change
  useEffect(() => {
    if (initialLoadComplete.current) {
      applyFiltersAndUpdateState(allPresetsRef.current);
    }
  }, [searchTerms, stableActiveFilters]);

  // Trigger the sync process
  useEffect(() => {
    syncPresets();
  }, [stableActiveFilters.category, triggerRefresh, retryCount]);

  // Immediately update category counts when triggered
  useEffect(() => {
    updateCategoryCounts();
  }, [triggerRefresh]);

  return null;
};

export default PresetSync;