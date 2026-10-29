export type Gender = 'Male' | 'Female' | 'Other';

export type ActivityLevel =
  | 'Sedentary'
  | 'Light'
  | 'Moderate'
  | 'High'
  | 'Extreme';

export type DietaryPreference =
  | 'Vegetarian'
  | 'Non-Vegetarian'
  | 'Vegan'
  | 'Jain'
  | 'Eggetarian';

export type PrimaryGoal =
  | 'Weight Loss'
  | 'Weight Gain'
  | 'Health Maintenance'
  | 'Muscle Gain'
  | 'Blood Sugar Control'
  | 'Heart Health';

export interface HealthAssessment {
  bmi: number | null;
  bmiStatus: string;
  idealWeightRange: string;
  bmr: number | null;
  tdee: number | null;
  target: number | null;
  proteinGoal: number | null;
  carbGoal: number | null;
  fatGoal: number | null;
  fiberGoal: number | null;
  waterGoalLiters: number;
}

export interface UserProfile {
  name: string;
  age: number | null;
  gender: Gender;
  weight: number | null; // kg
  height: number | null; // cm
  activity: ActivityLevel;
  dietaryPreference: DietaryPreference;
  goal: PrimaryGoal;
  medicalConditions: string;
  allergies: string;
  likesDislikes: string;
  photoUrl: string | null;
  assessment: HealthAssessment;
  aiSummary?: string;
}

export interface MealItem {
  id: string;
  text: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Other';
  kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  time: string;
  photoUrl?: string;
}

export interface DailyTracking {
  waterIntakeMl: number; // in ml (250ml per glass)
  fruitVegServings: number; // 0 to 8+
  mealLog: MealItem[];
  reminders: { id: string; time: string; type: 'Meal' | 'Water'; note: string; enabled: boolean }[];
  date: string;
}

export interface RoadmapStep {
  title: string;
  detail: string;
  phase?: string;
  icon?: string;
}

export interface DietPlanDayMeal {
  slot: string;
  timeEstimate: string;
  dishName: string;
  portion: string;
  kcal: number;
  macros: { protein: number; carbs: number; fat: number };
  healthNote: string;
}

export interface DietPlanDay {
  dayNumber: number;
  dayTitle: string;
  focusTheme: string;
  totalCalories: number;
  meals: DietPlanDayMeal[];
  tipsForDay: string[];
}

export interface DietPlan {
  days: DietPlanDay[];
  dietitianGeneralGuidance: string;
  hydrationStrategy: string;
  createdDate: string;
  roadmap: RoadmapStep[];
  rawMarkdown?: string;
}

export interface PlateScanResult {
  items: {
    name: string;
    portion: string;
    portion_g: number;
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    category?: string;
  }[];
  total: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  confidence: 'high' | 'medium' | 'low';
  tags: string[];
  dietitianNote: string;
  boosterTip: string;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export type SupportedLanguage = 'en' | 'hi' | 'gu';
