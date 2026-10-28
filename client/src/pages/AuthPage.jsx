
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Hotel,
  LockKeyhole,
  Mail,
  UserRound,
  CheckCircle2,
} from "lucide-react";
import { loginUser, registerUser } from "../api/authApi";

export default function AuthPage() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
    setSuccess("");
  };

  const switchMode = (loginMode) => {
    setIsLogin(loginMode);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const email = form.email.trim().toLowerCase();

    if (!isLogin && form.name.trim().length < 2) {
      setError("Please enter your name (at least 2 characters).");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const result = isLogin
        ? await loginUser({ email, password: form.password })
        : await registerUser({
            name: form.name.trim(),
            email,
            password: form.password,
          });

      setSuccess(result.message || "Authentication successful.");

      // The backend sets an HttpOnly JWT cookie.
      // Do not store the JWT in localStorage.
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.code === "ECONNABORTED"
            ? "The server took too long to respond. Please try again."
            : "Unable to connect. Check whether the backend is running.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#183c2b]">
      <header className="flex h-20 items-center justify-between border-b border-[#e9e4d9] px-5 sm:px-10 lg:px-16">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#183c2b] text-white">
            <Hotel size={21} />
          </span>
          <span>
            <span className="block text-lg font-bold tracking-[0.14em]">
              VELSAKA
            </span>
            <span className="block text-[9px] tracking-[0.34em] text-[#9b8050]">
              STAYS & EXPERIENCES
            </span>
          </span>
        </Link>

        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-[#59645c] transition hover:text-[#183c2b]"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to home</span>
          <span className="sm:hidden">Home</span>
        </Link>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-[1440px] lg:grid-cols-2">
        {/* Visual panel */}
        <div className="relative hidden min-h-[700px] overflow-hidden bg-[#183c2b] lg:block">
          <img
            src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1500&q=85"
            alt="Elegant hotel room"
            className="absolute inset-0 h-full w-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10251b] via-[#183c2b]/20 to-[#183c2b]/20" />

          <div className="absolute left-12 top-12 rounded-full border border-white/40 px-4 py-2 text-xs tracking-[0.2em] text-white">
            YOUR NEXT CHAPTER STARTS HERE
          </div>

          <div className="absolute bottom-16 left-12 right-12 text-white xl:left-16 xl:right-16">
            <div className="mb-5 h-px w-16 bg-[#d9bd84]" />
            <p className="mb-4 text-xs tracking-[0.35em] text-[#e4cfaa]">
              STAY A LITTLE CLOSER TO EXTRAORDINARY
            </p>
            <h1 className="max-w-xl text-5xl font-light leading-[1.15] xl:text-6xl">
              Find your place
              <br />
              in the world.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/75">
              Discover thoughtfully selected stays, memorable destinations,
              and the comfort of feeling right at home.
            </p>

            <div className="mt-10 flex items-center gap-3 text-sm text-white/90">
              <CheckCircle2 size={18} className="text-[#e4cfaa]" />
              Discover stays made for you
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center px-5 py-12 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 inline-flex rounded-xl bg-[#183c2b] p-3 text-white">
                <Hotel size={24} />
              </div>
              <p className="text-sm text-[#8a806e]">
                YOUR JOURNEY, YOUR WAY
              </p>
            </div>

            <p className="mb-3 text-xs font-semibold tracking-[0.28em] text-[#a1824b]">
              {isLogin ? "WELCOME BACK" : "JOIN OUR COMMUNITY"}
            </p>

            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {isLogin ? "Sign in to your account" : "Create your account"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#788078]">
              {isLogin
                ? "Your next memorable stay is just a few steps away."
                : "Create an account to start discovering your next stay."}
            </p>

            <div className="mt-8 grid grid-cols-2 rounded-xl bg-[#efede6] p-1">
              <button
                type="button"
                onClick={() => switchMode(true)}
                className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${
                  isLogin
                    ? "bg-white text-[#183c2b] shadow-sm"
                    : "text-[#777b72] hover:text-[#183c2b]"
                }`}
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={() => switchMode(false)}
                className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${
                  !isLogin
                    ? "bg-white text-[#183c2b] shadow-sm"
                    : "text-[#777b72] hover:text-[#183c2b]"
                }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {!isLogin && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Full name
                  </label>
                  <div className="relative">
                    <UserRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9c91]"
                    />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={handleChange}
                      required={!isLogin}
                      minLength={2}
                      maxLength={80}
                      className="h-13 w-full rounded-xl border border-[#e3e0d7] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#aaa99f] focus:border-[#183c2b] focus:ring-2 focus:ring-[#183c2b]/10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9c91]"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    maxLength={254}
                    className="h-13 w-full rounded-xl border border-[#e3e0d7] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#aaa99f] focus:border-[#183c2b] focus:ring-2 focus:ring-[#183c2b]/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() =>
                        setError(
                          "Password reset is not configured yet. Please contact support."
                        )
                      }
                      className="text-xs font-medium text-[#9b8050] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9c91]"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isLogin ? "current-password" : "new-password"
                    }
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    maxLength={72}
                    className="h-13 w-full rounded-xl border border-[#e3e0d7] bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-[#aaa99f] focus:border-[#183c2b] focus:ring-2 focus:ring-[#183c2b]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#858b82] hover:text-[#183c2b]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {!isLogin && (
                  <p className="mt-2 text-xs text-[#858b82]">
                    Use at least 8 characters.
                  </p>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                >
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-13 w-full items-center justify-center gap-3 rounded-xl bg-[#183c2b] px-5 text-sm font-semibold text-white transition hover:bg-[#24513b] focus:outline-none focus:ring-4 focus:ring-[#183c2b]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign in to your account"
                    : "Create my account"}
                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#e7e3da]" />
              <span className="text-xs text-[#99968b]">
                SECURE ACCOUNT ACCESS
              </span>
              <div className="h-px flex-1 bg-[#e7e3da]" />
            </div>

            <p className="text-center text-xs leading-6 text-[#898b82]">
              By continuing, you agree to use VELSAKA STAYS responsibly.
              Keep your account credentials private.
            </p>

            <p className="mt-7 text-center text-sm text-[#74796f]">
              {isLogin ? "New to VELSAKA STAYS?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(!isLogin)}
                className="font-semibold text-[#183c2b] hover:underline"
              >
                {isLogin ? "Create an account" : "Sign in"}
              </button>
            </p>

            <div className="mt-8 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs text-[#898b82] transition hover:text-[#183c2b]"
              >
                <ArrowLeft size={14} />
                Explore stays without signing in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
