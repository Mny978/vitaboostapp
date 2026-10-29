import React, { useState } from 'react';
import {
  Flame,
  Activity,
  Droplets,
  Award,
  Sparkles,
  Camera,
  Calendar,
  FileText,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  HeartPulse,
  Scale,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { UserProfile, DailyTracking, SupportedLanguage } from '../types';
import { translations } from '../utils/translations';
import { getAiHealthSummary } from '../services/geminiService';

interface DashboardViewProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  tracking: DailyTracking;
  setActiveTab: (tab: string) => void;
  language: SupportedLanguage;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  setProfile,
  tracking,
  setActiveTab,
  language,
}) => {
  const t = translations[language] || translations.en;
  const { assessment } = profile;
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Water percentage calculation
  const waterTargetMl = (assessment.waterGoalLiters || 3.5) * 1000;
  const waterPercent = Math.min(100, Math.round((tracking.waterIntakeMl / waterTargetMl) * 100));

  // Calories logged today
  const caloriesLogged = tracking.mealLog.reduce((sum, m) => sum + (m.kcal || 0), 0);
  const calorieTarget = assessment.target || 2000;
  const calPercent = Math.min(100, Math.round((caloriesLogged / calorieTarget) * 100));

  const handleFetchAiSummary = async () => {
    setIsLoadingSummary(true);
    setErrorMsg(null);
    try {
      const summary = await getAiHealthSummary(profile);
      setProfile((prev) => ({ ...prev, aiSummary: summary }));
    } catch (err: any) {
      console.error('Failed to get summary:', err);
      setErrorMsg(err.message || 'Could not fetch AI summary. Please check connection.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-6 text-white shadow-lg shadow-blue-900/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-blue-100">
              Personalized Dietetics
            </span>
            <span className="text-xs text-blue-200">
              {profile.dietaryPreference} • {profile.goal}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {profile.name ? `Welcome back, ${profile.name}!` : t.welcomeHeader}
          </h1>
          <p className="text-sm text-blue-100 mt-1 max-w-xl">
            {profile.medicalConditions
              ? `Personalized clinical nutrition safeguards active for: ${profile.medicalConditions}`
              : 'Your daily clinical health metrics, calibrated diet plan, and AI nutrition assistant.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('profile')}
            className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-xs hover:bg-blue-50 transition shadow-sm flex items-center gap-1.5"
          >
            <span>Edit Profile & Goals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Health Snapshot Cards */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-rose-500" />
          <span>{t.dashSnapshotHeader}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: BMI */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t.dashBMI}
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {assessment.bmi !== null ? assessment.bmi : '--'}
                </span>
                <span className="text-xs font-semibold text-slate-400">kg/m²</span>
              </div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                {assessment.bmiStatus}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Ideal: {assessment.idealWeightRange}
              </p>
            </div>
          </div>

          {/* Card 2: Calorie Target & Today's Intake */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t.dashTarget}
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {assessment.target !== null ? assessment.target : 2000}
                </span>
                <span className="text-xs font-semibold text-slate-400">kcal / day</span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${calPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 flex justify-between">
                <span>Logged: {caloriesLogged} kcal</span>
                <span>{calPercent}%</span>
              </p>
            </div>
          </div>

          {/* Card 3: Water Intake */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t.dashWater}
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {(tracking.waterIntakeMl / 1000).toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  / {assessment.waterGoalLiters || 3.5} L
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 flex justify-between">
                <span>{Math.round(tracking.waterIntakeMl / 250)} glasses</span>
                <button
                  onClick={() => setActiveTab('tracking')}
                  className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
                >
                  + Add Glass
                </button>
              </p>
            </div>
          </div>

          {/* Card 4: Plan Streak & Servings */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Fruit & Veg Servings
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {tracking.fruitVegServings}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 5 portions</span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (tracking.fruitVegServings / 5) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 flex justify-between">
                <span>Fiber & Antioxidants</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {tracking.fruitVegServings >= 5 ? 'Goal Met 🎉' : `${5 - tracking.fruitVegServings} left`}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Health Summary Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t.aiSummaryTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalized clinical analysis tailored to your BMI and health conditions
              </p>
            </div>
          </div>

          <button
            onClick={handleFetchAiSummary}
            disabled={isLoadingSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/70 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSummary ? 'animate-spin' : ''}`} />
            <span>{isLoadingSummary ? 'Analyzing...' : 'Generate / Refresh'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
          {isLoadingSummary ? (
            <div className="flex items-center gap-3 text-slate-500 py-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing your clinical biometric summary using Gemini AI...</span>
            </div>
          ) : profile.aiSummary ? (
            profile.aiSummary
          ) : (
            <div className="text-slate-500 dark:text-slate-400 py-1">
              {t.dashTipInitial}{' '}
              <button
                onClick={handleFetchAiSummary}
                className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2 ml-1"
              >
                Click here to generate your summary now.
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Target Macronutrient Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span>{t.dashProgressHeader}</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Calculated for {profile.goal} with {profile.assessment.target || 2000} kcal/day target
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span>Protein</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {assessment.proteinGoal ? `${assessment.proteinGoal * 4} kcal` : '--'}
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {assessment.proteinGoal || 75}g
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Muscle repair & satiety</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span>Carbohydrates</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {assessment.carbGoal ? `${assessment.carbGoal * 4} kcal` : '--'}
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {assessment.carbGoal || 220}g
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Complex grains & millets</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span>Healthy Fats</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {assessment.fatGoal ? `${assessment.fatGoal * 9} kcal` : '--'}
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {assessment.fatGoal || 55}g
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cold-pressed oils & nuts</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span>Dietary Fiber</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">Gut Health</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {assessment.fiberGoal || 28}g
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Prebiotics & glycemic ease</p>
          </div>
        </div>
      </div>

      {/* Quick Access Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scanner Shortcut */}
        <div
          onClick={() => setActiveTab('tracking')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            AI Plate Scanner
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Snap your plate to auto-calculate portions and nutrition.
          </p>
        </div>

        {/* Diet Plan Shortcut */}
        <div
          onClick={() => setActiveTab('plan')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            3-Day Diet Plan
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personalized Indian & global menus + printable PDF.
          </p>
        </div>

        {/* Lab Reports Shortcut */}
        <div
          onClick={() => setActiveTab('reports')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Lab Findings Analysis
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyze blood sugar, lipids, uric acid, and thyroid.
          </p>
        </div>

        {/* AI Dietitian Consultation */}
        <div
          onClick={() => setActiveTab('chat')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Consult AI Dietitian
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Instant answers, portion guidance, and restaurant tips.
          </p>
        </div>
      </div>
    </div>
  );
};
