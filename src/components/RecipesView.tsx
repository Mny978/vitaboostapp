import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  UtensilsCrossed,
  ShieldCheck,
  ChefHat,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { UserProfile, SupportedLanguage } from '../types';
import { translations } from '../utils/translations';
import {
  generateTherapeuticRecipe,
  generateCreativeIngredientRecipe,
} from '../services/geminiService';

interface RecipesViewProps {
  profile: UserProfile;
  language: SupportedLanguage;
}

const POPULAR_CONDITIONS = [
  'Type 2 Diabetes',
  'PCOS / Hormonal Balance',
  'Fatty Liver (NAFLD)',
  'Hypertension (Low Sodium)',
  'Hypothyroidism',
  'High Uric Acid / Gout',
  'Gut Health & Acid Reflux',
  'Weight Loss & Satiety',
];

const POPULAR_INGREDIENTS = [
  'Moringa (Drumstick leaves)',
  'Ragi (Finger Millet)',
  'Sprouted Green Moong',
  'Flaxseeds & Chia',
  'Oats & Barley',
  'Methi (Fenugreek seeds & leaves)',
  'Ash Gourd (Petha)',
  'Tofu / Paneer',
];

export const RecipesView: React.FC<RecipesViewProps> = ({ profile, language }) => {
  const t = translations[language] || translations.en;
  const [activeTab, setActiveTab] = useState<'therapeutic' | 'creative'>('therapeutic');
  const [conditionInput, setConditionInput] = useState(
    profile.medicalConditions && profile.medicalConditions !== 'None'
      ? profile.medicalConditions.split(',')[0].trim()
      : 'Type 2 Diabetes'
  );
  const [ingredientInput, setIngredientInput] = useState('Moringa (Drumstick leaves)');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipesOutput, setRecipesOutput] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setRecipesOutput(null);

    try {
      if (activeTab === 'therapeutic') {
        const result = await generateTherapeuticRecipe(conditionInput);
        setRecipesOutput(result);
      } else {
        const result = await generateCreativeIngredientRecipe(ingredientInput);
        setRecipesOutput(result);
      }
    } catch (err: any) {
      console.error('Recipe generation error:', err);
      setErrorMessage(err.message || 'Failed to generate recipes. Please check your backend.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!recipesOutput) return;
    navigator.clipboard.writeText(recipesOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <span>{t.recipesMainHeader}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Explore evidence-based therapeutic recipes for clinical conditions and creative culinary superfood boosters.
        </p>

        {/* Tab Switcher */}
        <div className="flex space-x-2 mt-4 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <button
            onClick={() => {
              setActiveTab('therapeutic');
              setRecipesOutput(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'therapeutic'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.therapeuticTab}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('creative');
              setRecipesOutput(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'creative'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>{t.creativeTab}</span>
          </button>
        </div>

        {/* Controls */}
        <div className="mt-4 space-y-3">
          {activeTab === 'therapeutic' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select or Type Medical Condition:
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {POPULAR_CONDITIONS.map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setConditionInput(cond)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                      conditionInput.toLowerCase() === cond.toLowerCase()
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-700 font-bold'
                        : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={conditionInput}
                  onChange={(e) => setConditionInput(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes, High Uric Acid, PCOS..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !conditionInput.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Crafting Recipes...' : t.btnGenerateRecipe}</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select or Type Superfood Ingredient:
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {POPULAR_INGREDIENTS.map((ing) => (
                  <button
                    key={ing}
                    type="button"
                    onClick={() => setIngredientInput(ing)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                      ingredientInput.toLowerCase() === ing.toLowerCase()
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold'
                        : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {ing}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  placeholder="e.g. Moringa, Ragi, Flaxseeds, Ash Gourd..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !ingredientInput.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Crafting Dishes...' : t.btnGenerateRecipe}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Output Display */}
      {recipesOutput && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
              <span>
                {activeTab === 'therapeutic'
                  ? `Clinical Recipes for ${conditionInput}`
                  : `Superfood Creations featuring ${ingredientInput}`}
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
            {recipesOutput}
          </div>
        </div>
      )}
    </div>
  );
};
