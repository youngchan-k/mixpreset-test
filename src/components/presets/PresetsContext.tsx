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
  // Initialize state with empty array for server-side rendering
  const [presets, setPresets] = useState<Preset[]>([]);
  const [filteredPresets, setFilteredPresets] = useState<Preset[]>([]);
  const [totalPresets, setTotalPresets] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Use a ref to track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load presets from localStorage only on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPresets = localStorage.getItem('all_presets');
        const parsedPresets = savedPresets ? JSON.parse(savedPresets) : [];
        if (Array.isArray(parsedPresets) && parsedPresets.length > 0) {
          setPresets(parsedPresets);
        }
      } catch (e) {
        // Handle storage errors silently
      }
    }
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
        // Try direct ID first
        const directPreset = sessionStorage.getItem(`preset_${actualPresetId}`);
        if (directPreset) {
          return JSON.parse(directPreset);
        }

        // Try with category prefix
        if (possibleCategory && categories.includes(possibleCategory)) {
          const categoryPrefixedId = `${possibleCategory}_${actualPresetId}`;
          const categoryPreset = sessionStorage.getItem(`preset_${categoryPrefixedId}`);
          if (categoryPreset) {
            return JSON.parse(categoryPreset);
          }
        }
      } catch (e) {
        // Handle storage errors silently
      }
    }

    // Then check in memory
    const preset = presets.find(p => p.id === actualPresetId);
    if (preset) {
      return preset;
    }

    // If not found in memory, try with category prefix
    if (possibleCategory && categories.includes(possibleCategory)) {
      return presets.find(p => p.id === actualPresetId && p.category === possibleCategory) || null;
    }

    return null;
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