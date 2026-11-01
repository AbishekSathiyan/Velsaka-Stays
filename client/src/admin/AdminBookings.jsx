
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CalendarCheck,
  RefreshCw,
  Search,
  Users,
  IndianRupee,
  Clock3,
  CheckCircle2,
  XCircle,
  Hotel,
  MapPin,
  CalendarDays,
  AlertCircle,
  ArrowUpRight,
  Filter,
  BedDouble,
} from "lucide-react";

import apiClient from "../api/apiClient";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";

    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-600/10";

    case "cancelled":
      return "bg-red-50 text-red-700 ring-red-600/10";

    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/10";
  }
};

const getBookingId = (id) =>
  id ? `#${String(id).slice(-8).toUpperCase()}` : "N/A";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/admin/bookings");

      const data = response.data;

      const bookingList = Array.isArray(data)
        ? data
        : Array.isArray(data?.bookings)
          ? data.bookings
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setBookings(bookingList);
    } catch (err) {
      console.error("ADMIN BOOKINGS ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load bookings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = bookings.length;

    const confirmed = bookings.filter(
      (booking) => booking.status?.toLowerCase() === "confirmed"
    ).length;

    const pending = bookings.filter(
      (booking) => booking.status?.toLowerCase() === "pending"
    ).length;

    const cancelled = bookings.filter(
      (booking) => booking.status?.toLowerCase() === "cancelled"
    ).length;

    return {
      total,
      confirmed,
      pending,
      cancelled,
    };
  }, [bookings]);

  // Search and filtering
  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const customer = booking.user?.name || "";
      const email = booking.user?.email || "";
      const hotel = booking.hotel?.name || "";
      const bookingId = booking._id || "";

      const matchesSearch =
        !query ||
        customer.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        hotel.toLowerCase().includes(query) ||
        bookingId.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        booking.status?.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.total,
      icon: CalendarCheck,
      iconStyle: "bg-blue-50 text-blue-600",
      description: "All reservations",
    },
    {
      title: "Confirmed",
      value: stats.confirmed,
      icon: CheckCircle2,
      iconStyle: "bg-emerald-50 text-emerald-600",
      description: "Confirmed reservations",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock3,
      iconStyle: "bg-amber-50 text-amber-600",
      description: "Awaiting confirmation",
    },
    {
      title: "Cancelled",
      value: stats.cancelled,
      icon: XCircle,
      iconStyle: "bg-red-50 text-red-600",
      description: "Cancelled reservations",
    },
  ];

  return (
    <div className="min-h-screen space-y-7 bg-slate-50/50">

      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Management
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Bookings
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage reservations and monitor customer activity.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${stat.iconStyle}`}>
                  <Icon size={21} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-slate-300 transition group-hover:text-amber-500"
                />
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                {stat.title}
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                {loading ? "..." : stat.value.toLocaleString("en-IN")}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* BOOKINGS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* TABLE HEADER */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              All Reservations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading reservations..."
                : `${filteredBookings.length} of ${bookings.length} bookings displayed`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* SEARCH */}
            <div className="relative min-w-0 sm:w-72">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, hotel, ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
              />
            </div>

            {/* STATUS FILTER */}
            <div className="relative sm:w-44">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="m-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle
                size={19}
                className="shrink-0 text-red-600"
              />

              <p className="text-sm text-red-700">{error}</p>
            </div>

            <button
              onClick={fetchBookings}
              className="text-sm font-semibold text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? null : filteredBookings.length === 0 ? (
          /* EMPTY STATE */
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <CalendarCheck size={30} />
            </div>

            <h3 className="mt-5 font-bold text-slate-800">
              {bookings.length === 0
                ? "No bookings found"
                : "No matching reservations"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {bookings.length === 0
                ? "Customer reservations will appear here."
                : "Try changing your search or status filter."}
            </p>

            {(search || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="mt-5 text-sm font-semibold text-amber-700 hover:text-amber-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          /* DATA TABLE */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-slate-50/80">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Booking</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Stay Details</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking._id}
                    className="transition hover:bg-slate-50/80"
                  >
                    {/* BOOKING ID */}
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-800">
                        {getBookingId(booking._id)}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(booking.createdAt)}
                      </p>
                    </td>

                    {/* CUSTOMER */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <Users size={17} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {booking.user?.name || "Unknown Customer"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {booking.user?.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* HOTEL */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Hotel
                          size={16}
                          className="shrink-0 text-slate-400"
                        />

                        <div>
                          <p className="font-semibold text-slate-800">
                            {booking.hotel?.name || "Hotel unavailable"}
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                            <MapPin size={12} />
                            {booking.hotel?.city || "Location unavailable"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* STAY DETAILS */}
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-sm text-slate-700">
                          <CalendarDays
                            size={14}
                            className="text-slate-400"
                          />
                          {formatDate(booking.checkIn)}
                        </p>

                        <p className="flex items-center gap-2 text-xs text-slate-400">
                          <BedDouble size={14} />
                          {booking.rooms || 1} room(s)
                          {" · "}
                          {booking.guests || 1} guest(s)
                        </p>
                      </div>
                    </td>

                    {/* AMOUNT */}
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900">
                        {formatCurrency(booking.totalPrice)}
                      </p>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusStyle(
                          booking.status
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {booking.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE FOOTER */}
        {!loading && !error && bookings.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <p className="text-xs text-slate-500">
              Showing {filteredBookings.length} of {bookings.length} reservations
            </p>

            <p className="text-xs font-medium text-slate-500">
              VELSAKA STAYS · Admin Management
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
