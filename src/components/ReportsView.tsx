import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  ShieldAlert,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../utils/translations';
import { analyzeLabFindings } from '../services/geminiService';

interface ReportsViewProps {
  language: SupportedLanguage;
}

const SAMPLE_REPORTS = [
  {
    title: 'Diabetic & Metabolic',
    text: 'HbA1c: 7.6%, Fasting Blood Sugar: 142 mg/dL, Postprandial Sugar: 198 mg/dL, Fasting Insulin: 18 uIU/mL.',
  },
  {
    title: 'Dyslipidemia / Heart',
    text: 'Total Cholesterol: 245 mg/dL, LDL: 158 mg/dL, HDL: 38 mg/dL, Triglycerides: 230 mg/dL, VLDL: 46 mg/dL.',
  },
  {
    title: 'Fatty Liver & Uric Acid',
    text: 'Uric Acid: 8.2 mg/dL, SGPT / ALT: 64 U/L, SGOT / AST: 52 U/L, Ultrasound indicates Grade 1 Fatty Liver.',
  },
  {
    title: 'Thyroid & Deficiencies',
    text: 'TSH: 6.2 uIU/mL, Free T4: 0.9 ng/dL, Vitamin D3: 14 ng/mL, Serum Ferritin: 15 ng/mL, Hemoglobin: 11.2 g/dL.',
  },
];

export const ReportsView: React.FC<ReportsViewProps> = ({ language }) => {
  const t = translations[language] || translations.en;
  const [reportText, setReportText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!reportText.trim()) return;
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeLabFindings(reportText.trim());
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Report analysis error:', err);
      setErrorMessage(
        err.message || 'Failed to interpret lab report. Please check your backend connection.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          <span>{t.reportsHeader}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {t.reportsSub}
        </p>

        {/* Quick Sample Chips */}
        <div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
            Load Quick Clinical Sample:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_REPORTS.map((sample) => (
              <button
                key={sample.title}
                onClick={() => setReportText(sample.text)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                + {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div className="pt-2 space-y-3">
          <textarea
            rows={4}
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Type or paste your lab numbers here (e.g. Fasting sugar 135 mg/dL, HbA1c 7.2%, Triglycerides 210 mg/dL)..."
            className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !reportText.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Interpreting Biomarkers with AI...' : t.btnAnalyzeReport}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Analysis Output */}
      {analysisResult && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>Evidence-Based Nutritional Interpretation</span>
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
            {analysisResult}
          </div>
        </div>
      )}
    </div>
  );
};
