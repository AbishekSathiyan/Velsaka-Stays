
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
  X,
  LocateFixed,
} from "lucide-react";

import { getHotels, getNearbyHotels } from "../api/hotelApi";
import Header from "../components/Header";
import Footer from "../components/Footer";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=2000";

const CTA_IMAGE =
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600";

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const formatPrice = (price) =>
  Number(price || 0).toLocaleString("en-IN");

const getHotelId = (hotel) => hotel?._id || hotel?.id;

const getHotelImage = (hotel) => {
  const image = hotel?.images?.[0];

  if (typeof image === "string" && image.trim()) {
    return image;
  }

  if (typeof image === "object" && image?.url) {
    return image.url;
  }

  return FALLBACK_IMAGE;
};

const getErrorMessage = (error) => {
  const status = error?.response?.status;

  if (status === 400) return "Invalid request. Please check your search.";
  if (status === 401) return "Please sign in to continue.";
  if (status === 403) return "You don't have permission to access this.";
  if (status === 404) return "The requested resource was not found.";
  if (status >= 500) return "Server error. Please try again shortly.";

  if (error?.code === "ERR_NETWORK") {
    return "Unable to connect to the server. Please check your internet connection.";
  }

  return error?.message || "Something went wrong. Please try again.";
};

const amenityIcons = {
  "free wi-fi": Wifi,
  wifi: Wifi,
  "free wifi": Wifi,
  "swimming pool": Waves,
  restaurant: Utensils,
  parking: Car,
  "air conditioning": Sparkles,
  breakfast: Coffee,
};

function HotelSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
      <div className="h-60 animate-pulse bg-stone-200" />
      <div className="space-y-4 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-stone-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-stone-200" />
        <div className="h-8 w-full animate-pulse rounded bg-stone-100" />
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, centered = false }) {
  return (
    <div className={centered ? "mx-auto mb-12 max-w-2xl text-center" : "mb-10 max-w-2xl"}>
      <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-emerald-800">
        <span className="h-px w-7 bg-amber-600" />
        {eyebrow}
      </div>

      <h2 className="font-serif text-3xl font-medium leading-tight text-stone-900 sm:text-4xl lg:text-5xl">
        {title}
      </h2>

      {description && (
        <p className="mt-4 text-sm leading-7 text-stone-500 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="col-span-full rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
        <BedDouble size={28} />
      </div>

      <h3 className="font-serif text-2xl text-stone-900">
        No stays found
      </h3>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
        We couldn't find hotels matching your current filters. Try another
        destination or adjust your price range.
      </p>

      <button
        onClick={onReset}
        className="mt-7 rounded-full bg-emerald-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        Clear filters
      </button>
    </div>
  );
}

function HotelCard({ hotel, onOpen, isFavorite, onFavorite }) {
  const amenities = Array.isArray(hotel.amenities)
    ? hotel.amenities.slice(0, 3)
    : [];

  return (
    <motion.article
      variants={fadeUp}
      className="group overflow-hidden rounded-3xl border border-stone-200/80 bg-white transition duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/10"
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={getHotelImage(hotel)}
          alt={hotel.name || "Hotel"}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow">
          {hotel.starRating || 4} <Star size={12} className="ml-1 inline fill-amber-500 text-amber-500" />
        </div>

        <button
          type="button"
          onClick={() => onFavorite(getHotelId(hotel))}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-stone-700 shadow transition hover:scale-110"
        >
          <Heart
            size={18}
            className={isFavorite ? "fill-rose-500 text-rose-500" : ""}
          />
        </button>

        <div className="absolute bottom-4 left-4 text-white">
          <p className="flex items-center gap-1 text-xs font-medium text-white/90">
            <MapPin size={13} />
            {hotel.city || "India"}
          </p>
        </div>
      </div>

      <div className="p-5">
        <h3 className="line-clamp-1 font-serif text-xl font-semibold text-stone-900">
          {hotel.name || "Premium Stay"}
        </h3>

        <p className="mt-2 line-clamp-1 text-sm text-stone-500">
          {hotel.address || hotel.city || "Comfortable accommodation"}
        </p>

        <div className="mt-5 flex min-h-7 flex-wrap gap-2">
          {amenities.map((amenity) => {
            const Icon =
              amenityIcons[String(amenity).toLowerCase()] || Sparkles;

            return (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600"
              >
                <Icon size={12} />
                {amenity}
              </span>
            );
          })}
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-stone-100 pt-5">
          <div>
            <p className="text-xs text-stone-400">Starting from</p>
            <p className="mt-1 text-xl font-bold text-emerald-900">
              ₹{formatPrice(hotel.pricePerNight)}
              <span className="text-xs font-normal text-stone-400"> / night</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpen(hotel)}
            className="flex items-center gap-2 rounded-full bg-emerald-900 px-5 py-3 text-xs font-semibold text-white transition hover:bg-emerald-800"
          >
            View stay
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  // Hotel data
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // Search filters
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Nearby hotels
  const [nearbyHotels, setNearbyHotels] = useState([]);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState("25");
  const [locationNotice, setLocationNotice] = useState("");

  // Favorites
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("velsaka-favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Load hotels
  const loadHotels = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const hotelsData = await getHotels();

      if (!Array.isArray(hotelsData)) {
        throw new Error("Invalid hotels data received from server.");
      }

      setHotels(hotelsData);
    } catch (error) {
      console.error("Failed to load hotels:", {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });

      setError(getErrorMessage(error));
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHotels();
  }, [loadHotels, retryKey]);

  // Save favorites
  useEffect(() => {
    try {
      localStorage.setItem("velsaka-favorites", JSON.stringify(favorites));
    } catch (error) {
      console.error("Unable to save favorites:", error);
    }
  }, [favorites]);

  // Toggle favorite
  const toggleFavorite = useCallback((hotelId) => {
    if (!hotelId) return;

    setFavorites((previous) =>
      previous.includes(hotelId)
        ? previous.filter((id) => id !== hotelId)
        : [...previous, hotelId]
    );
  }, []);

  // Filter hotels
  const sourceHotels = nearbyMode ? nearbyHotels : hotels;

  const filteredHotels = useMemo(() => {
    return sourceHotels.filter((hotel) => {
      const matchesCity = String(hotel.city || "")
        .toLowerCase()
        .includes(city.trim().toLowerCase());

      const price = Number(hotel.pricePerNight || 0);

      const matchesMin =
        minPrice === "" || price >= Number(minPrice);

      const matchesMax =
        maxPrice === "" || price <= Number(maxPrice);

      return matchesCity && matchesMin && matchesMax;
    });
  }, [sourceHotels, city, minPrice, maxPrice]);

  const featuredHotels = useMemo(() => {
    return [...hotels]
      .sort(
        (a, b) =>
          Number(b.starRating || 0) - Number(a.starRating || 0)
      )
      .slice(0, 3);
  }, [hotels]);

  const destinationCount = useMemo(() => {
    return new Set(hotels.map((hotel) => hotel.city).filter(Boolean)).size;
  }, [hotels]);

  const favoriteHotels = useMemo(() => {
    return hotels.filter((hotel) =>
      favorites.includes(getHotelId(hotel))
    );
  }, [hotels, favorites]);

  // Navigation
  const openHotel = (hotel) => {
    const id = getHotelId(hotel);

    if (id) {
      navigate(`/hotels/${id}`);
    }
  };

  const showAllStays = () => {
    setNearbyMode(false);
    setCity("");
    setMinPrice("");
    setMaxPrice("");

    document.getElementById("collection")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const clearFilters = () => {
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setNearbyMode(false);
    setLocationNotice("");
  };

  const scrollToCollection = () => {
    document.getElementById("collection")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // Nearby hotel search
  const searchNearby = () => {
    if (!navigator.geolocation) {
      setLocationNotice("Location services are not supported by your browser.");
      return;
    }

    setNearbyLoading(true);
    setLocationNotice("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const results = await getNearbyHotels({
            lat: latitude,
            lng: longitude,
            radiusKm: Number(nearbyRadius),
            limit: 50,
          });

          if (!Array.isArray(results)) {
            throw new Error("Invalid nearby hotels response.");
          }

          setNearbyHotels(results);
          setNearbyMode(true);
          setLocationNotice(
            results.length
              ? `${results.length} nearby stays found.`
              : "No hotels found nearby. Try increasing the search radius."
          );

          scrollToCollection();
        } catch (error) {
          console.error("Nearby hotel search failed:", error);
          setLocationNotice(getErrorMessage(error));
        } finally {
          setNearbyLoading(false);
        }
      },
      (error) => {
        const messages = {
          1: "Location permission denied. Please allow location access in your browser.",
          2: "Your current location could not be determined.",
          3: "Location request timed out. Please try again.",
        };

        setLocationNotice(
          messages[error.code] || "Unable to access your location."
        );

        setNearbyLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 300000,
      }
    );
  };

  const motionProps = reduceMotion
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, amount: 0.15 },
        variants: stagger,
      };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900">
      <Header />

      {/* HERO SECTION */}
      <section className="relative flex min-h-[680px] items-center overflow-hidden bg-stone-900 sm:min-h-[740px]">
        <img
          src={HERO_IMAGE}
          alt="Luxury hotel resort"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-28 sm:px-8 lg:px-12">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium tracking-wider text-white backdrop-blur-md">
              <Gem size={14} className="text-amber-300" />
              DISCOVER YOUR NEXT ESCAPE
            </div>

            <h1 className="font-serif text-5xl font-medium leading-[1.1] text-white sm:text-6xl lg:text-7xl">
              Find your place
              <br />
              <span className="italic text-amber-200">
                away from home.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-sm leading-7 text-white/80 sm:text-base sm:leading-8">
              Discover thoughtfully selected stays, beautiful destinations,
              and memorable experiences with VELSAKA STAYS.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <button
                onClick={scrollToCollection}
                className="inline-flex items-center gap-3 rounded-full bg-amber-200 px-7 py-4 text-sm font-bold text-stone-900 transition hover:bg-amber-100"
              >
                Explore stays
                <ArrowRight size={17} />
              </button>

              <button
                onClick={searchNearby}
                disabled={nearbyLoading}
                className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-60"
              >
                <LocateFixed size={17} />
                {nearbyLoading ? "Finding stays..." : "Explore nearby"}
              </button>
            </div>

            <div className="mt-12 flex flex-wrap gap-8 border-t border-white/20 pt-7">
              <div>
                <p className="font-serif text-3xl text-white">
                  {hotels.length}+
                </p>
                <p className="mt-1 text-xs text-white/60">Available stays</p>
              </div>

              <div>
                <p className="font-serif text-3xl text-white">
                  {destinationCount}+
                </p>
                <p className="mt-1 text-xs text-white/60">Destinations</p>
              </div>

              <div>
                <p className="font-serif text-3xl text-white">24/7</p>
                <p className="mt-1 text-xs text-white/60">Booking access</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 right-0 hidden h-36 w-36 items-center justify-center rounded-tl-full bg-amber-200 text-emerald-950 md:flex">
          <div className="text-center">
            <Flower2 className="mx-auto mb-1" size={28} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Stay
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Inspired
            </p>
          </div>
        </div>
      </section>

      {/* SEARCH PANEL */}
      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
                Find your stay
              </p>
              <h2 className="mt-1 font-serif text-2xl text-stone-900">
                Where would you like to go?
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setMobileSearchOpen((value) => !value)}
              className="rounded-full bg-stone-100 p-3 text-stone-700 sm:hidden"
              aria-label="Toggle search filters"
            >
              {mobileSearchOpen ? <X size={18} /> : <SlidersHorizontal size={18} />}
            </button>
          </div>

          <div
            className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto] ${
              mobileSearchOpen ? "" : "hidden sm:grid"
            }`}
          >
            <div className="rounded-2xl border border-stone-200 px-4 py-3">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-stone-500">
                <MapPin size={14} className="text-emerald-800" />
                Destination
              </label>

              <input
                type="text"
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  setNearbyMode(false);
                }}
                placeholder="Search city..."
                className="w-full bg-transparent text-sm font-medium text-stone-900 outline-none placeholder:font-normal placeholder:text-stone-400"
              />
            </div>

            <div className="rounded-2xl border border-stone-200 px-4 py-3">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-stone-500">
                <SlidersHorizontal size={14} className="text-emerald-800" />
                Minimum price
              </label>

              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="₹ Minimum"
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-stone-400"
              />
            </div>

            <div className="rounded-2xl border border-stone-200 px-4 py-3">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-stone-500">
                <SlidersHorizontal size={14} className="text-emerald-800" />
                Maximum price
              </label>

              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="₹ Maximum"
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-stone-400"
              />
            </div>

            <button
              onClick={scrollToCollection}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-7 py-4 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              <Search size={17} />
              Search stays
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Compass size={15} className="text-emerald-800" />
              Discover hotels across your favourite destinations.
            </div>

            <div className="flex items-center gap-3">
              <select
                value={nearbyRadius}
                onChange={(event) => setNearbyRadius(event.target.value)}
                className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600 outline-none"
                aria-label="Nearby search radius"
              >
                <option value="10">10 km radius</option>
                <option value="25">25 km radius</option>
                <option value="50">50 km radius</option>
                <option value="100">100 km radius</option>
              </select>

              <button
                onClick={searchNearby}
                disabled={nearbyLoading}
                className="flex items-center gap-2 text-xs font-bold text-emerald-900 hover:text-emerald-700 disabled:opacity-50"
              >
                <LocateFixed size={15} />
                {nearbyLoading ? "Searching..." : "Near me"}
              </button>
            </div>
          </div>

          {locationNotice && (
            <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
              {locationNotice}
            </p>
          )}
        </div>
      </section>

      {/* HOTEL COLLECTION */}
      <section id="collection" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="Curated collection"
              title="Stays worth discovering."
              description="Explore comfortable and memorable stays selected for your next journey."
            />

            <button
              onClick={showAllStays}
              className="mb-10 flex items-center gap-2 self-start text-sm font-bold text-emerald-900 transition hover:gap-3 sm:self-auto"
            >
              View all stays
              <ArrowRight size={16} />
            </button>
          </div>

          {nearbyMode && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-900">
                Showing nearby hotels
              </p>

              <button
                onClick={() => {
                  setNearbyMode(false);
                  setLocationNotice("");
                }}
                className="text-xs font-bold text-emerald-900 underline"
              >
                Show all hotels
              </button>
            </div>
          )}

          {error && (
            <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-red-800">
                  Unable to load hotels
                </p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>

              <button
                onClick={() => setRetryKey((value) => value + 1)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-700 px-5 py-3 text-xs font-bold text-white hover:bg-red-800"
              >
                <RefreshCw size={14} />
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-500">
                Showing{" "}
                <span className="font-bold text-stone-900">
                  {filteredHotels.length}
                </span>{" "}
                properties
              </p>

              {(city || minPrice || maxPrice || nearbyMode) && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-emerald-900 underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          <motion.div
            {...motionProps}
            className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3"
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <HotelSkeleton key={index} />
              ))
            ) : filteredHotels.length > 0 ? (
              filteredHotels.map((hotel) => {
                const hotelId = getHotelId(hotel);

                return (
                  <HotelCard
                    key={hotelId}
                    hotel={hotel}
                    onOpen={openHotel}
                    isFavorite={favorites.includes(hotelId)}
                    onFavorite={toggleFavorite}
                  />
                );
              })
            ) : !error ? (
              <EmptyState onReset={clearFilters} />
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* FEATURED SECTION */}
      <section className="bg-[#f0eee7] py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="Handpicked for you"
            title="A little more extraordinary."
            description="Discover some of our highest-rated properties for a memorable experience."
          />

          <div className="grid gap-6 md:grid-cols-3">
            {featuredHotels.map((hotel) => (
              <motion.button
                key={getHotelId(hotel)}
                type="button"
                onClick={() => openHotel(hotel)}
                whileHover={reduceMotion ? {} : { y: -7 }}
                className="group relative h-[380px] overflow-hidden rounded-3xl text-left"
              >
                <img
                  src={getHotelImage(hotel)}
                  alt={hotel.name || "Featured hotel"}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="mb-3 flex items-center gap-1 text-amber-300">
                    {Array.from({
                      length: Math.min(
                        5,
                        Math.max(1, Number(hotel.starRating || 4))
                      ),
                    }).map((_, index) => (
                      <Star
                        key={index}
                        size={13}
                        className="fill-current"
                      />
                    ))}
                  </div>

                  <p className="text-xs text-white/70">
                    {hotel.city || "India"}
                  </p>

                  <h3 className="mt-1 font-serif text-2xl">
                    {hotel.name}
                  </h3>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      ₹{formatPrice(hotel.pricePerNight)}{" "}
                      <span className="font-normal text-white/70">
                        / night
                      </span>
                    </p>

                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-900 transition group-hover:bg-amber-200">
                      <ArrowUpRight size={18} />
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* WHY VELSAKA */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeading
                eyebrow="The VELSAKA difference"
                title="Travel better. Stay beautifully."
                description="We make discovering your next stay simple, convenient, and enjoyable."
              />

              <div className="space-y-7">
                {[
                  {
                    icon: ShieldCheck,
                    title: "A comfortable booking experience",
                    description:
                      "Find the details you need to make a confident booking decision.",
                  },
                  {
                    icon: Gem,
                    title: "Thoughtfully presented stays",
                    description:
                      "Explore properties with useful information, images, and amenities.",
                  },
                  {
                    icon: HeadphonesIcon,
                    title: "Designed around your journey",
                    description:
                      "Discover destinations and stays that make travel easier.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="flex gap-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-900">
                        <Icon size={22} />
                      </div>

                      <div>
                        <h3 className="font-serif text-xl font-semibold text-stone-900">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-stone-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <img
                src={CTA_IMAGE}
                alt="Beautiful resort swimming pool"
                loading="lazy"
                className="h-[480px] w-full rounded-[2rem] object-cover"
              />

              <div className="absolute -bottom-7 -left-3 rounded-2xl bg-white p-5 shadow-xl sm:-left-7 sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-900">
                    <Sparkles size={23} />
                  </div>
                  <div>
                    <p className="font-serif text-xl font-semibold text-stone-900">
                      Your next escape
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Starts with VELSAKA STAYS
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAVORITES */}
      {favoriteHotels.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="mb-10 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
                  Your saved collection
                </p>
                <h2 className="mt-2 font-serif text-3xl text-stone-900">
                  Your favourite stays
                </h2>
              </div>

              <Heart className="fill-rose-500 text-rose-500" size={26} />
            </div>

            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteHotels.map((hotel) => (
                <HotelCard
                  key={getHotelId(hotel)}
                  hotel={hotel}
                  onOpen={openHotel}
                  isFavorite
                  onFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden bg-emerald-950 py-24">
        <div className="absolute inset-0 opacity-20">
          <img
            src={CTA_IMAGE}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>

        <div className="absolute inset-0 bg-emerald-950/80" />

        <div className="relative mx-auto max-w-4xl px-5 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-amber-200/40 text-amber-200">
            <CalendarDays size={25} />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200">
            Your journey begins here
          </p>

          <h2 className="mt-5 font-serif text-4xl font-medium leading-tight text-white sm:text-5xl lg:text-6xl">
            Make room for
            <br />
            <span className="italic text-amber-200">new experiences.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/70">
            Your next memorable stay is just a few clicks away. Explore our
            collection and find a place that feels right.
          </p>

          <button
            onClick={showAllStays}
            className="mt-9 inline-flex items-center gap-3 rounded-full bg-amber-200 px-8 py-4 text-sm font-bold text-emerald-950 transition hover:bg-amber-100"
          >
            Discover your stay
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Small local icon component used in the benefits section.
function HeadphonesIcon({ size = 22 }) {
  return <ShieldCheck size={size} />;
}
