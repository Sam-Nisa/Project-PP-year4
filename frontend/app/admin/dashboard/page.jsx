"use client";

import { useEffect } from "react";
import { DollarSign, ShoppingCart, Users, BookOpen } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useUserStore } from "../../store/useUserStore"; // Adjust path

export default function DashboardPage() {
 const { stats, fetchDashboardData, loading } = useUserStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !stats) return <div className="p-10">Loading Stats...</div>;
  if (!stats) return <div className="p-10">No data available. Check Console.</div>;

  // Map API data to your KPI cards
  const kpiData = [
    {
      title: "Total Authors",
      value: stats.totalAuthors || 0,
      percent: stats.authorsGrowth || "0%",
      icon: Users,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
    {
      title: "Total Users",
      value: stats.totalUsers || 0,
      percent: stats.usersGrowth || "0%",
      icon: Users,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "Total Categories",
      value: stats.totalCategories || 0,
      percent: stats.categoriesGrowth || "0%",
      icon: BookOpen,
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-500",
    },
    {
      title: "Total Books",
      value: stats.totalBooks || 0,
      percent: stats.booksGrowth || "0%",
      icon: BookOpen,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
  ];

  // Logic for the CSS Conic Gradient (Genre Chart)
  // Generating the gradient string dynamically based on API data
  const generateGradient = () => {
    let currentPerc = 0;
    const gradientParts = stats.genreData.map((g) => {
      const start = currentPerc;
      currentPerc += g.value;
      return `${g.color} ${start}% ${currentPerc}%`;
    });
    return `conic-gradient(${gradientParts.join(", ")})`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background-dark text-black">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
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

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Revenue Chart */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4">Revenue Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.weeklyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Genre */}
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4">Sales by Genre</h3>
            <div
              className="mx-auto h-48 w-48 rounded-full flex items-center justify-center"
              style={{ background: generateGradient() }}
            >
              <div className="h-36 w-36 rounded-full bg-white flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-black">{stats.totalSoldBooks || '0'}</span>
                <span className="text-xs text-slate-400">Books</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {stats.genreData.map((genre, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: genre.color }} />
                    <span className="text-slate-600">{genre.name}</span>
                  </div>
                  <span className="font-medium text-slate-700">{genre.value}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}