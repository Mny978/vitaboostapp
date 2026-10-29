import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Utensils,
  Droplets,
  Award,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Flame,
  Info,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  UserProfile,
  DailyTracking,
  MealItem,
  PlateScanResult,
  SupportedLanguage,
} from '../types';
import { translations } from '../utils/translations';
import { scanMealPlate, analyzeMealLog } from '../services/geminiService';

interface TrackingViewProps {
  profile: UserProfile;
  tracking: DailyTracking;
  setTracking: React.Dispatch<React.SetStateAction<DailyTracking>>;
  language: SupportedLanguage;
}

export const TrackingView: React.FC<TrackingViewProps> = ({
  profile,
  tracking,
  setTracking,
  language,
}) => {
  const t = translations[language] || translations.en;

  // Scanner State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scannerNotes, setScannerNotes] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<PlateScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Meal Log State
  const [mealText, setMealText] = useState('');
  const [mealType, setMealType] = useState<MealItem['mealType']>('Lunch');
  const [mealKcal, setMealKcal] = useState('');

  // AI Meal Log Analysis State
  const [isAnalyzingLog, setIsAnalyzingLog] = useState(false);
  const [logAnalysis, setLogAnalysis] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Handle Photo Selection & Downsampling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError(null);
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Downsample image to max 1024px for fast Gemini processing
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelectedImage(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleScanPlate = async () => {
    if (!selectedImage) return;
    setIsScanning(true);
    setScanError(null);
    try {
      const result = await scanMealPlate(selectedImage, scannerNotes);
      setScanResult(result);
    } catch (err: any) {
      console.error('Scan plate error:', err);
      setScanError(
        err.message || 'Plate scan failed. Please check your image or network connection.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddScannedToLog = () => {
    if (!scanResult) return;
    const itemsDescription = scanResult.items.map((i) => `${i.name} (${i.portion})`).join(', ');
    const newMeal: MealItem = {
      id: Date.now().toString(),
      text: itemsDescription || 'Scanned Meal Plate',
      mealType,
      kcal: scanResult.total.kcal,
      protein_g: scanResult.total.protein_g,
      carbs_g: scanResult.total.carbs_g,
      fat_g: scanResult.total.fat_g,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      photoUrl: selectedImage || undefined,
    };

    setTracking((prev) => ({
      ...prev,
      mealLog: [newMeal, ...prev.mealLog],
    }));

    // Reset scan state
    setSelectedImage(null);
    setScanResult(null);
  };

  const handleAddManualMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealText.trim()) return;

    const newMeal: MealItem = {
      id: Date.now().toString(),
      text: mealText.trim(),
      mealType,
      kcal: mealKcal ? parseInt(mealKcal, 10) : undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTracking((prev) => ({
      ...prev,
      mealLog: [newMeal, ...prev.mealLog],
    }));

    setMealText('');
    setMealKcal('');
  };

  const handleDeleteMeal = (id: string) => {
    setTracking((prev) => ({
      ...prev,
      mealLog: prev.mealLog.filter((m) => m.id !== id),
    }));
  };

  const handleAnalyzeLog = async () => {
    if (tracking.mealLog.length === 0) {
      setAnalysisError('Please log at least one meal to analyze.');
      return;
    }
    setIsAnalyzingLog(true);
    setAnalysisError(null);
    try {
      const feedback = await analyzeMealLog(tracking.mealLog, profile);
      setLogAnalysis(feedback);
    } catch (err: any) {
      console.error('Meal log analysis failed:', err);
      setAnalysisError(err.message || 'Could not analyze meal log.');
    } finally {
      setIsAnalyzingLog(false);
    }
  };

  // Water calculations
  const addWater = (ml: number) => {
    setTracking((prev) => ({
      ...prev,
      waterIntakeMl: Math.max(0, prev.waterIntakeMl + ml),
    }));
  };

  const addServing = (count: number) => {
    setTracking((prev) => ({
      ...prev,
      fruitVegServings: Math.max(0, prev.fruitVegServings + count),
    }));
  };

  const totalCaloriesLogged = tracking.mealLog.reduce((acc, m) => acc + (m.kcal || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Utensils className="w-6 h-6 text-blue-600" />
          <span>{t.trackerHeader}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Multimodal visual plate scanner, macro tracking, hydration logs, and AI coaching.
        </p>
      </div>

      {/* SECTION 1: AI Visual Meal Plate Scanner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>{t.scannerHeader}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.scannerPrompt}
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 w-fit">
            Gemini Multimodal Vision
          </span>
        </div>

        {scanError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Upload / Preview Area */}
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                selectedImage
                  ? 'border-blue-400 bg-blue-50/20 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedImage ? (
                <div className="space-y-3">
                  <img
                    src={selectedImage}
                    alt="Plate preview"
                    className="max-h-56 mx-auto rounded-xl object-cover shadow-sm"
                  />
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    Click to choose a different photo
                  </p>
                </div>
              ) : (
                <div className="py-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    Upload or Snap Meal Plate Photo
                  </h4>
                  <p className="text-xs text-slate-400">
                    Supports JPG, PNG, WEBP (food plate, thali, bowl, or snack)
                  </p>
                </div>
              )}
            </div>

            {selectedImage && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={scannerNotes}
                  onChange={(e) => setScannerNotes(e.target.value)}
                  placeholder="Optional notes (e.g. 2 phulkas, made with olive oil)..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />

                <button
                  onClick={handleScanPlate}
                  disabled={isScanning}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Analyzing Dishes with AI Vision...' : '✨ Analyze Meal Plate'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div>
            {scanResult ? (
              <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Plate Identification
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {scanResult.confidence} confidence
                    </span>
                  </div>

                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Total: ~{scanResult.total.kcal} kcal
                  </div>
                </div>

                {/* Macro Summary Pills */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Protein</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {scanResult.total.protein_g}g
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Carbs</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {scanResult.total.carbs_g}g
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Fat</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {scanResult.total.fat_g}g
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Dishes & Portion Estimates:
                  </span>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {scanResult.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </span>
                          <span className="text-slate-400 text-[11px] block">
                            {item.portion} (~{item.portion_g}g)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            ~{item.kcal} kcal
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            P: {item.protein_g}g | C: {item.carbs_g}g | F: {item.fat_g}g
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Dietitian Note */}
                {scanResult.dietitianNote && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                    <strong>Dietitian Insight:</strong> {scanResult.dietitianNote}
                  </div>
                )}

                {/* Booster Tip */}
                {scanResult.boosterTip && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                    <strong>💡 Nutrient Booster:</strong> {scanResult.boosterTip}
                  </div>
                )}

                {/* Add to Log Button */}
                <button
                  onClick={handleAddScannedToLog}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Scanned Meal (~{scanResult.total.kcal} kcal)</span>
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/30">
                <Info className="w-8 h-8 mb-2 opacity-50 text-blue-500" />
                <p className="text-xs">
                  Upload an image of your breakfast, lunch, or dinner on the left to see instant visual identification and nutrient estimation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Daily Log & Habit Trackers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Meal Log (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-600" />
                <span>{t.logHeader}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total Logged Today: <strong className="text-amber-600">{totalCaloriesLogged} kcal</strong> / {profile.assessment.target || 2000} kcal
              </p>
            </div>

            <button
              onClick={handleAnalyzeLog}
              disabled={isAnalyzingLog || tracking.mealLog.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-100 dark:hover:bg-purple-900 transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingLog ? 'animate-spin' : ''}`} />
              <span>{isAnalyzingLog ? 'Analyzing...' : t.btnAnalyzeLog}</span>
            </button>
          </div>

          {analysisError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{analysisError}</span>
            </div>
          )}

          {/* AI Coach Analysis Output Card */}
          {logAnalysis && (
            <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 p-4 rounded-xl text-xs text-slate-800 dark:text-slate-200 space-y-2">
              <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>{t.logAnalysisTitle}</span>
              </div>
              <div className="leading-relaxed whitespace-pre-line">{logAnalysis}</div>
            </div>
          )}

          {/* Quick Manual Entry Form */}
          <form onSubmit={handleAddManualMeal} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-3">
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealItem['mealType'])}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={mealText}
                  onChange={(e) => setMealText(e.target.value)}
                  placeholder="e.g. 1 bowl Moong Dal Khichdi + Curd"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  value={mealKcal}
                  onChange={(e) => setMealKcal(e.target.value)}
                  placeholder="kcal (opt)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-1">
                <button
                  type="submit"
                  className="w-full h-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Meals List */}
          <div className="space-y-2">
            {tracking.mealLog.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
                {tracking.mealLog.map((meal) => (
                  <div
                    key={meal.id}
                    className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {meal.mealType}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {meal.text}
                        </span>
                        <span className="text-[11px] text-slate-400 block">{meal.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {meal.kcal && (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          ~{meal.kcal} kcal
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="text-slate-400 hover:text-rose-500 transition cursor-pointer p-1"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                {t.logEmpty}
              </div>
            )}
          </div>
        </div>

        {/* Right: Water & Fruit/Veg Trackers (1 Col) */}
        <div className="space-y-6">
          {/* Hydration Tracker */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  <span>{t.waterHeader}</span>
                </h3>
                <p className="text-[11px] text-slate-400">{t.waterGoal}</p>
              </div>
              <span className="text-base font-black text-sky-600 dark:text-sky-400">
                {(tracking.waterIntakeMl / 1000).toFixed(2)} L
              </span>
            </div>

            {/* Glasses Visual */}
            <div className="flex flex-wrap gap-1.5 justify-center py-2">
              {Array.from({ length: 14 }).map((_, i) => {
                const filled = (i + 1) * 250 <= tracking.waterIntakeMl;
                return (
                  <div
                    key={i}
                    onClick={() => setTracking((prev) => ({ ...prev, waterIntakeMl: (i + 1) * 250 }))}
                    className={`w-7 h-9 rounded-md border flex items-end p-0.5 cursor-pointer transition ${
                      filled
                        ? 'border-sky-500 bg-sky-100 dark:bg-sky-950 text-sky-600'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                    }`}
                    title={`Glass ${i + 1} (250ml)`}
                  >
                    <div
                      className={`w-full rounded-xs transition-all ${
                        filled ? 'h-full bg-sky-500' : 'h-1 bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => addWater(250)}
                className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.btnAddWater}</span>
              </button>
              <button
                onClick={() => setTracking((prev) => ({ ...prev, waterIntakeMl: 0 }))}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                {t.btnResetWater}
              </button>
            </div>
          </div>

          {/* Fruit & Vegetable Servings Tracker */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>{t.servingsHeader}</span>
                </h3>
                <p className="text-[11px] text-slate-400">Target: 5 servings (400g)</p>
              </div>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {tracking.fruitVegServings} / 5
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => addServing(1)}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.btnAddServing}</span>
              </button>
              <button
                onClick={() => setTracking((prev) => ({ ...prev, fruitVegServings: 0 }))}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                {t.btnResetWater}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
