
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Heart,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
  MapPin,
  Users,
  BedDouble,
  Pencil,
  X,
  Check,
  LoaderCircle,
  Phone,
} from "lucide-react";

import Header from "../components/Header";
import {
  getCurrentUser,
  logoutUser,
  updateProfile,
} from "../api/authApi";
import { getMyBookings } from "../api/bookingApi";

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatPrice = (price) =>
  `₹${Number(price || 0).toLocaleString("en-IN")}`;

const getBookingCategory = (booking) => {
  if (booking.status === "cancelled") return "past";

  if (booking.category) return booking.category;

  return new Date(booking.checkOut) > new Date()
    ? "upcoming"
    : "past";
};

const getUserFromResponse = (result) =>
  result?.data?.user ??
  result?.data?.data?.user ??
  result?.user ??
  null;

const getBookingsFromResponse = (result) => {
  const candidates = [
    result?.data?.bookings,
    result?.data?.data?.bookings,
    result?.bookings,
    result?.data,
    result,
  ];

  return candidates.find(Array.isArray) ?? [];
};

export default function ProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");
  const [bookingTab, setBookingTab] = useState("upcoming");

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError("");

    try {
      const result = await getMyBookings();
      setBookings(getBookingsFromResponse(result));
    } catch (err) {
      if (err.response?.status === 401) {
        setBookingsError(
          "Your session has expired. Please sign in again."
        );
      } else {
        setBookingsError(
          err.response?.data?.message ||
            "Unable to load bookings. Please try again."
        );
      }
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const result = await getCurrentUser();
        const currentUser = getUserFromResponse(result);

        if (!currentUser) {
          throw new Error("User details were not returned.");
        }

        if (active) {
          setUser(currentUser);
          setName(currentUser.name || "");
          setPhone(currentUser.phone || "");
        }
      } catch (err) {
        if (!active) return;

        if (err.response?.status === 401) {
          navigate("/auth", { replace: true });
        } else {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load your profile. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function startEditing() {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setProfileMessage("");
    setProfileError("");
    setEditing(true);
  }

  function cancelEditing() {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setProfileError("");
    setEditing(false);
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    setProfileError("");
    setProfileMessage("");

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      setProfileError(
        "Name must contain between 2 and 80 characters."
      );
      return;
    }

    if (
      cleanPhone &&
      !/^[+]?[\d\s()-]{7,20}$/.test(cleanPhone)
    ) {
      setProfileError("Please enter a valid phone number.");
      return;
    }

    setSavingProfile(true);

    try {
      const result = await updateProfile({
        name: cleanName,
        phone: cleanPhone,
      });

      const updatedUser = getUserFromResponse(result);

      if (!updatedUser) {
        throw new Error(
          "Updated profile details were not returned by the server."
        );
      }

      setUser((previous) => ({
        ...previous,
        ...updatedUser,
      }));

      setName(updatedUser.name || cleanName);
      setPhone(updatedUser.phone ?? cleanPhone);
      setEditing(false);
      setProfileMessage("Your profile was updated successfully.");
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("auth", { replace: true });
        return;
      }

      setProfileError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    try {
      await logoutUser();

      // Also clear the optional client-side token.
      localStorage.removeItem("vstays_token");

      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Logout failed. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center bg-[#faf8f4] text-[#183c2b]">
          <LoaderCircle
            className="mr-3 animate-spin"
            size={22}
          />
          Loading your profile...
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center bg-[#faf8f4] px-5">
          <div className="max-w-md text-center">
            <UserRound
              className="mx-auto text-[#9b8050]"
              size={40}
            />

            <h1 className="mt-4 text-xl font-semibold text-[#183c2b]">
              Profile unavailable
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {error || "Please sign in to continue."}
            </p>

            <Link
              to="/login"
              className="mt-5 inline-flex rounded-xl bg-[#183c2b] px-5 py-3 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          </div>
        </main>
      </>
    );
  }

  const initial =
    user.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const visibleBookings = bookings.filter(
    (booking) => getBookingCategory(booking) === bookingTab
  );

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#183c2b]">
      <Header />

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-xs font-semibold tracking-[0.25em] text-[#9b8050]">
          YOUR ACCOUNT
        </p>

        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          My Profile
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          Manage your account and hotel reservations.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="min-w-0 rounded-2xl border border-[#e8e3d8] bg-white p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#183c2b] text-3xl font-semibold text-white">
              {initial}
            </div>

            <h2 className="mt-5 break-words text-xl font-semibold">
              {user.name}
            </h2>

            <p
              className="mt-1 w-full min-w-0 break-all text-sm leading-5 text-gray-500"
              title={user.email}
            >
              {user.email}
            </p>

            {user.phone && (
              <p className="mt-3 flex min-w-0 items-start gap-2 text-sm text-gray-600">
                <Phone
                  size={16}
                  className="mt-0.5 shrink-0 text-[#9b8050]"
                />
                <span className="min-w-0 break-words">
                  {user.phone}
                </span>
              </p>
            )}

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#edf4ed] px-3 py-1.5 text-xs font-medium text-[#24513b]">
              <ShieldCheck size={15} />
              Account active
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {loggingOut ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <LogOut size={17} />
              )}
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </aside>

          <div className="min-w-0 space-y-6">
            <section className="min-w-0 rounded-2xl border border-[#e8e3d8] bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Personal information
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    View and update your account details.
                  </p>
                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#dcd8cc] px-4 py-2.5 text-sm font-semibold transition hover:border-[#183c2b] hover:bg-[#faf8f4]"
                  >
                    <Pencil size={15} />
                    Edit profile
                  </button>
                )}
              </div>

              {profileMessage && (
                <p
                  role="status"
                  className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-800"
                >
                  {profileMessage}
                </p>
              )}

              {profileError && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                >
                  {profileError}
                </p>
              )}

              {editing ? (
                <form
                  onSubmit={handleSaveProfile}
                  className="mt-6 space-y-5"
                >
                  <div>
                    <label
                      htmlFor="profileName"
                      className="mb-2 block text-sm font-medium"
                    >
                      Full name
                    </label>
                    <input
                      id="profileName"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      minLength={2}
                      maxLength={80}
                      required
                      className="w-full min-w-0 rounded-xl border border-[#e3e0d7] bg-white px-4 py-3 text-sm outline-none focus:border-[#183c2b] focus:ring-2 focus:ring-[#183c2b]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profileEmail"
                      className="mb-2 block text-sm font-medium"
                    >
                      Email address
                    </label>
                    <div
                      id="profileEmail"
                      className="flex min-w-0 items-start gap-3 rounded-xl bg-[#f5f3ed] px-4 py-3 text-sm text-gray-600"
                    >
                      <Mail size={17} className="mt-0.5 shrink-0" />
                      <span className="min-w-0 flex-1 break-all leading-5">
                        {user.email}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Email cannot be changed from this form.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="profilePhone"
                      className="mb-2 block text-sm font-medium"
                    >
                      Phone number
                    </label>
                    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#e3e0d7] px-4 focus-within:border-[#183c2b] focus-within:ring-2 focus-within:ring-[#183c2b]/10">
                      <Phone size={17} className="shrink-0 text-[#9b8050]" />
                      <input
                        id="profilePhone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        maxLength={20}
                        className="w-full min-w-0 bg-transparent py-3 text-sm outline-none"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Your backend currently validates phone numbers as 10-digit Indian mobile numbers.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#183c2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24513b] disabled:opacity-60"
                    >
                      {savingProfile ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      {savingProfile ? "Saving..." : "Save changes"}
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={savingProfile}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e3e0d7] px-5 py-3 text-sm font-semibold hover:bg-[#faf8f4] disabled:opacity-60"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 space-y-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <UserRound size={19} className="mt-1 shrink-0 text-[#9b8050]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Full name</p>
                      <p className="mt-1 break-words font-medium">{user.name}</p>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-start gap-3">
                    <Mail size={19} className="mt-1 shrink-0 text-[#9b8050]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Email address</p>
                      <p className="mt-1 break-all text-sm font-medium leading-5">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-start gap-3">
                    <Phone size={19} className="mt-1 shrink-0 text-[#9b8050]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Phone number</p>
                      <p className="mt-1 break-words font-medium">
                        {user.phone || "Not added yet"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section
              id="my-bookings"
              className="min-w-0 scroll-mt-24 rounded-2xl border border-[#e8e3d8] bg-white p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-[#9b8050]">
                    YOUR JOURNEYS
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">My Bookings</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your hotel reservations in one place.
                  </p>
                </div>

                <span className="rounded-full bg-[#edf4ed] px-3 py-1.5 text-sm font-semibold text-[#24513b]">
                  {bookings.length} total
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 rounded-xl bg-[#efede6] p-1">
                {["upcoming", "past"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setBookingTab(tab)}
                    className={`rounded-lg px-3 py-3 text-sm font-semibold capitalize transition ${
                      bookingTab === tab
                        ? "bg-white text-[#183c2b] shadow-sm"
                        : "text-gray-500 hover:text-[#183c2b]"
                    }`}
                  >
                    {tab} stays
                  </button>
                ))}
              </div>

              {bookingsLoading ? (
                <div className="flex items-center justify-center gap-3 py-12 text-sm text-gray-500">
                  <LoaderCircle size={20} className="animate-spin" />
                  Loading your bookings...
                </div>
              ) : bookingsError ? (
                <div className="py-8 text-center">
                  <p role="alert" className="text-sm text-red-600">
                    {bookingsError}
                  </p>
                  <button
                    type="button"
                    onClick={loadBookings}
                    className="mt-4 rounded-lg border border-[#e3e0d7] px-4 py-2 text-sm font-medium transition hover:bg-[#faf8f4]"
                  >
                    Try again
                  </button>
                </div>
              ) : visibleBookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#ddd8cc] px-4 py-10 text-center">
                  <CalendarDays className="mx-auto text-[#9b8050]" size={32} />
                  <p className="mt-3 font-semibold">
                    No {bookingTab} stays yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Your reservations will appear here after you book a stay.
                  </p>
                  <Link
                    to="/"
                    className="mt-5 inline-flex rounded-xl bg-[#183c2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24513b]"
                  >
                    Explore hotels
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {visibleBookings.map((booking) => (
                    <article
                      key={booking._id || booking.id}
                      className="overflow-hidden rounded-xl border border-[#e8e3d8]"
                    >
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                        {booking.hotel?.images?.[0] ? (
                          <img
                            src={booking.hotel.images[0]}
                            alt={booking.hotel.name || "Hotel"}
                            className="h-40 w-full rounded-lg object-cover sm:w-36"
                          />
                        ) : (
                          <div className="flex h-40 w-full items-center justify-center rounded-lg bg-[#efede6] sm:w-36">
                            <BedDouble size={32} className="text-[#9b8050]" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="break-words font-semibold">
                              {booking.hotel?.name || "Hotel details unavailable"}
                            </h3>
                            <span className="rounded-full bg-[#f3f0e8] px-3 py-1 text-xs font-medium capitalize">
                              {booking.status || "pending"}
                            </span>
                          </div>

                          <p className="mt-2 flex items-start gap-2 text-sm text-gray-500">
                            <MapPin size={16} className="mt-0.5 shrink-0" />
                            <span className="min-w-0 break-words">
                              {booking.hotel?.city ||
                                booking.hotel?.address ||
                                "Location unavailable"}
                            </span>
                          </p>

                          <p className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                            <CalendarDays size={16} className="shrink-0" />
                            <span>
                              {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
                            </span>
                          </p>

                          <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                            <Users size={16} className="shrink-0" />
                            {booking.guests ?? 1} guests · {booking.rooms || 1} room(s)
                          </p>

                          <p className="mt-4 font-semibold text-[#183c2b]">
                            {formatPrice(booking.totalPrice)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#e8e3d8] bg-white p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Your VELSAKA STAYS</h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("my-bookings")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="flex items-center gap-3 rounded-xl border border-[#e8e3d8] p-4 text-left transition hover:border-[#183c2b]"
                >
                  <CalendarDays size={21} className="shrink-0 text-[#9b8050]" />
                  <div>
                    <p className="text-sm font-semibold">My bookings</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Review your reservations above
                    </p>
                  </div>
                </button>

                <Link
                  to="/favorites"
                  className="flex items-center gap-3 rounded-xl border border-[#e8e3d8] p-4 transition hover:border-[#183c2b]"
                >
                  <Heart size={21} className="shrink-0 text-[#9b8050]" />
                  <div>
                    <p className="text-sm font-semibold">Saved hotels</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Explore your favorites
                    </p>
                  </div>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
