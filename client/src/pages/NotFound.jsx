import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div
        className={`relative z-10 max-w-2xl mx-auto text-center transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Brand logo area */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-400/90 text-sm font-medium tracking-widest uppercase">
              Velsaka Stays
            </span>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          </div>
        </div>

        {/* 404 Number with animation */}
        <div className="relative mb-6">
          <h1 className="text-[12rem] sm:text-[16rem] md:text-[20rem] font-black leading-none tracking-tighter select-none">
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 animate-glitch">
              4
            </span>
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 animate-glitch-delay">
              0
            </span>
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 animate-glitch">
              4
            </span>
          </h1>
          {/* Glow effect behind 404 */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-transparent to-amber-500/20 blur-3xl -z-10 animate-pulse" />
        </div>

        {/* Message */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
          Lost in <span className="text-amber-400">Paradise?</span>
        </h2>
        <p className="text-slate-400 text-base sm:text-lg max-w-md mx-auto mb-10 leading-relaxed">
          The page you're looking for has drifted away like a summer breeze.
          Let's guide you back to comfort.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-semibold rounded-2xl transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.5)] hover:scale-105 active:scale-95 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Home
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <button
            onClick={() => navigate(-1)}
            className="group px-8 py-4 bg-white/5 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
              Go Back
            </span>
          </button>
        </div>

        {/* Decorative line */}
        <div className="mt-16 flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-500/30" />
          <div className="w-1.5 h-1.5 bg-amber-500/30 rounded-full" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500/30" />
        </div>

        {/* Footer text */}
        <p className="mt-6 text-slate-500 text-xs tracking-widest uppercase">
          Error 404 &mdash; Page Not Found
        </p>
      </div>

      {/* Custom animations via style tag */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 1;
          }
        }

        @keyframes glitch {
          0%, 100% {
            transform: translate(0);
            filter: brightness(1);
          }
          2% {
            transform: translate(-2px, 1px);
            filter: brightness(1.2);
          }
          4% {
            transform: translate(2px, -1px);
            filter: brightness(0.9);
          }
          6% {
            transform: translate(0);
            filter: brightness(1);
          }
        }

        @keyframes glitch-delay {
          0%, 100% {
            transform: translate(0);
            filter: brightness(1);
          }
          3% {
            transform: translate(2px, -2px);
            filter: brightness(0.8);
          }
          5% {
            transform: translate(-1px, 2px);
            filter: brightness(1.3);
          }
          7% {
            transform: translate(0);
            filter: brightness(1);
          }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animate-glitch {
          animation: glitch 3s ease-in-out infinite;
        }

        .animate-glitch-delay {
          animation: glitch-delay 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;