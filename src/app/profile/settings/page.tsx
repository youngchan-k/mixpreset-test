'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import HeroSection from '@/components/HeroSection';
import { deleteUserAccount } from '@/services/userService';
import { reauthenticateUser, updateUserPassword } from '@/lib/firebase';
import Image from 'next/image';

// Delete Account Modal Component
function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  error,
  isDeleting
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  error: string;
  isDeleting: boolean;
}) {
  const [password, setPassword] = useState('');

  // Reset password when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Your Account</h3>
        <p className="text-gray-600 mb-4">
          This action cannot be undone. All your data will be permanently deleted.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 mb-4 font-medium">Are you sure you want to delete your account?</p>
          <p className="text-gray-700 mb-4">This will permanently delete all your data including:</p>
          <ul className="list-disc list-inside mb-4 text-gray-700">
            <li>Your profile information</li>
            <li>Your payment history</li>
            <li>Your downloaded presets</li>
            <li>Your favorite presets</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="modal-delete-password" className="block text-sm font-medium text-gray-700 mb-1">
            Enter your password to confirm
          </label>
          <input
            type="password"
            id="modal-delete-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            disabled={isDeleting}
            required
          />
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => onConfirm(password)}
            disabled={isDeleting || !password}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
          </button>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Password Change Confirmation Modal Component
function PasswordChangeModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Password Change</h3>
        <p className="text-gray-600 mb-4">
          You are about to change your password. After confirmation, you will be logged out and need to log in again with your new password.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 mb-2 font-medium">Please note:</p>
          <ul className="list-disc list-inside mb-2 text-gray-700">
            <li>You will be automatically logged out</li>
            <li>You must use your new password for future logins</li>
            <li>If you have other devices logged in, they will remain active until their session expires</li>
          </ul>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Confirm Change'}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface User {
  name: string;
  email: string;
  profileImage: string | null;
}

export default function SettingsPage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User>({
    name: '',
    email: '',
    profileImage: null
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordData, setPasswordData] = useState<{current: string, new: string}>({ current: '', new: '' });
  const [activeTab, setActiveTab] = useState<string>('profile');

  // Update user data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setIsLoadingProfile(true);
      setUser({
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        profileImage: currentUser.photoURL || null
      });
      setIsLoadingProfile(false);
    } else {
      // If no user is logged in, redirect to login page
      router.push('/login');
    }
  }, [currentUser, router]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({
          ...user,
          profileImage: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real app, this would send the updated profile to the server
    alert('Profile updated successfully!');
  };

  const handlePasswordUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset error/success states
    setPasswordError('');
    setPasswordSuccess('');

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match!');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    // First validate the current password by trying to reauthenticate
    try {
      if (!currentUser || !currentUser.email) {
        throw new Error('User not authenticated');
      }

      // Try to reauthenticate first to verify current password
      await reauthenticateUser(currentUser.email, currentPassword);

      // If reauthentication succeeds, store password data and show confirmation modal
      setPasswordData({
        current: currentPassword,
        new: newPassword
      });
      setShowPasswordModal(true);

    } catch (error: any) {
      // Handle authentication failure (wrong current password)
      setPasswordError('Current password is incorrect: ' + (error.message || 'Authentication failed'));
    }
  };

  // Function to handle the actual password change after confirmation
  const handleConfirmPasswordChange = async () => {
    try {
      setIsUpdatingPassword(true);

      // Update password
      await updateUserPassword(passwordData.new);

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);

      // Set success message
      setPasswordSuccess('Password updated successfully! You will be logged out momentarily...');

      // Log user out after a short delay
      setTimeout(async () => {
        await logout();
        router.push('/login');
      }, 2000);

    } catch (error: any) {
      setPasswordError('Failed to update password: ' + (error.message || 'Unknown error'));
      setShowPasswordModal(false);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
  };

  const handleDeleteAccount = async (password: string) => {
    if (!currentUser) {
      setDeleteError('You must be logged in to delete your account');
      return;
    }

    // Check if password is provided for reauthentication
    if (!password) {
      setDeleteError('Please enter your password to confirm account deletion');
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError('');

      // Reauthenticate user before deletion
      if (currentUser.email) {
        await reauthenticateUser(currentUser.email, password);
      } else {
        throw new Error('User email not available');
      }

      // Delete the user account
      const success = await deleteUserAccount(currentUser.uid);

      if (success) {
        // Log out and redirect to homepage
        await logout();
        router.push('/');
      } else {
        setDeleteError('Failed to delete account. Please try again later.');
      }
    } catch (error: any) {
      setDeleteError('Error deleting account: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeleteError('');
    setShowDeleteModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        title="Account Settings"
        subtitle="Manage your profile information and account preferences"
        backgroundImage="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "SETTINGS" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-purple-600/90 to-purple-800/90"
      />

      <div className="container mx-auto px-8 py-6 mb-16">
        <div className="max-w-5xl mx-auto">
          {/* Page Navigation Links/Breadcrumbs */}
          <div className="flex mb-8 text-sm space-x-2 text-gray-600">
            <Link href="/profile" className="hover:text-purple-600 transition-colors">
              Profile
            </Link>
            <span>?</span>
            <span className="text-purple-600">Account Settings</span>
          </div>

          {/* Back to Profile Link */}
          <div className="mb-6">
            <Link href="/profile" className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Profile
            </Link>
          </div>

          {/* Settings Sub-Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-5 py-4 font-medium ${
                    activeTab === "profile"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-purple-600"
                  } transition-colors`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`px-5 py-4 font-medium ${
                    activeTab === "security"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-purple-600"
                  } transition-colors`}
                >
                  Security
                </button>
                <button
                  onClick={() => setActiveTab("account")}
                  className={`px-5 py-4 font-medium ${
                    activeTab === "account"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-purple-600"
                  } transition-colors`}
                >
                  Account Management
                </button>
              </div>
            </div>

            {/* Content based on active tab */}
            <div className="p-6">
              {/* Profile Information Tab */}
              {activeTab === "profile" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h2>
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 mb-6 md:mb-0 flex flex-col items-center">
                      {/* Profile Image */}
                      <div className="mb-8 text-center">
                        <div className="w-32 h-32 mx-auto relative border-4 border-white shadow-lg rounded-full overflow-hidden" style={{aspectRatio: '1/1'}}>
                          {isLoadingProfile ? (
                            <div className="w-full h-full bg-purple-300 flex items-center justify-center rounded-full">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                            </div>
                          ) : user.profileImage ? (
                            <Image
                              src={user.profileImage}
                              alt="Profile"
                              fill
                              sizes="128px"
                              className="rounded-full"
                              style={{objectFit: 'cover'}}
                            />
                          ) : (
                            <div className="w-full h-full bg-purple-600 flex items-center justify-center rounded-full">
                              <span className="text-4xl font-bold text-white">{user.name ? user.name.charAt(0) : ''}</span>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          id="profileImage"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        <label
                          htmlFor="profileImage"
                          className="inline-flex items-center mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 cursor-pointer transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                          Change Photo
                        </label>
                      </div>
                    </div>

                    <div className="md:w-2/3 md:pl-8">
                      <form onSubmit={handleProfileUpdate} className="max-w-2xl">
                        <div className="mb-4">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            value={user.name}
                            onChange={(e) => setUser({...user, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>

                        <div className="mb-4">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={user.email}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Security Settings</h2>

                  {passwordError && (
                    <div className="bg-red-50 text-red-800 p-3 rounded mb-4 text-sm">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="bg-green-50 text-green-800 p-3 rounded mb-4 text-sm">
                      {passwordSuccess}
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 mb-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-1">Password Management</h3>
                    <p className="text-gray-700 mb-2">
                      Strong passwords are important for keeping your account secure.
                    </p>
                    <ul className="list-disc ml-5 text-sm text-gray-600 mb-2">
                      <li>Use at least 8 characters</li>
                      <li>Include numbers, symbols, and uppercase letters</li>
                      <li>Don't reuse passwords from other sites</li>
                    </ul>
                  </div>

                  <form onSubmit={handlePasswordUpdate} className="max-w-md">
                    <div className="mb-4">
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div className="mb-6">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* Account Management Tab */}
              {activeTab === "account" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Management</h2>

                  <div className="border-b border-gray-200 pb-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Account Status</h3>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-700">Your account is active</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Account created: {currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>

                  <div className="border-b border-gray-200 pb-6 mb-6">
                    <h3 className="text-lg font-semibold text-red-600 mb-3">Danger Zone</h3>
                    <p className="text-gray-600 mb-4">
                      Deleting your account will permanently remove all your data from our systems. This action cannot be undone.
                    </p>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800 mb-4">When you delete your account, you will lose:</p>
                      <ul className="list-disc list-inside mb-4 text-gray-700">
                        <li>Your profile information</li>
                        <li>Your payment history</li>
                        <li>Your downloaded presets</li>
                        <li>Your favorite presets</li>
                      </ul>
                    </div>

                    <button
                      onClick={openDeleteModal}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Data & Privacy</h3>
                    <p className="text-gray-600 mb-4">
                      We take your privacy seriously. You can request a copy of your data or review our privacy policy.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link href="/privacy" className="text-purple-600 hover:text-purple-700 underline">
                        Privacy Policy
                      </Link>
                      <Link href="/terms" className="text-purple-600 hover:text-purple-700 underline">
                        Terms of Service
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteAccount}
        error={deleteError}
        isDeleting={isDeleting}
      />

      {/* Password Change Confirmation Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={closePasswordModal}
        onConfirm={handleConfirmPasswordChange}
        isProcessing={isUpdatingPassword}
      />
    </div>
  );
}