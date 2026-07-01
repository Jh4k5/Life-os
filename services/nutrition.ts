// services/nutrition.ts
// Nutrition math + the AI meal-estimate seam. All guidance here is general and
// non-prescriptive: we surface ranges/estimates, never medical instructions.
import type { MealEstimate } from './types';
import { getClient } from './supabase';

export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'cut' | 'maintain' | 'bulk';

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Mifflin–St Jeor Basal Metabolic Rate (kcal/day). */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (sex === 'male' ? 5 : -161));
}

/** Total Daily Energy Expenditure. */
export function tdee(bmrValue: number, activity: Activity): number {
  return Math.round(bmrValue * ACTIVITY_FACTOR[activity]);
}

/** A gentle target range around TDEE for the chosen goal (± not exact). */
export function targetCalories(tdeeValue: number, goal: Goal): number {
  if (goal === 'cut') return Math.round(tdeeValue - 400);
  if (goal === 'bulk') return Math.round(tdeeValue + 300);
  return tdeeValue;
}

/** A simple, transparent macro split (protein-forward). Grams. */
export function macroSplit(calories: number): { protein: number; carbs: number; fat: number } {
  const protein = Math.round((calories * 0.3) / 4);
  const carbs = Math.round((calories * 0.4) / 4);
  const fat = Math.round((calories * 0.3) / 9);
  return { protein, carbs, fat };
}

/**
 * Estimate a meal's macros from a photo/description. Tries the server (Gemini
 * vision via the `nutrition` Edge Function); returns null on any failure so the
 * UI stays honest and offers manual entry — we never fabricate numbers.
 */
export async function estimateMeal(input: { uri?: string; text?: string }): Promise<MealEstimate | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const { data, error } = await client.functions.invoke('nutrition', { body: input });
    if (error || !data || typeof data.calories !== 'number') return null;
    return {
      name: data.name ?? '',
      calories: data.calories,
      protein: data.protein ?? 0,
      carbs: data.carbs ?? 0,
      fat: data.fat ?? 0,
      aiEstimated: true,
    };
  } catch {
    return null;
  }
}
