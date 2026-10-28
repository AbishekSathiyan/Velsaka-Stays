import logo from "../assets/VelSAKA_Logo.jpeg";

const VELSAKA_TECH_URL = "https://velsaka-tech.vercel.app/";

export default function Footer() {
  return (
    <footer id="footer" className="bg-[#142c20] text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <a
              href={VELSAKA_TECH_URL}
              aria-label="Visit VELSAKA TECH"
              className="shrink-0"
            >
              <img
                src={logo}
                alt="VELSAKA logo"
                className="h-12 w-12 rounded-xl bg-white object-contain p-1"
                loading="lazy"
              />
            </a>

            <div>
              <a
                href={VELSAKA_TECH_URL}
                className="text-lg font-bold tracking-[0.14em] transition-colors hover:text-[#d8bd8b]"
              >
                VELSAKA STAYS
              </a>

              <p className="mt-2 text-sm text-white/60">
                Find your place. Make the journey memorable.
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/65"
          >
            <a href="#discover" className="transition-colors hover:text-white">
              Explore stays
            </a>

            <a href="#benefits" className="transition-colors hover:text-white">
              About
            </a>

            <a
              href="mailto:velsakatech@gmail.com"
              className="transition-colors hover:text-white"
            >
              Contact
            </a>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} VELSAKA STAYS. All rights reserved.
          </p>

          {/* By VELSAKA TECH */}
          <p className="text-sm text-white/60">
            Crafted with care by{" "}
            <a
              href={VELSAKA_TECH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#d8bd8b] transition-colors hover:text-white"
            >
              VELSAKA TECH
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
