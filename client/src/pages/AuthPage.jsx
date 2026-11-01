
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  reload,
} from "firebase/auth";

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
  LoaderCircle,
} from "lucide-react";

import { auth } from "../firebase/firebaseConfig";

// ======================================
// BACKEND API CONFIGURATION
// ======================================

const API_URL = import.meta.env.VITE_API_BASE_URL;

// ======================================
// FIREBASE USER -> MONGODB SYNC
// ======================================

const syncUserWithMongoDB = async (firebaseUser, name = "") => {
  if (!API_URL) {
    throw new Error("Backend API URL is not configured.");
  }

  // Refresh Firebase user details
  await reload(firebaseUser);

  // Force refresh token to get the latest email_verified claim
  const token = await firebaseUser.getIdToken(true);

  const response = await fetch(`${API_URL}/auth/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  const result = await response.json();

  // Existing MongoDB account with a different Firebase UID
  if (response.status === 403) {
    if (!firebaseUser.emailVerified) {
      try {
        await sendEmailVerification(firebaseUser);

        throw new Error(
          "Your email is not verified. A verification link has been sent to your email. Please verify it and sign in again."
        );
      } catch (verificationError) {
        if (verificationError.message.includes("verification link")) {
          throw verificationError;
        }

        console.error(
          "Email verification error:",
          verificationError
        );

        throw new Error(
          "Unable to send verification email. Please try again."
        );
      }
    }
  }

  if (!response.ok) {
    throw new Error(
      result.message || "Unable to synchronize your account."
    );
  }

  if (!result.data?.user) {
    throw new Error("Invalid user response from backend.");
  }

  return result.data.user;
};

// ======================================
// AUTH PAGE
// ======================================

export default function AuthPage() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // ======================================
  // INPUT HANDLER
  // ======================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ======================================
  // SWITCH LOGIN / REGISTER
  // ======================================

  const switchMode = (loginMode) => {
    setIsLogin(loginMode);
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  // ======================================
  // FIREBASE ERROR HANDLER
  // ======================================

  const getFirebaseError = (code) => {
    const errors = {
      "auth/email-already-in-use":
        "This email address is already registered.",

      "auth/invalid-email":
        "Please enter a valid email address.",

      "auth/invalid-credential":
        "Invalid email or password.",

      "auth/user-not-found":
        "No account found with this email address.",

      "auth/wrong-password":
        "Incorrect password. Please try again.",

      "auth/weak-password":
        "Password must contain at least 8 characters.",

      "auth/too-many-requests":
        "Too many attempts. Please try again later.",

      "auth/network-request-failed":
        "Network error. Check your internet connection.",

      "auth/user-disabled":
        "This account has been disabled.",

      "auth/operation-not-allowed":
        "Email and password authentication is not enabled.",

      "auth/invalid-api-key":
        "Firebase configuration is invalid.",

      "auth/too-many-requests":
        "Too many attempts. Please try again later.",

      "auth/quota-exceeded":
        "Email service quota exceeded. Try again later.",
    };

    return errors[code] || "Authentication failed. Please try again.";
  };

  // ======================================
  // LOGIN / REGISTER
  // ======================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const email = form.email.trim().toLowerCase();
    const name = form.name.trim();

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate name during registration
    if (!isLogin && (name.length < 2 || name.length > 80)) {
      setError("Name must be between 2 and 80 characters.");
      return;
    }

    // Validate password
    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      let credential;

      // ==================================
      // FIREBASE LOGIN
      // ==================================

      if (isLogin) {
        credential = await signInWithEmailAndPassword(
          auth,
          email,
          form.password
        );
      }

      // ==================================
      // FIREBASE REGISTRATION
      // ==================================

      else {
        credential = await createUserWithEmailAndPassword(
          auth,
          email,
          form.password
        );

        await updateProfile(credential.user, {
          displayName: name,
        });

        // Send verification email to new users
        await sendEmailVerification(credential.user);
      }

      // ==================================
      // SYNC WITH MONGODB
      // ==================================

      const mongoUser = await syncUserWithMongoDB(
        credential.user,
        isLogin ? "" : name
      );

      console.log("Authenticated user:", mongoUser);

      // ==================================
      // SUCCESS
      // ==================================

      setSuccess(
        isLogin
          ? "Welcome back! Login successful."
          : "Your account has been created successfully."
      );

      navigate("/", { replace: true });

    } catch (err) {
      console.error("Authentication error:", err);

      if (err.code?.startsWith("auth/")) {
        setError(getFirebaseError(err.code));
      } else if (
        err.message?.includes("Failed to fetch")
      ) {
        setError(
          "Unable to connect to the backend. Please check your server."
        );
      } else {
        setError(
          err.message || "Something went wrong. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // FORGOT PASSWORD
  // ======================================

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");

    const email = form.email.trim().toLowerCase();

    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);

      setSuccess(
        "Password reset email sent. Please check your inbox."
      );

    } catch (err) {
      console.error("Password reset error:", err);

      setError(getFirebaseError(err.code));

    } finally {
      setResetLoading(false);
    }
  };

  // ======================================
  // UI
  // ======================================

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#183c2b]">

      {/* HEADER */}

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

        {/* VISUAL PANEL */}

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
              Discover thoughtfully selected stays, memorable
              destinations, and the comfort of feeling right at home.
            </p>

            <div className="mt-10 flex items-center gap-3 text-sm text-white/90">
              <CheckCircle2 size={18} className="text-[#e4cfaa]" />
              Discover stays made for you
            </div>

          </div>

        </div>

        {/* FORM PANEL */}

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
              {isLogin
                ? "Sign in to your account"
                : "Create your account"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#788078]">
              {isLogin
                ? "Your next memorable stay is just a few steps away."
                : "Create an account to start discovering your next stay."}
            </p>

            {/* LOGIN / REGISTER TABS */}

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

            {/* AUTH FORM */}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">

              {/* NAME */}

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

              {/* EMAIL */}

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

              {/* PASSWORD */}

              <div>

                <div className="mb-2 flex items-center justify-between gap-3">

                  <label
                    htmlFor="password"
                    className="text-sm font-medium"
                  >
                    Password
                  </label>

                  {isLogin && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={resetLoading}
                      className="text-xs font-medium text-[#9b8050] hover:underline disabled:opacity-50"
                    >
                      {resetLoading
                        ? "Sending..."
                        : "Forgot password?"}
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#858b82] hover:text-[#183c2b]"
                  >
                    {showPassword
                      ? <EyeOff size={18} />
                      : <Eye size={18} />}
                  </button>

                </div>

                {!isLogin && (
                  <p className="mt-2 text-xs text-[#858b82]">
                    Use at least 8 characters.
                  </p>
                )}

              </div>

              {/* ERROR */}

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              {/* SUCCESS */}

              {success && (
                <div
                  role="status"
                  className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                >
                  {success}
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-13 w-full items-center justify-center gap-3 rounded-xl bg-[#183c2b] px-5 text-sm font-semibold text-white transition hover:bg-[#24513b] focus:outline-none focus:ring-4 focus:ring-[#183c2b]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {isLogin
                      ? "Sign in to your account"
                      : "Create my account"}

                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}

              </button>

            </form>

            {/* SECURITY */}

            <div className="my-7 flex items-center gap-4">

              <div className="h-px flex-1 bg-[#e7e3da]" />

              <span className="text-xs text-[#99968b]">
                FIREBASE SECURE AUTHENTICATION
              </span>

              <div className="h-px flex-1 bg-[#e7e3da]" />

            </div>

            <p className="text-center text-xs leading-6 text-[#898b82]">
              Your account is protected by Firebase Authentication.
              Your profile is securely synchronized with VELSAKA STAYS.
            </p>

            {/* SWITCH MODE */}

            <p className="mt-7 text-center text-sm text-[#74796f]">

              {isLogin
                ? "New to VELSAKA STAYS?"
                : "Already have an account?"}{" "}

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
