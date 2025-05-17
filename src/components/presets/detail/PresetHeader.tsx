'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addToFavorites, removeFromFavorites, isPresetFavorited, syncFavoritesToLocalStorage } from '@/lib/favoritesTracking';
import { PresetHeaderProps } from './types';

const PresetHeader: React.FC<PresetHeaderProps> = ({
  preset,
  isFavorite,
  setIsFavorite,
  onAuthRequired
}) => {
  const { currentUser } = useAuth();

  // Determine credits display
  const credits = preset.credit_cost || 1;

  // Check if the preset is in favorites when it loads
  useEffect(() => {
    if (preset?.id && typeof window !== 'undefined') {
      // Only check favorites if user is authenticated
      if (currentUser?.uid) {
        // First check in localStorage for immediate UI response
        const savedFavorites = localStorage.getItem('user_favorites');
        if (savedFavorites) {
          try {
            const favoritesObj = JSON.parse(savedFavorites);
            // Use setTimeout to batch UI updates
            setTimeout(() => {
              setIsFavorite(!!favoritesObj[preset.id]);
            }, 0);
          } catch (error) {
            console.error('[FavoritesError] Invalid local storage data:', error);
          }
        }

        // Then verify with DynamoDB (this may update the state if different)
        isPresetFavorited(currentUser.uid, preset.id)
          .then(isFav => {
            // Use requestAnimationFrame to smooth out UI updates
            requestAnimationFrame(() => {
              setIsFavorite(isFav);
            });

            // Sync from DynamoDB to localStorage to ensure consistency
            syncFavoritesToLocalStorage(currentUser.uid);
          })
          .catch(error => {
            console.error('[FavoritesError]', error);
          });
      } else {
        // Not authenticated, should not show favorites
        setIsFavorite(false);
      }
    }
  }, [preset, currentUser, setIsFavorite]);

  // Update DynamoDB and localStorage when favorite status changes
  const handleToggleFavorite = () => {
    onAuthRequired(() => {
      if (preset?.id && currentUser?.uid) {
        const newFavoriteState = !isFavorite;

        // Store currentUser data to avoid closure issues
        const uid = currentUser.uid;
        const email = currentUser.email || 'anonymous@user.com';

        // Use requestAnimationFrame for smoother UI updates
        requestAnimationFrame(() => {
          setIsFavorite(newFavoriteState);
        });

        // Update localStorage immediately for UI responsiveness
        const savedFavorites = localStorage.getItem('user_favorites');
        const favoritesObj = savedFavorites ? JSON.parse(savedFavorites) : {};

        if (newFavoriteState) {
          favoritesObj[preset.id] = true;

          // Add to DynamoDB
          addToFavorites(
            uid,
            preset.id,
            preset.title,
            preset.category,
            email
          ).catch(error => {
            console.error('[FavoritesError] Failed to add to DynamoDB:', error);
            // Revert UI state on error
            setIsFavorite(false);
          });
        } else {
          delete favoritesObj[preset.id];

          // Remove from DynamoDB
          removeFromFavorites(
            uid,
            preset.id
          ).catch(error => {
            console.error('[FavoritesError] Failed to remove from DynamoDB:', error);
            // Revert UI state on error
            setIsFavorite(true);
          });
        }

        localStorage.setItem('user_favorites', JSON.stringify(favoritesObj));
      }
    });
  };

  // Get color scheme based on category
  const getCategoryColorScheme = () => {
    const colorSchemes = {
      premium: {
        background: 'from-amber-700 to-amber-600',
        button: 'bg-amber-600 hover:bg-amber-700',
        tag: 'bg-amber-600/50'
      },
      vocal_chain: {
        background: 'from-purple-700 to-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700',
        tag: 'bg-purple-600/50'
      },
      instrument: {
        background: 'from-green-700 to-green-600',
        button: 'bg-green-600 hover:bg-green-700',
        tag: 'bg-green-600/50'
      }
    };

    return colorSchemes[preset.category as keyof typeof colorSchemes] || colorSchemes.premium;
  };

  const colorScheme = getCategoryColorScheme();

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${colorScheme.background} pt-20 pb-16 mt-6`}>
      {/* Add subtle pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      {/* Add subtle radial gradient for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/30 mix-blend-overlay"></div>

      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Title with modern typographic hierarchy */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight max-w-4xl mb-4">
              {preset.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-6 mb-2">
              {/* Credit indicator positioned on the left */}
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                <div className="flex">
                  {Array.from({ length: credits }).map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center -ml-1 first:ml-0 border border-purple-200">
                      <span className="text-purple-700 text-xs font-bold">C</span>
                    </div>
                  ))}
                </div>
                <span className="text-white/90 text-sm ml-2">{credits} credit{credits !== 1 ? 's' : ''}</span>
              </div>

              {/* Uploader Info on the right - no avatar, with email */}
              {preset.uploader && (
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                  <div className="flex items-center">
                    <span className="text-white/90 text-sm">By <span className="font-medium">{preset.uploader.name}</span></span>
                    {preset.uploader.email && (
                      <span className="text-white/80 text-sm ml-2">({preset.uploader.email})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons with reduced top margin */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {/* Download Button */}
            <button
              onClick={() => onAuthRequired(() => {
                if (!currentUser) return false;
                if (preset) {
                  // Trigger the download functionality by showing the download section
                  const downloadSection = document.querySelector('[data-download-section]');
                  if (downloadSection) {
                    downloadSection.scrollIntoView({ behavior: 'smooth' });

                    // Find and click the download button
                    const downloadButton = downloadSection.querySelector('button');
                    if (downloadButton) {
                      downloadButton.click();
                    }
                  }
                }
                return true;
              })}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-lg transition-all shadow-xl hover:shadow-2xl transform hover:translate-y-[-1px] border border-gray-100 hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-sm font-medium">Download Now</span>
            </button>

            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-transform transition-colors duration-300 shadow-xl hover:shadow-2xl transform-gpu will-change-transform hover:translate-y-[-1px] ${
                isFavorite
                  ? 'bg-white text-pink-600 border border-pink-100 hover:bg-pink-50'
                  : 'bg-white text-gray-800 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {isFavorite ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-600 transform-gpu" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Favorited</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform-gpu" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm font-medium">Add to Favorites</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Minimal wave shape divider */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
        <div className="relative h-8">
          <svg className="absolute bottom-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 160">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L60,106.7C120,117,240,139,360,128C480,117,600,75,720,64C840,53,960,75,1080,85.3C1200,96,1320,96,1380,96L1440,96L1440,160L1380,160C1320,160,1200,160,1080,160C960,160,840,160,720,160C600,160,480,160,360,160C240,160,120,160,60,160L0,160Z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PresetHeader;