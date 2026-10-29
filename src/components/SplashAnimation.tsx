import React, { useEffect, useState } from 'react';
import { Apple, Sparkles, HeartPulse, ShieldCheck, ArrowRight } from 'lucide-react';

interface SplashAnimationProps {
  onComplete: () => void;
}

export const SplashAnimation: React.FC<SplashAnimationProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phaseText, setPhaseText] = useState('Initializing Clinical Bio-Metrics...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(onComplete, 600);
          }, 300);
          return 100;
        }

        const next = prev + 3;
        if (next > 75) {
          setPhaseText('Empowering AI Dietetic Intelligence...');
        } else if (next > 45) {
          setPhaseText('Calibrating Mifflin-St Jeor & Micronutrient Formulas...');
        } else if (next > 20) {
          setPhaseText('Synchronizing Personal Nutrition Safeguards...');
        }
        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dynamic Animated Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">
        {/* Glowing Logo Crest */}
        <div className="relative mb-6">
          {/* Animated Pulsing Rings */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 opacity-40 blur-xl animate-pulse-ring" />
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-400 opacity-60 blur-xs" />

          {/* Icon Box */}
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-blue-500/50 border border-white/20">
            <Apple className="w-12 h-12 drop-shadow-md" />
            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-slate-900 border border-emerald-400/40 text-emerald-400 shadow-lg">
              <HeartPulse className="w-4 h-4 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Title & Tagline with Staggered Fade */}
        <div className="space-y-1 mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-[11px] font-extrabold tracking-widest uppercase px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>VitaBoost</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-emerald-200">
            VitaBoost NutriApp
          </h1>
          <p className="text-sm font-medium text-slate-300">
            Personalized Clinical Dietetics & Visual Nutrition
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full space-y-2 mb-6">
          <div className="w-full bg-slate-900/80 rounded-full h-2 p-0.5 border border-slate-800 shadow-inner overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-100 shadow-lg shadow-blue-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 px-1">
            <span className="text-[11px] truncate text-slate-300">{phaseText}</span>
            <span className="font-mono-numbers font-bold text-emerald-400 ml-2">
              {progress}%
            </span>
          </div>
        </div>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer"
        >
          <span>Enter Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
