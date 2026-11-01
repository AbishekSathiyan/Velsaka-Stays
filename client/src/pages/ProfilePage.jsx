
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  Hotel,
  LogOut,
  Pencil,
  Save,
  X,
  LoaderCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  CheckCircle,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../api/authApi";
import { getMyBookings } from "../api/bookingApi";

// Extract user from different possible API response structures.
const getUserFromResponse = (response) =>
  response?.data?.user ??
  response?.data?.data?.user ??
  response?.user ??
  response?.data ??
  null;

// Extract bookings from API response.
const getBookingsFromResponse = (response) => {
  const data = response?.data?.data ?? response?.data ?? response;

  if (Array.isArray(data)) return data;

  return (
    data?.bookings ??
    data?.data?.bookings ??
    data?.results ??
    []
  );
};

// Format date.
const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Format currency.
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

// Booking status.
const getBookingStatus = (booking) =>
  String(booking?.status || "pending").toLowerCase();

// Booking status styles.
const getStatusStyle = (status) => {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700";

    case "completed":
      return "bg-blue-50 text-blue-700";

    case "cancelled":
    case "rejected":
      return "bg-red-50 text-red-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
};

export default function ProfilePage() {
  const navigate = useNavigate();

  const {
    user: authUser,
    loading: authLoading,
    authError,
    logout,
    refreshUser,
  } = useAuth();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [loggingOut, setLoggingOut] = useState(false);

  // Booking states.
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");

  const [bookingTab, setBookingTab] = useState("all");

  // Profile editing states.
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);

  // Notification states.
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  // Sync Firebase user with profile page.
  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      setLoading(false);
      navigate("/auth", { replace: true });
      return;
    }

    setUser(authUser);

    setName(
      authUser.name ||
      authUser.displayName ||
      ""
    );

    setPhone(
      authUser.phone ||
      authUser.phoneNumber ||
      ""
    );

    setLoading(false);

    setError(authError || "");
  }, [authUser, authLoading, authError, navigate]);

  // Load user's bookings.
  const loadBookings = useCallback(async () => {
    if (!authUser) return;

    try {
      setBookingsLoading(true);
      setBookingsError("");

      const response = await getMyBookings();

      const bookingList = getBookingsFromResponse(response);

      setBookings(
        Array.isArray(bookingList) ? bookingList : []
      );
    } catch (err) {
      console.error("Load bookings error:", err);

      setBookingsError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load your bookings."
      );
    } finally {
      setBookingsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      setBookings([]);
      setBookingsLoading(false);
      return;
    }

    loadBookings();
  }, [authUser, authLoading, loadBookings]);

  // Logout.
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      setError("");

      await logout();

      navigate("/auth", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);

      setError(
        err?.message ||
        "Unable to logout. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  // Update profile.
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    setProfileError("");
    setProfileMessage("");

    // Name validation.
    if (cleanName.length < 2 || cleanName.length > 80) {
      setProfileError(
        "Please enter a name between 2 and 80 characters."
      );
      return;
    }

    // Indian mobile number validation.
    if (cleanPhone && !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setProfileError(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    try {
      setSavingProfile(true);

      console.log("SENDING PROFILE UPDATE:", {
        name: cleanName,
        phone: cleanPhone,
      });

      const response = await updateProfile({
        name: cleanName,
        phone: cleanPhone,
      });

      console.log("PROFILE UPDATE RESPONSE:", response);

      const updatedUser = getUserFromResponse(response);

      if (!updatedUser || typeof updatedUser !== "object") {
        throw new Error(
          response?.message ||
          "Unable to update your profile."
        );
      }

      // Update local profile state immediately.
      setUser((previous) => ({
        ...previous,
        ...updatedUser,
        name: updatedUser.name || cleanName,
        phone: updatedUser.phone ?? cleanPhone,
      }));

      // Update form values.
      setName(updatedUser.name || cleanName);
      setPhone(updatedUser.phone ?? cleanPhone);

      // Close modal.
      setEditing(false);

      // Display success notification.
      setProfileMessage(
        "Your profile has been updated successfully!"
      );

      console.log("PROFILE UPDATED SUCCESSFULLY");
    } catch (err) {
      console.error("PROFILE UPDATE ERROR:", err);

      setProfileError(
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Booking filters.
  const filteredBookings = useMemo(() => {
    if (bookingTab === "all") return bookings;

    if (bookingTab === "upcoming") {
      return bookings.filter((booking) => {
        const status = getBookingStatus(booking);

        return ![
          "completed",
          "cancelled",
          "rejected",
        ].includes(status);
      });
    }

    return bookings.filter((booking) => {
      const status = getBookingStatus(booking);

      return [
        "completed",
        "cancelled",
        "rejected",
      ].includes(status);
    });
  }, [bookings, bookingTab]);

  // Booking statistics.
  const stats = useMemo(() => {
    return {
      total: bookings.length,

      confirmed: bookings.filter(
        (booking) =>
          getBookingStatus(booking) === "confirmed"
      ).length,

      completed: bookings.filter(
        (booking) =>
          getBookingStatus(booking) === "completed"
      ).length,
    };
  }, [bookings]);

  // Display user information.
  const displayName =
    user?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Guest";

  const email = user?.email || "No email available";

  // Loading screen.
  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-indigo-600" />

          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* SUCCESS NOTIFICATION */}
        {profileMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />

            <span>{profileMessage}</span>

            <button
              type="button"
              onClick={() => setProfileMessage("")}
              className="ml-auto rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* GENERAL ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p>{error}</p>
          </div>
        )}

        {/* PAGE HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              VELSAKA STAYS
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              My Profile
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your personal information and hotel bookings.
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}

            {loggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>

        {/* PROFILE LAYOUT */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* PROFILE CARD */}
          <section className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-28 bg-gradient-to-r from-indigo-700 to-violet-600" />

            <div className="px-6 pb-6">
              <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-indigo-50 text-3xl font-bold text-indigo-700 shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div className="mt-4">
                <h2 className="text-xl font-bold text-slate-900">
                  {displayName}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {email}
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Authenticated account
                </div>
              </div>

              <div className="my-6 border-t border-slate-100" />

              <div className="space-y-4">

                {/* NAME */}
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2.5">
                    <UserRound className="h-4 w-4 text-slate-600" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">
                      Full name
                    </p>

                    <p className="truncate text-sm font-medium text-slate-800">
                      {user?.name || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2.5">
                    <Mail className="h-4 w-4 text-slate-600" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">
                      Email address
                    </p>

                    <p className="truncate text-sm font-medium text-slate-800">
                      {email}
                    </p>
                  </div>
                </div>

                {/* PHONE */}
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2.5">
                    <Phone className="h-4 w-4 text-slate-600" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">
                      Phone number
                    </p>

                    <p className="text-sm font-medium text-slate-800">
                      {user?.phone ||
                        user?.phoneNumber ||
                        "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditing(true);
                  setProfileError("");
                  setProfileMessage("");
                }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </button>
            </div>
          </section>

          {/* MAIN CONTENT */}
          <div className="space-y-6 lg:col-span-2">

            {/* BOOKING STATISTICS */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Total bookings
                  </p>

                  <CalendarDays className="h-5 w-5 text-indigo-600" />
                </div>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Confirmed
                  </p>

                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {stats.confirmed}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Completed
                  </p>

                  <Hotel className="h-5 w-5 text-blue-600" />
                </div>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {stats.completed}
                </p>
              </div>
            </section>

            {/* MY BOOKINGS */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    My Bookings
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    View and manage your hotel reservations.
                  </p>
                </div>

                <button
                  onClick={loadBookings}
                  disabled={bookingsLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      bookingsLoading ? "animate-spin" : ""
                    }`}
                  />

                  Refresh
                </button>
              </div>

              {/* BOOKING TABS */}
              <div className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-100">
                {[
                  { id: "all", label: "All bookings" },
                  { id: "upcoming", label: "Upcoming" },
                  { id: "past", label: "Past bookings" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setBookingTab(tab.id)}
                    className={`whitespace-nowrap border-b-2 px-3 pb-3 text-sm font-semibold transition ${
                      bookingTab === tab.id
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* BOOKING LOADING */}
              {bookingsLoading ? (
                <div className="flex flex-col items-center py-12">
                  <LoaderCircle className="h-8 w-8 animate-spin text-indigo-600" />

                  <p className="mt-3 text-sm text-slate-500">
                    Loading bookings...
                  </p>
                </div>

              ) : bookingsError ? (

                /* BOOKING ERROR */
                <div className="py-10 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-500" />

                  <p className="mt-3 text-sm text-red-600">
                    {bookingsError}
                  </p>

                  <button
                    onClick={loadBookings}
                    className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Try again
                  </button>
                </div>

              ) : filteredBookings.length === 0 ? (

                /* EMPTY BOOKINGS */
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <Hotel className="h-7 w-7 text-slate-400" />
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-800">
                    No bookings found
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your hotel reservations will appear here.
                  </p>

                  <Link
                    to="/"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Explore hotels
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

              ) : (

                /* BOOKING LIST */
                <div className="mt-4 divide-y divide-slate-100">
                  {filteredBookings.map((booking) => {
                    const status = getBookingStatus(booking);

                    const hotel =
                      booking.hotel ||
                      booking.hotelId ||
                      {};

                    const hotelName =
                      hotel.name ||
                      booking.hotelName ||
                      "Hotel reservation";

                    const hotelImage =
                      hotel.images?.[0] ||
                      hotel.image ||
                      booking.hotelImage;

                    const bookingId =
                      booking._id ||
                      booking.id;

                    return (
                      <article
                        key={bookingId}
                        className="flex flex-col gap-4 py-5 sm:flex-row"
                      >
                        <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-28">
                          {hotelImage ? (
                            <img
                              src={hotelImage}
                              alt={hotelName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Hotel className="h-8 w-8 text-slate-400" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-slate-900">
                                {hotelName}
                              </h3>

                              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                <MapPin className="h-3.5 w-3.5" />

                                {hotel.location ||
                                  hotel.address ||
                                  "Location unavailable"}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDate(booking.checkIn)}
                            </span>

                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(booking.checkOut)}
                            </span>

                            <span>
                              {booking.guests || 1} guest(s)
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <p className="font-bold text-slate-900">
                              {formatCurrency(
                                booking.totalPrice ||
                                booking.amount ||
                                0
                              )}
                            </p>

                            <span className="text-xs text-slate-400">
                              ID: {String(bookingId || "").slice(-8)}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* EDIT PROFILE MODAL */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

              {/* MODAL HEADER */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Edit Profile
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Update your personal information.
                  </p>
                </div>

                <button
                  onClick={() => setEditing(false)}
                  disabled={savingProfile}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close edit profile"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* PROFILE FORM */}
              <form
                onSubmit={handleSaveProfile}
                className="mt-6 space-y-5"
              >

                {/* FULL NAME */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full name
                  </label>

                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setProfileError("");
                      }}
                      placeholder="Enter your full name"
                      maxLength={80}
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      required
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email address
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-500"
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    Email is managed by Firebase Authentication.
                  </p>
                </div>

                {/* PHONE */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone number
                  </label>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value);
                        setProfileError("");
                      }}
                      placeholder="Enter your phone number"
                      maxLength={10}
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {/* PROFILE ERROR */}
                {profileError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>{profileError}</span>
                  </div>
                )}

                {/* MODAL ACTIONS */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setProfileError("");
                    }}
                    disabled={savingProfile}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingProfile ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}

                    {savingProfile
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
