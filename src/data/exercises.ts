export interface ExerciseData {
  id: string;
  name: string;
  primaryMuscle: string;
  subMuscles: string[];
  equipment: string;
}

export const EXERCISES: ExerciseData[] = [
  // CHEST
  { id: 'ex-001', name: 'Barbell Bench Press',       primaryMuscle: 'chest',     subMuscles: ['front_delts','triceps'],          equipment: 'barbell' },
  { id: 'ex-002', name: 'Incline Barbell Press',     primaryMuscle: 'chest',     subMuscles: ['upper_chest','front_delts'],      equipment: 'barbell' },
  { id: 'ex-003', name: 'Decline Barbell Press',     primaryMuscle: 'chest',     subMuscles: ['lower_chest','triceps'],          equipment: 'barbell' },
  { id: 'ex-004', name: 'Dumbbell Bench Press',      primaryMuscle: 'chest',     subMuscles: ['front_delts','triceps'],          equipment: 'dumbbell' },
  { id: 'ex-005', name: 'Incline Dumbbell Press',    primaryMuscle: 'chest',     subMuscles: ['upper_chest','front_delts'],      equipment: 'dumbbell' },
  { id: 'ex-006', name: 'Dumbbell Flye',             primaryMuscle: 'chest',     subMuscles: ['front_delts'],                   equipment: 'dumbbell' },
  { id: 'ex-007', name: 'Cable Crossover',           primaryMuscle: 'chest',     subMuscles: ['front_delts'],                   equipment: 'cable' },
  { id: 'ex-008', name: 'Chest Dip',                 primaryMuscle: 'chest',     subMuscles: ['lower_chest','triceps'],          equipment: 'bodyweight' },
  { id: 'ex-009', name: 'Push Up',                   primaryMuscle: 'chest',     subMuscles: ['front_delts','triceps'],          equipment: 'bodyweight' },
  { id: 'ex-010', name: 'Machine Chest Press',       primaryMuscle: 'chest',     subMuscles: ['front_delts','triceps'],          equipment: 'machine' },
  // BACK
  { id: 'ex-011', name: 'Deadlift',                  primaryMuscle: 'back',      subMuscles: ['lats','traps','glutes','hamstrings'], equipment: 'barbell' },
  { id: 'ex-012', name: 'Barbell Row',               primaryMuscle: 'back',      subMuscles: ['lats','rhomboids','biceps'],      equipment: 'barbell' },
  { id: 'ex-013', name: 'Pull Up',                   primaryMuscle: 'back',      subMuscles: ['lats','biceps'],                 equipment: 'bodyweight' },
  { id: 'ex-014', name: 'Chin Up',                   primaryMuscle: 'back',      subMuscles: ['lats','biceps'],                 equipment: 'bodyweight' },
  { id: 'ex-015', name: 'Lat Pulldown',              primaryMuscle: 'back',      subMuscles: ['lats','biceps'],                 equipment: 'cable' },
  { id: 'ex-016', name: 'Seated Cable Row',          primaryMuscle: 'back',      subMuscles: ['rhomboids','biceps','traps'],     equipment: 'cable' },
  { id: 'ex-017', name: 'Single-Arm Dumbbell Row',   primaryMuscle: 'back',      subMuscles: ['lats','rhomboids','biceps'],      equipment: 'dumbbell' },
  { id: 'ex-018', name: 'T-Bar Row',                 primaryMuscle: 'back',      subMuscles: ['lats','rhomboids','traps'],       equipment: 'barbell' },
  { id: 'ex-019', name: 'Face Pull',                 primaryMuscle: 'back',      subMuscles: ['rear_delts','traps','rhomboids'], equipment: 'cable' },
  { id: 'ex-020', name: 'Rack Pull',                 primaryMuscle: 'back',      subMuscles: ['traps','glutes'],                equipment: 'barbell' },
  // SHOULDERS
  { id: 'ex-021', name: 'Overhead Press',            primaryMuscle: 'shoulders', subMuscles: ['front_delts','triceps','traps'],  equipment: 'barbell' },
  { id: 'ex-022', name: 'Dumbbell Shoulder Press',   primaryMuscle: 'shoulders', subMuscles: ['front_delts','triceps'],          equipment: 'dumbbell' },
  { id: 'ex-023', name: 'Lateral Raise',             primaryMuscle: 'shoulders', subMuscles: ['side_delts'],                    equipment: 'dumbbell' },
  { id: 'ex-024', name: 'Cable Lateral Raise',       primaryMuscle: 'shoulders', subMuscles: ['side_delts'],                    equipment: 'cable' },
  { id: 'ex-025', name: 'Front Raise',               primaryMuscle: 'shoulders', subMuscles: ['front_delts'],                   equipment: 'dumbbell' },
  { id: 'ex-026', name: 'Rear Delt Flye',            primaryMuscle: 'shoulders', subMuscles: ['rear_delts','rhomboids'],         equipment: 'dumbbell' },
  { id: 'ex-027', name: 'Arnold Press',              primaryMuscle: 'shoulders', subMuscles: ['front_delts','side_delts'],       equipment: 'dumbbell' },
  { id: 'ex-028', name: 'Upright Row',               primaryMuscle: 'shoulders', subMuscles: ['traps','side_delts'],             equipment: 'barbell' },
  // BICEPS
  { id: 'ex-029', name: 'Barbell Curl',              primaryMuscle: 'biceps',    subMuscles: ['forearms'],                      equipment: 'barbell' },
  { id: 'ex-030', name: 'Dumbbell Curl',             primaryMuscle: 'biceps',    subMuscles: ['forearms'],                      equipment: 'dumbbell' },
  { id: 'ex-031', name: 'Hammer Curl',               primaryMuscle: 'biceps',    subMuscles: ['brachialis','forearms'],          equipment: 'dumbbell' },
  { id: 'ex-032', name: 'Incline Dumbbell Curl',     primaryMuscle: 'biceps',    subMuscles: ['long_head'],                     equipment: 'dumbbell' },
  { id: 'ex-033', name: 'Cable Curl',                primaryMuscle: 'biceps',    subMuscles: ['forearms'],                      equipment: 'cable' },
  { id: 'ex-034', name: 'Preacher Curl',             primaryMuscle: 'biceps',    subMuscles: ['short_head'],                    equipment: 'machine' },
  { id: 'ex-035', name: 'Concentration Curl',        primaryMuscle: 'biceps',    subMuscles: ['short_head'],                    equipment: 'dumbbell' },
  // TRICEPS
  { id: 'ex-036', name: 'Close-Grip Bench Press',    primaryMuscle: 'triceps',   subMuscles: ['chest','front_delts'],           equipment: 'barbell' },
  { id: 'ex-037', name: 'Tricep Pushdown',           primaryMuscle: 'triceps',   subMuscles: [],                                equipment: 'cable' },
  { id: 'ex-038', name: 'Overhead Tricep Extension', primaryMuscle: 'triceps',   subMuscles: ['long_head'],                     equipment: 'dumbbell' },
  { id: 'ex-039', name: 'Skull Crusher',             primaryMuscle: 'triceps',   subMuscles: ['long_head'],                     equipment: 'barbell' },
  { id: 'ex-040', name: 'Tricep Dip',                primaryMuscle: 'triceps',   subMuscles: ['chest'],                         equipment: 'bodyweight' },
  { id: 'ex-041', name: 'Diamond Push Up',           primaryMuscle: 'triceps',   subMuscles: ['chest'],                         equipment: 'bodyweight' },
  // QUADS
  { id: 'ex-042', name: 'Back Squat',                primaryMuscle: 'quads',     subMuscles: ['glutes','hamstrings'],            equipment: 'barbell' },
  { id: 'ex-043', name: 'Front Squat',               primaryMuscle: 'quads',     subMuscles: ['glutes'],                        equipment: 'barbell' },
  { id: 'ex-044', name: 'Leg Press',                 primaryMuscle: 'quads',     subMuscles: ['glutes','hamstrings'],            equipment: 'machine' },
  { id: 'ex-045', name: 'Hack Squat',                primaryMuscle: 'quads',     subMuscles: ['glutes'],                        equipment: 'machine' },
  { id: 'ex-046', name: 'Leg Extension',             primaryMuscle: 'quads',     subMuscles: [],                                equipment: 'machine' },
  { id: 'ex-047', name: 'Bulgarian Split Squat',     primaryMuscle: 'quads',     subMuscles: ['glutes','hamstrings'],            equipment: 'dumbbell' },
  { id: 'ex-048', name: 'Lunge',                     primaryMuscle: 'quads',     subMuscles: ['glutes','hamstrings'],            equipment: 'dumbbell' },
  // HAMSTRINGS / GLUTES
  { id: 'ex-049', name: 'Romanian Deadlift',         primaryMuscle: 'hamstrings',subMuscles: ['glutes','lower_back'],            equipment: 'barbell' },
  { id: 'ex-050', name: 'Leg Curl',                  primaryMuscle: 'hamstrings',subMuscles: [],                                equipment: 'machine' },
  { id: 'ex-051', name: 'Good Morning',              primaryMuscle: 'hamstrings',subMuscles: ['lower_back','glutes'],            equipment: 'barbell' },
  { id: 'ex-052', name: 'Hip Thrust',                primaryMuscle: 'glutes',    subMuscles: ['hamstrings'],                    equipment: 'barbell' },
  { id: 'ex-053', name: 'Cable Kickback',            primaryMuscle: 'glutes',    subMuscles: ['hamstrings'],                    equipment: 'cable' },
  { id: 'ex-054', name: 'Sumo Deadlift',             primaryMuscle: 'glutes',    subMuscles: ['hamstrings','quads'],             equipment: 'barbell' },
  // CALVES
  { id: 'ex-055', name: 'Standing Calf Raise',       primaryMuscle: 'calves',    subMuscles: ['soleus'],                        equipment: 'machine' },
  { id: 'ex-056', name: 'Seated Calf Raise',         primaryMuscle: 'calves',    subMuscles: ['soleus'],                        equipment: 'machine' },
  { id: 'ex-057', name: 'Donkey Calf Raise',         primaryMuscle: 'calves',    subMuscles: [],                                equipment: 'bodyweight' },
  // ABS
  { id: 'ex-058', name: 'Crunch',                    primaryMuscle: 'abs',       subMuscles: [],                                equipment: 'bodyweight' },
  { id: 'ex-059', name: 'Plank',                     primaryMuscle: 'abs',       subMuscles: ['obliques'],                      equipment: 'bodyweight' },
  { id: 'ex-060', name: 'Cable Crunch',              primaryMuscle: 'abs',       subMuscles: [],                                equipment: 'cable' },
  { id: 'ex-061', name: 'Hanging Leg Raise',         primaryMuscle: 'abs',       subMuscles: ['hip_flexors'],                   equipment: 'bodyweight' },
  { id: 'ex-062', name: 'Russian Twist',             primaryMuscle: 'abs',       subMuscles: ['obliques'],                      equipment: 'bodyweight' },
  { id: 'ex-063', name: 'Ab Wheel Rollout',          primaryMuscle: 'abs',       subMuscles: ['lats'],                          equipment: 'bodyweight' },
  // TRAPS
  { id: 'ex-064', name: 'Barbell Shrug',             primaryMuscle: 'traps',     subMuscles: [],                                equipment: 'barbell' },
  { id: 'ex-065', name: 'Dumbbell Shrug',            primaryMuscle: 'traps',     subMuscles: [],                                equipment: 'dumbbell' },
  // COMPOUND / FULL BODY
  { id: 'ex-066', name: 'Power Clean',               primaryMuscle: 'back',      subMuscles: ['traps','quads','glutes'],         equipment: 'barbell' },
  { id: 'ex-067', name: 'Clean and Press',           primaryMuscle: 'shoulders', subMuscles: ['traps','quads','glutes'],         equipment: 'barbell' },
  { id: 'ex-068', name: 'Kettlebell Swing',          primaryMuscle: 'glutes',    subMuscles: ['hamstrings','lower_back'],        equipment: 'kettlebell' },
  { id: 'ex-069', name: 'Farmer Walk',               primaryMuscle: 'traps',     subMuscles: ['forearms','quads'],               equipment: 'dumbbell' },
  { id: 'ex-070', name: 'Dumbbell Romanian Deadlift',primaryMuscle: 'hamstrings',subMuscles: ['glutes','lower_back'],            equipment: 'dumbbell' },
];

export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'traps',
] as const;

export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell',
] as const;
