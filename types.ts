
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
  // Map week number (1-based) to list of workout IDs for that week (null = Rest Day)
  // Index 0 = Day 1, Index 6 = Day 7
  schedule: Record<number, (string | null)[]>; 
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

export interface BodyMeasurements {
  date: string;
  weight?: number;
  bodyFat?: number;
  leanMass?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  thighLeft?: number;
  thighRight?: number;
  armLeft?: number;
  armRight?: number;
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
  targetWeight?: number; // NEW: Specific target
  
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  trainingDaysPerWeek?: number;
  preferredDays?: string[]; // Specific days they can train
  equipmentAccess?: string[]; // Gym, Home, Bands, etc.
  age?: number;
  gender?: string;
  height?: number; // cm
  weight?: number; // kg - Current Snapshot
  bodyFat?: number; // % - Current Snapshot
  leanMass?: number; // kg - Current Snapshot
  
  measurementHistory?: BodyMeasurements[]; // Progress Tracking

  // --- 2. Health + Risk Check ---
  injuries?: string[];
  medicalConditions?: string[]; // Diabetes, High BP, Asthma
  orthopedicIssues?: string[]; // Knee pain, Back pain
  surgeries?: string; // "ACL repair 2020"
  doctorClearance?: boolean;

  // --- 3. Behavioral + Personalization ---
  trainingStylePreference?: string[]; // HIIT, Bodyweight, Yoga
  environmentPreference?: 'Gym' | 'Home' | 'Outdoor';
  stressLevel?: 'Low' | 'Medium' | 'High';
  sleepQuality?: 'Poor' | 'Fair' | 'Good';
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening';
  
  // --- 4. Flexible Assessment ---
  intakeFormId?: string; // ID of the questionnaire used for deep dive
  assessmentAnswers?: Record<string, any>; // Map Question ID -> Answer

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
  type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'multiselect' | 'textarea';
  options?: string[]; // for select/multiselect
}

export type ViewState = 'dashboard' | 'clients' | 'exercises' | 'workouts' | 'programs' | 'questionnaires' | 'settings' | 'wrkout-library';
export type AppMode = 'admin' | 'client';
