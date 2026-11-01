import { Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";

function Favorites() {
  const favorites = JSON.parse(
    localStorage.getItem("velsaka-favorites") || "[]"
  );

  return (
    <main className="min-h-screen bg-[#f8faf7] px-5 py-16">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#183c2b] hover:underline"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>

        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[3px] text-[#a2844c]">
            Your collection
          </p>

          <h1 className="mt-3 text-4xl font-semibold text-[#183c2b]">
            My Favorites
          </h1>

          <p className="mt-3 text-gray-500">
            Hotels you've saved for your next stay.
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-20 text-center">
            <Heart className="mx-auto mb-5 text-[#a2844c]" size={42} />

            <h2 className="text-xl font-semibold text-[#183c2b]">
              No favorites yet
            </h2>

            <p className="mt-2 text-gray-500">
              Explore hotels and save your favorite places here.
            </p>

            <Link
              to="/"
              className="mt-7 inline-block rounded-xl bg-[#183c2b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#24543d]"
            >
              Explore hotels
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((hotel) => (
              <div
                key={hotel._id || hotel.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                {hotel.images?.[0] && (
                  <img
                    src={hotel.images[0]}
                    alt={hotel.name}
                    className="h-56 w-full object-cover"
                  />
                )}

                <div className="p-5">
                  <h2 className="text-lg font-semibold text-[#183c2b]">
                    {hotel.name}
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    {hotel.location}
                  </p>

                  <p className="mt-4 font-semibold text-[#a2844c]">
                    ₹{hotel.pricePerNight || hotel.price} / night
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default Favorites;
