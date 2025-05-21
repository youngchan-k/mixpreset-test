'use client';

import { useEffect, useState } from 'react';
import { UserProfile, getUserProfile } from '@/services/userService';

interface ProfileOverviewProps {
  userId: string;
}

export default function ProfileOverview({ userId }: ProfileOverviewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await getUserProfile(userId);
        if (userProfile) {
          setProfile(userProfile);
          setError(null);
        } else {
          setError('Could not load profile information');
        }
      } catch (err) {
        setError('Error loading profile information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="text-center text-red-600">
          <h3 className="text-lg font-medium">Error</h3>
          <p>{error || 'Could not load profile information'}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Profile Overview</h2>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Account Info</h3>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-[300px]">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{profile.displayName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{profile.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Credit Balance</h3>
          <div className="flex items-center space-x-2">
            <div className="font-bold text-2xl text-purple-600">{profile.credits}</div>
            <div className="text-gray-500">credits available</div>
          </div>
          <div className="mt-2">
            <a
              href="/pricing"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Buy Credits
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Activity</h3>
          {profile.paymentHistory.length === 0 ? (
            <div className="text-sm text-gray-500 italic">No recent activity</div>
          ) : (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchase
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...profile.paymentHistory]
                      .sort((a, b) => new Date(b.purchaseTime).getTime() - new Date(a.purchaseTime).getTime())
                      .slice(0, 5)
                      .map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.purchaseTime)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {payment.planName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            ${payment.priceAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-medium text-purple-600">+{payment.credits}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}