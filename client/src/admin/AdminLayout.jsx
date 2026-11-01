
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Hotel,
  CalendarCheck,
  Users,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

// Admin Navigation
const navigation = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Hotels",
    path: "/admin/hotels",
    icon: Hotel,
  },
  {
    name: "Bookings",
    path: "/admin/bookings",
    icon: CalendarCheck,
  },
  {
    name: "Customers",
    path: "/admin/customers",
    icon: Users,
  },
  {
    name: "Analytics",
    path: "/admin/analytics",
    icon: ChartNoAxesCombined,
  },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();

  // Firebase Logout
  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await signOut(auth);

      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#111827] text-white shadow-2xl transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >

        {/* LOGO HEADER */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5">

          <div className="flex items-center gap-3">

            {/* VELSAKA LOGO */}
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white">
              <img
                src="/VelSAKA_Logo.jpeg"
                alt="VELSAKA STAYS Logo"
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-wide text-white">
                VELSAKA
              </h1>

              <p className="mt-0.5 text-[10px] font-semibold tracking-[3px] text-amber-400">
                STAYS ADMIN
              </p>
            </div>
          </div>

          {/* MOBILE CLOSE */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-4 py-7">

          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Management
          </p>

          <nav className="space-y-2">

            {navigation.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/admin"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon size={19} />

                <span>{name}</span>
              </NavLink>
            ))}

          </nav>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="shrink-0 space-y-2 border-t border-white/10 p-4">

          <NavLink
            to="/admin/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Settings size={19} />
            Settings
          </NavLink>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut size={19} />

            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        {/* SIDEBAR BRAND FOOTER */}
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[10px] font-medium tracking-wider text-slate-500">
            POWERED BY VELSAKA TECH
          </p>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="min-h-screen lg:ml-64">

        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-xl md:px-8">

          <div className="flex items-center gap-3">

            {/* MOBILE MENU */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="font-bold text-slate-800">
                Management Console
              </h2>

              <p className="text-xs text-slate-500">
                Hotel administration
              </p>
            </div>
          </div>

          {/* ADMIN PROFILE */}
          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                Administrator
              </p>

              <p className="text-xs text-slate-500">
                Super Admin
              </p>
            </div>

            {/* ADMIN AVATAR */}
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-amber-200 bg-slate-900">
              <img
                src="/VelSAKA_Logo.jpeg"
                alt="Admin"
                className="h-full w-full object-cover"
              />
            </div>

          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-5 md:p-8">
          <Outlet />
        </div>

      </main>
    </div>
  );
}
