
import { Exercise, MuscleGroup, Difficulty } from "../types";

// CHANGED: Switch to jsDelivr CDN for reliable, fast image serving
const BASE_REPO_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main';
const EXERCISES_JSON_URL = `${BASE_REPO_URL}/dist/exercises.json`;

// Helper to map the DB's muscles to our Enum
const mapMuscleToGroup = (muscle: string): MuscleGroup => {
  if (!muscle) return MuscleGroup.FULL_BODY;
  const m = muscle.toLowerCase();
  if (['abdominals', 'core'].includes(m)) return MuscleGroup.CORE;
  if (['chest', 'pectorals'].includes(m)) return MuscleGroup.CHEST;
  if (['biceps', 'triceps', 'forearms'].includes(m)) return MuscleGroup.ARMS;
  if (['lats', 'middle back', 'lower back', 'traps'].includes(m)) return MuscleGroup.BACK;
  if (['shoulders', 'neck', 'deltoids'].includes(m)) return MuscleGroup.SHOULDERS;
  if (['quadriceps', 'hamstrings', 'calves', 'glutes', 'abductors', 'adductors', 'upper legs', 'lower legs'].includes(m)) return MuscleGroup.LEGS;
  if (['cardio'].includes(m)) return MuscleGroup.CARDIO;
  return MuscleGroup.FULL_BODY;
};

// Helper to map difficulty levels
const mapDifficulty = (level: string): Difficulty => {
  if (!level) return Difficulty.INTERMEDIATE;
  const l = level.toLowerCase();
  if (l === 'beginner') return Difficulty.BEGINNER;
  if (l === 'expert') return Difficulty.ADVANCED;
  return Difficulty.INTERMEDIATE;
};

export const fetchFreeExerciseDb = async (): Promise<Exercise[]> => {
  try {
    const response = await fetch(EXERCISES_JSON_URL);
    if (!response.ok) throw new Error("Failed to fetch exercise database");
    
    const data = await response.json();
    console.log(`Fetched ${data.length} exercises from DB`);

    // Map the raw data to our Exercise interface
    return data.map((item: any, index: number) => {
      let imageUrl = '';
      
      if (item.images && item.images.length > 0) {
          const rawPath = item.images[0]; 
          const cleanPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
          const parts = cleanPath.split('/');
          const encodedParts = parts.map((part: string) => encodeURIComponent(part));
          const encodedPath = encodedParts.join('/');
          
          imageUrl = `${BASE_REPO_URL}/${encodedPath}`;
      }

      return {
        id: `fedb-${index}-${item.id}`,
        name: item.name ? item.name.charAt(0).toUpperCase() + item.name.slice(1) : 'Unknown',
        description: item.instructions && item.instructions.length > 0 
            ? item.instructions.join(' ') 
            : 'No description available.',
        muscleGroup: item.primaryMuscles && item.primaryMuscles.length > 0 
          ? mapMuscleToGroup(item.primaryMuscles[0]) 
          : MuscleGroup.FULL_BODY,
        difficulty: item.level ? mapDifficulty(item.level) : Difficulty.INTERMEDIATE,
        equipment: item.equipment ? [item.equipment] : ['Bodyweight'],
        videoUrl: imageUrl
      };
    });

  } catch (error) {
    console.error("Error loading Free Exercise DB:", error);
    throw error;
  }
};
