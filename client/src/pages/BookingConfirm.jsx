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
  AlertCircle,
} from "lucide-react";

import Header from "../components/Header";
import api from "../api/hotelApi";
import { auth } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";

// ======================================
// HELPERS
// ======================================

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

const getProfileFromResponse = (result) => {
  const responseData = result?.data ?? result;

  return (
    responseData?.user ??
    responseData?.data?.user ??
    responseData?.data ??
    responseData?.profile ??
    null
  );
};

const getErrorMessage = (err, fallback) => {
  const status = err?.response?.status;

  const message =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message;

  if (status === 401) {
    return "Your login session has expired. Please log in again.";
  }

  if (status === 403) {
    return message || "You are not authorized to complete this booking.";
  }

  if (status === 404) {
    return "The requested API endpoint was not found. Check your backend routes.";
  }

  if (!err?.response && err?.request) {
    return "Cannot connect to the server. Check your internet connection and backend.";
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

// ======================================
// BOOKING CONFIRM COMPONENT
// ======================================

export default function BookingConfirm() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const booking = state?.booking ?? state;

  // Firebase + MongoDB authentication context
  const {
    user: authUser,
    loading: authLoading,
    authError,
  } = useAuth();

  // ======================================
  // STATES
  // ======================================

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

  // ======================================
  // BOOKING DATA
  // ======================================

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

  // ======================================
  // FIREBASE TOKEN
  // ======================================

  const getAuthHeaders = async () => {
    // Wait for AuthContext synchronization.
    if (authLoading) {
      throw new Error(
        "Authentication is still loading. Please wait."
      );
    }

    // AuthContext user is the MongoDB profile.
    if (!authUser) {
      throw new Error(
        authError ||
          "Your login session is unavailable. Please log in again."
      );
    }

    // Firebase user provides the actual ID token.
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      throw new Error(
        "Firebase session is unavailable. Please log in again."
      );
    }

    const token = await firebaseUser.getIdToken();

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // ======================================
  // LOAD USER PROFILE
  // ======================================

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      // Wait until Firebase authentication and
      // MongoDB user synchronization are completed.
      if (authLoading) {
        return;
      }

      // User is not authenticated.
      if (!authUser) {
        if (active) {
          setProfileLoading(false);
          setProfileError(
            authError ||
              "Please log in to continue with your booking."
          );
        }

        return;
      }

      try {
        setProfileLoading(true);
        setProfileError("");

        const headers = await getAuthHeaders();

        const response = await api.get("/auth/me", {
          headers,
        });

        console.log(
          "PROFILE API RESPONSE:",
          response.data
        );

        const profile = getProfileFromResponse(response);

        if (!profile) {
          throw new Error(
            "Profile details were not returned by the server."
          );
        }

        if (active) {
          setCustomer({
            name:
              profile.name ||
              profile.displayName ||
              authUser.name ||
              "",

            email:
              profile.email ||
              authUser.email ||
              "",

            phone:
              profile.phone ||
              profile.phoneNumber ||
              authUser.phone ||
              authUser.phoneNumber ||
              "",
          });
        }
      } catch (err) {
        console.error("PROFILE LOADING ERROR:", {
          message: err?.message,
          status: err?.response?.status,
          response: err?.response?.data,
          url: err?.config?.url,
        });

        if (active) {
          setProfileError(
            getErrorMessage(
              err,
              "Unable to load your profile. Enter your details manually."
            )
          );

          // Fallback to MongoDB user data.
          setCustomer((previous) => ({
            name:
              previous.name ||
              authUser.name ||
              "",

            email:
              previous.email ||
              authUser.email ||
              "",

            phone:
              previous.phone ||
              authUser.phone ||
              authUser.phoneNumber ||
              "",
          }));
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, [authUser, authLoading, authError]);

  // ======================================
  // UPDATE CUSTOMER DETAILS
  // ======================================

  const updateCustomer = (event) => {
    const { name, value } = event.target;

    setCustomer((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ======================================
  // HANDLE PAYMENT
  // ======================================

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
      setError(
        "Enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    setLoading(true);

    try {
      // Get a fresh Firebase authentication token.
      const headers = await getAuthHeaders();

      // Load Razorpay checkout script.
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Razorpay could not load. Check your internet connection."
        );
      }

      // ======================================
      // CREATE PAYMENT ORDER
      // ======================================

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
          headers,
        }
      );

      console.log(
        "ORDER RESPONSE:",
        orderResponse.data
      );

      const data =
        orderResponse.data?.data ??
        orderResponse.data;

      const order = data?.order;
      const bookingId = data?.bookingId;
      const keyId = data?.keyId;

      if (
        !data?.success ||
        !order?.id ||
        !bookingId ||
        !keyId
      ) {
        throw new Error(
          data?.message ||
            "The server did not return valid payment details."
        );
      }

      // ======================================
      // RAZORPAY CHECKOUT
      // ======================================

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

        // ======================================
        // PAYMENT SUCCESS CALLBACK
        // ======================================

        handler: async (paymentResponse) => {
          try {
            // Get a fresh token before verification.
            const verifyHeaders =
              await getAuthHeaders();

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
                headers: verifyHeaders,
              }
            );

            console.log(
              "PAYMENT VERIFICATION:",
              verifyResponse.data
            );

            const verificationData =
              verifyResponse.data?.data ??
              verifyResponse.data;

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
            console.error(
              "PAYMENT VERIFICATION ERROR:",
              verificationError
            );

            setError(
              getErrorMessage(
                verificationError,
                "Unable to verify payment. Save your payment ID and contact support."
              )
            );
          } finally {
            setLoading(false);
          }
        },
      });

      // ======================================
      // PAYMENT FAILED
      // ======================================

      razorpay.on("payment.failed", (response) => {
        console.error(
          "RAZORPAY PAYMENT FAILED:",
          response.error
        );

        setError(
          response.error?.description ||
            "Payment failed. Please try again."
        );

        setLoading(false);
      });

      razorpay.open();
    } catch (paymentError) {
      console.error(
        "PAYMENT ERROR:",
        paymentError
      );

      setError(
        getErrorMessage(
          paymentError,
          "Unable to start payment. Please try again."
        )
      );

      setLoading(false);
    }
  };

  // ======================================
  // INVALID BOOKING
  // ======================================

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

  // ======================================
  // PAYMENT SUCCESS
  // ======================================

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
              Your payment has been verified successfully.
            </p>

            <div className="mt-6 space-y-3 rounded-2xl bg-[#f7f5ef] p-4 text-left text-sm">
              <p>
                <strong>Hotel:</strong> {hotelName}
              </p>

              <p>
                <strong>Booking ID:</strong>{" "}
                <span className="break-all">
                  {success.bookingId}
                </span>
              </p>

              <p>
                <strong>Payment ID:</strong>{" "}
                <span className="break-all">
                  {success.paymentId}
                </span>
              </p>

              <p>
                <strong>Total:</strong>{" "}
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

  // ======================================
  // MAIN CHECKOUT PAGE
  // ======================================

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#faf9f6] px-4 py-5 sm:px-6 sm:py-7">
        <div className="mx-auto max-w-6xl">

          {/* BACK BUTTON */}

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#183c2b] hover:opacity-70"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          {/* PAGE HEADER */}

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

            {/* ======================================
                BOOKING SUMMARY
            ====================================== */}

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

              {/* PRICE DETAILS */}

              <div className="mt-5 border-t border-dashed border-gray-200 pt-4">
                <div className="flex justify-between gap-3 text-sm text-gray-500">
                  <span>
                    {money(pricePerNight)} × {nights} nights
                  </span>

                  <span className="font-medium text-gray-800">
                    {money(totalAmount)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="font-bold">
                    Total amount
                  </span>

                  <span className="text-2xl font-bold text-[#183c2b]">
                    {money(totalAmount)}
                  </span>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Final pricing is validated by the server.
                </p>
              </div>
            </section>

            {/* ======================================
                GUEST DETAILS
            ====================================== */}

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

              {/* PROFILE LOADING */}

              {profileLoading && (
                <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <LoaderCircle
                    size={15}
                    className="animate-spin"
                  />
                  Loading profile details...
                </p>
              )}

              {/* PROFILE ERROR */}

              {profileError && (
                <div
                  role="status"
                  className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm leading-5 text-amber-800"
                >
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{profileError}</span>
                </div>
              )}

              {/* CUSTOMER FORM */}

              <form
                onSubmit={handlePayment}
                className="mt-4 space-y-4"
              >

                {/* NAME */}

                <div>
                  <label
                    htmlFor="customer-name"
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Full name
                  </label>

                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-[#183c2b] focus-within:ring-2 focus-within:ring-[#183c2b]/10">
                    <UserRound
                      size={17}
                      className="shrink-0 text-[#9b8158]"
                    />

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

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="customer-email"
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Email address
                  </label>

                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-[#183c2b] focus-within:ring-2 focus-within:ring-[#183c2b]/10">
                    <Mail
                      size={17}
                      className="shrink-0 text-[#9b8158]"
                    />

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

                {/* PHONE */}

                <div>
                  <label
                    htmlFor="customer-phone"
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Mobile number
                  </label>

                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 focus-within:border-[#183c2b] focus-within:ring-2 focus-within:ring-[#183c2b]/10">
                    <Phone
                      size={17}
                      className="shrink-0 text-[#9b8158]"
                    />

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

                {/* PAYMENT ERROR */}

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-700"
                  >
                    {error}
                  </div>
                )}

                {/* SECURITY MESSAGE */}

                <div className="flex items-start gap-2 rounded-xl bg-[#f7f5ef] p-3 text-xs leading-5 text-gray-600">
                  <ShieldCheck
                    size={17}
                    className="mt-0.5 shrink-0 text-[#183c2b]"
                  />

                  <p>
                    Your payment is verified by the server before your booking is confirmed.
                  </p>
                </div>

                {/* PAY BUTTON */}

                <button
                  type="submit"
                  disabled={loading || profileLoading || authLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#183c2b] px-5 py-3.5 font-bold text-white transition hover:bg-[#28543e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <LoaderCircle
                        size={19}
                        className="animate-spin"
                      />
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