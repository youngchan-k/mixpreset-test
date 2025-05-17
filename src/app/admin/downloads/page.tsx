'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { hasAdminAccess } from '@/lib/permissions';
import { getAllDownloadRecords, formatDownloadDate, DownloadRecord } from '@/lib/downloadTracking';
import HeroSection from '@/components/HeroSection';

export default function AdminDownloadsPage() {
  const { currentUser } = useAuth();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [filteredDownloads, setFilteredDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  // Check if user is admin and fetch download records
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

        // Fetch all download records
        const records = await getAllDownloadRecords(1000);
        setDownloads(records);
        setFilteredDownloads(records);

        // Extract unique categories for filter dropdown
        const uniqueCategories = Array.from(new Set(records.map(record => record.presetCategory)));
        setCategories(uniqueCategories);
      } catch (err) {
        setError('Failed to load download records');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUser]);

  // Apply filters when any filter changes
  useEffect(() => {
    if (downloads.length === 0) return;

    let results = [...downloads];

    // Apply search query (case insensitive)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(download =>
        (download.userEmail?.toLowerCase().includes(query) || false) ||
        download.presetName.toLowerCase().includes(query) ||
        (download.fileName?.toLowerCase().includes(query) || false)
      );
    }

    // Apply category filter
    if (categoryFilter) {
      results = results.filter(download => download.presetCategory === categoryFilter);
    }

    // Apply date filter
    if (dateFilter) {
      const today = new Date();
      let filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          // Keep today's date
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          break;
      }

      results = results.filter(download => {
        const downloadDate = new Date(download.downloadTime);
        return downloadDate >= filterDate;
      });
    }

    setFilteredDownloads(results);
  }, [searchQuery, categoryFilter, dateFilter, downloads]);

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setDateFilter('');
  };

  // Export data as CSV
  const exportCSV = () => {
    if (filteredDownloads.length === 0) return;

    // Create CSV header
    const headers = [
      'User ID',
      'User Email',
      'Category',
      'Preset Name',
      'Filename',
      'Credit Cost',
      'Download Time'
    ];

    // Convert download records to CSV rows
    const rows = filteredDownloads.map(download => [
      download.userId,
      download.userEmail || 'Unknown',
      download.presetCategory,
      download.presetName,
      download.fileName || 'Unknown',
      download.credits || 'N/A',
      new Date(download.downloadTime).toISOString()
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `download_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        title="Admin Downloads Dashboard"
        subtitle="Track and analyze user download history"
        backgroundImage="https://images.unsplash.com/photo-1561736778-92e52a7769ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
        badge={{ text: "ADMIN" }}
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
            <span className="text-slate-800">Downloads</span>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Download History</h2>

              <button
                onClick={exportCSV}
                disabled={filteredDownloads.length === 0 || loading}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                  filteredDownloads.length === 0 || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export CSV</span>
              </button>
            </div>

            {/* Search and Filter Section */}
            {!loading && !error && downloads.length > 0 && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search Input */}
                  <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search email, preset, file..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      id="category"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">All Categories</option>
                      {(() => {
                        // Define the specific category order
                        const categoryOrder = ["premium", "vocal_chain", "instrument"];

                        // Create ordered list of categories (specified ones first, then sort others alphabetically)
                        const orderedCategories = [
                          ...categoryOrder.filter(cat => categories.includes(cat)),
                          ...categories.filter(cat => !categoryOrder.includes(cat)).sort()
                        ];

                        return orderedCategories.map((category) => (
                          <option key={category} value={category}>
                            {category.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <select
                      id="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>

                  {/* Reset Button */}
                  <div className="flex items-end">
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>

                {/* Results Count */}
                <div className="mt-4 text-sm text-gray-500">
                  Showing {filteredDownloads.length} of {downloads.length} download records
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 bg-red-50 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            ) : filteredDownloads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Download Date/Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDownloads.map((download) => (
                      <tr key={download.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{download.userEmail || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{download.userId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {download.presetCategory}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{download.presetName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {download.fileName || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {download.credits || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDownloadDate(download.downloadTime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg text-gray-600">
                  {downloads.length > 0 ? 'No matching records found. Try adjusting your filters.' : 'No download records found.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}