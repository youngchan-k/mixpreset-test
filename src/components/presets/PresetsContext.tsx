'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';

export interface Preset {
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
    email?: string | null;
  };
  metadata?: {
    preset_name?: string;
    description?: string;
    filters?: {
      daw?: string | string[];
      gender?: string | string[];
      genre?: string | string[];
      plugin?: string | string[];
      [key: string]: string | string[] | undefined;
    };
    [key: string]: any;
  };
  credit_cost: number;
}

export interface Filters {
  daw: string | null;
  gender: string | null;
  genre: string | null;
  plugin: string | null;
  category: string | null;
}

interface PresetsContextType {
  presets: Preset[];
  setPresets: React.Dispatch<React.SetStateAction<Preset[]>>;
  filteredPresets: Preset[];
  setFilteredPresets: React.Dispatch<React.SetStateAction<Preset[]>>;
  totalPresets: number;
  setTotalPresets: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  getPresetById: (id: string) => Preset | null;
  updatePresetsState: (newPresets: Preset[], newFilteredPresets: Preset[], count: number, isLoading: boolean) => void;
}

const PresetsContext = createContext<PresetsContextType | undefined>(undefined);

export const usePresets = () => {
  const context = useContext(PresetsContext);
  if (!context) {
    throw new Error('usePresets must be used within a PresetsProvider');
  }
  return context;
};

export const PresetsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state with data from localStorage if available
  const [presets, setPresets] = useState<Preset[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPresets = localStorage.getItem('all_presets');
        const parsedPresets = savedPresets ? JSON.parse(savedPresets) : [];
        return Array.isArray(parsedPresets) ? parsedPresets : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [filteredPresets, setFilteredPresets] = useState<Preset[]>([]);
  const [totalPresets, setTotalPresets] = useState<number>(0);
  // Always start with loading true to prevent premature "No presets" message
  const [loading, setLoading] = useState<boolean>(true);

  // Use a ref to track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Save presets to localStorage whenever they change - debounced
  useEffect(() => {
    if (typeof window !== 'undefined' && presets.length > 0) {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem('all_presets', JSON.stringify(presets));
          // Also update sessionStorage for faster access when navigating between pages
          sessionStorage.setItem('all_presets', JSON.stringify(presets));
        } catch (e) {
          // Handle storage errors silently
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [presets]);

  // More reliable batch update function to prevent flickering
  const updatePresetsState = useCallback((newPresets: Preset[], newFilteredPresets: Preset[], count: number, isLoading: boolean) => {
    // Only update if still mounted
    if (isMounted.current) {
      // Try to batch updates when possible
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(() => {
          setPresets(newPresets);
          setFilteredPresets(newFilteredPresets);
          setTotalPresets(count);
          setLoading(isLoading);
        });
      } else {
        // Fallback for environments without requestAnimationFrame
        setPresets(newPresets);
        setFilteredPresets(newFilteredPresets);
        setTotalPresets(count);
        setLoading(isLoading);
      }
    }
  }, []);

  // Update sessionStorage with individual presets for faster access
  useEffect(() => {
    if (typeof window !== 'undefined' && presets.length > 0) {
      // Store each preset individually in sessionStorage for fast access
      presets.forEach(preset => {
        try {
          // Use the ID directly as the key
          sessionStorage.setItem(`preset_${preset.id}`, JSON.stringify(preset));

          // Also store with category prefix for consistent access
          if (preset.category) {
            const categoryPrefixedId = `${preset.category}_${preset.id.replace(/\s+/g, '_')}`;
            sessionStorage.setItem(`preset_${categoryPrefixedId}`, JSON.stringify(preset));
          }
        } catch (e) {
          // Handle storage errors silently
        }
      });
    }
  }, [presets]);

  // Function to get a preset by ID with improved caching and lookup
  const getPresetById = useCallback((id: string): Preset | null => {
    // Decode the ID if it's URL-encoded
    const decodedId = decodeURIComponent(id);

    // Split to check if this is a category_presetId format
    const splitId = decodedId.split('_');
    const categories = ['premium', 'vocal_chain', 'instrument'];
    const possibleCategory = splitId[0];

    // Extract the actual preset ID without category prefix
    let actualPresetId = decodedId;

    // If ID starts with a valid category, extract the base preset ID
    if (categories.includes(possibleCategory) && splitId.length > 1) {
      // The actual preset ID is everything after the category
      actualPresetId = splitId.slice(1).join('_');
    }

    // First check sessionStorage if in browser context
    if (typeof window !== 'undefined') {
      try {
        // Check if we have this preset directly cached by full ID
        const sessionPreset = sessionStorage.getItem(`preset_${decodedId}`);
        if (sessionPreset) {
          return JSON.parse(sessionPreset);
        }

        // Try with the actual preset ID
        const actualSessionPreset = sessionStorage.getItem(`preset_${actualPresetId}`);
        if (actualSessionPreset) {
          return JSON.parse(actualSessionPreset);
        }

        // Try with spaces instead of underscores
        const actualPresetIdWithSpaces = actualPresetId.replace(/_+/g, ' ');
        const spacedSessionPreset = sessionStorage.getItem(`preset_${actualPresetIdWithSpaces}`);
        if (spacedSessionPreset) {
          return JSON.parse(spacedSessionPreset);
        }

        // Get all presets and find by ID logic
        const allStoredPresets = sessionStorage.getItem('all_presets');
        if (allStoredPresets) {
          const storedPresets = JSON.parse(allStoredPresets) as Preset[];

          // Look for a preset with exactly this ID
          let foundPreset = storedPresets.find(p => p.id === actualPresetId);

          // If not found by direct ID, also try with spaces instead of underscores
          if (!foundPreset) {
            foundPreset = storedPresets.find(p => p.id === actualPresetIdWithSpaces);
          }

          // If not found by direct ID, try to see if any preset with matching category has this ID
          if (!foundPreset && categories.includes(possibleCategory)) {
            foundPreset = storedPresets.find(p =>
              p.category === possibleCategory &&
              (p.id === actualPresetId || p.id === actualPresetIdWithSpaces)
            );
          }

          if (foundPreset) {
            // Cache this result for future lookups
            try {
              sessionStorage.setItem(`preset_${decodedId}`, JSON.stringify(foundPreset));
            } catch (e) {
              // Handle storage errors silently
            }
            return foundPreset;
          }
        }
      } catch (err) {
        // Fall back to checking the local state
      }
    }

    // If not found in sessionStorage, check the local state
    // Direct match with the preset ID (without category)
    let foundPreset = presets.find(p => p.id === actualPresetId);

    // If not found, try with spaces instead of underscores
    if (!foundPreset) {
      const actualPresetIdWithSpaces = actualPresetId.replace(/_+/g, ' ');
      foundPreset = presets.find(p => p.id === actualPresetIdWithSpaces);
    }

    // If not found and we have a category, try to match by category + id
    if (!foundPreset && categories.includes(possibleCategory)) {
      foundPreset = presets.find(p =>
        p.category === possibleCategory &&
        (p.id === actualPresetId || p.id === actualPresetId.replace(/_+/g, ' '))
      );
    }

    // Cache the result if found
    if (foundPreset && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`preset_${decodedId}`, JSON.stringify(foundPreset));
      } catch (e) {
        // Handle storage errors silently
      }
    }

    return foundPreset || null;
  }, [presets]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    presets,
    setPresets,
    filteredPresets,
    setFilteredPresets,
    totalPresets,
    setTotalPresets,
    loading,
    setLoading,
    getPresetById,
    updatePresetsState,
  }), [
    presets,
    setPresets,
    filteredPresets,
    setFilteredPresets,
    totalPresets,
    setTotalPresets,
    loading,
    setLoading,
    getPresetById,
    updatePresetsState,
  ]);

  return (
    <PresetsContext.Provider value={contextValue}>
      {children}
    </PresetsContext.Provider>
  );
};