import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ProfileView } from './components/ProfileView';
import { DietPlanView } from './components/DietPlanView';
import { TrackingView } from './components/TrackingView';
import { RecipesView } from './components/RecipesView';
import { ReportsView } from './components/ReportsView';
import { GuidanceView } from './components/GuidanceView';
import { SearchAndChatView } from './components/SearchAndChatView';
import { SplashAnimation } from './components/SplashAnimation';
import { AuthModal } from './components/AuthModal';
import { UserProfile, DailyTracking, DietPlan, SupportedLanguage } from './types';
import { calculateAssessment } from './utils/nutritionCalculator';
import {
  initAuthListener,
  validateFirestoreConnection,
  syncProfileToFirestore,
  loadProfileFromFirestore,
  syncTrackingToFirestore,
  syncDietPlanToFirestore,
  trackEvent,
} from './services/firebase';
import type { User } from 'firebase/auth';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Manya Patel',
  age: 26,
  gender: 'Female',
  weight: 62,
  height: 165,
  activity: 'Moderate',
  dietaryPreference: 'Vegetarian',
  goal: 'Weight Loss',
  medicalConditions: 'None',
  allergies: 'None',
  likesDislikes: 'Prefers homemade Indian meals, lentils, salads, oats and millets',
  photoUrl: null,
  assessment: {
    bmi: 22.8,
    bmiStatus: 'Normal Weight (Optimal)',
    idealWeightRange: '50 - 64 kg',
    bmr: 1386,
    tdee: 2148,
    target: 1700,
    proteinGoal: 87,
    carbGoal: 205,
    fatGoal: 53,
    fiberGoal: 24,
    waterGoalLiters: 3.5,
  },
  aiSummary:
    'Your BMI is 22.8 kg/m², which sits squarely in the optimal healthy range. For your goal of healthy fat loss with steady metabolic vitality, your target is calibrated to 1,700 kcal/day with 87g of clean protein. Focus on diverse dietary fiber from lentils, ragi, and fresh seasonal vegetables while maintaining 3.5 liters of hydration daily.',
};

const DEFAULT_TRACKING: DailyTracking = {
  waterIntakeMl: 1750, // 7 glasses
  fruitVegServings: 3,
  mealLog: [
    {
      id: '1',
      mealType: 'Breakfast',
      text: 'Oatmeal porridge with chia seeds, chopped almonds and 1 banana',
      kcal: 380,
      protein_g: 12,
      carbs_g: 62,
      fat_g: 9,
      time: '08:30 AM',
    },
    {
      id: '2',
      mealType: 'Lunch',
      text: '2 Multigrain Rotis, 1 bowl Tadka Moong Dal, Palak Paneer & Cucumber Salad',
      kcal: 540,
      protein_g: 24,
      carbs_g: 68,
      fat_g: 16,
      time: '01:15 PM',
    },
  ],
  reminders: [
    { id: '1', time: '08:00 AM', type: 'Meal', note: 'Balanced Breakfast', enabled: true },
    { id: '2', time: '11:00 AM', type: 'Water', note: 'Hydration Glass #3', enabled: true },
    { id: '3', time: '01:30 PM', type: 'Meal', note: 'Nutritious Lunch', enabled: true },
    { id: '4', time: '04:30 PM', type: 'Meal', note: '4 PM Healthy Snack', enabled: true },
    { id: '5', time: '07:30 PM', type: 'Meal', note: 'Light Dinner', enabled: true },
  ],
  date: new Date().toISOString().split('T')[0],
};

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('vitaboost-theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    } catch {
      return false;
    }
  });

  // Language state
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem('vitaboost-lang');
      if (stored === 'en' || stored === 'hi' || stored === 'gu') return stored;
    } catch {}
    return 'en';
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Splash screen state (shows once on initial load, dismissible)
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // Show splash on new session
    return sessionStorage.getItem('vitaboost-splash-seen') !== 'true';
  });

  const handleSplashDismiss = () => {
    sessionStorage.setItem('vitaboost-splash-seen', 'true');
    setShowSplash(false);
  };

  // Profile state with localStorage support for both vitaboost-profile and trackandtreat-profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored =
        localStorage.getItem('vitaboost-profile') ||
        localStorage.getItem('trackandtreat-profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          // Re-calculate assessment if needed
          const assessment = calculateAssessment({
            weight: parsed.weight,
            height: parsed.height,
            age: parsed.age,
            gender: parsed.gender || 'Female',
            activity: parsed.activity || 'Moderate',
            goal: parsed.goal || 'Weight Loss',
            medicalConditions: parsed.medicalConditions,
          });
          return { ...DEFAULT_PROFILE, ...parsed, assessment };
        }
      }
    } catch (e) {
      console.warn('Error reading profile from localStorage:', e);
    }
    return DEFAULT_PROFILE;
  });

  // Daily Tracking state
  const [tracking, setTracking] = useState<DailyTracking>(() => {
    try {
      const stored = localStorage.getItem('vitaboost-tracking');
      if (stored) {
        const parsed = JSON.parse(stored);
        const today = new Date().toISOString().split('T')[0];
        if (parsed && parsed.date === today) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading tracking from localStorage:', e);
    }
    return DEFAULT_TRACKING;
  });

  // Diet Plan state
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(() => {
    try {
      const stored = localStorage.getItem('vitaboost-dietplan');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  });

  // Firebase current user
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initialize Firebase Auth, Firestore connection, and Google Analytics
  useEffect(() => {
    validateFirestoreConnection().catch((err) => {
      console.warn('[VitaBoost Diagnostic] Firestore connection check:', err);
    });
    trackEvent('app_opened', { timestamp: new Date().toISOString() });

    const unsubscribe = initAuthListener(async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          // Attempt restoring profile from Firestore
          const remoteProfile = await loadProfileFromFirestore(user.uid);
          if (remoteProfile && remoteProfile.name) {
            setProfile((prev) => ({
              ...prev,
              ...remoteProfile,
              assessment: calculateAssessment({
                weight: remoteProfile.weight ?? prev.weight,
                height: remoteProfile.height ?? prev.height,
                age: remoteProfile.age ?? prev.age,
                gender: remoteProfile.gender ?? prev.gender,
                activity: remoteProfile.activity ?? prev.activity,
                goal: remoteProfile.goal ?? prev.goal,
                medicalConditions: remoteProfile.medicalConditions ?? prev.medicalConditions,
              }),
            }));
          }
        }
      } catch (err) {
        console.warn('[VitaBoost Diagnostic] Profile restoration error:', err);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Sync theme to document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vitaboost-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vitaboost-theme', 'light');
    }
  }, [isDarkMode]);

  // Sync language to document element
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('vitaboost-lang', language);
  }, [language]);

  // Persist tracking state & sync to Firestore
  useEffect(() => {
    try {
      localStorage.setItem('vitaboost-tracking', JSON.stringify(tracking));
    } catch (e) {
      console.warn('LocalStorage tracking save error:', e);
    }
    if (currentUser?.uid) {
      syncTrackingToFirestore(currentUser.uid, tracking).catch((err) => {
        console.warn('[VitaBoost Diagnostic] Tracking sync warning:', err);
      });
    }
  }, [tracking, currentUser]);

  // Persist profile state & sync to Firestore
  useEffect(() => {
    try {
      localStorage.setItem('vitaboost-profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('LocalStorage profile save error:', e);
    }
    if (currentUser?.uid) {
      syncProfileToFirestore(currentUser.uid, profile).catch((err) => {
        console.warn('[VitaBoost Diagnostic] Profile sync warning:', err);
      });
    }
  }, [profile, currentUser]);

  // Persist diet plan & sync to Firestore
  useEffect(() => {
    if (dietPlan) {
      try {
        localStorage.setItem('vitaboost-dietplan', JSON.stringify(dietPlan));
      } catch (e) {
        console.warn('LocalStorage diet plan save error:', e);
      }
      if (currentUser?.uid) {
        syncDietPlanToFirestore(currentUser.uid, dietPlan).catch((err) => {
          console.warn('[VitaBoost Diagnostic] Diet plan sync warning:', err);
        });
      }
    }
  }, [dietPlan, currentUser]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    trackEvent('tab_viewed', { tab: newTab });
  };

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-blue-500 selection:text-white">
      {/* Starting Splash Animation */}
      {showSplash && <SplashAnimation onComplete={handleSplashDismiss} />}

      {/* Account Login / Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onReplaySplash={() => setShowSplash(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            profile={profile}
            setProfile={setProfile}
            tracking={tracking}
            setActiveTab={handleTabChange}
            language={language}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            setProfile={setProfile}
            language={language}
          />
        )}

        {activeTab === 'plan' && (
          <DietPlanView
            profile={profile}
            dietPlan={dietPlan}
            setDietPlan={setDietPlan}
            language={language}
          />
        )}

        {activeTab === 'tracking' && (
          <TrackingView
            profile={profile}
            tracking={tracking}
            setTracking={setTracking}
            language={language}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipesView profile={profile} language={language} />
        )}

        {activeTab === 'reports' && <ReportsView language={language} />}

        {activeTab === 'guidance' && <GuidanceView language={language} />}

        {activeTab === 'search' && (
          <SearchAndChatView
            profile={profile}
            initialTab="search"
            language={language}
          />
        )}

        {activeTab === 'chat' && (
          <SearchAndChatView
            profile={profile}
            initialTab="chat"
            language={language}
          />
        )}
      </main>

      {/* Clinical Disclaimer & Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-6 mt-12 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            VitaBoost NutriApp • Personalized Clinical Dietetics
          </p>
          <p className="max-w-3xl mx-auto text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
            Notice: All calorie estimates, visual meal plate estimations, macronutrient allocations, and AI dietetic recommendations are provided for lifestyle, nutritional education, and habit tracking. They do not constitute formal medical prescription or diagnosis. Individuals with acute or chronic medical conditions should consult their licensed physician or clinical dietitian.
          </p>
        </div>
      </footer>
    </div>
  );
}
