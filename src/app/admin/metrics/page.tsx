'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { hasAdminAccess } from '@/lib/permissions';
import { getAllDownloadRecords, DownloadRecord } from '@/lib/downloadTracking';
import { getAllPaymentRecords, PaymentRecord } from '@/lib/paymentTracking';
import HeroSection from '@/components/HeroSection';

// Chart component for metrics visualization
const MetricsChart = ({ data, label, color = 'blue' }: { data: number[], label: string, color?: string }) => {
  // Find the max value to scale the chart appropriately
  const maxValue = Math.max(...data, 1);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-sm text-gray-500">Max: {maxValue}</span>
      </div>
      <div className="flex items-end h-32 gap-1">
        {data.map((value, index) => (
          <div
            key={index}
            className="flex-1 group relative"
            title={`${value} ${value === 1 ? 'item' : 'items'}`}
          >
            <div
              className={`w-full bg-${color}-500 rounded-t-sm hover:bg-${color}-600 transition-all duration-200`}
              style={{
                height: `${Math.max((value / maxValue) * 100, 4)}%`,
              }}
            >
              <div className="invisible group-hover:visible absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                {value}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-2 h-2 bg-gray-800 rotate-45"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>7 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};

export default function AdminMetricsPage() {
  const { currentUser } = useAuth();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Time range for filtering
  const [timeRange, setTimeRange] = useState<string>('week');

  // Check if user is admin and fetch records
  useEffect(() => {
    async function fetchData() {
      if (!currentUser) {
        setLoading(false);
        setError("Authentication required");
        return;
      }

      try {
        // Check if user has admin access
        const hasAccess = hasAdminAccess(currentUser);
        setIsAdmin(hasAccess);

        if (!hasAccess) {
          setLoading(false);
          setError("You don't have admin access");
          return;
        }

        // Fetch all download and payment records
        const downloadRecords = await getAllDownloadRecords(1000);
        const paymentRecords = await getAllPaymentRecords(1000);

        setDownloads(downloadRecords);
        setPayments(paymentRecords);
      } catch (err) {
        setError('Failed to load metrics data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUser]);

  // Compute derived metrics
  const metrics = useMemo(() => {
    // Get date range based on selected time period
    const getDateRange = () => {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'day':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
      }

      return {
        start: startDate.getTime(),
        end: now.getTime()
      };
    };

    const { start, end } = getDateRange();

    // Filter data by date range
    const filteredDownloads = downloads.filter(d => d.downloadTime >= start && d.downloadTime <= end);
    const filteredPayments = payments.filter(p => p.purchaseTime >= start && p.purchaseTime <= end);

    // Group downloads by category
    const downloadsByCategory = filteredDownloads.reduce((acc, download) => {
      const category = download.presetCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(download);
      return acc;
    }, {} as Record<string, DownloadRecord[]>);

    // Group payments by type
    const paymentsByType = filteredPayments.reduce((acc, payment) => {
      const type = payment.priceType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(payment);
      return acc;
    }, {} as Record<string, PaymentRecord[]>);

    // Calculate daily metrics for charts
    const getDailyMetrics = (items: any[], timestampField: string) => {
      const days = 7; // Show last 7 days
      const result = Array(days).fill(0);

      const now = new Date();
      now.setHours(23, 59, 59, 999); // End of today

      for (let i = 0; i < days; i++) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dayCount = items.filter(item => {
          const timestamp = item[timestampField];
          return timestamp >= dayStart.getTime() && timestamp <= dayEnd.getTime();
        }).length;

        // Store in reverse order (oldest first)
        result[days - i - 1] = dayCount;
      }

      return result;
    };

    // Calculate total revenue
    const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.priceAmount, 0);

    return {
      totalDownloads: filteredDownloads.length,
      totalPayments: filteredPayments.length,
      totalRevenue,
      downloadsByCategory,
      paymentsByType,
      dailyDownloads: getDailyMetrics(filteredDownloads, 'downloadTime'),
      dailyPayments: getDailyMetrics(filteredPayments, 'purchaseTime'),

      // Credit purchases metrics
      oneTimePurchases: filteredPayments.filter(p => p.priceType === 'one-time').length,

      // Average values
      avgOrderValue: totalRevenue / (filteredPayments.length || 1),
    };
  }, [downloads, payments, timeRange]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!currentUser) {
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

  if (!isAdmin && !loading) {
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
        title="Analytics Dashboard"
        subtitle="Key metrics and performance indicators"
        backgroundImage="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "METRICS" }}
        height="small"
        shape="curved"
        customGradient="bg-gradient-to-r from-slate-800/90 to-slate-600/90"
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
            <span className="text-slate-800">Metrics</span>
          </div>

          {/* Time Period Filter */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Time Period</h2>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-4 py-2 rounded-md ${
                  timeRange === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-4 py-2 rounded-md ${
                  timeRange === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-4 py-2 rounded-md ${
                  timeRange === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`px-4 py-2 rounded-md ${
                  timeRange === 'year'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last Year
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Downloads</h3>
                  <div className="text-3xl font-bold text-gray-800">{metrics.totalDownloads}</div>
                  <div className="text-sm text-gray-500 mt-2">Last {timeRange}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Purchases</h3>
                  <div className="text-3xl font-bold text-gray-800">{metrics.totalPayments}</div>
                  <div className="text-sm text-gray-500 mt-2">Last {timeRange}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-medium text-gray-500">Credit Pack Purchases</h3>
                  <div className="text-3xl font-bold text-gray-800">{metrics.oneTimePurchases}</div>
                  <div className="text-sm text-gray-500 mt-2">Last {timeRange}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                  <div className="text-3xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</div>
                  <div className="text-sm text-gray-500 mt-2">Last {timeRange}</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Daily Downloads</h3>
                  <MetricsChart data={metrics.dailyDownloads} label="Downloads" color="blue" />
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Daily Purchases</h3>
                  <MetricsChart data={metrics.dailyPayments} label="Purchases" color="green" />
                </div>
              </div>

              {/* Downloads by Category */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Downloads by Category</h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Downloads</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(metrics.downloadsByCategory).sort((a, b) => b[1].length - a[1].length).map(([category, downloads]) => (
                        <tr key={category} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {category.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {downloads.length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{ width: `${(downloads.length / metrics.totalDownloads) * 100}%` }}
                                ></div>
                              </div>
                              <span className="ml-4 text-sm text-gray-600">
                                {Math.round((downloads.length / metrics.totalDownloads) * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment by Type */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Payments by Type</h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(metrics.paymentsByType).sort((a, b) => b[1].length - a[1].length).map(([type, payments]) => {
                        const totalRevenue = payments.reduce((sum, payment) => sum + payment.priceAmount, 0);

                        return (
                          <tr key={type} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                type === 'one-time'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {payments.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(totalRevenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full ${
                                      type === 'one-time'
                                        ? 'bg-amber-600'
                                        : 'bg-gray-200'
                                    }`}
                                    style={{ width: `${(payments.length / metrics.totalPayments) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="ml-4 text-sm text-gray-600">
                                  {Math.round((payments.length / metrics.totalPayments) * 100)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}