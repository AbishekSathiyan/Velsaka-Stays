
import logo from "../assets/VelSAKA_Logo.jpeg";
import { Link, useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        {/* Logo */}
        <a
          href="https://velsaka-tech.vercel.app/"
          aria-label="Visit VELSAKA TECH website"
          className="flex shrink-0 items-center gap-3 text-left"
        >
          <img
            src={logo}
            alt="VELSAKA Logo"
            className="h-11 w-11 rounded-xl object-contain"
          />

          <div>
            <p className="text-lg font-bold tracking-[0.12em] text-[#183c2b]">
              VELSAKA
            </p>
            <p className="text-[10px] font-semibold tracking-[0.3em] text-[#9b8158]">
              STAYS
            </p>
          </div>
        </a>

        {/* Navigation */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex">
          <button
            type="button"
            onClick={() => scrollToSection("discover")}
            className="transition hover:text-[#183c2b]"
          >
            Discover
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("benefits")}
            className="transition hover:text-[#183c2b]"
          >
            Why Velsaka
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("footer")}
            className="transition hover:text-[#183c2b]"
          >
            Contact
          </button>
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Profile */}
          <Link
            to="/profile"
            aria-label="My Profile"
            title="My Profile"
            className="inline-flex items-center gap-2 rounded-full border border-[#183c2b]/15 px-3 py-2.5 text-sm font-semibold text-[#183c2b] transition hover:bg-[#183c2b]/5 sm:px-4"
          >
            <UserRound size={18} strokeWidth={1.8} />
            <span className="hidden sm:inline">Profile</span>
          </Link>

          {/* Explore */}
          <button
            type="button"
            onClick={() => scrollToSection("discover")}
            className="rounded-full bg-[#183c2b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#28543e] sm:px-5"
          >
            Explore stays
          </button>
        </div>
      </div>
    </header>
  );
}
