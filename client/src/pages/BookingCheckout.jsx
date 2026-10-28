
import { useState } from "react";
import { CalendarDays, ShieldCheck, Users } from "lucide-react";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

function getToday() {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return localDate.toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[data-razorpay-checkout="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () =>
        resolve(Boolean(window.Razorpay))
      );
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

async function requestJson(url, options) {
  const response = await fetch(url, options);

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}.`
    );
  }

  return data;
}

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);

export default function BookingCheckout({ hotel }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState("");

  const nights =
    checkIn && checkOut
      ? Math.round(
          (Date.parse(`${checkOut}T00:00:00Z`) -
            Date.parse(`${checkIn}T00:00:00Z`)) /
            86_400_000
        )
      : 0;

  const pricePerNight = Number(hotel?.pricePerNight || 0);

  const estimatedTotal =
    nights > 0 && Number.isFinite(pricePerNight)
      ? nights * pricePerNight
      : 0;

  function updateCustomer(event) {
    const { name, value } = event.target;

    setCustomer((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleBooking(event) {
    event.preventDefault();

    if (loading) return;

    setMessage("");

    if (!hotel?._id) {
      setMessage("Hotel information is missing. Please refresh the page.");
      return;
    }

    if (
      !checkIn ||
      !checkOut ||
      nights < 1 ||
      checkIn < getToday()
    ) {
      setMessage(
        "Choose a valid check-in date and a check-out date at least one day later."
      );
      return;
    }

    if (
      !customer.name.trim() ||
      !customer.email.trim() ||
      !customer.phone.trim()
    ) {
      setMessage("Please complete all guest details.");
      return;
    }

    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          "Unable to load Razorpay Checkout. Check your internet connection and try again."
        );
      }

      // The backend calculates the amount from the stored hotel price.
      const orderData = await requestJson(
        `${API_BASE_URL}/payments/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hotelId: hotel._id,
            checkIn,
            checkOut,
            guests: Number(guests),
            customer: {
              name: customer.name.trim(),
              email: customer.email.trim(),
              phone: customer.phone.trim(),
            },
          }),
        }
      );

      if (
        !orderData.keyId ||
        !orderData.orderId ||
        !orderData.bookingId ||
        !orderData.amount
      ) {
        throw new Error(
          "The server returned incomplete payment details."
        );
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "VELSAKA STAYS",
        description: `Booking at ${orderData.hotelName || hotel.name}`,
        order_id: orderData.orderId,

        prefill: {
          name: customer.name.trim(),
          email: customer.email.trim(),
          contact: customer.phone.trim(),
        },

        notes: {
          bookingId: String(orderData.bookingId),
        },

        theme: {
          color: "#183c2b",
        },

        handler: async (paymentResponse) => {
          setMessage("Verifying payment securely...");

          try {
            const verification = await requestJson(
              `${API_BASE_URL}/payments/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  bookingId: orderData.bookingId,
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,
                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,
                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            if (!verification.success) {
              throw new Error(
                verification.message ||
                  "Payment could not be verified."
              );
            }

            setBookingId(String(verification.bookingId));
            setConfirmed(true);
            setMessage("Your payment has been verified.");
          } catch (error) {
            setMessage(
              `${error.message || "Payment verification failed."} Do not pay again until you check the payment and booking status.`
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            setMessage(
              "Checkout was closed. If you completed a payment, check its status before trying again."
            );
          },
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (response) => {
        setLoading(false);
        setMessage(
          response.error?.description ||
            "Payment failed. Please check the payment status before retrying."
        );
      });

      checkout.open();
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to start checkout. Please try again."
      );
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <section className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-green-100 text-green-700">
          <ShieldCheck size={25} />
        </div>

        <h2 className="mt-4 text-xl font-semibold text-[#183c2b]">
          Booking confirmed
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Your payment has been verified successfully.
        </p>

        <div className="mt-4 rounded-xl bg-[#faf9f6] p-4">
          <p className="text-xs text-gray-500">Booking ID</p>
          <p className="mt-1 break-all font-semibold text-[#183c2b]">
            {bookingId}
          </p>
          <p className="mt-3 text-xs text-gray-500">
            Save this ID for future reference.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9b8158]">
          Secure reservation
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-[#183c2b]">
          Book your stay
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {hotel?.name || "Selected hotel"}
        </p>
      </div>

      <form onSubmit={handleBooking} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            <span className="mb-2 flex items-center gap-2">
              <CalendarDays size={16} />
              Check-in
            </span>

            <input
              type="date"
              required
              min={getToday()}
              value={checkIn}
              onChange={(event) => {
                const value = event.target.value;

                setCheckIn(value);

                if (checkOut && value >= checkOut) {
                  setCheckOut("");
                }
              }}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-[#183c2b]"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            <span className="mb-2 flex items-center gap-2">
              <CalendarDays size={16} />
              Check-out
            </span>

            <input
              type="date"
              required
              min={checkIn ? addDays(checkIn, 1) : addDays(getToday(), 1)}
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-[#183c2b]"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          <span className="mb-2 flex items-center gap-2">
            <Users size={16} />
            Number of guests
          </span>

          <select
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 outline-none focus:border-[#183c2b]"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </label>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-semibold text-gray-800">
            Guest details
          </h3>

          <div className="mt-3 space-y-3">
            <input
              name="name"
              value={customer.name}
              onChange={updateCustomer}
              placeholder="Full name"
              autoComplete="name"
              maxLength={100}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#183c2b]"
            />

            <input
              name="email"
              type="email"
              value={customer.email}
              onChange={updateCustomer}
              placeholder="Email address"
              autoComplete="email"
              maxLength={254}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#183c2b]"
            />

            <input
              name="phone"
              type="tel"
              value={customer.phone}
              onChange={updateCustomer}
              placeholder="Phone number"
              autoComplete="tel"
              maxLength={20}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#183c2b]"
            />
          </div>
        </div>

        <div className="rounded-xl bg-[#faf9f6] p-4">
          <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
            <span>Price per night</span>
            <span>{formatPrice(pricePerNight)}</span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-sm text-gray-600">
            <span>Number of nights</span>
            <span>{nights > 0 ? nights : "—"}</span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-200 pt-3">
            <span className="font-semibold text-gray-800">
              Estimated total
            </span>
            <span className="text-xl font-bold text-[#183c2b]">
              {formatPrice(estimatedTotal)}
            </span>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            The backend recalculates the final amount before creating
            the payment order.
          </p>
        </div>

        {message && (
          <p
            role="status"
            aria-live="polite"
            className="break-words rounded-xl bg-[#f5f5f0] p-3 text-sm text-gray-700"
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !hotel?._id}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#183c2b] px-5 py-3.5 font-semibold text-white transition hover:bg-[#28543e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShieldCheck size={18} />
          {loading
            ? "Processing..."
            : "Continue to secure payment"}
        </button>

        <p className="text-center text-xs leading-5 text-gray-500">
          Payments are processed securely by Razorpay. A booking is
          confirmed only after successful server-side verification.
        </p>
      </form>
    </section>
  );
}
