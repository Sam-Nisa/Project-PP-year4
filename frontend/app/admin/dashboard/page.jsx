"use client";

import {
  DollarSign,
  ShoppingCart,
  Users,
  BookOpen,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  // Weekly revenue data (Mon → Sun)
  const weeklyRevenue = [
    { day: "Mon", revenue: 1200 },
    { day: "Tue", revenue: 2100 },
    { day: "Wed", revenue: 1800 },
    { day: "Thu", revenue: 2600 },
    { day: "Fri", revenue: 3200 },
    { day: "Sat", revenue: 4000 },
    { day: "Sun", revenue: 3500 },
  ];
  const genreData = [
  { name: "Fiction", value: 40, color: "#137fec" },
  { name: "Science", value: 25, color: "#10b981" },
  { name: "History", value: 20, color: "#f59e0b" },
  { name: "Fantasy", value: 15, color: "#8b5cf6" },
];


  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background-dark text-black">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <span className="text-sm text-slate-400">
            Last update: Just now
          </span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Total Revenue",
              value: "$124,500",
              percent: "12%",
              icon: DollarSign,
              iconBg: "bg-blue-500/10",
              iconColor: "text-blue-500",
            },
            {
              title: "Total Orders",
              value: "1,432",
              percent: "5%",
              icon: ShoppingCart,
              iconBg: "bg-purple-500/10",
              iconColor: "text-purple-500",
            },
            {
              title: "New Customers",
              value: "320",
              percent: "8%",
              icon: Users,
              iconBg: "bg-orange-500/10",
              iconColor: "text-orange-500",
            },
            {
              title: "Books Sold",
              value: "8,540",
              percent: "3%",
              icon: BookOpen,
              iconBg: "bg-pink-500/10",
              iconColor: "text-pink-500",
            },
          ].map((item, i) => {
            const Icon = item.icon;

            return (
              <div
                key={i}
                className="
                  rounded-2xl 
                  bg-surface-dark 
                  p-6
                  shadow-lg 
                  shadow-black/30
                  hover:shadow-md
                  transition
                "
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">{item.title}</p>
                  <div className={`p-2 rounded-full ${item.iconBg}`}>
                    <Icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-black">
                    {item.value}
                  </span>
                  <span className="text-sm text-emerald-500">
                    ↑ {item.percent}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Compared to last month
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Revenue Chart */}
          <div
            className="
              lg:col-span-2
              rounded-2xl
              bg-surface-dark
              p-6
              shadow-[0_0_10px_rgba(0,0,0,0.2)]
              hover:shadow-[0_0_25px_rgba(0,0,0,0.15)]
              transition
            "
          >
            <h3 className="text-lg font-bold mb-4">Revenue Trends</h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Genre */}
          <div
  className="
    rounded-2xl 
    bg-surface-dark 
    p-6
    shadow-lg 
    shadow-black/30
    hover:shadow-md
    transition
  "
>
  <h3 className="text-lg font-bold mb-4">Sales by Genre</h3>

  {/* Circle Chart */}
  <div
    className="mx-auto h-48 w-48 rounded-full flex items-center justify-center"
    style={{
      background:
        "conic-gradient(#137fec 0% 40%, #10b981 40% 65%, #f59e0b 65% 85%, #8b5cf6 85% 100%)",
    }}
  >
    <div className="h-36 w-36 rounded-full bg-surface-dark flex flex-col items-center justify-center">
      <span className="text-2xl font-bold text-white">4.2k</span>
      <span className="text-xs text-slate-400">Books</span>
    </div>
  </div>

  {/* Legend */}
  <div className="mt-6 space-y-2">
    {genreData.map((genre, index) => (
      <div
        key={index}
        className="flex items-center justify-between text-sm"
      >
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: genre.color }}
          />
          <span className="text-slate-300">{genre.name}</span>
        </div>
        <span className="text-slate-400">{genre.value}%</span>
      </div>
    ))}
  </div>
</div>

        </div>
      </div>
    </div>
  );
}
