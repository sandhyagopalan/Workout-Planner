
import { Client, Difficulty, Exercise, MuscleGroup, Program, Workout, Questionnaire } from "./types";

// --- GLOBAL DEFINITIONS ---
export const GOAL_OPTIONS = [
  "Weight Loss",
  "Muscle Gain",
  "General Fitness",
  "Endurance",
  "Flexibility & Mobility",
  "Athletic Performance",
  "Strength & Power",
  "Rehabilitation"
];

// --- DEFAULT ASSESSMENT FORM ---
export const DEFAULT_INTAKE_QUESTIONNAIRE: Questionnaire = {
  id: 'q-intake-default',
  title: 'Comprehensive Fitness Assessment',
  questions: [
    {
      id: 'g-1',
      text: 'What are your fitness goals?',
      type: 'multiselect',
      options: [
        'Appearance (aesthetics)', 'Cardiovascular endurance', 'Flexibility',
        'Health (General)', 'Muscular definition', 'Muscular size',
        'Muscular strength/power', 'Self-esteem or confidence', 'Speed',
        'Sports performance', 'Stress reduction', 'Toning and shaping',
        'Weight loss', 'Posture'
      ]
    },
    { id: 'g-2', text: 'Other fitness goals (if not selected above)', type: 'text' },
    {
      id: 'h-1',
      text: 'Do you exercise regularly?',
      type: 'select',
      options: ['--', 'I have never exercised regularly', 'I used to exercise regularly', 'I currently exercise regularly']
    },
    {
      id: 'h-2',
      text: 'Rate your ability to perform cardio exercises',
      type: 'select',
      options: ['--', 'Very Low', 'Fair', 'Average', 'Good', 'Excellent']
    },
    {
      id: 'h-3',
      text: 'Rate your experience with exercise',
      type: 'select',
      options: ['--', 'Beginner', 'Intermediate', 'Advanced']
    },
    {
      id: 'eq-1',
      text: 'What equipment do you have access to?',
      type: 'multiselect',
      options: [
        'Free weights (dumbbell/barbells)', 'Gym machines', 'Cable weights',
        'Resistance bands', 'Bosu balls', 'Kettlebells', 'TRX bands', 'Bowflex'
      ]
    },
    {
      id: 'av-1',
      text: 'On which days are you available to work out?',
      type: 'multiselect',
      options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    {
      id: 'av-2',
      text: 'How frequently do you have time to exercise?',
      type: 'select',
      options: ['--', '1-3 days a week', '4-5 days a week', '6-7 days a week', 'Up to trainer to decide']
    },
    { id: 'm-1', text: 'Do you have any existing injuries or conditions that I should be aware of while building your training plan?', type: 'textarea' },
    {
      id: 'l-1',
      text: 'Do you smoke tobacco products?',
      type: 'select',
      options: ['--', 'No', 'Yes']
    },
    { id: 'c-1', text: 'Any other comments about what you would like to see in your fitness plan?', type: 'textarea' }
  ]
};

// --- 1. EXPANDED EXERCISE LIBRARY (Simulating ExerciseDB) ---
export const MOCK_EXERCISES: Exercise[] = [
  // ... existing exercises ...
  // --- CHEST ---
  {
    id: 'ex-bp',
    name: 'Barbell Bench Press',
    description: 'The standard for chest strength and development.',
    muscleGroup: MuscleGroup.CHEST,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Barbell', 'Bench'],
    videoUrl: 'https://media.giphy.com/media/24FK490Fj6O5i5r9o0/giphy.gif' 
  },
  {
    id: 'ex-inc-bp',
    name: 'Incline Barbell Bench Press',
    description: 'Targets the upper clavicular head of the pecs.',
    muscleGroup: MuscleGroup.CHEST,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Barbell', 'Bench'],
    videoUrl: 'https://media.giphy.com/media/l0HlOaQcLJ2hHpYdy/giphy.gif'
  },
  {
    id: 'ex-db-press',
    name: 'Dumbbell Bench Press',
    description: 'Allows for greater range of motion than barbell.',
    muscleGroup: MuscleGroup.CHEST,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Dumbbells', 'Bench'],
    videoUrl: 'https://media.giphy.com/media/zB4t8Ky55Fh72/giphy.gif'
  },
  {
    id: 'ex-inc-db',
    name: 'Incline Dumbbell Press',
    description: 'Upper chest builder with stabilizers.',
    muscleGroup: MuscleGroup.CHEST,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Dumbbells', 'Bench'],
  },
  {
    id: 'ex-cable-fly',
    name: 'Cable Fly',
    description: 'Constant tension isolation for the chest.',
    muscleGroup: MuscleGroup.CHEST,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Cable Machine'],
  },
  {
    id: 'ex-pec-dec',
    name: 'Pec Deck Machine',
    description: 'Machine isolation for chest.',
    muscleGroup: MuscleGroup.CHEST,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Machine'],
  },
  {
    id: 'ex-pushup',
    name: 'Push Up',
    description: 'Classic bodyweight chest and tricep builder.',
    muscleGroup: MuscleGroup.CHEST,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Bodyweight'],
    videoUrl: 'https://media.giphy.com/media/K61C9A0y9ZkIM/giphy.gif'
  },
  {
    id: 'ex-dip',
    name: 'Chest Dips',
    description: 'Compound movement for lower chest and triceps.',
    muscleGroup: MuscleGroup.CHEST,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Dip Station'],
  },

  // --- BACK ---
  {
    id: 'ex-dl',
    name: 'Barbell Deadlift',
    description: 'Full body posterior chain builder.',
    muscleGroup: MuscleGroup.BACK,
    difficulty: Difficulty.ADVANCED,
    equipment: ['Barbell'],
    videoUrl: 'https://media.giphy.com/media/pS2sR94L35LCo/giphy.gif'
  },
  {
    id: 'ex-pullup',
    name: 'Pull Up',
    description: 'Vertical pulling bodyweight exercise.',
    muscleGroup: MuscleGroup.BACK,
    difficulty: Difficulty.ADVANCED,
    equipment: ['Pull Up Bar'],
    videoUrl: 'https://media.giphy.com/media/eJ4j2VnFOXCso/giphy.gif'
  },
  {
    id: 'ex-lat-pulldown',
    name: 'Lat Pulldown',
    description: 'Machine vertical pull for back width.',
    muscleGroup: MuscleGroup.BACK,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Cable Machine'],
    videoUrl: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif'
  },
  {
    id: 'ex-bb-row',
    name: 'Barbell Bent Over Row',
    description: 'Heavy compound for back thickness.',
    muscleGroup: MuscleGroup.BACK,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Barbell'],
    videoUrl: 'https://media.giphy.com/media/12k3V5m2p2x81a/giphy.gif'
  },
  {
    id: 'ex-db-row',
    name: 'Single Arm Dumbbell Row',
    description: 'Unilateral back exercise to fix imbalances.',
    muscleGroup: MuscleGroup.BACK,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Dumbbells', 'Bench'],
  },
  {
    id: 'ex-seat-row',
    name: 'Seated Cable Row',
    description: 'Horizontal row for mid-back.',
    muscleGroup: MuscleGroup.BACK,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Cable Machine'],
  },
  {
    id: 'ex-face-pull',
    name: 'Face Pull',
    description: 'Rear delt and rotator cuff health.',
    muscleGroup: MuscleGroup.BACK,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Cable Machine'],
  },
  {
    id: 'ex-hyperext',
    name: 'Back Hyperextension',
    description: 'Lower back and glute focus.',
    muscleGroup: MuscleGroup.BACK,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Hyperextension Bench'],
  },

  // --- LEGS & GLUTES ---
  {
    id: 'ex-sq',
    name: 'Barbell Squat',
    description: 'The king of leg exercises. Targets quads, glutes, and core.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Barbell', 'Rack'],
    videoUrl: 'https://media.giphy.com/media/10h8CdMQUTEZqM/giphy.gif'
  },
  {
    id: 'ex-db-lunge',
    name: 'Dumbbell Lunges',
    description: 'Hold a dumbbell in each hand. Step forward with one leg, lowering your hips until both knees are bent at approximately a 90-degree angle. Keep your front knee directly above your ankle.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Dumbbells'],
    videoUrl: 'https://media.giphy.com/media/3oKIPDO5JgyF65FTEI/giphy.gif'
  },
  {
    id: 'ex-fs',
    name: 'Front Squat',
    description: 'Quad focused squat variation.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.ADVANCED,
    equipment: ['Barbell', 'Rack'],
  },
  {
    id: 'ex-leg-press',
    name: 'Leg Press',
    description: 'Heavy machine compound for legs.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Machine'],
    videoUrl: 'https://media.giphy.com/media/3o7TKUM3IgJBX2as9O/giphy.gif'
  },
  {
    id: 'ex-lunge',
    name: 'Walking Lunges',
    description: 'Unilateral leg development.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Dumbbells'],
    videoUrl: 'https://media.giphy.com/media/3oKIPDO5JgyF65FTEI/giphy.gif'
  },
  {
    id: 'ex-hip-thrust',
    name: 'Barbell Hip Thrust',
    description: 'Primary glute builder.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Barbell', 'Bench'],
  },
  {
    id: 'ex-bg-split',
    name: 'Bulgarian Split Squat',
    description: 'Advanced unilateral leg strength.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Dumbbells', 'Bench'],
  },
  {
    id: 'ex-leg-ext',
    name: 'Leg Extension',
    description: 'Isolation exercise for quadriceps.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Machine'],
  },
  {
    id: 'ex-leg-curl',
    name: 'Lying Leg Curl',
    description: 'Isolation exercise for hamstrings.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Machine'],
  },
  {
    id: 'ex-rdl',
    name: 'Romanian Deadlift (RDL)',
    description: 'Hip hinge for hamstrings and glutes.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Barbell'],
  },
  {
    id: 'ex-calf-raise',
    name: 'Standing Calf Raise',
    description: 'Isolation for gastrocnemius.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Machine'],
  },

  // --- SHOULDERS ---
  {
    id: 'ex-ohp',
    name: 'Overhead Press (Military Press)',
    description: 'Standing barbell shoulder press.',
    muscleGroup: MuscleGroup.SHOULDERS,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Barbell'],
    videoUrl: 'https://media.giphy.com/media/l41Ym49ppcDP6iY3C/giphy.gif'
  },
  {
    id: 'ex-db-shoulder',
    name: 'Seated Dumbbell Press',
    description: 'Overhead pressing for hypertrophy.',
    muscleGroup: MuscleGroup.SHOULDERS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Dumbbells', 'Bench'],
  },
  {
    id: 'ex-lat-raise',
    name: 'Dumbbell Lateral Raise',
    description: 'Isolation for side delts (width).',
    muscleGroup: MuscleGroup.SHOULDERS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Dumbbells'],
  },
  {
    id: 'ex-front-raise',
    name: 'Front Raise',
    description: 'Isolation for anterior delts.',
    muscleGroup: MuscleGroup.SHOULDERS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Dumbbells'],
  },
  {
    id: 'ex-rev-fly',
    name: 'Reverse Pec Dec',
    description: 'Rear delt isolation.',
    muscleGroup: MuscleGroup.SHOULDERS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Machine'],
  },
  {
    id: 'ex-shrug',
    name: 'Dumbbell Shrugs',
    description: 'Trapezius isolation.',
    muscleGroup: MuscleGroup.SHOULDERS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Dumbbells'],
  },

  // --- ARMS ---
  {
    id: 'ex-curl',
    name: 'Barbell Curl',
    description: 'Heavy bicep builder.',
    muscleGroup: MuscleGroup.ARMS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Barbell'],
    videoUrl: 'https://media.giphy.com/media/l41Yh1OL32vL4Z8wU/giphy.gif'
  },
  {
    id: 'ex-db-curl',
    name: 'Dumbbell Curl',
    description: 'Standard bicep isolation.',
    muscleGroup: MuscleGroup.ARMS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Dumbbells'],
  },
  {
    id: 'ex-hammer',
    name: 'Hammer Curl',
    description: 'Targets brachialis and forearms.',
    muscleGroup: MuscleGroup.ARMS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Dumbbells'],
  },
  {
    id: 'ex-preacher',
    name: 'Preacher Curl',
    description: 'Strict bicep isolation.',
    muscleGroup: MuscleGroup.ARMS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['EZ Bar', 'Bench'],
  },
  {
    id: 'ex-tri-push',
    name: 'Tricep Pushdown',
    description: 'Cable isolation for triceps.',
    muscleGroup: MuscleGroup.ARMS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Cable Machine'],
    videoUrl: 'https://media.giphy.com/media/3o7TKME3o9cK3O0g48/giphy.gif'
  },
  {
    id: 'ex-skull',
    name: 'Skullcrushers',
    description: 'Lying tricep extension.',
    muscleGroup: MuscleGroup.ARMS,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['EZ Bar', 'Bench'],
  },
  {
    id: 'ex-ohm-ext',
    name: 'Overhead Tricep Extension',
    description: 'Stretch focus for long head of tricep.',
    muscleGroup: MuscleGroup.ARMS,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Dumbbell'],
  },

  // --- CORE & MOBILITY ---
  {
    id: 'ex-plank',
    name: 'Plank',
    description: 'Isometric core stability.',
    muscleGroup: MuscleGroup.CORE,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Mat'],
    videoUrl: 'https://media.giphy.com/media/xT8qBff8cRBFsl5T8s/giphy.gif'
  },
  {
    id: 'ex-crunch',
    name: 'Crunch',
    description: 'Upper ab isolation.',
    muscleGroup: MuscleGroup.CORE,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Mat'],
  },
  {
    id: 'ex-leg-raise',
    name: 'Hanging Leg Raise',
    description: 'Lower ab focus.',
    muscleGroup: MuscleGroup.CORE,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Pull Up Bar'],
  },
  {
    id: 'ex-rus-twist',
    name: 'Russian Twist',
    description: 'Rotational core strength.',
    muscleGroup: MuscleGroup.CORE,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Medicine Ball'],
  },
  {
    id: 'ex-ab-roll',
    name: 'Ab Wheel Rollout',
    description: 'Anti-extension core strength.',
    muscleGroup: MuscleGroup.CORE,
    difficulty: Difficulty.ADVANCED,
    equipment: ['Ab Wheel'],
  },
  {
    id: 'ex-foam-roll',
    name: 'Foam Rolling (Full Body)',
    description: 'Myofascial release for recovery.',
    muscleGroup: MuscleGroup.FULL_BODY,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Foam Roller'],
  },
  {
    id: 'ex-kb-swing',
    name: 'Kettlebell Swing',
    description: 'Explosive posterior chain movement.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Kettlebell'],
  },

  // --- CARDIO ---
  {
    id: 'ex-run',
    name: 'Treadmill Run',
    description: 'Steady state or interval running.',
    muscleGroup: MuscleGroup.CARDIO,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Treadmill'],
    videoUrl: 'https://media.giphy.com/media/l2JhtVkS9g61vP076/giphy.gif'
  },
  {
    id: 'ex-bike',
    name: 'Stationary Bike',
    description: 'Low impact cycling.',
    muscleGroup: MuscleGroup.CARDIO,
    difficulty: Difficulty.BEGINNER,
    equipment: ['Bike'],
  },
  {
    id: 'ex-rower',
    name: 'Rowing Machine',
    description: 'Full body cardio.',
    muscleGroup: MuscleGroup.CARDIO,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Rower'],
  },
  {
    id: 'ex-burpee',
    name: 'Burpees',
    description: 'Full body metabolic conditioning.',
    muscleGroup: MuscleGroup.CARDIO,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Bodyweight'],
    videoUrl: 'https://media.giphy.com/media/26BkN21wz7w28pUv6/giphy.gif'
  },
  {
    id: 'ex-box-jump',
    name: 'Box Jump',
    description: 'Explosive plyometric leg power.',
    muscleGroup: MuscleGroup.LEGS,
    difficulty: Difficulty.INTERMEDIATE,
    equipment: ['Box'],
  }
];

// --- 2. MODULAR WORKOUTS (Now utilizing the full library) ---
export const MOCK_WORKOUTS: Workout[] = [
  // ... existing workouts ...
  // --- Strength Foundation ---
  {
    id: 'wk-5x5-a',
    title: 'Full Body Strength A',
    description: 'Heavy compound squat, bench, and row focus. Standard 5x5 linear progression protocol.',
    type: 'Strength',
    durationMinutes: 60,
    difficulty: Difficulty.BEGINNER,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-sq', sets: 5, reps: '5', restSeconds: 180, notes: 'Increase weight 2.5kg per session' },
      { exerciseId: 'ex-bp', sets: 5, reps: '5', restSeconds: 180, notes: 'Keep elbows tucked' },
      { exerciseId: 'ex-bb-row', sets: 5, reps: '5', restSeconds: 180, notes: 'Explosive pull, slow release' }
    ]
  },
  {
    id: 'wk-5x5-b',
    title: 'Full Body Strength B',
    description: 'Heavy compound squat, overhead press, and deadlift.',
    type: 'Strength',
    durationMinutes: 60,
    difficulty: Difficulty.BEGINNER,
    image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-sq', sets: 5, reps: '5', restSeconds: 180 },
      { exerciseId: 'ex-ohp', sets: 5, reps: '5', restSeconds: 180 },
      { exerciseId: 'ex-dl', sets: 1, reps: '5', restSeconds: 240, notes: 'Only 1 working set due to fatigue' }
    ]
  },

  // --- Hypertrophy Splits ---
  {
    id: 'wk-upper-power',
    title: 'Upper Body Power',
    description: 'Heavy upper body compounds featuring an antagonistic superset.',
    type: 'Strength',
    durationMinutes: 75,
    difficulty: Difficulty.INTERMEDIATE,
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-bp', sets: 4, reps: '6', restSeconds: 120 },
      { exerciseId: 'ex-bb-row', sets: 4, reps: '6', restSeconds: 120 },
      { exerciseId: 'ex-ohp', sets: 3, reps: '8', restSeconds: 0, notes: 'Superset A1', supersetId: 'ss-1' },
      { exerciseId: 'ex-pullup', sets: 3, reps: 'AMRAP', restSeconds: 90, notes: 'Superset A2', supersetId: 'ss-1' }
    ]
  },
  {
    id: 'wk-lower-power',
    title: 'Lower Body Power',
    description: 'Heavy leg development focused on Squats and Deadlifts.',
    type: 'Strength',
    durationMinutes: 75,
    difficulty: Difficulty.INTERMEDIATE,
    image: 'https://images.unsplash.com/photo-1574680096141-6331816e265a?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-sq', sets: 4, reps: '6', restSeconds: 180 },
      { exerciseId: 'ex-dl', sets: 3, reps: '5', restSeconds: 180 },
      { exerciseId: 'ex-lunge', sets: 3, reps: '10/leg', restSeconds: 90 },
      { exerciseId: 'ex-plank', sets: 3, reps: '60s', restSeconds: 60 }
    ]
  },
  {
    id: 'wk-push',
    title: 'Push Hypertrophy',
    description: 'Chest, Shoulders, Triceps volume focus for aesthetics.',
    type: 'Hypertrophy',
    durationMinutes: 60,
    difficulty: Difficulty.ADVANCED,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-bp', sets: 4, reps: '10', restSeconds: 90 },
      { exerciseId: 'ex-inc-db', sets: 3, reps: '12', restSeconds: 60 },
      { exerciseId: 'ex-lat-raise', sets: 3, reps: '15', restSeconds: 60 },
      { exerciseId: 'ex-dip', sets: 3, reps: '12', restSeconds: 60 },
      { exerciseId: 'ex-tri-push', sets: 4, reps: '15', restSeconds: 45 }
    ]
  },
  {
    id: 'wk-pull',
    title: 'Pull Hypertrophy',
    description: 'Back and Biceps volume to build the V-Taper.',
    type: 'Hypertrophy',
    durationMinutes: 60,
    difficulty: Difficulty.ADVANCED,
    image: 'https://images.unsplash.com/photo-1603287681836-e54f03018471?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-rdl', sets: 3, reps: '8', restSeconds: 120 },
      { exerciseId: 'ex-lat-pulldown', sets: 4, reps: '12', restSeconds: 60 },
      { exerciseId: 'ex-seat-row', sets: 3, reps: '12', restSeconds: 60 },
      { exerciseId: 'ex-face-pull', sets: 3, reps: '15', restSeconds: 60 },
      { exerciseId: 'ex-db-curl', sets: 4, reps: '12', restSeconds: 45 }
    ]
  },
  {
    id: 'wk-legs',
    title: 'Legs Hypertrophy',
    description: 'Quad and glute focus for lower body mass.',
    type: 'Hypertrophy',
    durationMinutes: 60,
    difficulty: Difficulty.ADVANCED,
    image: 'https://images.unsplash.com/photo-1434596922112-19c563067271?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-sq', sets: 4, reps: '10', restSeconds: 120 },
      { exerciseId: 'ex-leg-press', sets: 3, reps: '12', restSeconds: 90 },
      { exerciseId: 'ex-lunge', sets: 3, reps: '12/leg', restSeconds: 60 },
      { exerciseId: 'ex-leg-curl', sets: 3, reps: '15', restSeconds: 60 },
      { exerciseId: 'ex-calf-raise', sets: 4, reps: '15', restSeconds: 45 }
    ]
  },
  {
    id: 'wk-glute',
    title: 'Glute Focus',
    description: 'Specialized program for lower body development with glute priority.',
    type: 'Hypertrophy',
    durationMinutes: 50,
    difficulty: Difficulty.INTERMEDIATE,
    image: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-hip-thrust', sets: 4, reps: '10', restSeconds: 120, notes: 'Hold at top for 2s' },
      { exerciseId: 'ex-rdl', sets: 3, reps: '10', restSeconds: 90 },
      { exerciseId: 'ex-bg-split', sets: 3, reps: '10/leg', restSeconds: 90 },
      { exerciseId: 'ex-hyperext', sets: 3, reps: '15', restSeconds: 60 }
    ]
  },

  // --- Specialized, Cardio & Mobility ---
  {
    id: 'wk-hiit',
    title: 'HIIT Cardio Blast',
    description: 'High intensity metabolic conditioning to burn calories.',
    type: 'HIIT',
    durationMinutes: 30,
    difficulty: Difficulty.INTERMEDIATE,
    image: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-run', sets: 1, reps: '5 min', restSeconds: 60, notes: 'Warmup Jog' },
      { exerciseId: 'ex-burpee', sets: 4, reps: '30s', restSeconds: 30, notes: 'Max effort' },
      { exerciseId: 'ex-rower', sets: 4, reps: '30s', restSeconds: 30, notes: 'Max watts' },
      { exerciseId: 'ex-box-jump', sets: 3, reps: '15', restSeconds: 60 }
    ]
  },
  {
    id: 'wk-core',
    title: 'Core Crusher',
    description: 'Targeted abdominal and lower back work.',
    type: 'Strength',
    durationMinutes: 20,
    difficulty: Difficulty.BEGINNER,
    image: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-leg-raise', sets: 3, reps: '12', restSeconds: 45 },
      { exerciseId: 'ex-rus-twist', sets: 3, reps: '20', restSeconds: 45 },
      { exerciseId: 'ex-ab-roll', sets: 3, reps: '10', restSeconds: 60 },
      { exerciseId: 'ex-plank', sets: 3, reps: '60s', restSeconds: 45 }
    ]
  },
  {
    id: 'wk-arms',
    title: 'Arm Farm (Beach Day)',
    description: 'Isolation work for biceps and triceps.',
    type: 'Hypertrophy',
    durationMinutes: 45,
    difficulty: Difficulty.BEGINNER,
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-curl', sets: 3, reps: '10', restSeconds: 60, supersetId: 'ss-arms-1' },
      { exerciseId: 'ex-skull', sets: 3, reps: '10', restSeconds: 60, supersetId: 'ss-arms-1' },
      { exerciseId: 'ex-hammer', sets: 3, reps: '12', restSeconds: 60, supersetId: 'ss-arms-2' },
      { exerciseId: 'ex-tri-push', sets: 3, reps: '15', restSeconds: 60, supersetId: 'ss-arms-2' }
    ]
  },
  {
    id: 'wk-mobility',
    title: 'Full Body Mobility A',
    description: 'Recovery session to improve flexibility and reduce stiffness.',
    type: 'Mobility',
    durationMinutes: 25,
    difficulty: Difficulty.BEGINNER,
    image: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-foam-roll', sets: 1, reps: '5 min', restSeconds: 60, notes: 'Quads and Upper Back' },
      { exerciseId: 'ex-face-pull', sets: 3, reps: '15', restSeconds: 45, notes: 'Light weight, focus on rotation' },
      { exerciseId: 'ex-hyperext', sets: 2, reps: '15', restSeconds: 60 },
      { exerciseId: 'ex-lunge', sets: 2, reps: '10/leg', restSeconds: 60, notes: 'Bodyweight, deep stretch' }
    ]
  },
  {
    id: 'wk-kettlebell',
    title: 'Kettlebell Conditioning',
    description: 'Functional full body strength and conditioning using only kettlebells.',
    type: 'HIIT',
    durationMinutes: 35,
    difficulty: Difficulty.INTERMEDIATE,
    image: 'https://images.unsplash.com/photo-1599447421405-0e32012002eb?auto=format&fit=crop&w=800&q=80',
    exercises: [
      { exerciseId: 'ex-kb-swing', sets: 4, reps: '20', restSeconds: 45 },
      { exerciseId: 'ex-fs', sets: 4, reps: '10', restSeconds: 60, notes: 'Goblet Squats with KB' },
      { exerciseId: 'ex-lunge', sets: 3, reps: '12', restSeconds: 45, notes: 'KB held at chest' },
      { exerciseId: 'ex-rus-twist', sets: 3, reps: '20', restSeconds: 30 }
    ]
  },
  {
    id: 'wk-rec-flow',
    title: 'Active Recovery Flow',
    description: 'Low intensity movement to promote blood flow and recovery.',
    type: 'Mobility',
    durationMinutes: 20,
    difficulty: Difficulty.BEGINNER,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    exercises: [
        { exerciseId: 'ex-foam-roll', sets: 1, reps: '10 min', restSeconds: 0, notes: 'Full body roll out' },
        { exerciseId: 'ex-plank', sets: 3, reps: '30s', restSeconds: 60, notes: 'Low intensity hold' },
        { exerciseId: 'ex-face-pull', sets: 3, reps: '20', restSeconds: 60, notes: 'Very light weight, focus on posture' }
    ]
  }
];

// --- 3. WORKOUT TEMPLATES ---
export const WORKOUT_TEMPLATES = [
  {
    title: "Full Body 5x5 Template",
    description: "A classic linear progression strength routine. Start light and add weight each session.",
    type: "Strength",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    exercises: [
      { exerciseId: 'ex-sq', sets: 5, reps: '5', restSeconds: 180, notes: 'Squat: Focus on depth' },
      { exerciseId: 'ex-bp', sets: 5, reps: '5', restSeconds: 180, notes: 'Bench: Tuck elbows' },
      { exerciseId: 'ex-bb-row', sets: 5, reps: '5', restSeconds: 180, notes: 'Row: Explosive pull' }
    ]
  },
  // ... other templates ...
];

// --- 4. PROGRAM TAGS ---
export const PROGRAM_TAGS = [
  'Strength',
  'Hypertrophy',
  'Fat Loss',
  'Endurance',
  'Mobility',
  'Athletic Performance',
  'Beginner',
  'Advanced'
];

// --- 5. STANDARD PROGRAMS ---
export const MOCK_PROGRAMS: Program[] = [
  {
    id: 'pg-5x5',
    title: 'Classic 5x5 Strength',
    description: 'The gold standard for building a strength foundation using compound movements.',
    durationWeeks: 12,
    tags: ['Strength', 'Beginner'],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    schedule: {
      1: ['wk-5x5-a', null, 'wk-5x5-b', null, 'wk-5x5-a', null, null], // M,W,F (Index 0,2,4)
      2: ['wk-5x5-b', null, 'wk-5x5-a', null, 'wk-5x5-b', null, null],
      3: ['wk-5x5-a', null, 'wk-5x5-b', null, 'wk-5x5-a', null, null],
      4: ['wk-5x5-b', null, 'wk-5x5-a', null, 'wk-5x5-b', null, null]
    }
  },
  {
    id: 'pg-ul',
    title: 'Upper / Lower Split',
    description: '4-day split separating upper body and lower body training. Great for intermediate lifters.',
    durationWeeks: 8,
    tags: ['Strength', 'Hypertrophy', 'Intermediate'],
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    schedule: {
      1: ['wk-upper-power', 'wk-lower-power', null, 'wk-upper-power', 'wk-lower-power', null, null], // M,T,Th,F
      2: ['wk-upper-power', 'wk-lower-power', null, 'wk-upper-power', 'wk-lower-power', null, null],
      3: ['wk-upper-power', 'wk-lower-power', null, 'wk-upper-power', 'wk-lower-power', null, null],
      4: ['wk-upper-power', 'wk-lower-power', null, 'wk-upper-power', 'wk-lower-power', null, null]
    }
  },
  {
    id: 'pg-ppl',
    title: 'Push / Pull / Legs (PPL)',
    description: 'High volume 6-day split for advanced aesthetics and hypertrophy.',
    durationWeeks: 12,
    tags: ['Hypertrophy', 'Advanced'],
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
    schedule: {
      1: ['wk-push', 'wk-pull', 'wk-legs', 'wk-push', 'wk-pull', 'wk-legs', null], // 6 days on, 1 off
      2: ['wk-push', 'wk-pull', 'wk-legs', 'wk-push', 'wk-pull', 'wk-legs', null],
      3: ['wk-push', 'wk-pull', 'wk-legs', 'wk-push', 'wk-pull', 'wk-legs', null],
      4: ['wk-push', 'wk-pull', 'wk-legs', 'wk-push', 'wk-pull', 'wk-legs', null]
    }
  },
  {
    id: 'pg-shred',
    title: '8 Week Fat Loss Shred',
    description: 'Combination of full body lifting and high intensity cardio intervals.',
    durationWeeks: 8,
    tags: ['Fat Loss', 'Endurance', 'Intermediate'],
    image: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&w=800&q=80',
    schedule: {
      1: ['wk-5x5-a', 'wk-hiit', 'wk-5x5-b', 'wk-hiit', null, 'wk-core', null], // M,T,W,Th,Sat
      2: ['wk-5x5-b', 'wk-hiit', 'wk-5x5-a', 'wk-hiit', null, 'wk-core', null],
      3: ['wk-5x5-a', 'wk-hiit', 'wk-5x5-b', 'wk-hiit', null, 'wk-core', null],
      4: ['wk-5x5-b', 'wk-hiit', 'wk-5x5-a', 'wk-hiit', null, 'wk-core', null]
    }
  },
  {
    id: 'pg-beach',
    title: 'Beach Body Ready',
    description: 'Focus on aesthetics: Chest, Arms, and Abs.',
    durationWeeks: 4,
    tags: ['Hypertrophy', 'Beginner'],
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80',
    schedule: {
      1: ['wk-upper-power', null, 'wk-arms', null, 'wk-core', 'wk-upper-power', null],
      2: ['wk-upper-power', null, 'wk-arms', null, 'wk-core', 'wk-upper-power', null],
      3: ['wk-upper-power', null, 'wk-arms', null, 'wk-core', 'wk-upper-power', null],
      4: ['wk-upper-power', null, 'wk-arms', null, 'wk-core', 'wk-upper-power', null]
    }
  }
];

export const MOCK_CLIENTS: Client[] = [
  // ... existing client data ...
  {
    id: 'cl-1',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    status: 'Active',
    goal: 'Weight Loss',
    targetWeight: 65, // Target added
    lastActive: '2023-10-27',
    assignedExercises: [],
    assignedWorkouts: [],
    programStartDate: '2023-10-01',
    assignedProgramId: 'pg-shred',
    age: 34,
    gender: 'Female',
    height: 165,
    weight: 70,
    bodyFat: 28,
    leanMass: 50.4,
    experienceLevel: 'Intermediate',
    trainingDaysPerWeek: 4,
    preferredDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'], // New
    injuries: ['Right Knee (Minor)'],
    medicalConditions: ['Asthma'],
    orthopedicIssues: ['Patellar tendonitis'],
    trainingStylePreference: ['HIIT', 'Strength'],
    environmentPreference: 'Gym',
    stressLevel: 'Medium',
    sleepQuality: 'Good',
    equipmentAccess: ['Commercial Gym'],
    measurementHistory: [
      {
        date: '2023-10-01',
        weight: 72,
        bodyFat: 30,
        chest: 95,
        waist: 78,
        hips: 102,
        thighLeft: 58,
        thighRight: 58,
        armLeft: 29,
        armRight: 29
      },
      {
        date: '2023-10-15',
        weight: 70,
        bodyFat: 28,
        chest: 94,
        waist: 76,
        hips: 100,
        thighLeft: 57,
        thighRight: 57,
        armLeft: 29,
        armRight: 29
      }
    ],
    intakeFormId: 'q-intake-default',
    assessmentAnswers: {
        'g-1': 'Weight loss, Toning and shaping',
        'h-1': 'I currently exercise regularly',
        'eq-1': 'Free weights, Gym machines',
        'av-1': 'Monday, Wednesday, Friday, Saturday'
    }
  },
  {
    id: 'cl-2',
    name: 'Mike Chen',
    email: 'mike.c@example.com',
    status: 'Active',
    goal: 'Muscle Gain',
    assignedProgramId: 'pg-5x5',
    programStartDate: '2023-10-23', // Started this week
    lastActive: '2023-10-26',
    assignedExercises: [
      { id: 'ce-1', exerciseId: 'ex-pullup', assignedDate: '2023-10-25', notes: 'Extra volume requested', completed: false }
    ],
    assignedWorkouts: [],
    age: 28,
    gender: 'Male',
    height: 180,
    weight: 82,
    bodyFat: 15,
    leanMass: 69.7,
    experienceLevel: 'Advanced',
    trainingDaysPerWeek: 5,
    preferredDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
    injuries: [],
    trainingStylePreference: ['Powerlifting', 'Bodybuilding'],
    environmentPreference: 'Home',
    stressLevel: 'High',
    sleepQuality: 'Fair',
    equipmentAccess: ['Home Gym'],
    measurementHistory: []
  },
  {
    id: 'cl-3',
    name: 'Jessica Davis',
    email: 'jdavis@example.com',
    status: 'Active', 
    goal: 'General Fitness',
    lastActive: 'N/A',
    assignedExercises: [],
    assignedWorkouts: [],
    age: 45,
    gender: 'Female',
    height: 162,
    weight: 65,
    bodyFat: 25,
    experienceLevel: 'Beginner',
    trainingDaysPerWeek: 3,
    preferredDays: ['Tuesday', 'Thursday', 'Saturday'],
    injuries: ['Lower Back'],
    orthopedicIssues: ['L4-L5 disc bulge'],
    medicalConditions: ['High Blood Pressure'],
    doctorClearance: true,
    trainingStylePreference: ['Low Impact', 'Yoga', 'Bodyweight'],
    environmentPreference: 'Home',
    stressLevel: 'Low',
    sleepQuality: 'Poor',
    equipmentAccess: ['Dumbbells', 'Bands'],
    measurementHistory: []
  }
];
