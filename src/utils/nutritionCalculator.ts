import { Gender, ActivityLevel, PrimaryGoal, HealthAssessment } from '../types';

export function calculateAssessment(params: {
  weight: number | null;
  height: number | null;
  age: number | null;
  gender: Gender;
  activity: ActivityLevel;
  goal: PrimaryGoal;
  medicalConditions?: string;
}): HealthAssessment {
  const { weight, height, age, gender, activity, goal, medicalConditions = '' } = params;

  if (!weight || !height || !age || weight <= 0 || height <= 0 || age <= 0) {
    return {
      bmi: null,
      bmiStatus: 'Incomplete Details',
      idealWeightRange: '--',
      bmr: null,
      tdee: null,
      target: null,
      proteinGoal: null,
      carbGoal: null,
      fatGoal: null,
      fiberGoal: null,
      waterGoalLiters: 3.5,
    };
  }

  // BMI Calculation
  const heightM = height / 100;
  const bmiVal = weight / (heightM * heightM);
  const bmi = Math.round(bmiVal * 10) / 10;

  // BMI Status (using Asian / WHO recommended cutoffs)
  let bmiStatus = 'Normal Weight';
  if (bmi < 18.5) {
    bmiStatus = 'Underweight';
  } else if (bmi < 23) {
    bmiStatus = 'Normal Weight (Optimal)';
  } else if (bmi < 25) {
    bmiStatus = 'Overweight (Pre-Obese / Asian cutoff)';
  } else if (bmi < 30) {
    bmiStatus = 'Obese Class I';
  } else {
    bmiStatus = 'Obese Class II+';
  }

  // Ideal weight range for height (BMI 18.5 - 23.5 kg/m2)
  const minIdeal = Math.round(18.5 * heightM * heightM);
  const maxIdeal = Math.round(23.5 * heightM * heightM);
  const idealWeightRange = `${minIdeal} - ${maxIdeal} kg`;

  // Mifflin-St Jeor BMR
  let bmrVal = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'Male') {
    bmrVal += 5;
  } else if (gender === 'Female') {
    bmrVal -= 161;
  } else {
    bmrVal -= 78;
  }
  const bmr = Math.round(bmrVal);

  // Activity Multipliers
  const activityFactors: Record<ActivityLevel, number> = {
    Sedentary: 1.2,
    Light: 1.375,
    Moderate: 1.55,
    High: 1.725,
    Extreme: 1.9,
  };
  const factor = activityFactors[activity] || 1.2;
  const tdee = Math.round(bmr * factor);

  // Goal adjustment
  let target = tdee;
  if (goal === 'Weight Loss') {
    target = Math.max(1200, tdee - 450);
  } else if (goal === 'Weight Gain') {
    target = tdee + 400;
  } else if (goal === 'Muscle Gain') {
    target = tdee + 300;
  } else if (goal === 'Blood Sugar Control') {
    target = Math.max(1300, tdee - 250);
  }

  // Check for kidney/renal condition (requires moderate protein restriction if clinically noted)
  const isKidneyIssue = /kidney|renal|creatinine/i.test(medicalConditions);

  // Protein calculation
  let proteinPerKg = 1.2;
  if (goal === 'Muscle Gain') {
    proteinPerKg = 1.7;
  } else if (goal === 'Weight Loss') {
    proteinPerKg = 1.4;
  }
  if (isKidneyIssue) {
    proteinPerKg = 0.8; // conservative clinical restriction
  }

  const proteinGoal = Math.round(weight * proteinPerKg);
  const proteinCalories = proteinGoal * 4;

  // Fat calculation (25-30% of total calories)
  const fatCalories = target * 0.28;
  const fatGoal = Math.round(fatCalories / 9);

  // Carbs from remaining calories
  const remainingCals = Math.max(0, target - proteinCalories - fatCalories);
  const carbGoal = Math.round(remainingCals / 4);

  // Fiber calculation (14g per 1000 kcal)
  const fiberGoal = Math.round((target / 1000) * 14);

  // Recommended hydration (35ml per kg body weight, min 2.5L, standard 3.5L)
  const waterCalc = (weight * 35) / 1000;
  const waterGoalLiters = Math.max(2.5, Math.min(4.5, Math.round(waterCalc * 10) / 10));

  return {
    bmi,
    bmiStatus,
    idealWeightRange,
    bmr,
    tdee,
    target,
    proteinGoal,
    carbGoal,
    fatGoal,
    fiberGoal,
    waterGoalLiters,
  };
}
