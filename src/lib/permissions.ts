import adminData from '@/data/admin.json';

// Type for the user object
type User = {
  email?: string | null;
} | null;

/**
 * Check if a user has admin permissions
 * @param user User object with email
 * @returns Boolean indicating if user has admin access
 */
export function hasAdminAccess(user: User): boolean {
  if (!user || !user.email) return false;

  // Check if the user's email is in the admin list
  return adminData.adminUsers.includes(user.email);
}