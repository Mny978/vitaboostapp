import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Apple,
  Pill,
  Ban,
  Heart,
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../utils/translations';
import { getNutrientGuidance } from '../services/geminiService';

interface GuidanceViewProps {
  language: SupportedLanguage;
}

const CONDITIONS = [
  'Type 2 Diabetes',
  'Hypertension (High BP)',
  'PCOS / PCOD',
  'Hypothyroidism',
  'Fatty Liver (NAFLD)',
  'Hyperuricemia / Gout',
  'Dyslipidemia (High Cholesterol)',
  'Kidney Health / Pre-dialysis',
];

export const GuidanceView: React.FC<GuidanceViewProps> = ({ language }) => {
  const t = translations[language] || translations.en;
  const [selectedCondition, setSelectedCondition] = useState('Type 2 Diabetes');
  const [activeMode, setActiveMode] = useState<
    'nutrients_and_avoid' | 'food_sources' | 'drug_interactions'
  >('nutrients_and_avoid');

  const [isLoading, setIsLoading] = useState(false);
  const [guidanceOutput, setGuidanceOutput] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFetchGuidance = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setGuidanceOutput(null);

    try {
      const result = await getNutrientGuidance(selectedCondition, activeMode);
      setGuidanceOutput(result);
    } catch (err: any) {
      console.error('Guidance error:', err);
      setErrorMessage(err.message || 'Failed to fetch nutrient guidance.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!guidanceOutput) return;
    navigator.clipboard.writeText(guidanceOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span>{t.guidanceHeader}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Clinical nutrient priorities, Indian superfood sources, and critical food-drug interaction warnings.
          </p>
        </div>

        {/* Condition Selector Chips */}
        <div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Select Health Condition / Concern:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CONDITIONS.map((cond) => (
              <button
                key={cond}
                onClick={() => {
                  setSelectedCondition(cond);
                  setGuidanceOutput(null);
                }}
                className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  selectedCondition === cond
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => {
              setActiveMode('nutrients_and_avoid');
              setGuidanceOutput(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'nutrients_and_avoid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{t.tabNutrientsAvoid}</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('food_sources');
              setGuidanceOutput(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'food_sources'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>{t.tabFoodSources}</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('drug_interactions');
              setGuidanceOutput(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'drug_interactions'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>{t.tabDrugInteractions}</span>
          </button>
        </div>

        <button
          onClick={handleFetchGuidance}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Retrieving Clinical Guidance...' : 'Generate Guidance'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Output Display */}
      {guidanceOutput && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>
                {selectedCondition} •{' '}
                {activeMode === 'nutrients_and_avoid'
                  ? 'Nutrients & Foods to Avoid'
                  : activeMode === 'food_sources'
                  ? 'Indian Superfood Sources'
                  : 'Food-Drug Interactions'}
              </span>
            </h3>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-3">
            {guidanceOutput}
          </div>
        </div>
      )}
    </div>
  );
};
