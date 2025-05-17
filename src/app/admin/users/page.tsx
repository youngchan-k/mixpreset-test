'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { hasAdminAccess } from '@/lib/permissions';
import HeroSection from '@/components/HeroSection';
import { getAllDownloadRecords, DownloadRecord } from '@/lib/downloadTracking';
import { getAllPaymentRecords, PaymentRecord } from '@/lib/paymentTracking';
import { getFirebaseAuth } from '@/lib/firebase';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface UserStats {
  uid: string;
  email: string;
  displayName?: string;
  creationTime?: string;
  lastSignInTime?: string;
  downloadCount: number;
  creditsPurchased: number;
}

export default function UserManagementPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [timeRange, setTimeRange] = useState<string>('month');
  const [error, setError] = useState<string | null>(null);

  // Check for cached admin status on mount
  useEffect(() => {
    const cachedAdminState = localStorage.getItem('isAdmin');
    if (cachedAdminState === 'true') {
      setIsAdmin(true);
    }
  }, []);

  // Check if user is admin and fetch data
  useEffect(() => {
    async function fetchData() {
      if (authLoading) {
        return; // Wait for auth to complete
      }

      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has admin access
        const hasAccess = hasAdminAccess(currentUser);
        setIsAdmin(hasAccess);

        // Cache admin status for faster page transitions
        if (hasAccess) {
          localStorage.setItem('isAdmin', 'true');
        } else {
          localStorage.removeItem('isAdmin');
        }

        if (!hasAccess) {
          setLoading(false);
          return;
        }

        // Fetch all download and payment records
        const downloadRecords = await getAllDownloadRecords(1000);
        const paymentRecords = await getAllPaymentRecords(1000);

        setDownloads(downloadRecords);
        setPayments(paymentRecords);

        // Get Firebase Auth users (requires Firebase Admin SDK, this is a placeholder)
        // In a real implementation, this would be a server-side API call
        const userList = await fetchFirebaseUsers();
        setUsers(userList);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUser, authLoading]);

  // Mock function to fetch Firebase users (in a real app, this would be a server API call)
  const fetchFirebaseUsers = async (): Promise<UserStats[]> => {
    // In production, this would be an API call to a server endpoint that uses Firebase Admin SDK
    // For now, we'll create a placeholder that extracts unique users from downloads and payments

    const uniqueUsers = new Map<string, UserStats>();

    // Extract users from downloads
    downloads.forEach(download => {
      if (!uniqueUsers.has(download.userId)) {
        uniqueUsers.set(download.userId, {
          uid: download.userId,
          email: download.userEmail,
          downloadCount: 0,
          creditsPurchased: 0
        });
      }

      const user = uniqueUsers.get(download.userId)!;
      user.downloadCount += 1;
    });

    // Add payment info
    payments.forEach(payment => {
      if (!uniqueUsers.has(payment.userId)) {
        uniqueUsers.set(payment.userId, {
          uid: payment.userId,
          email: payment.userEmail,
          downloadCount: 0,
          creditsPurchased: 0
        });
      }

      const user = uniqueUsers.get(payment.userId)!;
      user.creditsPurchased += payment.credits;
    });

    return Array.from(uniqueUsers.values());
  };

  // Calculate user metrics
  const userMetrics = useMemo(() => {
    // Get date range based on selected time period
    const getDateRange = () => {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
        case 'quarter':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
      }

      return {
        start: startDate.getTime(),
        end: now.getTime()
      };
    };

    const { start, end } = getDateRange();

    // Calculate new users per day, week, and month
    const getNewUsersOverTime = () => {
      // In a real implementation, we would use account creation timestamps
      // For now, we'll use the earliest download or payment timestamp for each user

      const userFirstSeen = new Map<string, number>();

      // Find the earliest timestamp for each user
      [...downloads, ...payments].forEach(record => {
        const timestamp = 'downloadTime' in record ? record.downloadTime : record.purchaseTime;
        const userId = record.userId;

        if (!userFirstSeen.has(userId) || timestamp < userFirstSeen.get(userId)!) {
          userFirstSeen.set(userId, timestamp);
        }
      });

      // Group by day
      const dailyData: Record<string, number> = {};
      const weeklyData: Record<string, number> = {};
      const monthlyData: Record<string, number> = {};

      // Generate dates and initialize with 0
      const dateRange = getDates(new Date(start), new Date(end));

      // Initialize daily data
      dateRange.forEach(date => {
        const dateKey = formatDate(date);
        dailyData[dateKey] = 0;

        // Initialize weekly data (using the first day of the week)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Go to Sunday
        const weekKey = formatDate(weekStart);

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = 0;
        }

        // Initialize monthly data
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
      });

      // Count users by their first seen date
      userFirstSeen.forEach((timestamp, userId) => {
        if (timestamp >= start && timestamp <= end) {
          const date = new Date(timestamp);

          // Daily
          const dateKey = formatDate(date);
          dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;

          // Weekly
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay()); // Go to Sunday
          const weekKey = formatDate(weekStart);
          weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;

          // Monthly
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        }
      });

      return {
        daily: Object.entries(dailyData).sort(([dateA], [dateB]) => dateA.localeCompare(dateB)),
        weekly: Object.entries(weeklyData).sort(([dateA], [dateB]) => dateA.localeCompare(dateB)),
        monthly: Object.entries(monthlyData).sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      };
    };

    // Helper functions for date handling
    function getDates(startDate: Date, endDate: Date) {
      const dates = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dates;
    }

    function formatDate(date: Date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // Calculate new users metrics
    const newUsersOverTime = getNewUsersOverTime();

    // Calculate general stats
    const totalUsers = users.length;
    const usersWithDownloads = users.filter(user => user.downloadCount > 0).length;
    const usersWithPurchases = users.filter(user => user.creditsPurchased > 0).length;
    const averageDownloadsPerUser = totalUsers ? downloads.length / totalUsers : 0;
    const conversionRate = totalUsers ? (usersWithPurchases / totalUsers) * 100 : 0;

    return {
      totalUsers,
      usersWithDownloads,
      usersWithPurchases,
      averageDownloadsPerUser,
      conversionRate,
      newUsersOverTime
    };
  }, [users, downloads, payments, timeRange]);

  // Format data for charts
  const chartData = useMemo(() => {
    const { newUsersOverTime } = userMetrics;

    const dailyLabels = newUsersOverTime.daily.map(([date]) => {
      const parts = date.split('-');
      return `${parts[1]}/${parts[2]}`; // MM/DD format
    });

    const weeklyLabels = newUsersOverTime.weekly.map(([date]) => {
      const parts = date.split('-');
      return `Week of ${parts[1]}/${parts[2]}`; // Week of MM/DD format
    });

    const monthlyLabels = newUsersOverTime.monthly.map(([date]) => {
      const parts = date.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(parts[1]) - 1]} ${parts[0]}`; // MMM YYYY format
    });

    return {
      daily: {
        labels: dailyLabels,
        datasets: [
          {
            label: 'New Users',
            data: newUsersOverTime.daily.map(([, count]) => count),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1
          }
        ]
      },
      weekly: {
        labels: weeklyLabels,
        datasets: [
          {
            label: 'New Users',
            data: newUsersOverTime.weekly.map(([, count]) => count),
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
            tension: 0.1
          }
        ]
      },
      monthly: {
        labels: monthlyLabels,
        datasets: [
          {
            label: 'New Users',
            data: newUsersOverTime.monthly.map(([, count]) => count),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            tension: 0.1
          }
        ]
      },
      userStats: {
        labels: ['Users with Downloads', 'Users with Purchases'],
        datasets: [
          {
            label: 'User Count',
            data: [userMetrics.usersWithDownloads, userMetrics.usersWithPurchases],
            backgroundColor: [
              'rgba(54, 162, 235, 0.5)',
              'rgba(75, 192, 192, 0.5)'
            ],
            borderColor: [
              'rgb(54, 162, 235)',
              'rgb(75, 192, 192)'
            ],
            borderWidth: 1
          }
        ]
      }
    };
  }, [userMetrics]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // Create loading UI component for a better user experience
  const LoadingSpinner = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    </div>
  );

  // For smoother transitions, display loading spinner when auth is loading or admin status is uncertain
  if (authLoading || (loading && localStorage.getItem('isAdmin') === 'true')) {
    return <LoadingSpinner />;
  }

  // Only show the authentication required message after auth has loaded and user is not authenticated
  if (!authLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h2>
          <p className="mb-4">Please log in to access this page.</p>
          <Link href="/login" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
            Login
          </Link>
        </div>
      </div>
    );
  }

  // Only show access denied after auth has loaded and admin check is complete
  if (!authLoading && !loading && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="mb-4">You don't have permission to view this page.</p>
          <Link href="/" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        title="User Management"
        subtitle="Monitor user growth and engagement"
        backgroundImage="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "USERS" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-indigo-900/90 to-indigo-600/90"
      />

      <div className="container mx-auto px-8 py-6 mb-16">
        <div className="max-w-7xl mx-auto">
          {/* Admin Navigation Links */}
          <div className="flex mb-8 text-sm space-x-2 text-gray-600">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Home
            </Link>
            <span>?</span>
            <Link href="/admin" className="hover:text-slate-800 transition-colors">
              Admin
            </Link>
            <span>?</span>
            <span className="text-slate-800">User Management</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Time Range Selector */}
              <div className="flex justify-end mb-2">
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    onClick={() => setTimeRange('week')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                      timeRange === 'week'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setTimeRange('month')}
                    className={`px-4 py-2 text-sm font-medium ${
                      timeRange === 'month'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setTimeRange('quarter')}
                    className={`px-4 py-2 text-sm font-medium ${
                      timeRange === 'quarter'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Quarter
                  </button>
                  <button
                    onClick={() => setTimeRange('year')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                      timeRange === 'year'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Year
                  </button>
                </div>
              </div>

              {/* User Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">{userMetrics.totalUsers}</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-gray-500 text-sm font-medium">Users with Downloads</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">{userMetrics.usersWithDownloads}</p>
                    <p className="ml-2 text-sm text-gray-500">
                      ({Math.round((userMetrics.usersWithDownloads / userMetrics.totalUsers) * 100) || 0}%)
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-gray-500 text-sm font-medium">Users with Purchases</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">{userMetrics.usersWithPurchases}</p>
                    <p className="ml-2 text-sm text-gray-500">
                      ({Math.round((userMetrics.usersWithPurchases / userMetrics.totalUsers) * 100) || 0}%)
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-gray-500 text-sm font-medium">Conversion Rate</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">{userMetrics.conversionRate.toFixed(1)}%</p>
                    <p className="ml-2 text-sm text-gray-500">
                      ({userMetrics.usersWithPurchases} of {userMetrics.totalUsers})
                    </p>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Daily New Users Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Daily New Users</h3>
                  <div className="h-64">
                    <Line options={chartOptions} data={chartData.daily} />
                  </div>
                </div>

                {/* Weekly New Users Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Weekly New Users</h3>
                  <div className="h-64">
                    <Line options={chartOptions} data={chartData.weekly} />
                  </div>
                </div>

                {/* Monthly New Users Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Monthly New Users</h3>
                  <div className="h-64">
                    <Line options={chartOptions} data={chartData.monthly} />
                  </div>
                </div>

                {/* User Stats Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">User Engagement</h3>
                  <div className="h-64">
                    <Bar options={chartOptions} data={chartData.userStats} />
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">User List</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Downloads
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credits Purchased
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.uid} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-gray-500 font-medium">{user.email.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.displayName || user.email.split('@')[0]}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.downloadCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.creditsPurchased}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}