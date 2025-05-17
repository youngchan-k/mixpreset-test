'use client';

import { useParams, useRouter } from 'next/navigation';
import { Suspense, lazy, useState, useEffect } from 'react';
import { PresetsProvider } from '@/components/presets/PresetsContext';
import { useAuth } from '@/contexts/AuthContext';
import LoginPromptModal from '@/components/modals/LoginPromptModal';

// Lazy load the PresetDetail component (refactored version)
const PresetDetail = lazy(() => import('@/components/presets/detail/PresetDetail'));

// Loading component
const PresetDetailLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading preset details...</p>
    </div>
  </div>
);

export default function NestedPresetDetailPage() {
  const params = useParams();
  const category = params?.category as string;
  const preset = params?.preset as string;
  const router = useRouter();
  const { currentUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // Construct the complete preset ID with category for the component
  const fullPresetId = category && preset ? `${category}_${preset}` : preset || '';

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
      <Suspense fallback={<PresetDetailLoading />}>
        <PresetDetail
          presetId={fullPresetId}
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