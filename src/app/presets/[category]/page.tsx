'use client';

import { useParams, useRouter } from 'next/navigation';
import { Suspense, lazy, useState } from 'react';
import { PresetsProvider } from '@/components/presets/PresetsContext';
import { useAuth } from '@/contexts/AuthContext';
import LoginPromptModal from '@/components/modals/LoginPromptModal';

// Lazy load the PresetsContent component
const PresetsContent = lazy(() => import('@/components/presets/PresetsContent'));

// Loading component
const PresetsLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading presets...</p>
    </div>
  </div>
);

export default function CategoryPage() {
  const params = useParams();
  const category = params?.category as string;
  const router = useRouter();
  const { currentUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // Map URL category parameter to tab value
  const getTabFromCategory = (category: string) => {
    // Handle category mapping (URL format to internal format)
    const categoryMap: Record<string, 'premium' | 'vocal-chain' | 'instrument'> = {
      'premium': 'premium',
      'vocal_chain': 'vocal-chain',
      'vocal-chain': 'vocal-chain',
      'instrument': 'instrument'
    };

    return categoryMap[category] || 'premium';
  };

  const handleNavigate = (page: string, param?: string | null) => {
    let targetPath = '';

    if (page === 'preset-detail' && param) {
      // Handle the new URL structure with forward slash separating category and preset ID
      // Format is expected to be "category/presetId"
      targetPath = `/presets/${param}`;
    } else if (page === 'preset' && param) {
      // Extract category from the param if it contains category_presetName format
      const parts = param.split('_');
      const categories = ['premium', 'vocal_chain', 'instrument'];
      const possibleCategory = parts[0];

      if (categories.includes(possibleCategory) && parts.length > 1) {
        const presetId = parts.slice(1).join('_');
        targetPath = `/presets/${possibleCategory}/${encodeURIComponent(presetId)}`;
      } else {
        // Fallback if we can't determine category
        targetPath = `/presets/${encodeURIComponent(param)}`;
      }
    } else if (param) {
      targetPath = `/${page}/${encodeURIComponent(param)}`;
    } else {
      targetPath = `/${page}`;
    }

    console.log(`Navigating to: ${targetPath}`);
    router.push(targetPath);
  };

  const handleAuthRequired = (callback: () => void) => {
    if (currentUser) {
      // User is already logged in, proceed with action
      callback();
      return true;
    } else {
      // Store the callback for later use if needed
      setPendingCallback(() => callback);

      // Show login modal
      setShowLoginModal(true);

      return false;
    }
  };

  const handleLoginClick = () => {
    setShowLoginModal(false);
    router.push('/login');

    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
    setPendingCallback(null);
  };

  return (
    <PresetsProvider>
      <Suspense fallback={<PresetsLoading />}>
        <PresetsContent
          initialTab={getTabFromCategory(category)}
          onNavigate={handleNavigate}
          onAuthRequired={handleAuthRequired}
        />
      </Suspense>
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={handleCloseModal}
        onLogin={handleLoginClick}
        message="You need to be logged in to use this feature. Would you like to login now?"
      />
    </PresetsProvider>
  );
}