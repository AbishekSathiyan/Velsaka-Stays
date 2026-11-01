
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BarChart3,
  IndianRupee,
  CalendarCheck,
  RefreshCw,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { getAdminDashboard } from "../api/adminDashboardApi";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    confirmedBookings: 0,
  });

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Reuse the existing authenticated dashboard endpoint.
      const data = await getAdminDashboard();

      setStats({
        totalRevenue: Number(data.stats.totalRevenue) || 0,
        totalBookings: Number(data.stats.totalBookings) || 0,
        confirmedBookings:
          Number(data.stats.confirmedBookings) || 0,
      });

      setChartData(
        data.chartData.map((item) => ({
          month: item.month || "Unknown",
          revenue: Number(item.revenue) || 0,
        }))
      );
    } catch (err) {
      console.error("ADMIN ANALYTICS ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load analytics data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const averageRevenue = useMemo(() => {
    if (!stats.confirmedBookings) return 0;

    return stats.totalRevenue / stats.confirmedBookings;
  }, [stats.totalRevenue, stats.confirmedBookings]);

  const totalChartRevenue = useMemo(
    () =>
      chartData.reduce(
        (total, item) => total + item.revenue,
        0
      ),
    [chartData]
  );

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Analytics & Reports
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor VELSAKA STAYS revenue and booking performance.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Reports
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle
              size={20}
              className="shrink-0 text-red-600"
            />

            <p className="text-sm text-red-700">{error}</p>
          </div>

          <button
            onClick={loadAnalytics}
            className="text-sm font-semibold text-red-700 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ANALYTICS CARDS */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

        {/* TOTAL REVENUE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <IndianRupee size={22} />
            </div>

            <TrendingUp size={18} className="text-slate-300" />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            Total Revenue
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "..." : formatCurrency(stats.totalRevenue)}
          </h2>

          <p className="mt-2 text-xs text-slate-400">
            Confirmed booking revenue
          </p>
        </div>

        {/* CONFIRMED BOOKINGS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <CalendarCheck size={22} />
            </div>

            <TrendingUp size={18} className="text-slate-300" />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            Confirmed Bookings
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {loading
              ? "..."
              : stats.confirmedBookings.toLocaleString("en-IN")}
          </h2>

          <p className="mt-2 text-xs text-slate-400">
            Successfully confirmed reservations
          </p>
        </div>

        {/* AVERAGE REVENUE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <BarChart3 size={22} />
            </div>

            <TrendingUp size={18} className="text-slate-300" />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            Average Revenue / Booking
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "..." : formatCurrency(averageRevenue)}
          </h2>

          <p className="mt-2 text-xs text-slate-400">
            Revenue divided by confirmed bookings
          </p>
        </div>
      </div>

      {/* MONTHLY REVENUE CHART */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Monthly Revenue
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Revenue generated from confirmed bookings · Last 7 months
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
            <BarChart3 size={22} />
          </div>
        </div>

        <div className="mt-8 h-80">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Loading analytics...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <BarChart3
                size={42}
                className="text-slate-300"
              />

              <p className="mt-3 font-medium text-slate-600">
                No analytics data available
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Revenue data will appear when bookings are recorded.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 15,
                  right: 15,
                  left: 10,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 12,
                  }}
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
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                  }}
                />

                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#c99a36"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={55}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {!loading && chartData.length > 0 && (
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
            <span className="text-sm text-slate-500">
              Revenue across displayed months
            </span>

            <span className="font-bold text-slate-900">
              {formatCurrency(totalChartRevenue)}
            </span>
          </div>
        )}
      </div>

      {/* REPORT SUMMARY */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">
          Booking Performance
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Overall reservation statistics
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">
              Total Bookings
            </p>

            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              {loading
                ? "..."
                : stats.totalBookings.toLocaleString("en-IN")}
            </h3>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Confirmation Rate
            </p>

            <h3 className="mt-2 text-2xl font-bold text-emerald-600">
              {loading
                ? "..."
                : stats.totalBookings > 0
                  ? `${(
                      (stats.confirmedBookings /
                        stats.totalBookings) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
