"use client";

import { useEffect, useState } from "react";
import { DollarSign, BookOpen, Users, TrendingUp, RefreshCw, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuthStore } from "../../store/authStore";
import { request } from "../../utils/request";

export default function AuthorDashboardPage() {
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [bakongStatus, setBakongStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAuthorDashboardData = async () => {
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    if (!user || user.role !== 'author') {
      setError("Author access required. Please contact admin to upgrade your account.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching author dashboard data...");
      
      // Fetch dashboard stats and Bakong status in parallel
      const [dashboardResponse, paymentResponse] = await Promise.all([
        request("/api/author-dashboard-stats", "GET", null, {}, token),
        request("/api/author/payment/info", "GET", null, {}, token).catch(() => null)
      ]);
      
      console.log("Dashboard API response:", dashboardResponse);
      
      if (dashboardResponse && dashboardResponse.success && dashboardResponse.data) {
        setStats(dashboardResponse.data);
        console.log("Dashboard data loaded successfully:", dashboardResponse.data);
      } else {
        throw new Error(dashboardResponse?.message || "Invalid response format");
      }

      // Set payment status if available
      if (paymentResponse && paymentResponse.success) {
        const paymentData = paymentResponse.data;
        setBakongStatus({
          hasAccount: !!(paymentData.bakong_account_id),
          isVerified: paymentData.bakong_account_verified || false,
          accountId: paymentData.bakong_account_id || null,
          paymentMethod: paymentData.payment_method || 'bank'
        });
      }
      
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      
      // More specific error messages
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Access denied. Author privileges required.");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorDashboardData();
  }, [token, user]);

  if (loading) return (
    <div className="flex-1 p-6 bg-background-dark">
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading Dashboard...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex-1 p-6 bg-background-dark">
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Dashboard Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAuthorDashboardData}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
  
  if (!stats) return (
    <div className="flex-1 p-6 bg-background-dark">
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-600">No data available</p>
        <button
          onClick={fetchAuthorDashboardData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Load Data
        </button>
      </div>
    </div>
  );

  // KPI Data for author dashboard
  const kpiData = [
    {
      title: "Total Books",
      value: stats.totalBooks || 0,
      percent: `+${stats.booksGrowth || "0%"}`,
      icon: BookOpen,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "Published Books",
      value: stats.publishedBooks || 0,
      percent: "+8%",
      icon: BookOpen,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    {
      title: "Total Sales",
      value: stats.totalSales || 0,
      percent: `+${stats.salesGrowth || "0%"}`,
      icon: TrendingUp,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
    {
      title: "Revenue",
      value: `$${stats.totalRevenue || 0}`,
      percent: `+${stats.revenueGrowth || "0%"}`,
      icon: DollarSign,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
  ];

  // Book status distribution for pie chart
  const statusData = [
    { name: 'Published', value: stats.publishedBooks || 0, color: '#10B981' },
    { name: 'Pending', value: stats.pendingBooks || 0, color: '#F59E0B' },
    { name: 'Rejected', value: stats.rejectedBooks || 0, color: '#EF4444' },
  ];

  return (
    <div className="flex-1  p-6 bg-background-dark text-black">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Author Dashboard</h2>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchAuthorDashboardData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <span className="text-sm text-slate-400">
              Last update: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-lg transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">{item.title}</p>
                  <div className={`p-2 rounded-full ${item.iconBg}`}>
                    <Icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-black">{item.value}</span>
                  <span className="text-sm text-emerald-500">↑ {item.percent}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Compared to last month</p>
              </div>
            );
          })}
        </div>

        {/* Bakong Payment Status */}
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Bakong Payment Status
          </h3>
          
          {bakongStatus ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {bakongStatus.bakong_account_verified ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium">
                    {bakongStatus.bakong_account_verified ? 'Account Verified' : 'Setup Required'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {bakongStatus.bakong_account_verified 
                      ? `Account: ${bakongStatus.bakong_account_id}` 
                      : 'Configure your Bakong account to receive payments'
                    }
                  </p>
                </div>
              </div>
              <a
                href="/author/payment"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                {bakongStatus.bakong_account_verified ? 'Manage' : 'Setup Now'}
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-600">Payment Setup</p>
                  <p className="text-sm text-gray-500">Configure Bakong to receive payments</p>
                </div>
              </div>
              <a
                href="/author/payment"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                Setup Now
              </a>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Weekly Sales Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.weeklySales || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Book Status Distribution */}
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Book Status Distribution</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Books Table */}
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Recent Books</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Genre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(stats.recentBooks || []).map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {book.cover_image_url && (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            className="w-10 h-12 object-cover rounded mr-3"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900">{book.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.genre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(book.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        book.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : book.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {book.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.stock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
  