'use client';

import { useState, useEffect, useRef } from 'react';
import { PresetAudioProps, AudioPlaying } from './types';

// Set the S3 custom URL with proper server-side rendering support
const PRESET_S3_URL = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_PRESET_S3_URL || "preset.mixpreset.com"
  : "preset.mixpreset.com";

// Helper function to get preset file URL
const getPresetFileUrl = async (objectKey: string, allPresets: any[]): Promise<string> => {
  try {
    // Validate the objectKey
    if (!objectKey || typeof objectKey !== 'string' || objectKey.trim() === '') {
      console.error("[getPresetFileUrl] Invalid objectKey:", objectKey);
      throw new Error("Invalid object key");
    }

    // If the objectKey is already a complete URL, return it directly
    if (objectKey.startsWith('http://') || objectKey.startsWith('https://')) {
      return objectKey;
    }

    // Extract category and preset ID from path
    const pathParts = objectKey.split('/');
    if (pathParts.length >= 2) {
      const category = pathParts[0];
      const presetFolderId = pathParts[1];

      // Find matching preset in our data
      const matchingPreset = allPresets.find(p =>
        p.category === category &&
        (p.id.replace(/\s+/g, '_') === presetFolderId || p.id === presetFolderId)
      );

      if (matchingPreset) {
        // Check which type of file is being requested
        if (objectKey.endsWith('full_preset.zip') && matchingPreset.fullPreset) {
          return matchingPreset.fullPreset;
        }

        if (objectKey.includes('mp3/before.mp3') && matchingPreset.mp3s.before) {
          return matchingPreset.mp3s.before;
        }

        if (objectKey.includes('mp3/after.mp3') && matchingPreset.mp3s.after) {
          return matchingPreset.mp3s.after;
        }
      }
    }

    // Fallback to direct S3 URL construction
    return `https://${PRESET_S3_URL}/${objectKey}`;
  } catch (error) {
    console.error("[getPresetFileUrl] Error getting file URL:", error);
    // Fallback to traditional S3 URL
    return `https://${PRESET_S3_URL}/${objectKey}`;
  }
};

const PresetAudio: React.FC<PresetAudioProps> = ({ preset, presets }) => {
  const [playingAudio, setPlayingAudio] = useState<AudioPlaying | null>(null);
  const [audioProgress, setAudioProgress] = useState<{[key: string]: number}>({});
  const [audioDuration, setAudioDuration] = useState<{[key: string]: number}>({});
  const [audioCurrentTime, setAudioCurrentTime] = useState<{[key: string]: number}>({});
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({});
  const [isDragging, setIsDragging] = useState<{[key: string]: boolean}>({});
  const [audioLoadingState, setAudioLoadingState] = useState<{[key: string]: boolean}>({
    before: true,
    after: true
  });

  // Animation frame reference for smooth progress updates
  const animationFrameRef = useRef<number | null>(null);
  const mouseMoveHandlerRef = useRef<{[key: string]: ((e: MouseEvent) => void) | null}>({});
  const mouseUpHandlerRef = useRef<{[key: string]: (() => void) | null}>({});

  // Set up smooth progress bar animation
  useEffect(() => {
    // Function to update progress bar animation
    const updateProgressBar = () => {
      if (playingAudio && !isDragging[playingAudio.type]) {
        const { audio, type } = playingAudio;
        const progress = (audio.currentTime / (audioDuration[type] || 1)) * 100;

        // Update the UI state with the current audio position
        setAudioProgress(prev => ({
          ...prev,
          [type]: progress
        }));

        setAudioCurrentTime(prev => ({
          ...prev,
          [type]: audio.currentTime
        }));
      }

      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(updateProgressBar);
    };

    // Start the animation if we have playing audio
    if (playingAudio) {
      // Cancel any existing animation frame before starting a new one
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Start the animation loop
      animationFrameRef.current = requestAnimationFrame(updateProgressBar);
    }

    // Clean up animation frame on unmount or when playingAudio changes
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playingAudio, isDragging, audioDuration]);

  // Load audio files when the component mounts
  useEffect(() => {
    const loadAudio = async (url: string | null, type: string, retryCount = 0) => {
      if (!url) {
        setAudioLoadingState(prev => ({
          ...prev,
          [type]: false
        }));
        return;
      }

      try {
        // Mark as loading
        setAudioLoadingState(prev => ({
          ...prev,
          [type]: true
        }));

        // Create a new audio element
        const audio = new Audio();

        // Set up audio event handlers
        audio.addEventListener('loadedmetadata', () => {
          setAudioDuration(prev => ({
            ...prev,
            [type]: audio.duration
          }));
          setAudioLoadingState(prev => ({
            ...prev,
            [type]: false
          }));
        });

        audio.addEventListener('ended', () => {
          // Reset playing state when audio finishes
          setPlayingAudio(prev => prev?.type === type ? null : prev);
        });

        audio.addEventListener('error', async (e) => {
          // Try alternative approach if the first method fails
          if (retryCount === 0) {
            // First try with the preset folder path construction
            const category = preset.category;
            const presetId = preset.id.replace(/\s+/g, '_');
            const fallbackUrl = `https://${PRESET_S3_URL}/${category}/${presetId}/mp3/${type}.mp3`;

            // Try again with constructed URL
            loadAudio(fallbackUrl, type, 1);
          }
          else if (retryCount === 1) {
            // Second try with direct S3 URL if we have a complete URL
            if (url.includes('://')) {
              const pathOnly = url.split('://')[1].split('/').slice(1).join('/');
              const fallbackUrl = `https://${PRESET_S3_URL}/${pathOnly}`;
              loadAudio(fallbackUrl, type, 2);
            } else {
              // If we don't have a URL with protocol, just retry once more with the same URL
              loadAudio(url, type, 2);
            }
          }
          else {
            // Give up after multiple retries
            setAudioLoadingState(prev => ({
              ...prev,
              [type]: false
            }));
          }
        });

        // Store the audio element
        setAudioElements(prev => ({
          ...prev,
          [type]: audio
        }));

        // First try to directly resolve the URL if it's a relative path
        let resolvedUrl = url;
        if (!url.startsWith('http')) {
          resolvedUrl = `https://${PRESET_S3_URL}/${url}`;
        }

        // Set the source and load the audio
        audio.src = resolvedUrl;
        audio.load();
      } catch (error) {
        if (retryCount < 2) {
          // Try with a more reliable path construction
          const category = preset.category;
          const presetId = preset.id.replace(/\s+/g, '_');
          const fallbackUrl = `https://${PRESET_S3_URL}/${category}/${presetId}/mp3/${type}.mp3`;

          setTimeout(() => {
            loadAudio(fallbackUrl, type, retryCount + 1);
          }, 500);
        } else {
          setAudioLoadingState(prev => ({
            ...prev,
            [type]: false
          }));
        }
      }
    };

    // Load both before and after audio samples
    if (preset.mp3s.before) {
      loadAudio(preset.mp3s.before, 'before');
    } else {
      // Try with the standard expected path even if not provided
      const category = preset.category;
      const presetId = preset.id.replace(/\s+/g, '_');
      const fallbackUrl = `https://${PRESET_S3_URL}/${category}/${presetId}/mp3/before.mp3`;
      loadAudio(fallbackUrl, 'before');
    }

    if (preset.mp3s.after) {
      loadAudio(preset.mp3s.after, 'after');
    } else {
      // Try with the standard expected path even if not provided
      const category = preset.category;
      const presetId = preset.id.replace(/\s+/g, '_');
      const fallbackUrl = `https://${PRESET_S3_URL}/${category}/${presetId}/mp3/after.mp3`;
      loadAudio(fallbackUrl, 'after');
    }

    // Clean up function to stop and remove all audio elements when component unmounts
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Clean up all mouse event handlers
      Object.keys(mouseMoveHandlerRef.current).forEach(key => {
        if (mouseMoveHandlerRef.current[key]) {
          document.removeEventListener('mousemove', mouseMoveHandlerRef.current[key]!);
        }
      });

      Object.keys(mouseUpHandlerRef.current).forEach(key => {
        if (mouseUpHandlerRef.current[key]) {
          document.removeEventListener('mouseup', mouseUpHandlerRef.current[key]!);
        }
      });

      // Stop all audio and remove elements
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, [preset.mp3s.before, preset.mp3s.after, presets]);

  // Function to handle audio playback
  const handlePlayAudio = (audioUrl: string | null, type: string) => {
    if (!audioUrl || !audioElements[type]) {
      return;
    }

    const audio = audioElements[type];

    // Check if the clicked audio is already playing
    if (playingAudio && playingAudio.audio === audio) {
      // If it's the same audio, toggle play/pause
      if (audio.paused) {
        // Resume playback
        audio.play().catch(err => console.error('Error playing audio:', err));
      } else {
        // Pause playback
        audio.pause();
        setPlayingAudio(null);
      }
    } else {
      // If a different audio is playing, pause it first
      if (playingAudio) {
        playingAudio.audio.pause();
      }

      // Start playing the new audio
      audio.play().catch(err => console.error('Error playing audio:', err));
      setPlayingAudio({ audio, type });
    }
  };

  // Handle progress bar click/drag
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>, type: string) => {
    if (!audioElements[type]) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = offsetX / width;
    const audio = audioElements[type];

    // Calculate the new time based on the percentage
    const newTime = percentage * (audioDuration[type] || 0);

    // Set the new time
    audio.currentTime = newTime;

    // Update the progress immediately for visual feedback
    setAudioProgress(prev => ({
      ...prev,
      [type]: percentage * 100
    }));

    setAudioCurrentTime(prev => ({
      ...prev,
      [type]: newTime
    }));
  };

  // Setup for drag functionality
  const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>, type: string) => {
    if (!audioElements[type]) return;

    e.preventDefault();

    // Set dragging state
    setIsDragging(prev => ({
      ...prev,
      [type]: true
    }));

    const progressBar = e.currentTarget;
    const audio = audioElements[type];

    // Create the handler to update time during dragging
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDragging[type]) {
        const rect = progressBar.getBoundingClientRect();
        const offsetX = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
        const percentage = offsetX / rect.width;

        // Update progress bar visually during drag
        setAudioProgress(prev => ({
          ...prev,
          [type]: percentage * 100
        }));

        // Calculate the new time but don't set it on the audio yet
        const newTime = percentage * (audioDuration[type] || 0);
        setAudioCurrentTime(prev => ({
          ...prev,
          [type]: newTime
        }));
      }
    };

    // Create handler to finish dragging
    const handleMouseUp = () => {
      if (isDragging[type]) {
        // Set dragging state to false
        setIsDragging(prev => ({
          ...prev,
          [type]: false
        }));

        // Get the current progress value
        const progress = audioProgress[type] || 0;

        // Calculate and set the final audio time
        const newTime = (progress / 100) * (audioDuration[type] || 0);
        audio.currentTime = newTime;

        // Remove event listeners
        document.removeEventListener('mousemove', mouseMoveHandlerRef.current[type]!);
        document.removeEventListener('mouseup', mouseUpHandlerRef.current[type]!);

        // Clear references
        mouseMoveHandlerRef.current[type] = null;
        mouseUpHandlerRef.current[type] = null;
      }
    };

    // Save handlers to refs for cleanup
    mouseMoveHandlerRef.current[type] = handleMouseMove;
    mouseUpHandlerRef.current[type] = handleMouseUp;

    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Add a function to reset audio to the beginning
  const handleResetAudio = (type: string) => {
    if (!audioElements[type]) return;

    const audio = audioElements[type];
    audio.currentTime = 0;

    // Update UI
    setAudioProgress(prev => ({
      ...prev,
      [type]: 0
    }));

    setAudioCurrentTime(prev => ({
      ...prev,
      [type]: 0
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Before Sample */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <div className="flex items-center mb-3">
          <h4 className="font-medium text-gray-700 flex-1 text-sm">Before Processing</h4>
          {audioLoadingState.before ? (
            <div className="animate-pulse flex items-center space-x-2">
              <div className="h-2 w-14 bg-gray-300 rounded"></div>
              <span className="text-gray-400 text-xs">Loading...</span>
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              {formatTime(audioCurrentTime.before || 0)} / {formatTime(audioDuration.before || 0)}
            </div>
          )}
        </div>

        {/* Audio Player Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handlePlayAudio(preset.mp3s.before, 'before')}
            disabled={audioLoadingState.before || !preset.mp3s.before}
            className={`h-8 w-8 rounded-full flex items-center justify-center
              ${!audioLoadingState.before && preset.mp3s.before ?
                'bg-purple-600 text-white hover:bg-purple-700' :
                'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {!preset.mp3s.before ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : playingAudio && playingAudio.type === 'before' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={() => handleResetAudio('before')}
            disabled={audioLoadingState.before || !preset.mp3s.before}
            className={`h-8 w-8 rounded-full flex items-center justify-center mr-1
              ${!audioLoadingState.before && preset.mp3s.before ?
                'bg-gray-200 text-gray-600 hover:bg-gray-300' :
                'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <div
            className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden"
          >
            <div
              className="bg-purple-600 h-full transition-all"
              style={{ width: `${audioProgress.before || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* After Sample */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <div className="flex items-center mb-3">
          <h4 className="font-medium text-gray-700 flex-1 text-sm">After Processing</h4>
          {audioLoadingState.after ? (
            <div className="animate-pulse flex items-center space-x-2">
              <div className="h-2 w-14 bg-gray-300 rounded"></div>
              <span className="text-gray-400 text-xs">Loading...</span>
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              {formatTime(audioCurrentTime.after || 0)} / {formatTime(audioDuration.after || 0)}
            </div>
          )}
        </div>

        {/* Audio Player Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handlePlayAudio(preset.mp3s.after, 'after')}
            disabled={audioLoadingState.after || !preset.mp3s.after}
            className={`h-8 w-8 rounded-full flex items-center justify-center
              ${!audioLoadingState.after && preset.mp3s.after ?
                'bg-green-600 text-white hover:bg-green-700' :
                'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {!preset.mp3s.after ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : playingAudio && playingAudio.type === 'after' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={() => handleResetAudio('after')}
            disabled={audioLoadingState.after || !preset.mp3s.after}
            className={`h-8 w-8 rounded-full flex items-center justify-center mr-1
              ${!audioLoadingState.after && preset.mp3s.after ?
                'bg-gray-200 text-gray-600 hover:bg-gray-300' :
                'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <div
            className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden"
          >
            <div
              className="bg-green-600 h-full transition-all"
              style={{ width: `${audioProgress.after || 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresetAudio;