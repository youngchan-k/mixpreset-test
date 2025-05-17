'use client';

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import HeroSection from '@/components/HeroSection';
import { getUserCreditBalance } from '@/lib/creditTracking';
import { useRouter } from 'next/navigation';

interface User {
  name: string;
  email: string;
  profileImage: string | null;
  credits: number;
}

const ProfileContent = () => {
  const { currentUser } = useAuth();
  const [user, setUser] = useState<User>({
    name: '',
    email: '',
    profileImage: null,
    credits: 0
  })

  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isLoadingCredits, setIsLoadingCredits] = useState<boolean>(false);
  const router = useRouter();

  // Update user data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setIsLoadingProfile(true);
      setUser(prevUser => ({
        ...prevUser,
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        profileImage: currentUser.photoURL || null
      }));
      setIsLoadingProfile(false);

      // Load credits from payment history - with loading state
      const loadCredits = async () => {
        try {
          setIsLoadingCredits(true);
          const creditData = await getUserCreditBalance(currentUser.uid);
          setUser(prevUser => ({
            ...prevUser,
            credits: creditData.available
          }));
        } catch (error) {
          console.error('[ProfileContent] Error loading user credits:', error);
        } finally {
          setIsLoadingCredits(false);
        }
      };

      loadCredits();

    }
  }, [currentUser]);

  // Memoize the hero section props for consistent rendering
  const heroSectionProps = useMemo(() => ({
    title: "Profile Overview",
    subtitle: "Manage your account, view your downloads, and credit balance",
    backgroundImage: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    badge: { text: 'CREDITS' },
    height: "small" as const,
    shape: "curved" as const,
    customGradient: "bg-gradient-to-r from-purple-800/90 to-purple-600/90"
  }), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection {...heroSectionProps}>
        {/* User info box removed from here */}
      </HeroSection>

      <div className="container mx-auto px-8 py-6 mb-16">
        <div className="max-w-5xl mx-auto">
          {/* Navigation Tabs */}
          <div className="flex mb-8 border-b border-gray-200">
            <div className="px-6 py-3 font-medium text-purple-600 border-b-2 border-purple-600">
              Profile Overview
            </div>
            <Link href="/profile/downloads" className="px-6 py-3 font-medium text-gray-500 hover:text-purple-600 transition-colors">
              My Downloads
            </Link>
            <Link href="/profile/credits" className="px-6 py-3 font-medium text-gray-500 hover:text-purple-600 transition-colors">
              Credit Management
            </Link>
            <Link href="/profile/favorites" className="px-6 py-3 font-medium text-gray-500 hover:text-purple-600 transition-colors">
              Favorite Presets
            </Link>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Profile Overview Tab */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row">
                {/* Profile Summary */}
                <div className="md:w-1/3 mb-6 md:mb-0 flex flex-col items-center justify-center">
                  <div className="flex flex-row items-center mb-6 w-full max-w-xs">
                    <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mr-4 relative">
                      {isLoadingProfile ? (
                        <div className="w-full h-full bg-purple-300 flex items-center justify-center rounded-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      ) : user.profileImage ? (
                        <Image
                          src={user.profileImage}
                          alt="Profile"
                          fill
                          sizes="96px"
                          loading="eager"
                          className="rounded-full"
                          style={{objectFit: 'cover'}}
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-600 flex items-center justify-center rounded-full">
                          <span className="text-2xl font-bold text-white">{user.name ? user.name.charAt(0) : ''}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      {isLoadingProfile ? (
                        <div className="space-y-2">
                          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl font-bold text-gray-800">{user.name || 'My Profile'}</h3>
                          <p className="text-gray-600">{user.email}</p>
                        </>
                      )}
                      <Link href="/profile/settings" className="mt-2 inline-flex items-center text-sm text-purple-600 hover:text-purple-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Account Settings
                      </Link>
                    </div>
                  </div>

                  <div className="w-full max-w-xs">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-4 text-white shadow-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-base font-semibold">Credits</h3>
                        <div className="bg-white/20 rounded-full px-2 py-0.5 text-xs backdrop-blur-sm">
                          Balance
                        </div>
                      </div>
                      {isLoadingCredits ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                          <span className="text-white/70 text-sm">Loading...</span>
                        </div>
                      ) : (
                        <>
                          <div className="text-2xl font-bold mb-1">{user.credits}</div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-purple-100">Available for use</span>
                            <button
                              onClick={() => router.push('/pricing')}
                              className="bg-white text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors text-xs font-medium shadow-sm"
                            >
                              Buy More
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="md:w-2/3 md:pl-8 flex flex-col items-center">
                  <div className="w-full max-w-2xl">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link href="/profile/downloads" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Download History</h3>
                          <p className="text-sm text-gray-600">View your downloaded presets</p>
                        </div>
                      </Link>

                      <Link href="/profile/credits" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Manage Credits</h3>
                          <p className="text-sm text-gray-600">View your credit balance and purchase history</p>
                        </div>
                      </Link>

                      <Link href="/profile/favorites" className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Favorite Presets</h3>
                          <p className="text-sm text-gray-600">Browse your collection of saved presets</p>
                        </div>
                      </Link>

                      <Link href="/profile/settings" className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Account Settings</h3>
                          <p className="text-sm text-gray-600">Manage your account & security</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProfileContent);