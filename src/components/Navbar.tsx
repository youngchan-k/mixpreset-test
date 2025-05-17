'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasAdminAccess } from '@/lib/permissions';

// Helper function to extract username from email
const getUsernameFromEmail = (email: string | null | undefined): string => {
  return email ? email.split('@')[0] : 'User';
};

// Helper to get user initials for avatar
const getUserInitials = (displayName?: string | null, email?: string | null): string => {
  if (displayName) {
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName[0].toUpperCase();
  }

  if (email) {
    return email[0].toUpperCase();
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, googleSignIn, loading } = useAuth();

  // Use context values if available, otherwise use props
  // Only consider authenticated if not loading and user exists
  const isAuthenticated = (!loading && currentUser !== null) || propIsAuthenticated;
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

  // Check if current page is community page
  const isCommunityPage = pathname?.includes('/community');

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('user-dropdown');
      const avatar = document.getElementById('user-avatar');
      if (dropdown && avatar && !dropdown.contains(event.target as Node) && !avatar.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActivePath = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  // Add a reliable navigation handler function
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, path: string) => {
    e.preventDefault();

    // Close mobile menu if open
    if (isOpen) {
      setIsOpen(false);
    }

    // Close dropdown if open
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    }

    // Force a hard navigation for preset pages to solve navigation issues
    if (pathname?.includes('/presets') || path.includes('/presets')) {
      window.location.href = path;
    } else {
      // For other pages, use router with fallback
      router.push(path);

      // Add fallback direct navigation after a short delay if router doesn't work
      setTimeout(() => {
        window.location.href = path;
      }, 100);
    }
  };

  // Extract username from email if displayName is not available
  const displayName = currentUser?.displayName || (currentUser?.email ? getUsernameFromEmail(currentUser.email) : 'User');
  // Get user initials for avatar
  const userInitials = getUserInitials(currentUser?.displayName, currentUser?.email);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Presets', path: '/presets' },
    { name: 'Community', path: '/community' },
    { name: 'Courses', path: '/courses' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Blog', path: '/blog' },
    { name: 'FAQ', path: '/faq' }
  ];

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 bg-white shadow-md ${
        isScrolled
          ? 'py-2'
          : 'py-3'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="font-bold text-2xl relative group"
          >
            <span className="text-gray-900 transition-colors duration-300">
              MIX<span className="text-purple-600">PRESET</span>
            </span>
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-2 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`relative px-4 py-2 rounded-full text-base font-medium transition-all duration-300 group ${
                  isActivePath(link.path)
                    ? 'text-purple-600'
                    : 'text-gray-800 hover:text-purple-700'
                }`}
              >
                {link.name}
                {isActivePath(link.path) && (
                  <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-purple-600 rounded-full"></span>
                )}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
              </Link>
            ))}
          </div>

          {/* Auth Buttons or User Menu */}
          <div className="hidden lg:flex items-center space-x-3">
            {loading ? (
              // Show nothing or a subtle loading indicator while authentication state is loading
              <div className="w-10 h-10 flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-purple-600 rounded-full animate-spin"></div>
              </div>
            ) : isAuthenticated ? (
              <div className="relative">
                <button
                  id="user-avatar"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-800 hover:text-purple-700 transition-colors"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-purple-800 flex items-center justify-center overflow-hidden border-2 border-white shadow-md hover:shadow-lg transition-all duration-300">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {userInitials}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-800">
                    {displayName}
                  </span>
                  <svg className={`h-4 w-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''} text-gray-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div
                    id="user-dropdown"
                    className="absolute right-0 mt-3 w-56 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 ease-out transform origin-top scale-100 opacity-100 py-1 animate-fadeIn"
                  >
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-medium text-gray-800">{displayName}</div>
                      <div className="text-sm text-gray-500 truncate">{currentUser?.email || 'user@example.com'}</div>
                  </div>

                  {/* Main Navigation Links */}
                  <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile Dashboard
                        </div>
                      </Link>

                      <Link
                        href="/profile/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Account Settings
                        </div>
                      </Link>
                    </div>

                    {/* Admin Section */}
                    <div className="py-1 border-t border-gray-100">
                      {hasAdmin && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 hover:text-purple-900"
                          onClick={() => setIsDropdownOpen(false)}
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

                    <div className="py-1 border-t border-gray-100">
                  <button
                        onClick={() => {
                      onLogout();
                          setIsDropdownOpen(false);
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
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-800 hover:text-purple-700 border-gray-300 hover:border-purple-600 px-5 py-2 rounded-full border transition-all duration-300 text-base font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-purple-600 text-white hover:bg-purple-700 px-5 py-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-purple-500/20 text-base font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 focus:outline-none transition-colors duration-300"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          </div>
        </div>

        {/* Mobile Menu */}
      <div
        className={`${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'
        } lg:hidden fixed top-16 right-0 z-40 w-full max-w-xs h-auto max-h-[90vh] overflow-y-auto bg-white shadow-xl border-t border-gray-100 rounded-bl-2xl transition-all duration-300 ease-in-out transform origin-top-right`}
              >
        <div className="px-4 py-4 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-lg relative ${
                    isActivePath(link.path) ? 'text-purple-700 font-medium' : 'text-gray-700'
                  } hover:text-purple-700 transition-colors py-2 border-b border-gray-100`}
                  onClick={(e) => {
                    setIsOpen(false);
                    handleNavigation(e, link.path);
                  }}
                >
                  {link.name}
                  {isActivePath(link.path) && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-full"></span>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-t-2 border-purple-600 rounded-full animate-spin"></div>
                </div>
              ) : isAuthenticated ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 pb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-purple-800 flex items-center justify-center overflow-hidden">
                      {currentUser?.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {userInitials}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{displayName}</div>
                      <div className="text-sm text-gray-500 truncate">{currentUser?.email}</div>
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    className="block py-2 text-gray-700 hover:text-purple-700 transition-colors border-b border-gray-100"
                    onClick={(e) => {
                      setIsOpen(false);
                      handleNavigation(e, '/profile');
                    }}
                  >
                    Profile Dashboard
                  </Link>

                  <Link
                    href="/profile/settings"
                    className="block py-2 text-gray-700 hover:text-purple-700 transition-colors border-b border-gray-100"
                    onClick={(e) => {
                      setIsOpen(false);
                      handleNavigation(e, '/profile/settings');
                    }}
                  >
                    Account Settings
                  </Link>

                  {/* Admin Link in Mobile Menu */}
                  {hasAdmin && (
                    <Link
                      href="/admin"
                      className="block py-2 text-purple-700 hover:text-purple-900 transition-colors font-medium border-b border-gray-100"
                      onClick={(e) => {
                        setIsOpen(false);
                        handleNavigation(e, '/admin');
                      }}
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={(e) => {
                      onLogout();
                      setIsOpen(false);
                      handleNavigation(e, '/');
                    }}
                    className="w-full text-left py-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Link
                    href="/login"
                    className="w-full py-3 text-center border border-gray-300 rounded-lg text-gray-800 hover:text-purple-700 hover:border-purple-600 transition-colors duration-300"
                    onClick={(e) => {
                      setIsOpen(false);
                      handleNavigation(e, '/login');
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="w-full py-3 text-center bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300"
                    onClick={(e) => {
                      setIsOpen(false);
                      handleNavigation(e, '/signup');
                    }}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}