
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Moon,
  ShieldCheck,
  CreditCard,
  LoaderCircle,
  CheckCircle2,
  UserRound,
  Mail,
  Phone,
} from "lucide-react";

import Header from "../components/Header";
import api from "../api/hotelApi";
import { getCurrentUser } from "../api/authApi";

const money = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getProfileFromResponse = (result) =>
  result?.data?.user ??
  result?.data?.data?.user ??
  result?.user ??
  null;

const getErrorMessage = (err, fallback) => {
  const message =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message;

  if (err?.response?.status === 401) {
    return "Your login session is missing or expired. Please log in again, then retry your booking.";
  }

  if (err?.response?.status === 403) {
    return message || "You are not authorized to complete this booking.";
  }

  return message || fallback;
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const scriptUrl =
      "https://checkout.razorpay.com/v1/checkout.js";

    const existingScript = document.querySelector(
      `script[src="${scriptUrl}"]`
    );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(Boolean(window.Razorpay)),
        { once: true }
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

export default function BookingConfirm() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const booking = state?.booking ?? state;

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const hotelName = booking?.hotelName;
  const hotelId = booking?.hotelId;
  const checkIn = booking?.checkIn;
  const checkOut = booking?.checkOut;
  const guests = Number(booking?.guests);
  const nights = Number(booking?.nights);
  const pricePerNight = Number(booking?.pricePerNight);

  const totalAmount = pricePerNight * nights;

  const isValid =
    Boolean(hotelName) &&
    Boolean(hotelId) &&
    Boolean(checkIn) &&
    Boolean(checkOut) &&
    Number.isInteger(guests) &&
    guests >= 1 &&
    Number.isInteger(nights) &&
    nights >= 1 &&
    Number.isFinite(pricePerNight) &&
    pricePerNight > 0 &&
    Number.isFinite(totalAmount) &&
    totalAmount > 0;

  // Load the signed-in user's profile.
  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      try {
        setProfileError("");

        const result = await getCurrentUser();
        const profile = getProfileFromResponse(result);

        if (!profile) {
          throw new Error("Profile details were not returned.");
        }

        if (active) {
          setCustomer({
            name: profile.name || "",
            email: profile.email || "",
            phone: profile.phone || "",
          });
        }
      } catch (err) {
        if (!active) return;

        setProfileError(
          err?.response?.status === 401
            ? "Please log in to load your saved profile. You can enter your details manually, but payment requires a valid login session."
            : "Unable to load your profile. Check your login session or enter your details manually."
        );
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, []);

  const updateCustomer = (event) => {
    const { name, value } = event.target;

    setCustomer((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create an authenticated payment order and open Razorpay.
  const handlePayment = async (event) => {
    event.preventDefault();
    setError("");

    if (!isValid) {
      setError(
        "Booking details are invalid. Please select your hotel and travel dates again."
      );
      return;
    }

    const name = customer.name.trim();
    const email = customer.email.trim();
    const phone = customer.phone.replace(/\D/g, "");

    if (name.length < 2 || name.length > 100) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);

    try {
      // Check that the user still has a valid login session.
      try {
        const profileResponse = await getCurrentUser();
        const profile = getProfileFromResponse(profileResponse);

        if (!profile?.id && !profile?._id) {
          throw new Error("Your login session could not be verified.");
        }
      } catch (authError) {
        if (authError?.response?.status === 401) {
          throw new Error(
            "Please log in again before booking. Your login session is missing or expired."
          );
        }

        throw authError;
      }

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Razorpay could not load. Check your internet connection and try again."
        );
      }

      const orderResponse = await api.post(
        "/payments/create-order",
        {
          hotelId,
          customer: {
            name,
            email,
            phone,
          },
          checkIn,
          checkOut,
          guests,
        },
        {
          withCredentials: true,
        }
      );

      const data = orderResponse.data?.data ?? orderResponse.data;
      const order = data?.order;
      const bookingId = data?.bookingId;
      const keyId = data?.keyId;

      if (!data?.success || !order?.id || !bookingId || !keyId) {
        throw new Error(
          data?.message ||
            "The server did not return the required payment details."
        );
      }

      const razorpay = new window.Razorpay({
        key: keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "VELSAKA STAYS",
        description: `Hotel booking - ${hotelName}`,

        prefill: {
          name,
          email,
          contact: phone,
        },

        notes: {
          bookingId: String(bookingId),
          hotelId: String(hotelId),
        },

        theme: {
          color: "#183c2b",
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },

        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await api.post(
              "/payments/verify",
              {
                bookingId,
                razorpay_order_id:
                  paymentResponse.razorpay_order_id,
                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,
                razorpay_signature:
                  paymentResponse.razorpay_signature,
              },
              {
                withCredentials: true,
              }
            );

            const verificationData =
              verifyResponse.data?.data ?? verifyResponse.data;

            if (!verificationData?.success) {
              throw new Error(
                verificationData?.message ||
                  "Payment verification failed."
              );
            }

            setSuccess({
              bookingId,
              paymentId:
                paymentResponse.razorpay_payment_id,
            });
          } catch (verificationError) {
            setError(
              getErrorMessage(
                verificationError,
                "Unable to verify payment. Keep your payment ID and contact support."
              )
            );
          } finally {
            setLoading(false);
          }
        },
      });

      razorpay.on("payment.failed", (response) => {
        setError(
          response.error?.description ||
            "Payment failed. Please try again."
        );

        setLoading(false);
      });

      razorpay.open();
    } catch (paymentError) {
      setError(
        getErrorMessage(
          paymentError,
          "Unable to start payment. Please try again."
        )
      );

      setLoading(false);
    }
  };

  if (!booking || !isValid) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-5 py-10">
          <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-[#183c2b]">
              No valid booking selected
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Please select a hotel and valid travel dates first.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 rounded-full bg-[#183c2b] px-6 py-3 font-semibold text-white"
            >
              Browse hotels
            </button>
          </section>
        </main>
      </>
    );
  }

  if (success) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-4 py-8">
          <section className="w-full max-w-lg rounded-3xl bg-white p-7 text-center shadow-sm sm:p-9">
            <CheckCircle2
              size={54}
              className="mx-auto text-green-700"
            />

            <h1 className="mt-4 text-3xl font-bold text-[#183c2b]">
              Booking confirmed!
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Your payment has been verified.
            </p>

            <div className="mt-6 space-y-3 rounded-2xl bg-[#f7f5ef] p-4 text-left text-sm">
              <p>
                <span className="font-semibold">Hotel: </span>
                {hotelName}
              </p>
              <p>
                <span className="font-semibold">Booking ID: </span>
                <span className="break-all">{success.bookingId}</span>
              </p>
              <p>
                <span className="font-semibold">Payment ID: </span>
                <span className="break-all">{success.paymentId}</span>
              </p>
              <p>
                <span className="font-semibold">Total: </span>
                {money(totalAmount)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="mt-5 w-full rounded-full border border-[#183c2b] px-5 py-3 font-bold text-[#183c2b]"
            >
              View my bookings
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-3 w-full rounded-full bg-[#183c2b] px-5 py-3 font-bold text-white"
            >
              Continue exploring
            </button>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#faf9f6] px-4 py-5 sm:px-6 sm:py-7">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#183c2b] hover:opacity-70"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-[#9b8158]">
                VELSAKA STAYS
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[#183c2b] sm:text-3xl">
                Confirm your booking
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Review your stay and contact details.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-800">
              <ShieldCheck size={16} />
              Secure checkout
            </div>
          </header>

          <div className="grid items-start gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-gray-900">
                Booking summary
              </h2>

              <div className="mt-4 rounded-xl bg-[#f7f5ef] p-4">
                <div className="flex items-start gap-3">
                  <MapPin
                    size={20}
                    className="mt-1 shrink-0 text-[#9b8158]"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Selected hotel
                    </p>
                    <h3 className="mt-1 break-words text-lg font-bold text-[#183c2b]">
                      {hotelName}
                    </h3>
                    <p className="mt-1 break-all text-xs text-gray-500">
                      Hotel ID: {hotelId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CalendarDays size={15} />
                    Check-in
                  </div>
                  <p className="mt-2 text-sm font-bold">
                    {formatDate(checkIn)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CalendarDays size={15} />
                    Check-out
                  </div>
                  <p className="mt-2 text-sm font-bold">
                    {formatDate(checkOut)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users size={15} />
                    Guests
                  </div>
                  <p className="mt-2 text-sm font-bold">
                    {guests} {guests === 1 ? "guest" : "guests"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Moon size={15} />
                    Duration
                  </div>
                  <p className="mt-2 text-sm font-bold">
                    {nights} {nights === 1 ? "night" : "nights"}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-dashed border-gray-200 pt-4">
                <div className="flex justify-between gap-3 text-sm text-gray-500">
                  <span>
                    {money(pricePerNight)} × {nights}{" "}
                    {nights === 1 ? "night" : "nights"}
                  </span>
                  <span className="font-medium text-gray-800">
                    {money(totalAmount)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="font-bold">Total amount</span>
                  <span className="text-2xl font-bold text-[#183c2b]">
                    {money(totalAmount)}
                  </span>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Final pricing is validated by the server.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Guest details
                </h2>

                {!profileLoading && !profileError && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                    Profile loaded
                  </span>
                )}
              </div>

              {profileLoading && (
                <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <LoaderCircle size={15} className="animate-spin" />
                  Loading profile details...
                </p>
              )}

              {profileError && (
                <p
                  role="status"
                  className="mt-3 rounded-lg bg-amber-50 p-3 text-sm leading-5 text-amber-800"
                >
                  {profileError}
                </p>
              )}

              <form onSubmit={handlePayment} className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="customer-name"
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Full name
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-[#183c2b] focus-within:ring-2 focus-within:ring-[#183c2b]/10">
                    <UserRound size={17} className="shrink-0 text-[#9b8158]" />
                    <input
                      id="customer-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={customer.name}
                      onChange={updateCustomer}
                      required
                      minLength={2}
                      maxLength={100}
                      placeholder="Your full name"
                      className="w-full min-w-0 bg-transparent py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="customer-email"
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Email address
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-[#183c2b] focus-within:ring-2 focus-within:ring-[#183c2b]/10">
                    <Mail size={17} className="shrink-0 text-[#9b8158]" />
                    <input
                      id="customer-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={customer.email}
                      onChange={updateCustomer}
                      required
                      maxLength={254}
                      placeholder="you@example.com"
                      className="w-full min-w-0 bg-transparent py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="customer-phone"
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Mobile number
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-[#183c2b] focus-within:ring-2 focus-within:ring-[#183c2b]/10">
                    <Phone size={17} className="shrink-0 text-[#9b8158]" />
                    <input
                      id="customer-phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={customer.phone}
                      onChange={updateCustomer}
                      required
                      maxLength={20}
                      placeholder="10-digit mobile number"
                      className="w-full min-w-0 bg-transparent py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-700"
                  >
                    {error}
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-xl bg-[#f7f5ef] p-3 text-xs leading-5 text-gray-600">
                  <ShieldCheck
                    size={17}
                    className="mt-0.5 shrink-0 text-[#183c2b]"
                  />
                  <p>
                    Your payment is verified by the server before your booking is confirmed.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || profileLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#183c2b] px-5 py-3.5 font-bold text-white transition hover:bg-[#28543e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <LoaderCircle size={19} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={19} />
                      Pay {money(totalAmount)}
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">
                  Secure checkout powered by Razorpay
                </p>
              </form>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
