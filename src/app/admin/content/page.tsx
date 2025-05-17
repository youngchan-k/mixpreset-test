'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { hasAdminAccess } from '@/lib/permissions';
import { getAllDownloadRecords, DownloadRecord } from '@/lib/downloadTracking';
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
    </div>
  );
};

// Component to show preset distribution by filter
const FilterDistributionChart = ({
  title,
  data
}: {
  title: string,
  data: {label: string, count: number}[]
}) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-600">{item.label}</span>
              <span className="text-sm text-gray-500">{item.count} ({Math.round((item.count / total) * 100)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full"
                style={{ width: `${(item.count / total) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface PresetMetadata {
  id?: string;
  preset_name?: string;
  description?: string;
  filters?: {
    daw?: string | string[];
    gender?: string | string[];
    genre?: string | string[];
    plugin?: string | string[];
    [key: string]: any;
  };
  [key: string]: any;
}

interface PresetStats {
  id: string;
  title: string;
  category: string;
  downloadCount: number;
  creditsUsed: number;
  filters: {
    daw: string | string[];
    gender: string | string[];
    genre: string | string[];
    plugin: string | string[];
  };
}

export default function AdminContentPage() {
  const { currentUser } = useAuth();
  // Add state for S3 URL
  const [presetS3Url, setPresetS3Url] = useState("preset.mixpreset.com");
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [presetMetadata, setPresetMetadata] = useState<Map<string, PresetMetadata>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [categories, setCategories] = useState<{label: string, count: number}[]>([]);
  const [dawDistribution, setDawDistribution] = useState<{label: string, count: number}[]>([]);
  const [genreDistribution, setGenreDistribution] = useState<{label: string, count: number}[]>([]);
  const [genderDistribution, setGenderDistribution] = useState<{label: string, count: number}[]>([]);
  const [pluginDistribution, setPluginDistribution] = useState<{label: string, count: number}[]>([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState<number[]>([]);
  const [topPresets, setTopPresets] = useState<PresetStats[]>([]);

  // Set up the S3 URL properly once we're client-side
  useEffect(() => {
    // This will only run on the client
    setPresetS3Url(process.env.NEXT_PUBLIC_PRESET_S3_URL || "preset.mixpreset.com");
  }, []);

  // Initialize S3 client
  const s3Client = useMemo(() => ({
    getDirectUrl: (key: string): string => {
      return `https://${presetS3Url}/${key}`;
    }
  }), [presetS3Url]);

  // Check if user is admin and fetch data
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
        const downloadRecords = await getAllDownloadRecords(1000);
        setDownloads(downloadRecords);

        // Fetch preset metadata from S3
        await fetchPresetMetadata();

      } catch (err) {
        setError('Failed to load content data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUser, presetS3Url]);

  // Fetch preset metadata from S3
  const fetchPresetMetadata = async () => {
    try {
      // Categories in S3
      const CATEGORIES = ['vocal_fx', 'vocal_chain', 'instrument'];
      const metadataMap = new Map<string, PresetMetadata>();
      const categoryData: {label: string, count: number}[] = [];

      // Track all filter values
      const dawValues: Record<string, number> = {};
      const genreValues: Record<string, number> = {};
      const genderValues: Record<string, number> = {};
      const pluginValues: Record<string, number> = {};

      // Track monthly preset creation
      const monthlyData = Array(6).fill(0); // Last 6 months

      for (const category of CATEGORIES) {
        try {
          // List all preset folders in this category using direct S3 URL
          const listUrl = `https://${presetS3Url}/?prefix=${category}/&delimiter=/`;
          const response = await fetch(listUrl);

          if (!response.ok) {
            continue;
          }

          // Parse the XML response to get folder names
          const xmlText = await response.text();
          const folderRegex = /<CommonPrefixes><Prefix>([^<]+)<\/Prefix><\/CommonPrefixes>/g;
          const presetFolders: string[] = [];

          let match;
          while ((match = folderRegex.exec(xmlText)) !== null) {
            if (match[1] && match[1].startsWith(`${category}/`) && match[1].endsWith('/')) {
              presetFolders.push(match[1]);
            }
          }

          // Add to category counts
          categoryData.push({
            label: category.replace(/_/g, ' '),
            count: presetFolders.length
          });

          // Process each preset folder to get metadata
          for (const folderPrefix of presetFolders) {
            try {
              // Get meta.json file using direct URL
              const metaUrl = s3Client.getDirectUrl(`${folderPrefix}meta.json`);
              const metaResponse = await fetch(metaUrl);

              if (!metaResponse.ok) continue;

              const metaData = await metaResponse.json();

              if (metaData.preset) {
                // Get preset ID
                const presetName = folderPrefix.split('/')[1];
                const fallbackId = `${category}_${presetName}`;
                const presetId = metaData.preset.id || fallbackId;

                // Store in map with presetId as key
                metadataMap.set(presetId, metaData.preset);

                // Track filter values
                if (metaData.preset.filters) {
                  // Handle DAW filter
                  const daw = metaData.preset.filters.daw || 'Any';
                  if (Array.isArray(daw)) {
                    daw.forEach(d => {
                      dawValues[d] = (dawValues[d] || 0) + 1;
                    });
                  } else {
                    dawValues[daw] = (dawValues[daw] || 0) + 1;
                  }

                  // Handle genre filter
                  const genre = metaData.preset.filters.genre || 'Any';
                  if (Array.isArray(genre)) {
                    genre.forEach(g => {
                      genreValues[g] = (genreValues[g] || 0) + 1;
                    });
                  } else {
                    genreValues[genre] = (genreValues[genre] || 0) + 1;
                  }

                  // Handle gender filter
                  const gender = metaData.preset.filters.gender || 'All';
                  if (Array.isArray(gender)) {
                    gender.forEach(g => {
                      genderValues[g] = (genderValues[g] || 0) + 1;
                    });
                  } else {
                    genderValues[gender] = (genderValues[gender] || 0) + 1;
                  }

                  // Handle plugin filter
                  const plugin = metaData.preset.filters.plugin || 'Any';
                  if (Array.isArray(plugin)) {
                    plugin.forEach(p => {
                      pluginValues[p] = (pluginValues[p] || 0) + 1;
                    });
                  } else {
                    pluginValues[plugin] = (pluginValues[plugin] || 0) + 1;
                  }
                }

                // Track preset creation date
                const creationDate = new Date();
                const now = new Date();
                const monthsAgo = (now.getFullYear() - creationDate.getFullYear()) * 12 +
                  (now.getMonth() - creationDate.getMonth());

                // Only count last 6 months
                if (monthsAgo >= 0 && monthsAgo < 6) {
                  monthlyData[5 - monthsAgo]++;
                }
              }
            } catch (folderErr) {
              continue;
            }
          }
        } catch (categoryErr) {
          continue;
        }
      }

      // Process preset metadata with download counts
      processPresetStats(metadataMap);

      // Set category data
      setCategories(categoryData);

      // Set filter distributions
      setDawDistribution(
        Object.entries(dawValues)
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
      );

      setGenreDistribution(
        Object.entries(genreValues)
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
      );

      setGenderDistribution(
        Object.entries(genderValues)
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
      );

      setPluginDistribution(
        Object.entries(pluginValues)
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
      );

      // Set monthly growth data
      setMonthlyGrowth(monthlyData);

      // Store the metadata map
      setPresetMetadata(metadataMap);

    } catch (err) {
      setError('Failed to load preset metadata');
    }
  };

  // Process download data with preset metadata to get comprehensive stats
  const processPresetStats = (metadataMap: Map<string, PresetMetadata>) => {
    // Group downloads by presetId
    const downloadsByPreset: Record<string, DownloadRecord[]> = {};
    downloads.forEach(download => {
      if (!downloadsByPreset[download.presetId]) {
        downloadsByPreset[download.presetId] = [];
      }
      downloadsByPreset[download.presetId].push(download);
    });

    // Create stats for each preset
    const presetStats: PresetStats[] = [];

    for (const [presetId, presetDownloads] of Object.entries(downloadsByPreset)) {
      const metadata = metadataMap.get(presetId);
      const totalCredits = presetDownloads.reduce((sum, download) => sum + (download.credits || 0), 0);

      if (metadata) {
        presetStats.push({
          id: presetId,
          title: metadata.preset_name || presetId,
          category: presetId.split('_')[0] || '',
          downloadCount: presetDownloads.length,
          creditsUsed: totalCredits,
          filters: {
            daw: metadata.filters?.daw || 'Any',
            gender: metadata.filters?.gender || 'All',
            genre: metadata.filters?.genre || 'Any',
            plugin: metadata.filters?.plugin || 'Any'
          }
        });
      } else {
        // Fallback for presets without metadata
        presetStats.push({
          id: presetId,
          title: presetId,
          category: presetId.split('_')[0] || '',
          downloadCount: presetDownloads.length,
          creditsUsed: totalCredits,
          filters: {
            daw: 'Any',
            gender: 'All',
            genre: 'Any',
            plugin: 'Any'
          }
        });
      }
    }

    // Sort by download count and take top presets
    const topByDownloads = [...presetStats].sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 10);
    setTopPresets(topByDownloads);
  };

  // Format arrays for display
  const formatArrayValue = (value: string | string[]): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value;
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
        title="Content Management"
        subtitle="Analyze and manage your preset content"
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
            <span className="text-slate-800">Content</span>
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
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500">Total Presets</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">
                    {categories.reduce((sum, cat) => sum + cat.count, 0)}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500">Total Downloads</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{downloads.length}</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500">Used Credits</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">
                    {downloads.reduce((sum, download) => sum + (download.credits || 0), 0)}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500">New This Month</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{monthlyGrowth[5] || 0}</div>
                </div>
              </div>

              {/* Content Growth Chart */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Content Growth</h3>
                <MetricsChart data={monthlyGrowth} label="New Presets" color="purple" />
              </div>

              {/* Category Distribution and Filter Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <FilterDistributionChart
                  title="Presets by Category"
                  data={categories}
                />

                <FilterDistributionChart
                  title="DAW Distribution"
                  data={dawDistribution.slice(0, 10)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <FilterDistributionChart
                  title="Genre Distribution"
                  data={genreDistribution.slice(0, 10)}
                />

                <FilterDistributionChart
                  title="Voice Gender Distribution"
                  data={genderDistribution}
                />
              </div>

              {/* Top Presets Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-bold text-gray-800">Top Presets by Downloads</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preset</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Downloads</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits Used</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filters</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topPresets.map((preset) => (
                        <tr key={preset.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{preset.title}</div>
                            <div className="text-sm text-gray-500">{preset.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              {preset.category.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {preset.downloadCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {preset.creditsUsed}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="space-y-1">
                              <div><span className="font-medium">DAW:</span> {formatArrayValue(preset.filters.daw)}</div>
                              <div><span className="font-medium">Genre:</span> {formatArrayValue(preset.filters.genre)}</div>
                              <div><span className="font-medium">Gender:</span> {formatArrayValue(preset.filters.gender)}</div>
                              <div><span className="font-medium">Plugin:</span> {formatArrayValue(preset.filters.plugin)}</div>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {topPresets.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            No preset data available
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