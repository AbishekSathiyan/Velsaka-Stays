
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  Wifi,
  Waves,
  Utensils,
  SlidersHorizontal,
  ArrowRight,
  Heart,
  ShieldCheck,
  Coffee,
  Car,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  BedDouble,
  ChevronDown,
  Gem,
  Compass,
  Flower2,
  CalendarDays,
} from "lucide-react";

import { getHotels, getNearbyHotels } from "../api/hotelApi";
import Header from "../components/Header";
import Footer from "../components/Footer";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=2200&q=90";

const CTA_IMAGE =
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=85";

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const formatPrice = (price) => {
  const amount = Number(price);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const amenityIcons = {
  "Free Wi-Fi": Wifi,
  "Swimming Pool": Waves,
  Restaurant: Utensils,
  Parking: Car,
  "Air Conditioning": Sparkles,
  "Breakfast Included": Coffee,
};

function extractHotels(response) {
  const candidates = [
    response?.data?.data,
    response?.data?.hotels,
    response?.data,
    response?.hotels,
    response,
  ];

  const result = candidates.find(Array.isArray);

  if (!result) {
    throw new Error(
      "Unexpected hotels API response. Check your backend response format."
    );
  }

  return result;
}

function getErrorMessage(error) {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error;

  if (status === 400) {
    return message || "Invalid search parameters. Please try again.";
  }

  if (status === 404) {
    return "Hotels API route not found. Check your backend route and API URL.";
  }

  if (status === 500) {
    return (
      message ||
      "Server error. Check your backend and database connection."
    );
  }

  if (status === 401 || status === 403) {
    return (
      message ||
      "You do not have permission to access the hotels API."
    );
  }

  if (error?.code === "ERR_NETWORK" || !error?.response) {
    return `Cannot connect to ${API_BASE_URL}. Check your backend, API URL, and CORS settings.`;
  }

  return message || error?.message || "Unable to load hotels.";
}

function getHotelId(hotel) {
  return hotel?._id || hotel?.id;
}

function getHotelImage(hotel) {
  const image = hotel?.images?.[0];

  return typeof image === "string" && image.trim()
    ? image
    : FALLBACK_IMAGE;
}

function HotelSkeleton() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-[#e9e4da] bg-white">
      <div className="h-64 animate-pulse bg-[#eae7e0] sm:h-72" />
      <div className="space-y-4 p-6">
        <div className="h-6 w-3/4 animate-pulse rounded-lg bg-[#eae7e0]" />
        <div className="h-4 w-1/2 animate-pulse rounded-lg bg-[#eae7e0]" />
        <div className="h-10 animate-pulse rounded-xl bg-[#eae7e0]" />
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    >
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#96764a] sm:text-xs">
          <span className="h-px w-7 bg-[#b89a6b]" />
          {eyebrow}
        </p>

        <h2 className="mt-4 font-serif text-3xl font-medium leading-tight tracking-tight text-[#183c2b] sm:text-4xl lg:text-5xl">
          {title}
        </h2>

        {description && (
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#77776e] sm:text-base">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState({ hasHotels, nearbyMode, onReset, onRetry }) {
  const title = nearbyMode
    ? "No stays found nearby"
    : hasHotels
      ? "No stays match your search"
      : "Your next stay awaits";

  const description = nearbyMode
    ? "Try a larger search radius or return to the full collection to discover more stays."
    : hasHotels
      ? "Try a different destination or adjust your price range to discover more stays."
      : "We couldn't find any hotel listings. Check your connection and try again.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full rounded-[28px] border border-dashed border-[#d9d1c1] bg-white px-6 py-16 text-center"
    >
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f5efe3] text-[#96764a]">
        <Search size={27} strokeWidth={1.5} />
      </div>

      <h3 className="mt-6 font-serif text-2xl text-[#183c2b]">
        {title}
      </h3>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#77776e]">
        {description}
      </p>

      <button
        type="button"
        onClick={hasHotels || nearbyMode ? onReset : onRetry}
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#183c2b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#28543e]"
      >
        <RefreshCw size={15} />
        {hasHotels || nearbyMode ? "Reset search" : "Reload collection"}
      </button>
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [locationNotice, setLocationNotice] = useState("");
  const [nearbyHotels, setNearbyHotels] = useState([]);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState("10");

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("velsaka-favorites") || "[]"
      );

      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const loadHotels = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await getHotels({
        limit: 100,
        signal,
      });

      const hotelList = extractHotels(response);

      if (!signal?.aborted) {
        setHotels(hotelList);
      }
    } catch (err) {
      if (
        err?.code === "ERR_CANCELED" ||
        err?.name === "CanceledError" ||
        err?.name === "AbortError"
      ) {
        return;
      }

      if (signal?.aborted) return;

      console.error("Failed to load hotels:", {
        message: err?.message,
        status: err?.response?.status,
        response: err?.response?.data,
        apiBaseURL: API_BASE_URL,
      });

      setError(getErrorMessage(err));
      setHotels([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadHotels(controller.signal);

    return () => controller.abort();
  }, [loadHotels, retryKey]);

  const filteredHotels = useMemo(() => {
    const sourceHotels = nearbyMode ? nearbyHotels : hotels;

    return sourceHotels.filter((hotel) => {
      const matchesCity = String(hotel.city || "")
        .toLowerCase()
        .includes(city.trim().toLowerCase());

      const price = Number(hotel.pricePerNight);
      const matchesMin = minPrice === "" || price >= Number(minPrice);
      const matchesMax = maxPrice === "" || price <= Number(maxPrice);

      return matchesCity && matchesMin && matchesMax;
    });
  }, [hotels, nearbyHotels, nearbyMode, city, minPrice, maxPrice]);

  const featuredHotels = useMemo(() => {
    return [...filteredHotels]
      .sort(
        (a, b) =>
          Number(b.starRating || 0) - Number(a.starRating || 0)
      )
      .slice(0, 3);
  }, [filteredHotels]);

  const destinationCount = useMemo(
    () => new Set(hotels.map((hotel) => hotel.city).filter(Boolean)).size,
    [hotels]
  );

  function toggleFavorite(id) {
    if (id == null) return;

    setFavorites((current) => {
      const exists = current.some(
        (item) => String(item) === String(id)
      );

      const next = exists
        ? current.filter((item) => String(item) !== String(id))
        : [...current, id];

      try {
        localStorage.setItem(
          "velsaka-favorites",
          JSON.stringify(next)
        );
      } catch {
        // Favorites remain available for this session.
      }

      return next;
    });
  }

  function clearFilters() {
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setLocationNotice("");
    setNearbyMode(false);
    setNearbyHotels([]);
    setNearbyRadius("10");
  }

  function scrollToCollection() {
    document.getElementById("discover")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });

    setMobileSearchOpen(false);
  }

  function showAllStays() {
    setNearbyMode(false);
    setNearbyHotels([]);
    setLocationNotice("");
  }

  function searchNearby() {
    setLocationNotice("");

    if (!navigator.geolocation) {
      setLocationNotice(
        "Your browser does not support location access. Enter a destination instead."
      );
      return;
    }

    setNearbyLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await getNearbyHotels({
            lat: latitude,
            lng: longitude,
            radiusKm: Number(nearbyRadius),
            limit: 50,
          });

          const results = response?.data?.data;

          if (!Array.isArray(results)) {
            throw new Error(
              "Unexpected nearby hotels API response. Check your backend response format."
            );
          }

          setNearbyHotels(results);
          setNearbyMode(true);

          setLocationNotice(
            results.length > 0
              ? `Found ${results.length} ${
                  results.length === 1 ? "stay" : "stays"
                } within ${nearbyRadius} km of your location.`
              : `No stays found within ${nearbyRadius} km. Try a larger search radius.`
          );

          requestAnimationFrame(() => {
            document.getElementById("discover")?.scrollIntoView({
              behavior: reduceMotion ? "auto" : "smooth",
              block: "start",
            });
          });
        } catch (err) {
          console.error("Nearby hotel search failed:", {
            message: err?.message,
            status: err?.response?.status,
            response: err?.response?.data,
          });

          setNearbyMode(false);
          setNearbyHotels([]);
          setLocationNotice(
            `${getErrorMessage(err)} Check that the nearby hotels backend route is configured.`
          );
        } finally {
          setNearbyLoading(false);
        }
      },
      (geoError) => {
        setNearbyLoading(false);

        if (geoError.code === 1) {
          setLocationNotice(
            "Location permission was declined. Allow location access in your browser settings to find nearby stays."
          );
        } else if (geoError.code === 2) {
          setLocationNotice(
            "Your location is unavailable. Check your device location settings and try again."
          );
        } else if (geoError.code === 3) {
          setLocationNotice(
            "The location request timed out. Please try again."
          );
        } else {
          setLocationNotice(
            "Unable to retrieve your location. Please try again."
          );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  }

  const motionProps = reduceMotion
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, amount: 0.12 },
        variants: stagger,
      };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#faf9f6] font-sans text-[#202a23] selection:bg-[#d8bd8b]/40">
      <Header />

      <main>
        {/* HERO */}
        <section className="relative isolate min-h-[650px] overflow-hidden bg-[#10291d] sm:min-h-[720px] lg:min-h-[760px]">
          <motion.div
            initial={reduceMotion ? false : { scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="absolute inset-0 -z-30"
          >
            <img
              src={HERO_IMAGE}
              alt="Beautiful luxury hotel interior"
              fetchPriority="high"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
              className="h-full w-full object-cover"
            />
          </motion.div>

          <div className="absolute inset-0 -z-20 bg-[#10291d]/45" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#10291d]/95 via-[#10291d]/75 to-[#10291d]/20" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-[#10291d]/70 to-transparent" />

          <div className="mx-auto flex min-h-[650px] max-w-7xl flex-col justify-center px-5 pb-20 pt-20 sm:min-h-[720px] sm:pb-24 lg:min-h-[760px] lg:px-8">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-md sm:text-xs">
                <Gem size={15} className="text-[#e0c79b]" />
                Thoughtfully chosen stays
              </div>

              <h1 className="mt-8 font-serif text-5xl font-medium leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-8xl">
                Travel well.
                <br />
                <span className="italic text-[#e0c79b]">
                  Stay beautifully.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-sm leading-8 text-white/75 sm:text-lg">
                Extraordinary journeys begin with the right place. Discover
                considered stays, memorable destinations, and spaces made for
                slowing down.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <motion.button
                  type="button"
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  onClick={scrollToCollection}
                  className="group inline-flex items-center gap-3 rounded-full bg-[#d8bd8b] px-6 py-4 text-sm font-semibold text-[#183c2b] shadow-lg shadow-black/10 transition hover:bg-white sm:px-7"
                >
                  Explore our collection
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </motion.button>

                <div className="flex items-center gap-2 px-1 text-xs font-medium text-white/80 sm:text-sm">
                  <ShieldCheck size={17} className="text-[#e0c79b]" />
                  A more thoughtful way to stay
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-16 grid max-w-2xl grid-cols-3 border-t border-white/20 pt-6 sm:mt-20"
            >
              <div className="pr-3 sm:pr-6">
                <p className="font-serif text-2xl text-white sm:text-4xl">
                  {loading ? "—" : hotels.length}
                </p>
                <p className="mt-2 text-[10px] leading-5 text-white/60 sm:text-xs">
                  Places to discover
                </p>
              </div>

              <div className="border-l border-white/20 px-4 sm:px-6">
                <p className="font-serif text-2xl text-white sm:text-4xl">
                  {loading ? "—" : destinationCount}
                </p>
                <p className="mt-2 text-[10px] leading-5 text-white/60 sm:text-xs">
                  Destinations
                </p>
              </div>

              <div className="border-l border-white/20 pl-4 sm:pl-6">
                <p className="font-serif text-2xl text-white sm:text-4xl">
                  {favorites.length}
                </p>
                <p className="mt-2 text-[10px] leading-5 text-white/60 sm:text-xs">
                  Your saved stays
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            animate={reduceMotion ? {} : { y: [0, 6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-7 right-6 hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 lg:flex"
          >
            Scroll to explore
            <div className="grid h-9 w-9 place-items-center rounded-full border border-white/25">
              <ChevronDown size={16} />
            </div>
          </motion.div>
        </section>

        {/* SEARCH PANEL */}
        <section className="relative z-10 mx-auto max-w-7xl px-5 pt-12 sm:pt-16 lg:px-8 lg:pt-20">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-[28px] border border-[#e9e3d8] bg-white shadow-[0_20px_70px_-30px_rgba(24,60,43,0.2)]"
          >
            <div className="relative overflow-hidden bg-[#183c2b] px-5 py-7 sm:px-8 sm:py-9">
              <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border border-white/10" />
              <div className="absolute -right-5 -top-12 h-40 w-40 rounded-full border border-white/10" />

              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#e0c79b]">
                    Your next journey
                  </p>

                  <h2 className="mt-3 font-serif text-2xl text-white sm:text-3xl">
                    Find your next escape
                  </h2>

                  <p className="mt-2 text-sm text-white/65">
                    Explore stays that suit your journey.
                  </p>
                </div>

                <motion.div
                  animate={
                    reduceMotion ? {} : { y: [0, -5, 0], rotate: [0, 4, 0] }
                  }
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[#e0c79b] sm:grid"
                >
                  <Compass size={27} strokeWidth={1.4} />
                </motion.div>

                <button
                  type="button"
                  onClick={() => setMobileSearchOpen((value) => !value)}
                  aria-expanded={mobileSearchOpen}
                  aria-label="Toggle search filters"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20 text-white sm:hidden"
                >
                  <SlidersHorizontal size={18} />
                </button>
              </div>
            </div>

            <div
              className={`p-5 sm:p-8 ${
                mobileSearchOpen ? "block" : "hidden sm:block"
              }`}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#ede9e0] bg-[#faf9f6] px-4 py-4 transition focus-within:border-[#b89a6b] focus-within:bg-white">
                  <MapPin size={21} className="shrink-0 text-[#96764a]" />

                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#77776e]">
                      Destination
                    </span>

                    <input
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") scrollToCollection();
                      }}
                      placeholder="Enter city name"
                      className="mt-2 w-full bg-transparent text-sm font-medium text-[#183c2b] outline-none placeholder:font-normal placeholder:text-[#a09b90]"
                    />
                  </span>
                </label>

                <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#ede9e0] bg-[#faf9f6] px-4 py-4 transition focus-within:border-[#b89a6b] focus-within:bg-white">
                  <Search size={20} className="shrink-0 text-[#96764a]" />

                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#77776e]">
                      Minimum price
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(event) => setMinPrice(event.target.value)}
                      placeholder="₹ 0"
                      className="mt-2 w-full bg-transparent text-sm font-medium text-[#183c2b] outline-none placeholder:font-normal placeholder:text-[#a09b90]"
                    />
                  </span>
                </label>

                <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#ede9e0] bg-[#faf9f6] px-4 py-4 transition focus-within:border-[#b89a6b] focus-within:bg-white sm:col-span-2 lg:col-span-1">
                  <SlidersHorizontal
                    size={20}
                    className="shrink-0 text-[#96764a]"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#77776e]">
                      Maximum price
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(event) => setMaxPrice(event.target.value)}
                      placeholder="No limit"
                      className="mt-2 w-full bg-transparent text-sm font-medium text-[#183c2b] outline-none placeholder:font-normal placeholder:text-[#a09b90]"
                    />
                  </span>
                </label>
              </div>

              {locationNotice && (
                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  className="mt-4 rounded-xl bg-[#f6f4ef] px-4 py-3 text-xs leading-6 text-[#68685e]"
                >
                  {locationNotice}
                </motion.p>
              )}

              <div className="mt-5 flex flex-col gap-4 border-t border-[#eeeae2] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs leading-5 text-[#858176]">
                  <ShieldCheck size={16} className="shrink-0 text-[#67806a]" />
                  Discover stays and compare nightly prices.
                </p>

                <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
                  <label className="flex items-center justify-between gap-3 rounded-full border border-[#dcd5c7] px-4 py-3">
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#183c2b]">
                      <MapPin size={16} className="text-[#96764a]" />
                      Radius
                    </span>

                    <select
                      value={nearbyRadius}
                      onChange={(event) => setNearbyRadius(event.target.value)}
                      disabled={nearbyLoading}
                      aria-label="Nearby search radius"
                      className="bg-transparent text-sm font-medium text-[#183c2b] outline-none disabled:opacity-60"
                    >
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="25">25 km</option>
                      <option value="50">50 km</option>
                    </select>
                  </label>

                  <motion.button
                    type="button"
                    whileHover={
                      reduceMotion || nearbyLoading ? undefined : { y: -2 }
                    }
                    whileTap={
                      reduceMotion || nearbyLoading
                        ? undefined
                        : { scale: 0.97 }
                    }
                    onClick={searchNearby}
                    disabled={nearbyLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dcd5c7] px-5 py-3.5 text-sm font-semibold text-[#183c2b] transition hover:border-[#183c2b] hover:bg-[#f6f4ef] disabled:cursor-wait disabled:opacity-60"
                  >
                    {nearbyLoading ? (
                      <RefreshCw size={17} className="animate-spin" />
                    ) : (
                      <MapPin size={17} />
                    )}

                    {nearbyLoading ? "Finding stays..." : "Search Nearby"}
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    onClick={scrollToCollection}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#183c2b] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#28543e]"
                  >
                    Update Search
                    <ArrowRight size={17} />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* HOTEL COLLECTION */}
        <section
          id="discover"
          className="mx-auto max-w-7xl scroll-mt-12 px-5 pb-20 pt-24 lg:px-8 lg:pb-28 lg:pt-32"
        >
          <motion.div {...motionProps}>
            <SectionHeading
              eyebrow="The Velsaka collection"
              title={
                <>
                  Places that stay
                  <br className="hidden sm:block" /> with you.
                </>
              }
              description="From peaceful retreats to memorable city stays, discover a place that makes every part of your journey feel special."
            />

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#e6e0d5] pb-5">
              <p className="text-sm text-[#77776e]">
                {loading
                  ? "Discovering available stays..."
                  : nearbyMode
                    ? `${filteredHotels.length} nearby ${
                        filteredHotels.length === 1 ? "stay" : "stays"
                      } within ${nearbyRadius} km`
                    : `${filteredHotels.length} ${
                        filteredHotels.length === 1 ? "stay" : "stays"
                      } to explore`}
              </p>

              <p className="flex items-center gap-2 text-xs text-[#77776e]">
                <SlidersHorizontal size={15} />
                Refine your search above
              </p>
            </div>

            {nearbyMode && !loading && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e9e3d8] bg-white p-4">
                <p className="text-sm text-[#68685e]">
                  Showing stays near your current location.
                </p>

                <button
                  type="button"
                  onClick={showAllStays}
                  className="inline-flex items-center gap-2 rounded-full bg-[#183c2b] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#28543e]"
                >
                  Show all stays
                  <ArrowRight size={15} />
                </button>
              </div>
            )}

            {loading && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <HotelSkeleton key={item} />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="mt-8 rounded-[24px] border border-red-200 bg-white p-7 sm:p-10">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
                    <RefreshCw size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-2xl text-[#183c2b]">
                      We couldn't load the collection
                    </h3>

                    <p className="mt-3 break-words text-sm leading-7 text-[#77776e]">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={() => setRetryKey((current) => current + 1)}
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#183c2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#28543e]"
                    >
                      <RefreshCw size={15} />
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && filteredHotels.length === 0 && (
              <div className="mt-8">
                <EmptyState
                  hasHotels={hotels.length > 0}
                  nearbyMode={nearbyMode}
                  onReset={clearFilters}
                  onRetry={() => setRetryKey((current) => current + 1)}
                />
              </div>
            )}

            {!loading && !error && filteredHotels.length > 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredHotels.map((hotel, index) => {
                  const id = getHotelId(hotel);

                  const isFavorite =
                    id != null &&
                    favorites.some((item) => String(item) === String(id));

                  const amenities = Array.isArray(hotel.amenities)
                    ? hotel.amenities
                    : [];

                  const rating = Number(hotel.starRating);
                  const displayRating =
                    Number.isFinite(rating) && rating > 0 ? rating : 3;

                  const distanceMeters = Number(hotel.distanceMeters);

                  return (
                    <motion.article
                      key={id ?? `${hotel.name}-${index}`}
                      variants={fadeUp}
                      transition={{
                        duration: reduceMotion ? 0 : 0.55,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={reduceMotion ? undefined : { y: -7 }}
                      className="group min-w-0 overflow-hidden rounded-[26px] border border-[#e9e4da] bg-white transition-shadow duration-500 hover:shadow-[0_24px_60px_-25px_rgba(24,60,43,0.24)]"
                    >
                      <div className="relative h-64 overflow-hidden bg-[#eae7e0] sm:h-72">
                        <motion.img
                          src={getHotelImage(hotel)}
                          alt={hotel.name || "Hotel accommodation"}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = FALLBACK_IMAGE;
                          }}
                          initial={reduceMotion ? false : { scale: 1.08 }}
                          whileInView={
                            reduceMotion ? undefined : { scale: 1 }
                          }
                          viewport={{ once: true, amount: 0.15 }}
                          className={`h-full w-full object-cover ${
                            reduceMotion
                              ? ""
                              : "transition-transform duration-700 group-hover:scale-105"
                          }`}
                        />

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/95 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#183c2b]">
                            <Gem size={13} className="text-[#96764a]" />
                            {displayRating} star stay
                          </span>

                          {index === 0 && (
                            <span className="rounded-full bg-[#d8bd8b] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#183c2b]">
                              {nearbyMode ? "Nearest match" : "Featured"}
                            </span>
                          )}
                        </div>

                        <motion.button
                          type="button"
                          whileTap={reduceMotion ? undefined : { scale: 0.88 }}
                          onClick={() => toggleFavorite(id)}
                          disabled={id == null}
                          aria-pressed={isFavorite}
                          aria-label={
                            isFavorite
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/60 bg-white/95 text-[#183c2b] shadow-sm transition hover:bg-white disabled:cursor-not-allowed"
                        >
                          <Heart
                            size={19}
                            className={
                              isFavorite
                                ? "fill-rose-500 text-rose-500"
                                : ""
                            }
                          />
                        </motion.button>

                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                          <div className="flex min-w-0 items-center gap-2 text-sm font-medium drop-shadow">
                            <MapPin size={15} className="shrink-0" />
                            <span className="truncate">
                              {hotel.city || "Discover this destination"}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-[#183c2b]">
                            <Star
                              size={13}
                              className="fill-[#b89a6b] text-[#b89a6b]"
                            />
                            {displayRating.toFixed(1)}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6">
                        <h3 className="line-clamp-1 font-serif text-2xl font-medium text-[#183c2b] transition-colors group-hover:text-[#96764a]">
                          {hotel.name || "Unnamed stay"}
                        </h3>

                        {nearbyMode &&
                          Number.isFinite(distanceMeters) &&
                          distanceMeters >= 0 && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#96764a]">
                              <MapPin size={13} />
                              {(distanceMeters / 1000).toFixed(1)} km away
                            </p>
                          )}

                        <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-[#858176]">
                          {hotel.description ||
                            "Discover this property and explore the amenities available for your stay."}
                        </p>

                        <div className="mt-5 flex min-h-8 flex-wrap gap-2">
                          {amenities.slice(0, 3).map((amenity, amenityIndex) => {
                            const Icon = amenityIcons[amenity] || Coffee;

                            return (
                              <span
                                key={`${amenity}-${amenityIndex}`}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#f6f4ef] px-3 py-2 text-[10px] font-medium text-[#68685e]"
                              >
                                <Icon
                                  size={13}
                                  className="text-[#96764a]"
                                />
                                {amenity}
                              </span>
                            );
                          })}

                          {amenities.length === 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f6f4ef] px-3 py-2 text-[10px] font-medium text-[#68685e]">
                              <BedDouble size={13} />
                              Comfortable accommodation
                            </span>
                          )}
                        </div>

                        <div className="mt-6 flex items-end justify-between gap-3 border-t border-[#eeeae2] pt-5">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#858176]">
                              Starting from
                            </p>

                            <p className="mt-2 font-serif text-xl font-semibold text-[#183c2b] sm:text-2xl">
                              {formatPrice(hotel.pricePerNight)}
                            </p>

                            <p className="mt-1 text-[11px] text-[#858176]">
                              Per night
                            </p>
                          </div>

                          <motion.button
                            type="button"
                            whileHover={reduceMotion ? undefined : { y: -2 }}
                            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                            onClick={() => {
                              if (id != null) navigate(`/hotels/${id}`);
                            }}
                            disabled={id == null}
                            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#183c2b] px-4 py-3.5 text-xs font-semibold text-white transition hover:bg-[#28543e] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
                          >
                            View stay
                            <ArrowUpRight size={15} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* FEATURED STAY */}
        {!loading && !error && featuredHotels.length > 0 && (
          <section className="border-y border-[#e8e2d7] bg-[#f1eee6]">
            <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: -25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.75 }}
                className="relative"
              >
                <div className="overflow-hidden rounded-[28px]">
                  <motion.img
                    src={getHotelImage(featuredHotels[0])}
                    alt={featuredHotels[0].name || "Featured accommodation"}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    initial={reduceMotion ? false : { scale: 1.06 }}
                    whileInView={reduceMotion ? undefined : { scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="h-[350px] w-full object-cover sm:h-[480px]"
                  />
                </div>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25, duration: 0.5 }}
                  className="absolute -bottom-5 right-4 max-w-[270px] rounded-2xl border border-[#e9e3d8] bg-white p-5 shadow-xl sm:-right-5 sm:p-6"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#96764a]">
                    Worth discovering
                  </p>

                  <p className="mt-3 font-serif text-xl text-[#183c2b]">
                    {featuredHotels[0].name}
                  </p>

                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[#858176]">
                    <MapPin size={13} />
                    {featuredHotels[0].city || "Explore this destination"}
                  </p>
                </motion.div>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: 25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.75, delay: 0.1 }}
                className="pt-6 lg:pt-0"
              >
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#96764a] sm:text-xs">
                  <span className="h-px w-7 bg-[#b89a6b]" />
                  A little more extraordinary
                </p>

                <h2 className="mt-5 font-serif text-4xl font-medium leading-tight text-[#183c2b] sm:text-5xl">
                  Your next favourite place is closer than you think.
                </h2>

                <p className="mt-6 text-sm leading-8 text-[#77776e] sm:text-base">
                  The right stay is more than somewhere to sleep. It is the
                  quiet morning, the welcoming space, and the memories you
                  take home. Explore our collection to find a place that fits
                  the way you want to travel.
                </p>

                <div className="mt-7 space-y-4">
                  {[
                    {
                      icon: ShieldCheck,
                      title: "Explore with confidence",
                      description:
                        "Review property details before deciding where to stay.",
                    },
                    {
                      icon: Sparkles,
                      title: "Find your kind of comfort",
                      description:
                        "Compare amenities and nightly prices in one place.",
                    },
                    {
                      icon: Compass,
                      title: "Discover somewhere new",
                      description:
                        "Search destinations and find your next getaway.",
                    },
                  ].map(({ icon: Icon, title, description }) => (
                    <div key={title} className="flex gap-4">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#96764a]">
                        <Icon size={19} strokeWidth={1.6} />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-[#183c2b]">
                          {title}
                        </h3>
                        <p className="mt-1 text-xs leading-6 text-[#858176]">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={scrollToCollection}
                  className="group mt-8 inline-flex items-center gap-3 border-b border-[#183c2b] pb-2 text-sm font-semibold text-[#183c2b]"
                >
                  Explore the collection
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </motion.div>
            </div>
          </section>
        )}

        {/* WHY VELSAKA */}
        <section
          id="benefits"
          className="bg-white px-5 py-20 sm:py-24 lg:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <motion.div {...motionProps}>
              <div className="mx-auto max-w-2xl text-center">
                <p className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#96764a] sm:text-xs">
                  <span className="h-px w-7 bg-[#b89a6b]" />
                  The Velsaka difference
                  <span className="h-px w-7 bg-[#b89a6b]" />
                </p>

                <h2 className="mt-5 font-serif text-3xl font-medium tracking-tight text-[#183c2b] sm:text-5xl">
                  Thoughtful stays. Better journeys.
                </h2>

                <p className="mt-5 text-sm leading-7 text-[#858176] sm:text-base">
                  Everything you need to explore your options and make a more
                  confident choice for your next journey.
                </p>
              </div>

              <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    number: "01",
                    icon: MapPin,
                    title: "Discover destinations",
                    description:
                      "Explore accommodation across destinations and find a place that suits your plans.",
                  },
                  {
                    number: "02",
                    icon: Gem,
                    title: "Compare your options",
                    description:
                      "Review prices, amenities, property descriptions, and ratings before making a choice.",
                  },
                  {
                    number: "03",
                    icon: CalendarDays,
                    title: "Plan your next stay",
                    description:
                      "Explore property details and continue to the relevant stay page.",
                  },
                ].map(({ number, icon: Icon, title, description }) => (
                  <motion.article
                    key={number}
                    variants={fadeUp}
                    whileHover={reduceMotion ? undefined : { y: -5 }}
                    className="rounded-[24px] border border-[#ebe6dc] bg-[#faf9f6] p-7 transition-shadow hover:shadow-lg sm:p-8"
                  >
                    <div className="flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#183c2b] text-[#e0c79b]">
                        <Icon size={22} strokeWidth={1.6} />
                      </div>

                      <span className="font-serif text-2xl text-[#d5c7ae]">
                        {number}
                      </span>
                    </div>

                    <h3 className="mt-7 font-serif text-2xl text-[#183c2b]">
                      {title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[#858176]">
                      {description}
                    </p>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative isolate overflow-hidden bg-[#183c2b]">
          <motion.div
            initial={reduceMotion ? false : { scale: 1.05 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.3 }}
            className="absolute inset-0 -z-20"
          >
            <img
              src={CTA_IMAGE}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
              className="h-full w-full object-cover"
            />
          </motion.div>

          <div className="absolute inset-0 -z-10 bg-[#10291d]/85" />

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-4xl px-5 py-20 text-center sm:py-24 lg:py-28"
          >
            <motion.div
              animate={reduceMotion ? {} : { y: [0, -5, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-white/10 text-[#e0c79b] backdrop-blur"
            >
              <Flower2 size={25} strokeWidth={1.5} />
            </motion.div>

            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.3em] text-[#e0c79b] sm:text-xs">
              Every journey deserves a beautiful beginning
            </p>

            <h2 className="mt-5 font-serif text-4xl font-medium leading-tight text-white sm:text-6xl">
              Somewhere wonderful
              <br />
              is waiting for you.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
              Explore the collection and find the place that feels right for
              your next escape.
            </p>

            <motion.button
              type="button"
              whileHover={reduceMotion ? undefined : { y: -3 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              onClick={scrollToCollection}
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#d8bd8b] px-7 py-4 text-sm font-semibold text-[#183c2b] transition hover:bg-white"
            >
              Find your next stay
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </motion.button>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
