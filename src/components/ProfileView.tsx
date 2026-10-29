import React, { useState } from 'react';
import {
  User,
  Scale,
  Ruler,
  Calendar,
  Flame,
  Activity,
  ShieldAlert,
  Sparkles,
  Save,
  Check,
  AlertCircle,
  Heart,
} from 'lucide-react';
import {
  UserProfile,
  Gender,
  ActivityLevel,
  DietaryPreference,
  PrimaryGoal,
  SupportedLanguage,
} from '../types';
import { translations } from '../utils/translations';
import { calculateAssessment } from '../utils/nutritionCalculator';
import { getAiHealthSummary } from '../services/geminiService';

interface ProfileViewProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  language: SupportedLanguage;
}

const COMMON_CONDITIONS = [
  'Type 2 Diabetes / Pre-diabetes',
  'Hypertension (High BP)',
  'PCOS / PCOD',
  'Hypothyroidism',
  'Fatty Liver (NAFLD)',
  'High Uric Acid / Gout',
  'High Cholesterol / Dyslipidemia',
  'Acid Reflux / GERD',
  'Kidney / Renal Concern',
  'None',
];

const COMMON_ALLERGIES = [
  'Gluten / Celiac',
  'Lactose / Dairy',
  'Peanuts',
  'Tree Nuts',
  'Soy',
  'Eggs',
  'Shellfish',
  'None',
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  setProfile,
  language,
}) => {
  const t = translations[language] || translations.en;

  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recalculate assessment preview whenever weight/height/age/activity/goal changes
  const handleNumericChange = (field: keyof UserProfile, val: number | null) => {
    const updated = { ...formData, [field]: val };
    const assessment = calculateAssessment({
      weight: updated.weight,
      height: updated.height,
      age: updated.age,
      gender: updated.gender,
      activity: updated.activity,
      goal: updated.goal,
      medicalConditions: updated.medicalConditions,
    });
    updated.assessment = assessment;
    setFormData(updated);
  };

  const handleFieldChange = (field: keyof UserProfile, val: any) => {
    const updated = { ...formData, [field]: val };
    const assessment = calculateAssessment({
      weight: updated.weight,
      height: updated.height,
      age: updated.age,
      gender: updated.gender,
      activity: updated.activity,
      goal: updated.goal,
      medicalConditions: updated.medicalConditions,
    });
    updated.assessment = assessment;
    setFormData(updated);
  };

  const toggleCondition = (cond: string) => {
    if (cond === 'None') {
      handleFieldChange('medicalConditions', 'None');
      return;
    }
    const current = (formData.medicalConditions || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== 'None');

    let updated: string[];
    if (current.includes(cond)) {
      updated = current.filter((c) => c !== cond);
    } else {
      updated = [...current, cond];
    }
    handleFieldChange('medicalConditions', updated.join(', ') || 'None');
  };

  const toggleAllergy = (allergy: string) => {
    if (allergy === 'None') {
      handleFieldChange('allergies', 'None');
      return;
    }
    const current = (formData.allergies || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== 'None');

    let updated: string[];
    if (current.includes(allergy)) {
      updated = current.filter((c) => c !== allergy);
    } else {
      updated = [...current, allergy];
    }
    handleFieldChange('allergies', updated.join(', ') || 'None');
  };

  const handleSave = () => {
    const assessment = calculateAssessment({
      weight: formData.weight,
      height: formData.height,
      age: formData.age,
      gender: formData.gender,
      activity: formData.activity,
      goal: formData.goal,
      medicalConditions: formData.medicalConditions,
    });
    const finalProfile = { ...formData, assessment };
    setProfile(finalProfile);
    try {
      localStorage.setItem('vitaboost-profile', JSON.stringify(finalProfile));
      localStorage.setItem('trackandtreat-profile', JSON.stringify(finalProfile));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleGenerateAiSummary = async () => {
    handleSave();
    setIsGeneratingAiSummary(true);
    setErrorMsg(null);
    try {
      const summary = await getAiHealthSummary(formData);
      const updated = { ...formData, aiSummary: summary };
      setFormData(updated);
      setProfile(updated);
      localStorage.setItem('vitaboost-profile', JSON.stringify(updated));
    } catch (err: any) {
      console.error('AI summary error:', err);
      setErrorMsg(err.message || 'AI request failed.');
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  const assessment = formData.assessment;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            <span>{t.profileHeader}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure your biometric data and clinical safeguards for tailored diet plans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Saved Successfully!' : t.btnSaveProfile}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Form on Left, Calculated Assessment on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Biometrics Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              <span>{t.metricHeader}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.labelName}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g. Manya Patel"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.labelAge}
                </label>
                <input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) =>
                    handleNumericChange('age', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="e.g. 28"
                  min="10"
                  max="120"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.labelGender}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleFieldChange('gender', e.target.value as Gender)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Male">{t.genderMale}</option>
                  <option value="Female">{t.genderFemale}</option>
                  <option value="Other">{t.genderOther}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.labelWeight}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={formData.weight || ''}
                    onChange={(e) =>
                      handleNumericChange(
                        'weight',
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="e.g. 68.5"
                    min="30"
                    max="300"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <span className="absolute right-3 top-2 text-xs font-medium text-slate-400">
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.labelHeight}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={formData.height || ''}
                    onChange={(e) =>
                      handleNumericChange(
                        'height',
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="e.g. 172"
                    min="100"
                    max="250"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <span className="absolute right-3 top-2 text-xs font-medium text-slate-400">
                    cm
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.labelActivity}
                </label>
                <select
                  value={formData.activity}
                  onChange={(e) =>
                    handleFieldChange('activity', e.target.value as ActivityLevel)
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Sedentary">Sedentary (Desk job / little activity)</option>
                  <option value="Light">Light (Exercise 1-3 days/week)</option>
                  <option value="Moderate">Moderate (Exercise 3-5 days/week)</option>
                  <option value="High">High (Hard exercise 6-7 days/week)</option>
                  <option value="Extreme">Extreme (Athlete / Heavy physical labor)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dietary & Goals Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Dietary Lifestyle & Goals</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.labelDiet}
                </label>
                <select
                  value={formData.dietaryPreference}
                  onChange={(e) =>
                    handleFieldChange('dietaryPreference', e.target.value as DietaryPreference)
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Vegetarian">Vegetarian (Lacto-veg)</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan (Plant-based 100%)</option>
                  <option value="Jain">Jain (No root vegetables/onion/garlic)</option>
                  <option value="Eggetarian">Eggetarian (Vegetarian + Eggs)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.labelGoal}
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) =>
                    handleFieldChange('goal', e.target.value as PrimaryGoal)
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Weight Loss">Weight Loss (Fat Loss ~450 kcal deficit)</option>
                  <option value="Health Maintenance">Health Maintenance</option>
                  <option value="Muscle Gain">Muscle Gain (High protein surplus)</option>
                  <option value="Blood Sugar Control">Blood Sugar Control (Low glycemic)</option>
                  <option value="Heart Health">Heart Health (Low sodium/saturated fat)</option>
                  <option value="Weight Gain">Weight Gain (Caloric surplus)</option>
                </select>
              </div>
            </div>

            {/* Medical Conditions Chip Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.labelCondition}</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_CONDITIONS.map((cond) => {
                  const isSelected = (formData.medicalConditions || '')
                    .toLowerCase()
                    .includes(cond.toLowerCase().split(' ')[0]);
                  return (
                    <button
                      type="button"
                      key={cond}
                      onClick={() => toggleCondition(cond)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-semibold'
                          : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={formData.medicalConditions}
                onChange={(e) => handleFieldChange('medicalConditions', e.target.value)}
                placeholder="Or type custom medical conditions (comma separated)..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Allergies Chip Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.labelAllergies}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_ALLERGIES.map((allergy) => {
                  const isSelected = (formData.allergies || '')
                    .toLowerCase()
                    .includes(allergy.toLowerCase().split(' ')[0]);
                  return (
                    <button
                      type="button"
                      key={allergy}
                      onClick={() => toggleAllergy(allergy)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        isSelected
                          ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700 font-semibold'
                          : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {allergy}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => handleFieldChange('allergies', e.target.value)}
                placeholder="Or type custom allergies (e.g. Mustard, Sesame, MSG)..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Food Dislikes / Regional preferences */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.labelDislikes}
              </label>
              <input
                type="text"
                value={formData.likesDislikes}
                onChange={(e) => handleFieldChange('likesDislikes', e.target.value)}
                placeholder="e.g., Prefers Gujarati kadhi, dislikes bitter gourd, loves oats and ragi"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Calculated Clinical Assessment Card (1 Col) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-2xl shadow-md space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2 text-blue-200">
              <Heart className="w-5 h-5 text-emerald-400" />
              <span>{t.assessmentHeader}</span>
            </h3>

            <div className="space-y-3 divide-y divide-blue-800/60 text-xs">
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-300">{t.calcBMI}</span>
                <span className="font-bold text-base text-white">
                  {assessment.bmi !== null ? `${assessment.bmi} kg/m²` : '--'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-300">{t.calcBMIStatus}</span>
                <span className="font-semibold text-emerald-300 text-right">
                  {assessment.bmiStatus}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-300">Ideal Weight Range</span>
                <span className="font-semibold text-white">{assessment.idealWeightRange}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-300">Basal Metabolic Rate (BMR)</span>
                <span className="font-semibold text-white">
                  {assessment.bmr ? `${assessment.bmr} kcal` : '--'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-300">{t.calcTDEE}</span>
                <span className="font-semibold text-white">
                  {assessment.tdee ? `${assessment.tdee} kcal` : '--'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 text-amber-300 font-bold">
                <span>{t.calcReqCals} (Target)</span>
                <span className="text-base text-amber-300">
                  {assessment.target ? `${assessment.target} kcal` : '--'}
                </span>
              </div>

              <div className="pt-3 space-y-2">
                <span className="text-slate-300 font-semibold block">{t.macroHeader}</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/10 rounded-lg p-2">
                    <span className="text-[10px] text-slate-300 block">Protein</span>
                    <span className="font-bold text-sm text-blue-300">
                      {assessment.proteinGoal ? `${assessment.proteinGoal}g` : '--'}
                    </span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <span className="text-[10px] text-slate-300 block">Carbs</span>
                    <span className="font-bold text-sm text-amber-300">
                      {assessment.carbGoal ? `${assessment.carbGoal}g` : '--'}
                    </span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <span className="text-[10px] text-slate-300 block">Fat</span>
                    <span className="font-bold text-sm text-emerald-300">
                      {assessment.fatGoal ? `${assessment.fatGoal}g` : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerateAiSummary}
                disabled={isGeneratingAiSummary}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingAiSummary ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAiSummary ? 'Generating AI Analysis...' : t.btnAiSummary}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
