
import { useCallback, useEffect, useState } from "react";
import {
  Hotel,
  RefreshCw,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  MapPin,
  Star,
  ImagePlus,
  Loader2,
} from "lucide-react";
import api from "../api/hotelApi";

const initialForm = {
  name: "",
  city: "",
  address: "",
  description: "",
  pricePerNight: "",
  starRating: "3",
  images: "",
  amenities: "",
  isActive: true,
};

const getImage = (hotel) => {
  const image = hotel.images?.[0];

  if (typeof image === "string") return image;
  if (image?.url) return image.url;

  return "https://placehold.co/600x350?text=Hotel";
};

const getHotelsFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.hotels)) return data.hotels;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.hotels)) return data.data.hotels;

  return [];
};

export default function AdminHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [form, setForm] = useState(initialForm);

  // FETCH HOTELS
  const fetchHotels = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/hotels");

      const data = getHotelsFromResponse(response.data);
      setHotels(data);
    } catch (err) {
      console.error("FETCH HOTELS ERROR:", err.response?.data || err);

      setError(
        err.response?.data?.message || "Unable to load hotels."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // FORM INPUT HANDLER
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // OPEN CREATE MODAL
  const openCreateModal = () => {
    setEditingHotel(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  // OPEN EDIT MODAL
  const openEditModal = (hotel) => {
    setEditingHotel(hotel);

    setForm({
      name: hotel.name || "",
      city: hotel.city || "",
      address: hotel.address || "",
      description: hotel.description || "",
      pricePerNight: hotel.pricePerNight ?? "",
      starRating: String(hotel.starRating || 3),
      images: Array.isArray(hotel.images)
        ? hotel.images
            .map((image) =>
              typeof image === "string" ? image : image?.url
            )
            .filter(Boolean)
            .join(", ")
        : "",
      amenities: Array.isArray(hotel.amenities)
        ? hotel.amenities.join(", ")
        : "",
      isActive: hotel.isActive !== false,
    });

    setModalOpen(true);
  };

  // CREATE / UPDATE HOTEL
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        description: form.description.trim(),
        pricePerNight: Number(form.pricePerNight),
        starRating: Number(form.starRating),
        images: form.images
          .split(",")
          .map((image) => image.trim())
          .filter(Boolean),
        amenities: form.amenities
          .split(",")
          .map((amenity) => amenity.trim())
          .filter(Boolean),
        isActive: form.isActive,
      };

      if (
        !payload.name ||
        !payload.city ||
        !payload.address ||
        !Number.isFinite(payload.pricePerNight) ||
        payload.pricePerNight <= 0
      ) {
        throw new Error(
          "Enter a hotel name, city, address and valid price."
        );
      }

      if (editingHotel) {
        await api.put(
          `/admin/hotels/${editingHotel._id}`,
          payload
        );
      } else {
        await api.post("/admin/hotels", payload);
      }

      setModalOpen(false);
      setEditingHotel(null);
      setForm(initialForm);

      await fetchHotels();
    } catch (err) {
      console.error("SAVE HOTEL ERROR:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save hotel."
      );
    } finally {
      setSaving(false);
    }
  };

  // DELETE HOTEL
  const handleDelete = async (hotel) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${hotel.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(hotel._id);
      setError("");

      await api.delete(`/admin/hotels/${hotel._id}`);

      setHotels((previous) =>
        previous.filter((item) => item._id !== hotel._id)
      );
    } catch (err) {
      console.error("DELETE HOTEL ERROR:", err.response?.data || err);

      setError(
        err.response?.data?.message || "Unable to delete hotel."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // SEARCH
  const filteredHotels = hotels.filter((hotel) => {
    const query = search.toLowerCase();

    return (
      hotel.name?.toLowerCase().includes(query) ||
      hotel.city?.toLowerCase().includes(query) ||
      hotel.address?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-7">

      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Administration
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Hotel Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage hotel listings, pricing and availability.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchHotels}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
          >
            <Plus size={17} />
            Add Hotel
          </button>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Hotels</p>
            <Hotel className="text-indigo-600" size={21} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {hotels.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active Hotels</p>
          <p className="mt-3 text-3xl font-bold text-emerald-600">
            {hotels.filter((hotel) => hotel.isActive !== false).length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Inactive Hotels</p>
          <p className="mt-3 text-3xl font-bold text-rose-600">
            {hotels.filter((hotel) => hotel.isActive === false).length}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <Search size={18} className="text-slate-400" />

        <input
          type="text"
          placeholder="Search hotel name, city or address..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button onClick={() => setError("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {/* HOTEL LIST */}
      {loading ? (
        <div className="rounded-2xl border bg-white p-12 text-center">
          <Loader2 className="mx-auto animate-spin text-indigo-600" size={30} />
          <p className="mt-4 text-sm text-slate-500">
            Loading hotel records...
          </p>
        </div>
      ) : filteredHotels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Hotel className="mx-auto text-slate-300" size={42} />

          <h3 className="mt-4 font-semibold text-slate-800">
            {hotels.length === 0 ? "No hotels found" : "No matching hotels"}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {hotels.length === 0
              ? "Add your first hotel to get started."
              : "Try searching with another name or city."}
          </p>

          {hotels.length === 0 && (
            <button
              onClick={openCreateModal}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Add your first hotel
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredHotels.map((hotel) => (
            <div
              key={hotel._id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              {/* IMAGE */}
              <div className="relative">
                <img
                  src={getImage(hotel)}
                  alt={hotel.name || "Hotel"}
                  onError={(event) => {
                    event.currentTarget.src =
                      "https://placehold.co/600x350?text=Hotel";
                  }}
                  className="h-48 w-full object-cover"
                />

                <span
                  className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
                    hotel.isActive === false
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {hotel.isActive === false ? "Inactive" : "Active"}
                </span>
              </div>

              {/* DETAILS */}
              <div className="space-y-4 p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-slate-900">
                      {hotel.name}
                    </h3>

                    <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-600">
                      <Star size={14} className="fill-amber-400" />
                      {hotel.starRating || 3}
                    </span>
                  </div>

                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin size={14} />
                    {hotel.city || "Location unavailable"}
                  </p>

                  <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                    {hotel.address || "No address provided"}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    Price per night
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    ₹{Number(hotel.pricePerNight || 0).toLocaleString("en-IN")}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-3 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => openEditModal(hotel)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-50 px-3 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(hotel)}
                    disabled={deletingId === hotel._id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                  >
                    {deletingId === hotel._id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingHotel ? "Edit Hotel" : "Add New Hotel"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter the hotel information below.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <X size={19} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Hotel Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="The Grand Palm Residency"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      City *
                    </label>

                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      required
                      placeholder="Coimbatore"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Price per night (₹) *
                    </label>

                    <input
                      type="number"
                      name="pricePerNight"
                      value={form.pricePerNight}
                      onChange={handleChange}
                      min="1"
                      required
                      placeholder="3200"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Address *
                  </label>

                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    placeholder="Avinashi Road, Coimbatore, Tamil Nadu"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Star Rating
                    </label>

                    <select
                      name="starRating"
                      value={form.starRating}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <option key={star} value={star}>
                          {star} Star
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 accent-indigo-600"
                    />

                    <label className="text-sm font-semibold">
                      Active listing
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe the hotel..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <ImagePlus size={16} />
                    Image URLs
                  </label>

                  <textarea
                    name="images"
                    value={form.images}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Paste image URLs separated by commas"
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Enter multiple image URLs separated by commas.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Amenities
                  </label>

                  <input
                    name="amenities"
                    value={form.amenities}
                    onChange={handleChange}
                    placeholder="Free Wi-Fi, Swimming Pool, Restaurant, Parking"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Separate amenities using commas.
                  </p>
                </div>
              </div>

              {/* FORM FOOTER */}
              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 size={16} className="animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingHotel
                    ? "Update Hotel"
                    : "Create Hotel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
