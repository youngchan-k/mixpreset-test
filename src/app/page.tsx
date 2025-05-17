'use client';

import { useRouter } from 'next/navigation';
import { Suspense, lazy } from 'react';

// Dynamically import HomeContent to improve initial load time
const HomeContent = lazy(() => import('@/components/HomeContent'));

// Simple loading component
const HomeLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
      <p className="mt-4 text-white text-lg">Loading...</p>
    </div>
  </div>
);

export default function Home() {
  const router = useRouter();

  const handleNavigate = (page: string) => {
    router.push(`/${page}`);
  };

  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent onNavigate={handleNavigate} />
    </Suspense>
  );
}
