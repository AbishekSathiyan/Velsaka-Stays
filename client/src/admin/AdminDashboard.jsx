
import { useCallback, useEffect, useState } from "react";

import {
  Hotel,
  CalendarCheck,
  Users,
  IndianRupee,
  TrendingUp,
  Clock,
  RefreshCw,
  AlertCircle,
  MapPin,
  UserRound,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { getAdminDashboard } from "../api/adminDashboardApi";

const initialStats = {
  totalHotels: 0,
  totalBookings: 0,
  totalCustomers: 0,
  totalRevenue: 0,
  pendingBookings: 0,
  confirmedBookings: 0,
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700";

    case "pending":
      return "bg-amber-50 text-amber-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

const statConfig = [
  {
    key: "totalHotels",
    title: "Total Hotels",
    description: "Registered properties",
    icon: Hotel,
    color: "bg-blue-50 text-blue-600",
  },
  {
    key: "totalBookings",
    title: "Total Bookings",
    description: "All reservations",
    icon: CalendarCheck,
    color: "bg-purple-50 text-purple-600",
  },
  {
    key: "totalCustomers",
    title: "Total Customers",
    description: "Registered customers",
    icon: Users,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "totalRevenue",
    title: "Total Revenue",
    description: "Confirmed booking revenue",
    icon: IndianRupee,
    color: "bg-amber-50 text-amber-600",
    currency: true,
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(initialStats);
  const [chartData, setChartData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminDashboard();

      setStats({
        totalHotels: Number(data.stats.totalHotels) || 0,
        totalBookings: Number(data.stats.totalBookings) || 0,
        totalCustomers: Number(data.stats.totalCustomers) || 0,
        totalRevenue: Number(data.stats.totalRevenue) || 0,
        pendingBookings: Number(data.stats.pendingBookings) || 0,
        confirmedBookings: Number(data.stats.confirmedBookings) || 0,
      });

      setChartData(
        data.chartData.map((item) => ({
          ...item,
          revenue: Number(item.revenue) || 0,
        }))
      );

      setRecentBookings(data.recentBookings);
    } catch (err) {
      console.error("ADMIN DASHBOARD ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard Overview
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor your VELSAKA STAYS platform.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Data
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />

            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="text-sm font-semibold text-red-700 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statConfig.map((stat) => {
          const Icon = stat.icon;
          const value = stats[stat.key] ?? 0;

          return (
            <div
              key={stat.key}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <Icon size={22} />
                </div>

                <TrendingUp
                  size={18}
                  className="text-slate-300"
                />
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                {stat.title}
              </p>

              <h2 className="mt-1 break-words text-2xl font-bold text-slate-900">
                {loading
                  ? "..."
                  : stat.currency
                    ? formatCurrency(value)
                    : value.toLocaleString("en-IN")}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* BOOKING STATUS */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Confirmed Bookings
          </p>

          <h3 className="mt-2 text-2xl font-bold text-emerald-600">
            {loading ? "..." : stats.confirmedBookings.toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Pending Bookings
          </p>

          <h3 className="mt-2 text-2xl font-bold text-amber-600">
            {loading ? "..." : stats.pendingBookings.toLocaleString("en-IN")}
          </h3>
        </div>
      </div>

      {/* REVENUE CHART */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">
                Revenue Overview
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Confirmed booking revenue · Last 7 months
              </p>
            </div>

            <TrendingUp className="text-emerald-600" />
          </div>

          <div className="h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Loading revenue data...
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No revenue data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 10,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="revenueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#d6a84f"
                        stopOpacity={0.3}
                      />

                      <stop
                        offset="95%"
                        stopColor="#d6a84f"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `₹${(value / 1000).toFixed(0)}k`
                        : `₹${value}`
                    }
                  />

                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(value),
                      "Revenue",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#c99a36"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* PLATFORM STATUS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">
            Platform Status
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Platform integration overview
          </p>

          <div className="mt-7 space-y-5">
            {[
              ["Hotel Management", "Available"],
              ["Booking Management", "Available"],
              ["Firebase Authentication", "Enabled"],
              ["Payment Integration", "Razorpay"],
            ].map(([label, status]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4"
              >
                <span className="text-sm text-slate-600">
                  {label}
                </span>

                <span className="text-xs font-semibold text-emerald-600">
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT BOOKINGS */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
          <div>
            <h3 className="font-bold text-slate-900">
              Recent Bookings
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Latest five reservation records
            </p>
          </div>

          <CalendarCheck className="text-slate-400" />
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Loading bookings...
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarCheck
              className="mx-auto text-slate-300"
              size={38}
            />

            <p className="mt-3 font-medium text-slate-600">
              No bookings found
            </p>

            <p className="mt-1 text-sm text-slate-400">
              New reservations will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Hotel</th>
                  <th className="px-6 py-4 font-semibold">Booking Date</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((booking) => (
                  <tr
                    key={booking._id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <UserRound size={17} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {booking.user?.name || "Unknown Customer"}
                          </p>

                          <p className="text-xs text-slate-400">
                            {booking.user?.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {booking.hotel?.name || "Hotel unavailable"}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <MapPin size={12} />
                        {booking.hotel?.city || "N/A"}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(booking.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {formatCurrency(booking.totalPrice)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                          booking.status
                        )}`}
                      >
                        {booking.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Clock size={14} />
        Dashboard refreshes when you open the page or click Refresh Data.
      </div>
    </div>
  );
}
