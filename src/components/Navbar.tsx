'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasAdminAccess } from '@/lib/permissions';

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

interface NavbarProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export default function Navbar({ isAuthenticated: propIsAuthenticated, onLogout: propOnLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, googleSignIn } = useAuth();

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

  // Check user permissions when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setHasAdmin(hasAdminAccess(currentUser));
    } else {
      setHasAdmin(false);
    }
  }, [currentUser]);

  // Check if current page is an auth page (login, signup, forgot-password)
  const isAuthPage = pathname?.includes('/login') ||
                    pathname?.includes('/signup') ||
                    pathname?.includes('/forgot-password');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Extract username from email if displayName is not available
  const displayName = currentUser?.displayName || (currentUser?.email ? getUsernameFromEmail(currentUser.email) : 'User');
  // Get user initials for avatar
  const userInitials = getUserInitials(currentUser?.displayName, currentUser?.email);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 py-3 ${
        isScrolled || isAuthPage ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
      style={{
        backgroundColor: isScrolled || isAuthPage ? 'white' : 'transparent',
        boxShadow: isScrolled || isAuthPage ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'
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
              className={`text-base border-b-2 ${
                pathname === '/'
                  ? (isScrolled || isAuthPage ? 'border-purple-600 text-gray-900' : 'border-white text-white')
                  : (isScrolled || isAuthPage ? 'border-transparent text-gray-900 hover:text-purple-700 hover:border-purple-600' : 'border-transparent text-white hover:text-purple-200 hover:border-white')
              } transition-colors pb-1 ${pathname === '/' ? 'font-medium' : ''}`}
              style={{
                color: isScrolled || isAuthPage ? '#111827' : 'white',
                borderBottomColor: pathname === '/'
                  ? (isScrolled || isAuthPage ? '#9333ea' : 'white')
                  : 'transparent'
              }}
            >
              Home
            </Link>
            <Link
              href="/presets"
              className={`text-base border-b-2 ${
                pathname?.startsWith('/presets')
                  ? (isScrolled || isAuthPage ? 'border-purple-600 text-gray-900' : 'border-white text-white')
                  : (isScrolled || isAuthPage ? 'border-transparent text-gray-900 hover:text-purple-700 hover:border-purple-600' : 'border-transparent text-white hover:text-purple-200 hover:border-white')
              } transition-colors pb-1 ${pathname?.startsWith('/presets') ? 'font-medium' : ''}`}
            >
              Presets
            </Link>
            <Link
              href="/community"
              className={`text-base border-b-2 ${
                pathname?.startsWith('/community')
                  ? (isScrolled || isAuthPage ? 'border-purple-600 text-gray-900' : 'border-white text-white')
                  : (isScrolled || isAuthPage ? 'border-transparent text-gray-900 hover:text-purple-700 hover:border-purple-600' : 'border-transparent text-white hover:text-purple-200 hover:border-white')
              } transition-colors pb-1 ${pathname?.startsWith('/community') ? 'font-medium' : ''}`}
            >
              Community
            </Link>
            <Link
              href="/courses"
              className={`text-base border-b-2 ${
                pathname?.startsWith('/courses')
                  ? (isScrolled || isAuthPage ? 'border-purple-600 text-gray-900' : 'border-white text-white')
                  : (isScrolled || isAuthPage ? 'border-transparent text-gray-900 hover:text-purple-700 hover:border-purple-600' : 'border-transparent text-white hover:text-purple-200 hover:border-white')
              } transition-colors pb-1 ${pathname?.startsWith('/courses') ? 'font-medium' : ''}`}
            >
              Courses
            </Link>
            <Link
              href="/pricing"
              className={`text-base border-b-2 ${
                pathname?.startsWith('/pricing')
                  ? (isScrolled || isAuthPage ? 'border-purple-600 text-gray-900' : 'border-white text-white')
                  : (isScrolled || isAuthPage ? 'border-transparent text-gray-900 hover:text-purple-700 hover:border-purple-600' : 'border-transparent text-white hover:text-purple-200 hover:border-white')
              } transition-colors pb-1 ${pathname?.startsWith('/pricing') ? 'font-medium' : ''}`}
            >
              Pricing
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
              className={`text-base border-b-2 ${
                pathname?.startsWith('/faq')
                  ? (isScrolled || isAuthPage ? 'border-purple-600 text-gray-900' : 'border-white text-white')
                  : (isScrolled || isAuthPage ? 'border-transparent text-gray-900 hover:text-purple-700 hover:border-purple-600' : 'border-transparent text-white hover:text-purple-200 hover:border-white')
              } transition-colors pb-1 ${pathname?.startsWith('/faq') ? 'font-medium' : ''}`}
            >
              FAQ
            </Link>
          </div>

          {/* Login and Signup Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative group">
                <button
                  className={`flex items-center space-x-2 text-base ${
                    isScrolled || isAuthPage ? 'text-gray-900 hover:text-purple-700' : 'text-white hover:text-purple-200'
                  } transition-colors`}
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
                  className={`text-base border-b-2 ${
                    pathname?.startsWith('/login')
                      ? (isScrolled || isAuthPage ? 'border-purple-600 text-gray-900' : 'border-white text-white')
                      : (isScrolled || isAuthPage ? 'border-transparent text-gray-900 hover:text-purple-700 hover:border-purple-600' : 'border-transparent text-white hover:text-purple-200 hover:border-white')
                  } transition-colors pb-1 ${pathname?.startsWith('/login') ? 'font-medium' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className={`text-base px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors ${
                    isScrolled || isAuthPage
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-white text-purple-700 hover:bg-gray-100'
                  } ${pathname?.startsWith('/signup') ? 'bg-purple-700' : ''}`}
                  onClick={() => setIsOpen(false)}
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
          <div className="md:hidden mt-2 py-2 bg-white rounded-lg shadow-lg">
            <div className="flex flex-col space-y-2 px-3">
              <Link
                href="/"
                className="text-sm text-gray-900 hover:text-purple-700 transition-colors border-l-4 border-transparent hover:border-purple-600 pl-2 py-0.5"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/presets"
                className="text-sm text-gray-900 hover:text-purple-700 transition-colors border-l-4 border-transparent hover:border-purple-600 pl-2 py-0.5"
                onClick={() => setIsOpen(false)}
              >
                Presets
              </Link>
              <Link
                href="/community"
                className="text-sm text-gray-900 hover:text-purple-700 transition-colors border-l-4 border-transparent hover:border-purple-600 pl-2 py-0.5"
                onClick={() => setIsOpen(false)}
              >
                Community
              </Link>
              <Link
                href="/courses"
                className="text-sm text-gray-900 hover:text-purple-700 transition-colors border-l-4 border-transparent hover:border-purple-600 pl-2 py-0.5"
                onClick={() => setIsOpen(false)}
              >
                Courses
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-gray-900 hover:text-purple-700 transition-colors border-l-4 border-transparent hover:border-purple-600 pl-2 py-0.5"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              {/* <Link
                href="/blog"
                className="text-sm text-gray-900 hover:text-purple-700 transition-colors border-l-4 border-transparent hover:border-purple-600 pl-2 py-0.5"
                onClick={() => setIsOpen(false)}
              >
                Blog
              </Link> */}
              <Link
                href="/faq"
                className="text-sm text-gray-900 hover:text-purple-700 transition-colors border-l-4 border-transparent hover:border-purple-600 pl-2 py-0.5"
                onClick={() => setIsOpen(false)}
              >
                FAQ
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="text-sm text-gray-900 hover:text-purple-700 transition-colors border-l-4 border-transparent hover:border-purple-600 pl-2 py-0.5"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>

                  <Link
                    href="/profile/settings"
                    className="text-sm text-gray-900 hover:text-purple-700 transition-colors border-l-4 border-transparent hover:border-purple-600 pl-2 py-0.5"
                    onClick={() => setIsOpen(false)}
                  >
                    Account Settings
                  </Link>

                  {/* Admin Link in Mobile Menu */}
                  {hasAdmin && (
                    <Link
                      href="/admin"
                      className="text-sm text-purple-700 hover:text-purple-900 transition-colors font-medium border-l-4 border-purple-600 pl-2 py-0.5"
                      onClick={() => setIsOpen(false)}
                    >
                      Admin
                    </Link>
                  )}

                  <button
                    onClick={(e) => {
                      onLogout();
                    }}
                    className="text-sm text-gray-900 hover:text-purple-700 transition-colors border-l-4 border-transparent hover:border-purple-600 pl-2 py-0.5 text-left w-full"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-gray-900 hover:text-purple-700 transition-colors border-l-4 border-transparent hover:border-purple-600 pl-2 py-0.5"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-center mt-2"
                    onClick={() => setIsOpen(false)}
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