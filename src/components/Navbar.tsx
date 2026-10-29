import React from 'react';
import {
  Apple,
  LayoutDashboard,
  User,
  Calendar,
  UtensilsCrossed,
  BookOpen,
  FileText,
  ShieldCheck,
  Search,
  MessageSquare,
  Moon,
  Sun,
  Globe,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../utils/translations';

import type { User as FirebaseUser } from 'firebase/auth';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onReplaySplash?: () => void;
  currentUser?: FirebaseUser | null;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  isDarkMode,
  setIsDarkMode,
  onReplaySplash,
  currentUser,
  onOpenAuth,
}) => {
  const t = translations[language] || translations.en;

  const navItems = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'profile', label: t.navProfile, icon: User },
    { id: 'plan', label: t.navPlan, icon: Calendar },
    { id: 'tracking', label: t.navTracking, icon: UtensilsCrossed },
    { id: 'recipes', label: t.navRecipes, icon: BookOpen },
    { id: 'reports', label: t.navReports, icon: FileText },
    { id: 'guidance', label: t.navGuidance, icon: ShieldCheck },
    { id: 'search', label: t.navSearch, icon: Search },
    { id: 'chat', label: t.navChat, icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Apple className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  VitaBoost
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  NutriApp
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Personalized Clinical Dietetics
              </p>
            </div>
          </div>

          {/* Actions: Account, Language & Dark mode */}
          <div className="flex items-center gap-2">
            {/* Account Button */}
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
                  {currentUser && !currentUser.isAnonymous && currentUser.email
                    ? currentUser.email[0].toUpperCase()
                    : 'U'}
                </div>
                <span className="hidden sm:inline">
                  {currentUser && !currentUser.isAnonymous
                    ? currentUser.email?.split('@')[0]
                    : 'Sign In'}
                </span>
              </button>
            )}

            {/* Language dropdown */}
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                aria-label="Language selection"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
              </select>
            </div>

            {/* Replay Intro Animation */}
            {onReplaySplash && (
              <button
                onClick={onReplaySplash}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                title="Replay intro animation"
                aria-label="Replay intro animation"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-100 dark:border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
