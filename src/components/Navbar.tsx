'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasAdminAccess } from '@/lib/permissions';
import React from 'react';

// Helper function to extract username from email
const getUsernameFromEmail = (email: string | null | undefined): string => {
  return email ? email.split('@')[0] : 'User';
};

// Helper function to get user initials
const getUserInitials = (displayName: string | null | undefined, email: string | null | undefined): string => {
  if (displayName && displayName.trim() !== '') {
    const nameParts = displayName.trim().split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return displayName[0].toUpperCase();
  } else if (email) {
    const username = getUsernameFromEmail(email);
    return username[0].toUpperCase();
  }
  return 'U';
};

// Custom hook for detecting scroll
function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState(0);

  // Function to update scroll position - handle all browser compatibility issues
  const updatePosition = useCallback(() => {
    const position = window.pageYOffset ||
                     window.scrollY ||
                     document.documentElement.scrollTop ||
                     document.body.scrollTop ||
                     0;

    setScrollPosition(position);
    console.log('Scroll position updated:', position);
  }, []);

  useEffect(() => {
    console.log('Setting up useScrollPosition hook');

    // Update position immediately
    updatePosition();

    // Add scroll event to multiple elements to ensure it works
    window.addEventListener('scroll', updatePosition, { passive: true });
    document.addEventListener('scroll', updatePosition, { passive: true });
    console.log('Added scroll event listeners');

    // Add resize event
    window.addEventListener('resize', updatePosition, { passive: true });

    // Manual polling as a backup
    const intervalId = setInterval(() => {
      const currentPosition = window.pageYOffset ||
                             window.scrollY ||
                             document.documentElement.scrollTop ||
                             document.body.scrollTop ||
                             0;

      if (Math.abs(currentPosition - scrollPosition) > 5) { // Only update if significant change
        console.log('Interval update - position changed from', scrollPosition, 'to', currentPosition);
        setScrollPosition(currentPosition);
      }
    }, 250); // Check more frequently

    return () => {
      window.removeEventListener('scroll', updatePosition);
      document.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      clearInterval(intervalId);
    };
  }, [updatePosition, scrollPosition]);

  return scrollPosition;
}

interface NavbarProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export default function Navbar({ isAuthenticated: propIsAuthenticated, onLogout: propOnLogout }: NavbarProps) {
  const scrollPosition = useScrollPosition();
  const [isOpen, setIsOpen] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, googleSignIn } = useAuth();

  // Add navbar ref for direct manipulation if needed
  const navbarRef = useRef<HTMLDivElement>(null);

  // Check if current page is an auth page (login, signup, forgot-password)
  const isAuthPage = pathname?.includes('/login') ||
                    pathname?.includes('/signup') ||
                    pathname?.includes('/forgot-password');

  // Determine if navbar should be scrolled based on position
  const isScrolled = scrollPosition > 10;

  // Use context values if available, otherwise use props
  const isAuthenticated = currentUser !== null || propIsAuthenticated;
  const onLogout = async () => {
    if (currentUser) {
      await logout();
      router.push('/');
    } else if (propOnLogout) {
      propOnLogout();
      router.push('/');
    }
  };

  // Function to force update navbar style
  const forceUpdateNavStyle = useCallback(() => {
    if (!navbarRef.current) return;

    const scrollPos = window.pageYOffset ||
                     window.scrollY ||
                     document.documentElement.scrollTop ||
                     document.body.scrollTop ||
                     0;

    const shouldBeScrolled = scrollPos > 10 || isAuthPage;

    if (shouldBeScrolled) {
      navbarRef.current.style.backgroundColor = 'white';
      navbarRef.current.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    } else {
      navbarRef.current.style.backgroundColor = 'transparent';
      navbarRef.current.style.boxShadow = 'none';
    }
  }, [isAuthPage]);

  // Force update style on mount, route change, and scrolled state change
  useEffect(() => {
    forceUpdateNavStyle();
  }, [forceUpdateNavStyle, isScrolled, pathname]);

  // Check user permissions when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setHasAdmin(hasAdminAccess(currentUser));
    } else {
      setHasAdmin(false);
    }
  }, [currentUser]);

  // Extract username from email if displayName is not available
  const displayName = currentUser?.displayName || (currentUser?.email ? getUsernameFromEmail(currentUser.email) : 'User');
  // Get user initials for avatar
  const userInitials = getUserInitials(currentUser?.displayName, currentUser?.email);

  return (
    <nav
      ref={navbarRef}
      className={`fixed w-full z-50 py-3 ${
        isScrolled || isAuthPage ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
      style={{
        backgroundColor: (isScrolled || isAuthPage) ? 'white' : 'transparent',
        boxShadow: (isScrolled || isAuthPage) ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
        transition: 'background-color 0.4s ease, box-shadow 0.4s ease'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className={`font-bold text-2xl ${
              isScrolled || isAuthPage ? 'text-gray-900' : 'text-white'
            }`}
            style={{ color: isScrolled || isAuthPage ? '#111827' : 'white' }}
          >
            MIXPRESET
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            <Link
              href="/"
              className={`text-base relative ${
                pathname === '/'
                  ? (isScrolled || isAuthPage ? 'text-gray-900' : 'text-white')
                  : (isScrolled || isAuthPage ? 'text-gray-900 hover:text-purple-700' : 'text-white hover:text-purple-200')
              } pb-1 ${pathname === '/' ? 'font-medium' : ''}`}
              style={{
                color: isScrolled || isAuthPage ? '#111827' : 'white',
                transition: 'color 0.4s ease',
                paddingBottom: '4px'
              }}
            >
              Home
              <span
                style={{
                  position: 'absolute',
                  background: isScrolled || isAuthPage ? '#9333ea' : 'white',
                  height: '2px',
                  bottom: '-1px',
                  width: pathname === '/' ? '100%' : '0',
                  transition: 'width 0.3s ease',
                  opacity: '1',
                  left: pathname === '/' ? '0' : '50%',
                  transform: pathname === '/' ? 'none' : 'translateX(-50%)'
                }}
                className="nav-underline"
              ></span>
            </Link>
            <Link
              href="/presets"
              className={`text-base relative ${
                pathname?.startsWith('/presets')
                  ? (isScrolled || isAuthPage ? 'text-gray-900' : 'text-white')
                  : (isScrolled || isAuthPage ? 'text-gray-900 hover:text-purple-700' : 'text-white hover:text-purple-200')
              } pb-1 ${pathname?.startsWith('/presets') ? 'font-medium' : ''}`}
              style={{
                color: isScrolled || isAuthPage ? '#111827' : 'white',
                transition: 'color 0.4s ease',
                paddingBottom: '4px'
              }}
            >
              Presets
              <span
                style={{
                  position: 'absolute',
                  background: isScrolled || isAuthPage ? '#9333ea' : 'white',
                  height: '2px',
                  bottom: '-1px',
                  width: pathname?.startsWith('/presets') ? '100%' : '0',
                  transition: 'width 0.3s ease',
                  opacity: '1',
                  left: pathname?.startsWith('/presets') ? '0' : '50%',
                  transform: pathname?.startsWith('/presets') ? 'none' : 'translateX(-50%)'
                }}
                className="nav-underline"
              ></span>
            </Link>
            <Link
              href="/community"
              className={`text-base relative ${
                pathname?.startsWith('/community')
                  ? (isScrolled || isAuthPage ? 'text-gray-900' : 'text-white')
                  : (isScrolled || isAuthPage ? 'text-gray-900 hover:text-purple-700' : 'text-white hover:text-purple-200')
              } pb-1 ${pathname?.startsWith('/community') ? 'font-medium' : ''}`}
              style={{
                color: isScrolled || isAuthPage ? '#111827' : 'white',
                transition: 'color 0.4s ease',
                paddingBottom: '4px'
              }}
            >
              Community
              <span
                style={{
                  position: 'absolute',
                  background: isScrolled || isAuthPage ? '#9333ea' : 'white',
                  height: '2px',
                  bottom: '-1px',
                  width: pathname?.startsWith('/community') ? '100%' : '0',
                  transition: 'width 0.3s ease',
                  opacity: '1',
                  left: pathname?.startsWith('/community') ? '0' : '50%',
                  transform: pathname?.startsWith('/community') ? 'none' : 'translateX(-50%)'
                }}
                className="nav-underline"
              ></span>
            </Link>
            <Link
              href="/courses"
              className={`text-base relative ${
                pathname?.startsWith('/courses')
                  ? (isScrolled || isAuthPage ? 'text-gray-900' : 'text-white')
                  : (isScrolled || isAuthPage ? 'text-gray-900 hover:text-purple-700' : 'text-white hover:text-purple-200')
              } pb-1 ${pathname?.startsWith('/courses') ? 'font-medium' : ''}`}
              style={{
                color: isScrolled || isAuthPage ? '#111827' : 'white',
                transition: 'color 0.4s ease',
                paddingBottom: '4px'
              }}
            >
              Courses
              <span
                style={{
                  position: 'absolute',
                  background: isScrolled || isAuthPage ? '#9333ea' : 'white',
                  height: '2px',
                  bottom: '-1px',
                  width: pathname?.startsWith('/courses') ? '100%' : '0',
                  transition: 'width 0.3s ease',
                  opacity: '1',
                  left: pathname?.startsWith('/courses') ? '0' : '50%',
                  transform: pathname?.startsWith('/courses') ? 'none' : 'translateX(-50%)'
                }}
                className="nav-underline"
              ></span>
            </Link>
            <Link
              href="/pricing"
              className={`text-base relative ${
                pathname?.startsWith('/pricing')
                  ? (isScrolled || isAuthPage ? 'text-gray-900' : 'text-white')
                  : (isScrolled || isAuthPage ? 'text-gray-900 hover:text-purple-700' : 'text-white hover:text-purple-200')
              } pb-1 ${pathname?.startsWith('/pricing') ? 'font-medium' : ''}`}
              style={{
                color: isScrolled || isAuthPage ? '#111827' : 'white',
                transition: 'color 0.4s ease',
                paddingBottom: '4px'
              }}
            >
              Pricing
              <span
                style={{
                  position: 'absolute',
                  background: isScrolled || isAuthPage ? '#9333ea' : 'white',
                  height: '2px',
                  bottom: '-1px',
                  width: pathname?.startsWith('/pricing') ? '100%' : '0',
                  transition: 'width 0.3s ease',
                  opacity: '1',
                  left: pathname?.startsWith('/pricing') ? '0' : '50%',
                  transform: pathname?.startsWith('/pricing') ? 'none' : 'translateX(-50%)'
                }}
                className="nav-underline"
              ></span>
            </Link>
            {/* <Link
              href="/blog"
              className={`text-base border-b-2 ${
                pathname?.startsWith('/blog')
                  ? (isScrolled || isAuthPage ? 'border-purple-600 text-gray-900' : 'border-white text-white')
                  : (isScrolled || isAuthPage ? 'border-transparent text-gray-900 hover:text-purple-700 hover:border-purple-600' : 'border-transparent text-white hover:text-purple-200 hover:border-white')
              } transition-colors pb-1 ${pathname?.startsWith('/blog') ? 'font-medium' : ''}`}
            >
              Blog
            </Link> */}
            <Link
              href="/faq"
              className={`text-base relative ${
                pathname?.startsWith('/faq')
                  ? (isScrolled || isAuthPage ? 'text-gray-900' : 'text-white')
                  : (isScrolled || isAuthPage ? 'text-gray-900 hover:text-purple-700' : 'text-white hover:text-purple-200')
              } pb-1 ${pathname?.startsWith('/faq') ? 'font-medium' : ''}`}
              style={{
                color: isScrolled || isAuthPage ? '#111827' : 'white',
                transition: 'color 0.4s ease',
                paddingBottom: '4px'
              }}
            >
              FAQ
              <span
                style={{
                  position: 'absolute',
                  background: isScrolled || isAuthPage ? '#9333ea' : 'white',
                  height: '2px',
                  bottom: '-1px',
                  width: pathname?.startsWith('/faq') ? '100%' : '0',
                  transition: 'width 0.3s ease',
                  opacity: '1',
                  left: pathname?.startsWith('/faq') ? '0' : '50%',
                  transform: pathname?.startsWith('/faq') ? 'none' : 'translateX(-50%)'
                }}
                className="nav-underline"
              ></span>
            </Link>
          </div>

          {/* Login and Signup Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative group">
                <button
                  className={`flex items-center space-x-2 text-base ${
                    isScrolled || isAuthPage ? 'text-gray-900 hover:text-purple-700' : 'text-white hover:text-purple-200'
                  }`}
                  style={{
                    transition: 'color 0.4s ease'
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center overflow-hidden">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-white">
                        {userInitials}
                      </span>
                    )}
                  </div>
                  <span>{displayName}</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-medium text-gray-800">{displayName}</div>
                    <div className="text-sm text-gray-500">{currentUser?.email || 'user@example.com'}</div>
                  </div>

                  {/* Main Navigation Links */}
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile Dashboard
                      </div>
                    </Link>
                  </div>

                  {/* Account Settings Section */}
                  <div className="py-1 border-t border-gray-100">
                    <Link
                      href="/profile/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Account Settings
                      </div>
                    </Link>

                    {/* Admin Link - Only shown for admin users */}
                    {hasAdmin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 hover:text-purple-900"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Admin Dashboard
                        </div>
                      </Link>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      onLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`text-base relative ${
                    pathname?.startsWith('/login')
                      ? (isScrolled || isAuthPage ? 'text-gray-900' : 'text-white')
                      : (isScrolled || isAuthPage ? 'text-gray-900 hover:text-purple-700' : 'text-white hover:text-purple-200')
                  } pb-1 ${pathname?.startsWith('/login') ? 'font-medium' : ''}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    color: isScrolled || isAuthPage ? '#111827' : 'white',
                    transition: 'color 0.4s ease',
                    paddingBottom: '4px'
                  }}
                >
                  Login
                  <span
                    style={{
                      position: 'absolute',
                      background: isScrolled || isAuthPage ? '#9333ea' : 'white',
                      height: '2px',
                      bottom: '-1px',
                      width: pathname?.startsWith('/login') ? '100%' : '0',
                      transition: 'width 0.3s ease',
                      opacity: '1',
                      left: pathname?.startsWith('/login') ? '0' : '50%',
                      transform: pathname?.startsWith('/login') ? 'none' : 'translateX(-50%)'
                    }}
                    className="nav-underline"
                  ></span>
                </Link>
                <Link
                  href="/signup"
                  className={`text-base px-4 py-2 rounded-md hover:bg-opacity-90 ${
                    isScrolled || isAuthPage
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-white text-purple-700 hover:bg-gray-100'
                  } ${pathname?.startsWith('/signup') ? 'bg-purple-700' : ''}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    transition: 'background-color 0.4s ease, color 0.4s ease'
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`${
                isScrolled || isAuthPage ? 'text-gray-900' : 'text-white'
              } focus:outline-none`}
              style={{
                transition: 'color 0.4s ease'
              }}
            >
              {isOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-2 py-3 bg-white rounded-lg shadow-lg"
               style={{
                 animation: 'fadeIn 0.3s ease-out',
                 transformOrigin: 'top center'
               }}>
            <div className="flex flex-col space-y-3 px-4">
              <Link
                href="/"
                className="text-base text-gray-900 hover:text-purple-700 border-l-4 border-transparent hover:border-purple-600 pl-3 py-1.5"
                onClick={() => setIsOpen(false)}
                style={{
                  transition: 'color 0.3s ease, border-color 0.3s ease'
                }}
              >
                Home
              </Link>
              <Link
                href="/presets"
                className="text-base text-gray-900 hover:text-purple-700 border-l-4 border-transparent hover:border-purple-600 pl-3 py-1.5"
                onClick={() => setIsOpen(false)}
                style={{
                  transition: 'color 0.3s ease, border-color 0.3s ease'
                }}
              >
                Presets
              </Link>
              <Link
                href="/community"
                className="text-base text-gray-900 hover:text-purple-700 border-l-4 border-transparent hover:border-purple-600 pl-3 py-1.5"
                onClick={() => setIsOpen(false)}
                style={{
                  transition: 'color 0.3s ease, border-color 0.3s ease'
                }}
              >
                Community
              </Link>
              <Link
                href="/courses"
                className="text-base text-gray-900 hover:text-purple-700 border-l-4 border-transparent hover:border-purple-600 pl-3 py-1.5"
                onClick={() => setIsOpen(false)}
                style={{
                  transition: 'color 0.3s ease, border-color 0.3s ease'
                }}
              >
                Courses
              </Link>
              <Link
                href="/pricing"
                className="text-base text-gray-900 hover:text-purple-700 border-l-4 border-transparent hover:border-purple-600 pl-3 py-1.5"
                onClick={() => setIsOpen(false)}
                style={{
                  transition: 'color 0.3s ease, border-color 0.3s ease'
                }}
              >
                Pricing
              </Link>
              {/* <Link
                href="/blog"
                className="text-base text-gray-900 hover:text-purple-700 border-l-4 border-transparent hover:border-purple-600 pl-3 py-1.5"
                onClick={() => setIsOpen(false)}
              >
                Blog
              </Link> */}
              <Link
                href="/faq"
                className="text-base text-gray-900 hover:text-purple-700 border-l-4 border-transparent hover:border-purple-600 pl-3 py-1.5"
                onClick={() => setIsOpen(false)}
                style={{
                  transition: 'color 0.3s ease, border-color 0.3s ease'
                }}
              >
                FAQ
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="text-base text-gray-900 hover:text-purple-700 border-l-4 border-transparent hover:border-purple-600 pl-3 py-1.5"
                    onClick={() => setIsOpen(false)}
                    style={{
                      transition: 'color 0.3s ease, border-color 0.3s ease'
                    }}
                  >
                    Profile
                  </Link>

                  <Link
                    href="/profile/settings"
                    className="text-base text-gray-900 hover:text-purple-700 border-l-4 border-transparent hover:border-purple-600 pl-3 py-1.5"
                    onClick={() => setIsOpen(false)}
                    style={{
                      transition: 'color 0.3s ease, border-color 0.3s ease'
                    }}
                  >
                    Account Settings
                  </Link>

                  {/* Admin Link in Mobile Menu */}
                  {hasAdmin && (
                    <Link
                      href="/admin"
                      className="text-base text-purple-700 hover:text-purple-900 font-medium border-l-4 border-purple-600 pl-3 py-1.5"
                      onClick={() => setIsOpen(false)}
                      style={{
                        transition: 'color 0.3s ease, border-color 0.3s ease'
                      }}
                    >
                      Admin
                    </Link>
                  )}

                  <button
                    onClick={(e) => {
                      onLogout();
                    }}
                    className="text-base text-gray-900 hover:text-purple-700 border-l-4 border-transparent hover:border-purple-600 pl-3 py-1.5 text-left w-full"
                    style={{
                      transition: 'color 0.3s ease, border-color 0.3s ease'
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`text-base text-gray-900 hover:text-purple-700 border-l-4 border-transparent hover:border-purple-600 pl-3 py-1.5`}
                    onClick={() => setIsOpen(false)}
                    style={{
                      transition: 'color 0.3s ease, border-color 0.3s ease'
                    }}
                  >
                    Login
                    <span
                      style={{
                        position: 'absolute',
                        background: isScrolled || isAuthPage ? '#9333ea' : 'white',
                        opacity: pathname?.startsWith('/login') ? '1' : '0',
                        width: pathname?.startsWith('/login') ? '100%' : '0%',
                        height: '2px',
                        bottom: '-1px',
                        left: '0',
                        transition: 'width 0.3s ease, opacity 0.3s ease'
                      }}
                      className="absolute bottom-0 left-0 w-0 group-hover:w-full"
                    ></span>
                  </Link>
                  <Link
                    href="/signup"
                    className="text-base bg-purple-600 text-white px-5 py-2.5 rounded-md hover:bg-purple-700 text-center mt-3"
                    onClick={() => setIsOpen(false)}
                    style={{
                      transition: 'background-color 0.3s ease, color 0.3s ease'
                    }}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}