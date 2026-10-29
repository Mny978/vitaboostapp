import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Download,
  Clock,
  Flame,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  FileText,
  MapPin,
} from 'lucide-react';
import { UserProfile, DietPlan, SupportedLanguage } from '../types';
import { translations } from '../utils/translations';
import { generate3DayDietPlan } from '../services/geminiService';
import { exportDietPlanToPdf } from '../utils/pdfExport';

interface DietPlanViewProps {
  profile: UserProfile;
  dietPlan: DietPlan | null;
  setDietPlan: React.Dispatch<React.SetStateAction<DietPlan | null>>;
  language: SupportedLanguage;
}

export const DietPlanView: React.FC<DietPlanViewProps> = ({
  profile,
  dietPlan,
  setDietPlan,
  language,
}) => {
  const t = translations[language] || translations.en;
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMarkdown, setShowMarkdown] = useState(false);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const plan = await generate3DayDietPlan(profile);
      setDietPlan(plan);
      try {
        localStorage.setItem('vitaboost-dietplan', JSON.stringify(plan));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
    } catch (err: any) {
      console.error('Diet plan generation failed:', err);
      setErrorMessage(
        err.message || 'Failed to generate diet plan. Please ensure your backend is reachable.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!dietPlan) return;
    exportDietPlanToPdf(dietPlan, profile);
  };

  const currentDayData = dietPlan?.days.find((d) => d.dayNumber === selectedDay) || dietPlan?.days[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {profile.dietaryPreference} • {profile.goal}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Target: ~{profile.assessment.target || 2000} kcal/day
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <span>{t.planHeader}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Condition-tailored 3-day meal schedule with 5 daily eating slots and balanced macros.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dietPlan && (
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{t.btnDownloadPdf}</span>
            </button>
          )}

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating 3-Day Plan...' : t.btnGeneratePlan}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Plan Content */}
      {dietPlan ? (
        <div className="space-y-6">
          {/* Dietitian Overview Card */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30 p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40">
            <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Dietitian Clinical Strategy & Hydration</span>
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
              {dietPlan.dietitianGeneralGuidance}
            </p>
            {dietPlan.hydrationStrategy && (
              <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                💧 <strong>Hydration:</strong> {dietPlan.hydrationStrategy}
              </p>
            )}
          </div>

          {/* Day Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <div className="flex space-x-2">
              {dietPlan.days.map((day) => {
                const isActive = day.dayNumber === selectedDay;
                return (
                  <button
                    key={day.dayNumber}
                    onClick={() => setSelectedDay(day.dayNumber)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>Day {day.dayNumber}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      ~{day.totalCalories} kcal
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowMarkdown(!showMarkdown)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showMarkdown ? 'Structured View' : 'Raw Text / Notes'}</span>
            </button>
          </div>

          {/* Meals for Selected Day */}
          {showMarkdown ? (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {dietPlan.rawMarkdown}
            </div>
          ) : currentDayData ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {currentDayData.dayTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Focus Theme: {currentDayData.focusTheme}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold w-fit">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Total: ~{currentDayData.totalCalories} kcal</span>
                </div>
              </div>

              {/* Meal Cards */}
              <div className="grid grid-cols-1 gap-3.5">
                {currentDayData.meals.map((meal, idx) => {
                  const s = meal.slot.toLowerCase();
                  let slotBadgeClass = 'bg-blue-600 text-white';
                  let cardBorderClass = 'border-slate-200 dark:border-slate-700 hover:border-blue-400';
                  let slotBgClass = 'from-blue-500/5 to-indigo-500/5';

                  if (s.includes('early')) {
                    slotBadgeClass = 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
                    cardBorderClass = 'border-amber-200 dark:border-amber-900/60 hover:border-amber-400';
                    slotBgClass = 'from-amber-500/10 to-orange-500/5';
                  } else if (s.includes('breakfast')) {
                    slotBadgeClass = 'bg-gradient-to-r from-rose-500 to-pink-500 text-white';
                    cardBorderClass = 'border-rose-200 dark:border-rose-900/60 hover:border-rose-400';
                    slotBgClass = 'from-rose-500/10 to-pink-500/5';
                  } else if (s.includes('mid-morning')) {
                    slotBadgeClass = 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white';
                    cardBorderClass = 'border-sky-200 dark:border-sky-900/60 hover:border-sky-400';
                    slotBgClass = 'from-sky-500/10 to-cyan-500/5';
                  } else if (s.includes('lunch')) {
                    slotBadgeClass = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white';
                    cardBorderClass = 'border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400';
                    slotBgClass = 'from-emerald-500/10 to-teal-500/5';
                  } else if (s.includes('evening')) {
                    slotBadgeClass = 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white';
                    cardBorderClass = 'border-purple-200 dark:border-purple-900/60 hover:border-purple-400';
                    slotBgClass = 'from-purple-500/10 to-indigo-500/5';
                  } else if (s.includes('dinner')) {
                    slotBadgeClass = 'bg-gradient-to-r from-indigo-700 to-blue-700 text-white';
                    cardBorderClass = 'border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400';
                    slotBgClass = 'from-indigo-500/10 to-blue-500/5';
                  }

                  return (
                    <div
                      key={idx}
                      className={`bg-white dark:bg-slate-800 bg-gradient-to-r ${slotBgClass} p-5 rounded-2xl border ${cardBorderClass} shadow-xs transition-all space-y-2.5 relative overflow-hidden group`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl shadow-xs ${slotBadgeClass}`}
                          >
                            {meal.slot}
                          </span>
                          <h4 className="font-bold text-base text-slate-900 dark:text-white">
                            {meal.dishName}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold border border-amber-200 dark:border-amber-800">
                            ~{meal.kcal} kcal
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-900">
                            P: {meal.macros.protein}g
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border border-orange-200 dark:border-orange-900">
                            C: {meal.macros.carbs}g
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900">
                            F: {meal.macros.fat}g
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <span>
                          <strong>Standard Portion:</strong> {meal.portion}
                        </span>
                      </div>

                      <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 mr-1.5">
                          ✨ Clinical Health Note:
                        </span>
                        {meal.healthNote}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Day Lifestyle Tips */}
              {currentDayData.tipsForDay && currentDayData.tipsForDay.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Daily Lifestyle & Digestive Tips
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {currentDayData.tipsForDay.map((tip, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          {/* Phased Dietary Roadmap */}
          {dietPlan.roadmap && dietPlan.roadmap.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>{t.planRoadmapHeader}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A 6 to 8-step phased clinical habit roadmap to achieve sustainable metabolic results.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                {dietPlan.roadmap.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-1.5 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {step.phase || `Step ${idx + 1}`}
                      </span>
                      <span className="text-xs font-black text-slate-300 dark:text-slate-600">
                        #{idx + 1}
                      </span>
                    </div>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {step.title}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty / Initial State */
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Diet Plan Generated Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {t.planInitialPrompt}
          </p>
          <div>
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? 'Generating Your Plan...' : t.btnGeneratePlan}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
