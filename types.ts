
export enum MuscleGroup {
  CHEST = 'Chest',
  BACK = 'Back',
  LEGS = 'Legs',
  SHOULDERS = 'Shoulders',
  ARMS = 'Arms',
  CORE = 'Core',
  CARDIO = 'Cardio',
  FULL_BODY = 'Full Body'
}

export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: MuscleGroup;
  difficulty: Difficulty;
  equipment: string[];
  videoUrl?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: string; // string to allow "10-12" or "To Failure"
  restSeconds: number;
  notes?: string;
  supersetId?: string; // Identifier to group exercises together (e.g., "ss-1")
}

export interface Workout {
  id: string;
  title: string;
  description: string;
  type: string; // HIIT, Strength, Hypertrophy
  durationMinutes: number;
  exercises: WorkoutExercise[];
  difficulty: Difficulty;
  image?: string; // Added cover image
}

export interface Program {
  id: string;
  title: string;
  durationWeeks: number;
  description: string;
  tags: string[]; // Added tags for categorization
  image?: string; // Added cover image
  // Map week number (1-based) to list of workout IDs for that week
  schedule: Record<number, string[]>; 
}

export interface ClientExercise {
  id: string;
  exerciseId: string;
  assignedDate: string; // YYYY-MM-DD
  notes?: string;
  completed: boolean;
  sets?: number;
  reps?: string;
}

export interface ClientWorkout {
  id: string;
  workoutId: string; // Reference to original library workout
  title: string; // Snapshot title allows renaming
  assignedDate: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
  exercises: WorkoutExercise[]; // Snapshot of exercises for customization
}

export interface Client {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive' | 'Pending';
  assignedProgramId?: string;
  programStartDate?: string; // ISO Date string YYYY-MM-DD
  assignedExercises?: ClientExercise[]; // Ad-hoc exercises
  assignedWorkouts?: ClientWorkout[]; // Ad-hoc or customized workouts
  lastActive?: string;
  goal: string;
}

export interface Questionnaire {
  id: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[]; // for select
}

export type ViewState = 'dashboard' | 'clients' | 'exercises' | 'workouts' | 'programs' | 'questionnaires';
