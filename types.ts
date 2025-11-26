
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

export interface WorkoutLog {
  date: string;
  workoutId: string;
  logs: Record<string, { weight: string; reps: string; completed: boolean }[]>;
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
  workoutLogs?: WorkoutLog[]; // History of completed workouts
  lastActive?: string;
  onboardingComplete?: boolean; // Flag to trigger B2C intake flow
  
  // --- 1. Core Fitness Profile ---
  goal: string; // Primary Goal
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  trainingDaysPerWeek?: number;
  equipmentAccess?: string[]; // Gym, Home, Bands, etc.
  age?: number;
  gender?: string;
  height?: number; // cm
  weight?: number; // kg
  bodyFat?: number; // %

  // --- 2. Health + Risk Check ---
  injuries?: string[];
  medicalConditions?: string[]; // Diabetes, High BP, Asthma
  orthopedicIssues?: string[]; // Knee pain, Back pain
  surgeries?: string; // "ACL repair 2020"
  medications?: string; 
  doctorClearance?: boolean;

  // --- 3. Behavioral + Personalization ---
  trainingStylePreference?: string[]; // HIIT, Bodyweight, Yoga
  environmentPreference?: 'Gym' | 'Home' | 'Outdoor';
  stressLevel?: 'Low' | 'Medium' | 'High';
  sleepQuality?: 'Poor' | 'Fair' | 'Good';
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening';
  
  // General
  notes?: string; 
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

export type ViewState = 'dashboard' | 'clients' | 'exercises' | 'workouts' | 'programs' | 'questionnaires' | 'wrkout-library';
export type AppMode = 'admin' | 'client';
