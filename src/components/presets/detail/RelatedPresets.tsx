'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { RelatedPresetsProps, Preset } from './types';

const RelatedPresets: React.FC<RelatedPresetsProps> = ({
  currentPreset,
  allPresets,
  onNavigate
}) => {
  // Shuffle array helper function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Filter match helper function
  const checkFilterMatch = (value1: string | string[], value2: string | string[]): boolean => {
    // Convert to arrays for consistency
    const arr1 = Array.isArray(value1) ? value1 : [value1];
    const arr2 = Array.isArray(value2) ? value2 : [value2];

    // Check for any overlap
    return arr1.some(v1 => arr2.includes(v1));
  };

  // Calculate final presets to display - ensuring exactly 4 items
  const presetsToDisplay = useMemo(() => {
    if (!currentPreset || !allPresets.length) return [];

    // Filter out the current preset from all available presets
    const otherPresets = allPresets.filter(preset => preset.id !== currentPreset.id);
    if (otherPresets.length === 0) return [];

    // Calculate score for each preset based on relatedness
    const scoredPresets = otherPresets.map(preset => {
      let score = 0;

      // Category match is most important
      if (preset.category === currentPreset.category) score += 5;

      // Add scores for each matching filter
      if (currentPreset.filters.daw && preset.filters.daw &&
          checkFilterMatch(currentPreset.filters.daw, preset.filters.daw)) {
        score += 3;
      }

      if (currentPreset.filters.genre && preset.filters.genre &&
          checkFilterMatch(currentPreset.filters.genre, preset.filters.genre)) {
        score += 3;
      }

      if (currentPreset.filters.gender && preset.filters.gender &&
          checkFilterMatch(currentPreset.filters.gender, preset.filters.gender)) {
        score += 2;
      }

      if (currentPreset.filters.plugin && preset.filters.plugin &&
          checkFilterMatch(currentPreset.filters.plugin, preset.filters.plugin)) {
        score += 2;
      }

      return { preset, score };
    }).sort((a, b) => b.score - a.score); // Sort by score descending

    // First get the top most related presets (at least some by category match)
    const relatedPresets = scoredPresets
      .filter(item => item.score >= 5) // At least category match
      .map(item => item.preset);

    // Get a separate pool of other presets for filling any gaps
    const otherRandomPresets = scoredPresets
      .filter(item => item.score < 5)
      .map(item => item.preset);

    // Shuffle both arrays for variety
    const shuffledRelated = shuffleArray(relatedPresets).slice(0, 4);
    const shuffledRandom = shuffleArray(otherRandomPresets);

    // If we have exactly 4 related, use them
    if (shuffledRelated.length === 4) {
      return shuffledRelated;
    }

    // Otherwise, fill with random presets to get exactly 4
    const result = [...shuffledRelated];

    // Fill remaining slots with random presets
    const remaining = 4 - result.length;
    if (remaining > 0 && shuffledRandom.length > 0) {
      // Only add enough to reach exactly 4 total
      result.push(...shuffledRandom.slice(0, remaining));
    }

    // If we still don't have 4, just use any available presets
    if (result.length < 4 && otherPresets.length >= 4) {
      return shuffleArray(otherPresets).slice(0, 4);
    }

    return result;
  }, [currentPreset, allPresets]);

  // Handle navigation to a related preset
  const handlePresetClick = (preset: Preset) => {
    if (!onNavigate) {
      console.error("onNavigate function is not defined");
      return;
    }

    // Format preset ID appropriately for the URL
    const presetId = preset.id.replace(/\s+/g, '_');
    const category = preset.category;

    // Use the new URL structure: presets/{category}/{presetId}
    // We'll pass 'preset-detail' as the page type to distinguish this navigation
    onNavigate('preset-detail', `${category}/${presetId}`);
  };

  // If there's no current preset or no presets to display, don't show anything
  if (!currentPreset) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {presetsToDisplay.map(preset => (
        <div
          key={preset.id}
          onClick={() => handlePresetClick(preset)}
          className="group cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="rounded-lg overflow-hidden bg-gray-100 aspect-[4/3] mb-3 transition-all group-hover:shadow-md">
            {preset.image ? (
              <div className="relative w-full h-full">
                <Image
                  src={preset.image}
                  alt={preset.title}
                  className="transition-transform group-hover:scale-105"
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  style={{objectFit: 'cover'}}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-800 to-purple-600 flex items-center justify-center">
                <span className="text-lg text-white opacity-50">{preset.category.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          <h4 className="font-medium text-gray-800 mb-1 group-hover:text-purple-700 transition-colors line-clamp-1">{preset.title}</h4>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              {preset.category.replace('_', ' ')}
            </span>
            <span className="text-purple-600 text-sm font-medium">
              {preset.credit_cost || 1} credit{(preset.credit_cost || 1) !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RelatedPresets;