
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Star,
  Wifi,
  Waves,
  Utensils,
  Car,
  ShieldCheck,
  CalendarDays,
  Users,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { getHotelById } from "../api/hotelApi";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=85";

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

function getTodayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Handles responses such as:
 * { _id: "...", name: "Hotel", pricePerNight: 2500 }
 * { data: { _id: "...", name: "Hotel" } }
 * { data: { success: true, data: { ...hotel } } }
 * { hotel: { ...hotel } }
 */
function unwrapHotelResponse(response) {
  let current = response;

  for (let i = 0; i < 5; i += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return null;
    }

    // A hotel document should have an identifier.
    if (current._id || current.id) {
      return current;
    }

    if (current.success === false) {
      throw new Error(current.message || "Unable to load hotel details.");
    }

    if (current.hotel && typeof current.hotel === "object") {
      current = current.hotel;
      continue;
    }

    if (current.data && typeof current.data === "object") {
      current = current.data;
      continue;
    }

    return null;
  }

  return null;
}

function normalizeHotel(response) {
  const hotel = unwrapHotelResponse(response);

  if (!hotel) {
    console.error("Unexpected hotel API response:", response);
    throw new Error(
      "The server response does not contain a valid hotel. Check the hotel API response."
    );
  }

  const rawPrice =
    hotel.pricePerNight ??
    hotel.price ??
    hotel.pricePerNightAmount;

  const parsedPrice =
    rawPrice !== null &&
    rawPrice !== undefined &&
    String(rawPrice).trim() !== ""
      ? Number(rawPrice)
      : NaN;

  const pricePerNight =
    Number.isFinite(parsedPrice) && parsedPrice > 0
      ? parsedPrice
      : null;

  let images = [];

  if (Array.isArray(hotel.images)) {
    images = hotel.images
      .map((image) => {
        if (typeof image === "string") return image;
        if (image && typeof image.url === "string") return image.url;
        return "";
      })
      .filter(Boolean);
  } else if (typeof hotel.images === "string") {
    images = [hotel.images];
  }

  if (images.length === 0) {
    const singleImage =
      hotel.imageUrl || hotel.image || hotel.coverImage;

    if (typeof singleImage === "string" && singleImage.trim()) {
      images = [singleImage];
    }
  }

  const amenities = Array.isArray(hotel.amenities)
    ? hotel.amenities
        .map((amenity) => {
          if (typeof amenity === "string") return amenity;
          if (amenity && typeof amenity.name === "string") {
            return amenity.name;
          }
          return "";
        })
        .filter(Boolean)
    : [];

  return {
    ...hotel,
    _id: String(hotel._id || hotel.id),
    name: hotel.name || hotel.hotelName || "Hotel",
    city: hotel.city || hotel.location?.city || "",
    address:
      hotel.address ||
      hotel.location?.address ||
      "",
    description: hotel.description || "",
    pricePerNight,
    starRating: Number(hotel.starRating || hotel.rating) || 3,
    images,
    amenities,
  };
}

function getNights(checkIn, checkOut) {
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return 0;
  }

  const [startYear, startMonth, startDay] = checkIn
    .split("-")
    .map(Number);

  const [endYear, endMonth, endDay] = checkOut
    .split("-")
    .map(Number);

  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);

  return Math.max(0, Math.round((end - start) / 86400000));
}

function getAmenityIcon(amenity) {
  const value = String(amenity).toLowerCase();

  if (value.includes("wifi") || value.includes("wi-fi")) return Wifi;
  if (value.includes("pool")) return Waves;
  if (value.includes("restaurant") || value.includes("food")) {
    return Utensils;
  }
  if (value.includes("parking")) return Car;

  return CheckCircle2;
}

export default function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const today = useMemo(() => getTodayString(), []);

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [notice, setNotice] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadHotel() {
      setLoading(true);
      setError("");
      setHotel(null);
      setNotice("");

      try {
        if (!id) {
          throw new Error("Hotel ID is missing from the URL.");
        }

        const response = await getHotelById(id);
        const hotelData = normalizeHotel(response);

        if (!active) return;

        setHotel(hotelData);

        if (!hotelData.pricePerNight) {
          setNotice(
            "The hotel loaded, but its nightly price is missing or invalid."
          );
        }
      } catch (err) {
        console.error("Failed to load hotel:", err);

        if (!active) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load hotel details. Please try again."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHotel();

    return () => {
      active = false;
    };
  }, [id, retryCount]);

  const nights = useMemo(
    () => getNights(checkIn, checkOut),
    [checkIn, checkOut]
  );

  const pricePerNight = hotel?.pricePerNight;

  const validPrice =
    typeof pricePerNight === "number" &&
    Number.isFinite(pricePerNight) &&
    pricePerNight > 0;

  const total = validPrice && nights > 0
    ? pricePerNight * nights
    : 0;

  function continueBooking(event) {
    event.preventDefault();
    setNotice("");

    if (!hotel?._id) {
      setNotice("Hotel details are incomplete. Please reload the page.");
      return;
    }

    if (!validPrice) {
      setNotice("This hotel does not have a valid nightly price.");
      return;
    }

    if (!checkIn || !checkOut) {
      setNotice("Please select your check-in and check-out dates.");
      return;
    }

    if (checkIn < today) {
      setNotice("Check-in cannot be in the past.");
      return;
    }

    if (checkOut <= checkIn || nights < 1) {
      setNotice("Check-out must be at least one day after check-in.");
      return;
    }

    const booking = {
      hotelId: hotel._id,
      hotelName: hotel.name,
      checkIn,
      checkOut,
      guests: Number(guests),
      nights,
      pricePerNight,
      totalAmount: total,
    };

    navigate("/booking/confirm", {
      state: { booking },
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf9f6] px-5 py-12">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-8 w-40 rounded-lg bg-gray-200" />
          <div className="mt-6 h-72 rounded-3xl bg-gray-200 sm:h-96" />
          <div className="mt-6 h-8 w-2/3 rounded-lg bg-gray-200" />
          <div className="mt-4 h-4 w-1/3 rounded bg-gray-200" />
        </div>
        <div className="mt-8 flex justify-center gap-2 text-sm text-gray-500">
          <LoaderCircle className="animate-spin" size={18} />
          Loading hotel details...
        </div>
      </main>
    );
  }

  if (error || !hotel) {
    return (
      <main className="min-h-screen bg-[#faf9f6] px-5 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#183c2b] hover:underline"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            Unable to load hotel
          </h1>

          <p className="mt-3 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">
            {error || "This hotel could not be found."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="inline-flex items-center gap-2 rounded-full bg-[#183c2b] px-5 py-3 font-semibold text-white hover:bg-[#28543e]"
            >
              <RefreshCw size={17} />
              Try again
            </button>

            <button
              type="button"
              onClick={() => navigate("/hotels")}
              className="rounded-full border border-gray-200 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Browse hotels
            </button>
          </div>
        </div>
      </main>
    );
  }

  const amenities = hotel.amenities;

  return (
    <main className="min-h-screen bg-[#faf9f6]">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#183c2b] hover:underline"
        >
          <ArrowLeft size={18} />
          Back to stays
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-3xl bg-white">
              <img
                src={hotel.images[0] || FALLBACK_IMAGE}
                alt={hotel.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
                className="h-[280px] w-full object-cover sm:h-[440px]"
              />
            </div>

            <section className="mt-7">
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1 rounded-full bg-[#f3eee3] px-3 py-1.5 font-semibold text-[#80653d]">
                  <Star size={15} className="fill-current" />
                  {hotel.starRating} star stay
                </span>

                {hotel.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {hotel.city}
                  </span>
                )}
              </div>

              <h1 className="mt-4 break-words text-3xl font-semibold text-gray-900 sm:text-4xl">
                {hotel.name}
              </h1>

              {hotel.address && (
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {hotel.address}
                </p>
              )}

              {hotel.description && (
                <p className="mt-5 max-w-3xl whitespace-pre-line leading-7 text-gray-600">
                  {hotel.description}
                </p>
              )}
            </section>

            <section className="mt-9 rounded-2xl border border-black/5 bg-white p-6">
              <h2 className="text-xl font-semibold text-gray-900">
                What this stay offers
              </h2>

              {amenities.length > 0 ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {amenities.map((amenity, index) => {
                    const Icon = getAmenityIcon(amenity);

                    return (
                      <div
                        key={`${amenity}-${index}`}
                        className="flex items-center gap-3 text-gray-600"
                      >
                        <Icon
                          size={19}
                          className="shrink-0 text-[#9b8158]"
                        />
                        <span>{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  Hotel amenities have not been added yet.
                </p>
              )}
            </section>

            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#eaf1eb] p-5 text-sm leading-6 text-[#183c2b]">
              <ShieldCheck className="mt-0.5 shrink-0" size={21} />
              <p>
                <strong>Secure booking:</strong> Review your dates and
                estimated price before continuing. The backend must verify
                availability and calculate the final payment amount.
              </p>
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-black/5 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <p className="text-sm text-gray-500">Price per night</p>

            <p className="mt-1 text-3xl font-bold text-[#183c2b]">
              {validPrice ? money(pricePerNight) : "Price unavailable"}
            </p>

            <form onSubmit={continueBooking} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="checkIn"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold"
                >
                  <CalendarDays size={17} />
                  Check-in
                </label>

                <input
                  id="checkIn"
                  type="date"
                  required
                  min={today}
                  value={checkIn}
                  onChange={(event) => {
                    const value = event.target.value;

                    setCheckIn(value);

                    if (checkOut && checkOut <= value) {
                      setCheckOut("");
                    }

                    setNotice("");
                  }}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#183c2b]"
                />
              </div>

              <div>
                <label
                  htmlFor="checkOut"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold"
                >
                  <CalendarDays size={17} />
                  Check-out
                </label>

                <input
                  id="checkOut"
                  type="date"
                  required
                  min={checkIn ? addDays(checkIn, 1) : addDays(today, 1)}
                  value={checkOut}
                  onChange={(event) => {
                    setCheckOut(event.target.value);
                    setNotice("");
                  }}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#183c2b]"
                />
              </div>

              <div>
                <label
                  htmlFor="guests"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold"
                >
                  <Users size={17} />
                  Guests
                </label>

                <select
                  id="guests"
                  value={guests}
                  onChange={(event) => setGuests(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#183c2b]"
                >
                  {[1, 2, 3, 4, 5, 6].map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </select>
              </div>

              {nights > 0 && validPrice && (
                <div className="space-y-3 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex justify-between gap-3 text-gray-600">
                    <span>
                      {money(pricePerNight)} × {nights}{" "}
                      {nights === 1 ? "night" : "nights"}
                    </span>
                    <span>{money(total)}</span>
                  </div>

                  <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900">
                    <span>Estimated total</span>
                    <span>{money(total)}</span>
                  </div>

                  <p className="text-xs leading-5 text-gray-400">
                    Taxes and final charges may not be included. The server
                    must calculate the final booking amount.
                  </p>
                </div>
              )}

              {notice && (
                <p
                  role="alert"
                  className="rounded-lg bg-amber-50 p-3 text-sm leading-5 text-amber-800"
                >
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={!validPrice}
                className="w-full rounded-full bg-[#183c2b] px-5 py-3.5 font-semibold text-white transition hover:bg-[#28543e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue to booking
              </button>

              <p className="text-center text-xs leading-5 text-gray-400">
                No payment is taken on this page.
              </p>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}
