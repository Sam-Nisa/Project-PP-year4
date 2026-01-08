"use client";

import { useEffect, useState } from "react";
import { DollarSign, BookOpen, Users, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuthStore } from "../../store/authStore";
import { request } from "../../utils/request";

export default function AuthorDashboardPage() {
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuthorDashboardData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await request("/api/author-dashboard-stats", "GET", null, {}, token);
        
        if (response && response.data) {
          setStats(response.data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorDashboardData();
  }, [token]);

  if (loading) return <div className="p-10">Loading Dashboard...</div>;
  if (error) return <div className="p-10 text-red-500">{error}</div>;
  if (!stats) return <div className="p-10">No data available</div>;

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
    <div className="flex-1 overflow-y-auto p-6 bg-background-dark text-black">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Author Dashboard</h2>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>
          <span className="text-sm text-slate-400">
            Last update: {new Date().toLocaleTimeString()}
          </span>
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
  