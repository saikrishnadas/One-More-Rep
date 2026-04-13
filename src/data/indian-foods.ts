export interface IndianFood {
  id: string;
  name: string;
  category: string;
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export const INDIAN_FOODS: IndianFood[] = [
  // ── BREAKFAST ──────────────────────────────────────────────────────────────
  { id: 'in-001', name: 'Idli (steamed)',           category: 'breakfast', servingSize: '2 pieces (100g)',  calories: 116, proteinG: 3.9,  carbsG: 23.8, fatG: 0.4,  fiberG: 0.8 },
  { id: 'in-002', name: 'Masala Dosa',              category: 'breakfast', servingSize: '1 piece (200g)',   calories: 340, proteinG: 7.5,  carbsG: 56,   fatG: 9,    fiberG: 3 },
  { id: 'in-003', name: 'Plain Dosa',               category: 'breakfast', servingSize: '1 piece (80g)',    calories: 120, proteinG: 3,    carbsG: 20,   fatG: 3.5,  fiberG: 0.5 },
  { id: 'in-004', name: 'Uttapam',                  category: 'breakfast', servingSize: '1 piece (100g)',   calories: 118, proteinG: 3.5,  carbsG: 20,   fatG: 3,    fiberG: 1 },
  { id: 'in-005', name: 'Poha',                     category: 'breakfast', servingSize: '1 bowl (150g)',    calories: 250, proteinG: 5,    carbsG: 46,   fatG: 5,    fiberG: 2 },
  { id: 'in-006', name: 'Upma',                     category: 'breakfast', servingSize: '1 bowl (180g)',    calories: 220, proteinG: 5,    carbsG: 38,   fatG: 6,    fiberG: 2 },
  { id: 'in-007', name: 'Aloo Paratha',             category: 'breakfast', servingSize: '1 piece (120g)',   calories: 260, proteinG: 6,    carbsG: 42,   fatG: 8,    fiberG: 3 },
  { id: 'in-008', name: 'Plain Paratha',            category: 'breakfast', servingSize: '1 piece (80g)',    calories: 200, proteinG: 4,    carbsG: 30,   fatG: 7,    fiberG: 2 },
  { id: 'in-009', name: 'Methi Paratha',            category: 'breakfast', servingSize: '1 piece (80g)',    calories: 190, proteinG: 5,    carbsG: 28,   fatG: 7,    fiberG: 3 },
  { id: 'in-010', name: 'Puri',                     category: 'breakfast', servingSize: '2 pieces (60g)',   calories: 200, proteinG: 3.5,  carbsG: 28,   fatG: 9,    fiberG: 1 },
  { id: 'in-011', name: 'Bread Poha',               category: 'breakfast', servingSize: '1 plate (150g)',   calories: 230, proteinG: 5.5,  carbsG: 40,   fatG: 6,    fiberG: 2 },
  { id: 'in-012', name: 'Sabudana Khichdi',         category: 'breakfast', servingSize: '1 bowl (150g)',    calories: 280, proteinG: 4,    carbsG: 50,   fatG: 7,    fiberG: 1 },
  { id: 'in-013', name: 'Vada (Medu)',              category: 'breakfast', servingSize: '2 pieces (80g)',   calories: 210, proteinG: 7,    carbsG: 24,   fatG: 10,   fiberG: 2 },
  { id: 'in-014', name: 'Pongal',                   category: 'breakfast', servingSize: '1 bowl (200g)',    calories: 310, proteinG: 9,    carbsG: 50,   fatG: 8,    fiberG: 2 },
  { id: 'in-015', name: 'Akki Roti',               category: 'breakfast', servingSize: '1 piece (100g)',   calories: 220, proteinG: 4,    carbsG: 40,   fatG: 5,    fiberG: 1.5 },
  { id: 'in-016', name: 'Pesarattu',                category: 'breakfast', servingSize: '2 pieces (120g)',  calories: 180, proteinG: 10,   carbsG: 28,   fatG: 3,    fiberG: 4 },
  { id: 'in-017', name: 'Ragi Dosa',               category: 'breakfast', servingSize: '1 piece (80g)',    calories: 100, proteinG: 3,    carbsG: 18,   fatG: 2,    fiberG: 2 },
  { id: 'in-018', name: 'Sheera (Suji Halwa)',      category: 'breakfast', servingSize: '1 bowl (100g)',    calories: 310, proteinG: 4,    carbsG: 52,   fatG: 9,    fiberG: 0.5 },
  { id: 'in-019', name: 'Chole Bhature',            category: 'breakfast', servingSize: '1 serving (300g)', calories: 520, proteinG: 16,   carbsG: 78,   fatG: 16,   fiberG: 8 },
  { id: 'in-020', name: 'Misal Pav',                category: 'breakfast', servingSize: '1 serving (250g)', calories: 380, proteinG: 14,   carbsG: 58,   fatG: 10,   fiberG: 7 },

  // ── DAL & LENTILS ──────────────────────────────────────────────────────────
  { id: 'in-021', name: 'Dal Makhani',              category: 'dal',  servingSize: '1 bowl (200g)',    calories: 210, proteinG: 10,   carbsG: 26,   fatG: 8,    fiberG: 6 },
  { id: 'in-022', name: 'Toor Dal (cooked)',        category: 'dal',  servingSize: '1 bowl (200g)',    calories: 180, proteinG: 12,   carbsG: 28,   fatG: 2,    fiberG: 5 },
  { id: 'in-023', name: 'Moong Dal (cooked)',       category: 'dal',  servingSize: '1 bowl (200g)',    calories: 150, proteinG: 11,   carbsG: 22,   fatG: 1,    fiberG: 4 },
  { id: 'in-024', name: 'Chana Dal (cooked)',       category: 'dal',  servingSize: '1 bowl (200g)',    calories: 200, proteinG: 13,   carbsG: 30,   fatG: 2,    fiberG: 7 },
  { id: 'in-025', name: 'Masoor Dal (cooked)',      category: 'dal',  servingSize: '1 bowl (200g)',    calories: 165, proteinG: 12,   carbsG: 26,   fatG: 0.5,  fiberG: 5 },
  { id: 'in-026', name: 'Urad Dal (cooked)',        category: 'dal',  servingSize: '1 bowl (200g)',    calories: 195, proteinG: 13,   carbsG: 29,   fatG: 1.5,  fiberG: 6 },
  { id: 'in-027', name: 'Rajma (cooked)',           category: 'dal',  servingSize: '1 bowl (200g)',    calories: 220, proteinG: 14,   carbsG: 34,   fatG: 1.5,  fiberG: 8 },
  { id: 'in-028', name: 'Chana Masala',             category: 'dal',  servingSize: '1 bowl (200g)',    calories: 270, proteinG: 14,   carbsG: 38,   fatG: 7,    fiberG: 10 },
  { id: 'in-029', name: 'Pav Bhaji Dal',            category: 'dal',  servingSize: '1 bowl (200g)',    calories: 190, proteinG: 8,    carbsG: 30,   fatG: 4,    fiberG: 6 },
  { id: 'in-030', name: 'Lobia (Black Eye Pea)',   category: 'dal',  servingSize: '1 bowl (200g)',    calories: 200, proteinG: 14,   carbsG: 33,   fatG: 1,    fiberG: 7 },
  { id: 'in-031', name: 'Green Moong (sprouted)',   category: 'dal',  servingSize: '1 cup (100g)',     calories: 105, proteinG: 8,    carbsG: 14,   fatG: 0.5,  fiberG: 4 },
  { id: 'in-032', name: 'Sambar',                   category: 'dal',  servingSize: '1 bowl (200g)',    calories: 120, proteinG: 6,    carbsG: 18,   fatG: 3,    fiberG: 4 },
  { id: 'in-033', name: 'Rasam',                    category: 'dal',  servingSize: '1 bowl (200g)',    calories: 60,  proteinG: 2,    carbsG: 10,   fatG: 1.5,  fiberG: 1 },

  // ── RICE DISHES ────────────────────────────────────────────────────────────
  { id: 'in-034', name: 'Steamed Rice',             category: 'rice', servingSize: '1 cup cooked (180g)', calories: 240, proteinG: 5, carbsG: 53,   fatG: 0.5,  fiberG: 0.5 },
  { id: 'in-035', name: 'Chicken Biryani',          category: 'rice', servingSize: '1 plate (350g)',   calories: 520, proteinG: 28,   carbsG: 62,   fatG: 16,   fiberG: 2 },
  { id: 'in-036', name: 'Mutton Biryani',           category: 'rice', servingSize: '1 plate (350g)',   calories: 570, proteinG: 30,   carbsG: 60,   fatG: 22,   fiberG: 2 },
  { id: 'in-037', name: 'Veg Biryani',              category: 'rice', servingSize: '1 plate (300g)',   calories: 390, proteinG: 9,    carbsG: 68,   fatG: 9,    fiberG: 4 },
  { id: 'in-038', name: 'Fried Rice',               category: 'rice', servingSize: '1 plate (250g)',   calories: 400, proteinG: 9,    carbsG: 68,   fatG: 10,   fiberG: 2 },
  { id: 'in-039', name: 'Curd Rice',                category: 'rice', servingSize: '1 bowl (200g)',    calories: 250, proteinG: 7,    carbsG: 45,   fatG: 4.5,  fiberG: 0.5 },
  { id: 'in-040', name: 'Lemon Rice',               category: 'rice', servingSize: '1 bowl (180g)',    calories: 280, proteinG: 5,    carbsG: 48,   fatG: 7,    fiberG: 1 },
  { id: 'in-041', name: 'Tamarind Rice',            category: 'rice', servingSize: '1 bowl (180g)',    calories: 295, proteinG: 5,    carbsG: 52,   fatG: 7,    fiberG: 2 },
  { id: 'in-042', name: 'Peas Pulao',               category: 'rice', servingSize: '1 bowl (180g)',    calories: 300, proteinG: 7,    carbsG: 54,   fatG: 6.5,  fiberG: 3 },
  { id: 'in-043', name: 'Khichdi',                  category: 'rice', servingSize: '1 bowl (200g)',    calories: 220, proteinG: 9,    carbsG: 38,   fatG: 3.5,  fiberG: 3 },
  { id: 'in-044', name: 'Brown Rice (cooked)',      category: 'rice', servingSize: '1 cup (180g)',     calories: 215, proteinG: 5,    carbsG: 45,   fatG: 1.5,  fiberG: 3.5 },

  // ── INDIAN BREADS ──────────────────────────────────────────────────────────
  { id: 'in-045', name: 'Roti / Chapati (1)',       category: 'bread', servingSize: '1 piece (35g)',    calories: 100, proteinG: 3,    carbsG: 18,   fatG: 2,    fiberG: 2 },
  { id: 'in-046', name: 'Tandoori Roti',            category: 'bread', servingSize: '1 piece (50g)',    calories: 120, proteinG: 4,    carbsG: 22,   fatG: 1.5,  fiberG: 2 },
  { id: 'in-047', name: 'Butter Naan',              category: 'bread', servingSize: '1 piece (90g)',    calories: 260, proteinG: 7,    carbsG: 40,   fatG: 9,    fiberG: 2 },
  { id: 'in-048', name: 'Garlic Naan',              category: 'bread', servingSize: '1 piece (90g)',    calories: 270, proteinG: 7,    carbsG: 41,   fatG: 9.5,  fiberG: 2 },
  { id: 'in-049', name: 'Missi Roti',               category: 'bread', servingSize: '1 piece (50g)',    calories: 130, proteinG: 5,    carbsG: 20,   fatG: 3,    fiberG: 3 },
  { id: 'in-050', name: 'Jowar Roti',               category: 'bread', servingSize: '1 piece (40g)',    calories: 95,  proteinG: 3,    carbsG: 19,   fatG: 1,    fiberG: 2 },
  { id: 'in-051', name: 'Bajra Roti',               category: 'bread', servingSize: '1 piece (40g)',    calories: 100, proteinG: 3.5,  carbsG: 18,   fatG: 1.5,  fiberG: 2.5 },
  { id: 'in-052', name: 'Kulcha',                   category: 'bread', servingSize: '1 piece (80g)',    calories: 230, proteinG: 6,    carbsG: 38,   fatG: 6,    fiberG: 1.5 },
  { id: 'in-053', name: 'Bhatura',                  category: 'bread', servingSize: '1 piece (90g)',    calories: 300, proteinG: 6,    carbsG: 44,   fatG: 11,   fiberG: 1 },
  { id: 'in-054', name: 'Stuffed Kulcha (Potato)',  category: 'bread', servingSize: '1 piece (100g)',   calories: 280, proteinG: 6.5,  carbsG: 46,   fatG: 8,    fiberG: 2.5 },

  // ── VEGETARIAN CURRIES ─────────────────────────────────────────────────────
  { id: 'in-055', name: 'Palak Paneer',             category: 'curry-veg', servingSize: '1 bowl (200g)',    calories: 280, proteinG: 14,   carbsG: 12,   fatG: 20,   fiberG: 3 },
  { id: 'in-056', name: 'Paneer Butter Masala',     category: 'curry-veg', servingSize: '1 bowl (200g)',    calories: 380, proteinG: 16,   carbsG: 18,   fatG: 28,   fiberG: 2 },
  { id: 'in-057', name: 'Shahi Paneer',             category: 'curry-veg', servingSize: '1 bowl (200g)',    calories: 400, proteinG: 16,   carbsG: 18,   fatG: 30,   fiberG: 2 },
  { id: 'in-058', name: 'Matar Paneer',             category: 'curry-veg', servingSize: '1 bowl (200g)',    calories: 300, proteinG: 14,   carbsG: 22,   fatG: 18,   fiberG: 4 },
  { id: 'in-059', name: 'Aloo Gobi',                category: 'curry-veg', servingSize: '1 bowl (180g)',    calories: 170, proteinG: 5,    carbsG: 28,   fatG: 5,    fiberG: 5 },
  { id: 'in-060', name: 'Aloo Matar',               category: 'curry-veg', servingSize: '1 bowl (180g)',    calories: 190, proteinG: 5.5,  carbsG: 32,   fatG: 5,    fiberG: 4 },
  { id: 'in-061', name: 'Bhindi Masala',            category: 'curry-veg', servingSize: '1 bowl (150g)',    calories: 160, proteinG: 4,    carbsG: 18,   fatG: 8,    fiberG: 5 },
  { id: 'in-062', name: 'Baingan Bharta',           category: 'curry-veg', servingSize: '1 bowl (150g)',    calories: 140, proteinG: 4,    carbsG: 18,   fatG: 6,    fiberG: 5 },
  { id: 'in-063', name: 'Mixed Veg Sabzi',          category: 'curry-veg', servingSize: '1 bowl (180g)',    calories: 160, proteinG: 5,    carbsG: 22,   fatG: 6,    fiberG: 4 },
  { id: 'in-064', name: 'Jeera Aloo',               category: 'curry-veg', servingSize: '1 bowl (150g)',    calories: 200, proteinG: 3,    carbsG: 32,   fatG: 7,    fiberG: 3 },
  { id: 'in-065', name: 'Pav Bhaji',                category: 'curry-veg', servingSize: '1 plate (300g)',   calories: 430, proteinG: 11,   carbsG: 70,   fatG: 13,   fiberG: 7 },
  { id: 'in-066', name: 'Matar Mushroom',           category: 'curry-veg', servingSize: '1 bowl (180g)',    calories: 180, proteinG: 7,    carbsG: 18,   fatG: 9,    fiberG: 4 },
  { id: 'in-067', name: 'Lauki Ki Sabzi',           category: 'curry-veg', servingSize: '1 bowl (180g)',    calories: 100, proteinG: 3,    carbsG: 14,   fatG: 4,    fiberG: 2 },
  { id: 'in-068', name: 'Karela Sabzi',             category: 'curry-veg', servingSize: '1 bowl (150g)',    calories: 110, proteinG: 3,    carbsG: 14,   fatG: 5,    fiberG: 3 },
  { id: 'in-069', name: 'Kadai Paneer',             category: 'curry-veg', servingSize: '1 bowl (200g)',    calories: 360, proteinG: 16,   carbsG: 16,   fatG: 26,   fiberG: 3 },
  { id: 'in-070', name: 'Dal Tadka',                category: 'curry-veg', servingSize: '1 bowl (200g)',    calories: 190, proteinG: 11,   carbsG: 28,   fatG: 4,    fiberG: 5 },
  { id: 'in-071', name: 'Avial',                    category: 'curry-veg', servingSize: '1 bowl (180g)',    calories: 190, proteinG: 5,    carbsG: 22,   fatG: 10,   fiberG: 5 },
  { id: 'in-072', name: 'Kootu',                    category: 'curry-veg', servingSize: '1 bowl (200g)',    calories: 210, proteinG: 9,    carbsG: 28,   fatG: 7,    fiberG: 6 },

  // ── NON-VEG CURRIES ────────────────────────────────────────────────────────
  { id: 'in-073', name: 'Butter Chicken',           category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 360, proteinG: 28,   carbsG: 12,   fatG: 22,   fiberG: 1.5 },
  { id: 'in-074', name: 'Chicken Tikka Masala',     category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 310, proteinG: 30,   carbsG: 10,   fatG: 17,   fiberG: 2 },
  { id: 'in-075', name: 'Chicken Curry',            category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 280, proteinG: 26,   carbsG: 8,    fatG: 16,   fiberG: 1 },
  { id: 'in-076', name: 'Mutton Curry',             category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 330, proteinG: 28,   carbsG: 7,    fatG: 20,   fiberG: 1 },
  { id: 'in-077', name: 'Egg Curry',                category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 260, proteinG: 18,   carbsG: 10,   fatG: 17,   fiberG: 1 },
  { id: 'in-078', name: 'Fish Curry',               category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 240, proteinG: 26,   carbsG: 8,    fatG: 12,   fiberG: 1 },
  { id: 'in-079', name: 'Prawn Masala',             category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 230, proteinG: 26,   carbsG: 9,    fatG: 11,   fiberG: 1 },
  { id: 'in-080', name: 'Keema Matar',              category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 350, proteinG: 28,   carbsG: 14,   fatG: 20,   fiberG: 4 },
  { id: 'in-081', name: 'Chicken Korma',            category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 400, proteinG: 28,   carbsG: 12,   fatG: 27,   fiberG: 1 },
  { id: 'in-082', name: 'Rogan Josh',               category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 320, proteinG: 27,   carbsG: 8,    fatG: 20,   fiberG: 1 },
  { id: 'in-083', name: 'Goan Fish Curry',          category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 260, proteinG: 24,   carbsG: 10,   fatG: 14,   fiberG: 1.5 },
  { id: 'in-084', name: 'Chicken Saag',             category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 270, proteinG: 27,   carbsG: 9,    fatG: 14,   fiberG: 3 },
  { id: 'in-085', name: 'Kadai Chicken',            category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 295, proteinG: 28,   carbsG: 10,   fatG: 17,   fiberG: 2 },
  { id: 'in-086', name: 'Chicken Handi',            category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 320, proteinG: 29,   carbsG: 9,    fatG: 19,   fiberG: 1.5 },
  { id: 'in-087', name: 'Nihari',                   category: 'curry-nonveg', servingSize: '1 bowl (200g)',    calories: 360, proteinG: 30,   carbsG: 8,    fatG: 23,   fiberG: 1 },

  // ── STREET FOOD ────────────────────────────────────────────────────────────
  { id: 'in-088', name: 'Samosa (fried)',           category: 'street-food', servingSize: '2 pieces (100g)',  calories: 290, proteinG: 5,    carbsG: 36,   fatG: 14,   fiberG: 3 },
  { id: 'in-089', name: 'Pani Puri (6 pieces)',     category: 'street-food', servingSize: '6 pieces (120g)',  calories: 200, proteinG: 4,    carbsG: 36,   fatG: 4.5,  fiberG: 2 },
  { id: 'in-090', name: 'Bhel Puri',                category: 'street-food', servingSize: '1 plate (150g)',   calories: 220, proteinG: 5,    carbsG: 38,   fatG: 6,    fiberG: 3 },
  { id: 'in-091', name: 'Sev Puri',                 category: 'street-food', servingSize: '1 plate (150g)',   calories: 270, proteinG: 6,    carbsG: 38,   fatG: 10,   fiberG: 3 },
  { id: 'in-092', name: 'Dahi Puri',                category: 'street-food', servingSize: '1 plate (150g)',   calories: 230, proteinG: 6,    carbsG: 36,   fatG: 7,    fiberG: 2 },
  { id: 'in-093', name: 'Vada Pav',                 category: 'street-food', servingSize: '1 piece (150g)',   calories: 290, proteinG: 8,    carbsG: 44,   fatG: 9,    fiberG: 3 },
  { id: 'in-094', name: 'Kachori',                  category: 'street-food', servingSize: '1 piece (80g)',    calories: 280, proteinG: 6,    carbsG: 32,   fatG: 14,   fiberG: 3 },
  { id: 'in-095', name: 'Aloo Tikki',               category: 'street-food', servingSize: '2 pieces (120g)',  calories: 260, proteinG: 4.5,  carbsG: 38,   fatG: 10,   fiberG: 3 },
  { id: 'in-096', name: 'Dahi Vada',                category: 'street-food', servingSize: '2 pieces (150g)',  calories: 240, proteinG: 9,    carbsG: 34,   fatG: 7,    fiberG: 2 },
  { id: 'in-097', name: 'Chaat (Papdi)',            category: 'street-food', servingSize: '1 plate (150g)',   calories: 270, proteinG: 6,    carbsG: 40,   fatG: 9,    fiberG: 3 },
  { id: 'in-098', name: 'Ragda Patties',            category: 'street-food', servingSize: '1 plate (250g)',   calories: 350, proteinG: 11,   carbsG: 52,   fatG: 11,   fiberG: 7 },
  { id: 'in-099', name: 'Dabeli',                   category: 'street-food', servingSize: '1 piece (130g)',   calories: 260, proteinG: 7,    carbsG: 42,   fatG: 7,    fiberG: 3 },
  { id: 'in-100', name: 'Kathi Roll (Chicken)',     category: 'street-food', servingSize: '1 roll (180g)',    calories: 340, proteinG: 22,   carbsG: 38,   fatG: 11,   fiberG: 2 },
  { id: 'in-101', name: 'Egg Roll',                 category: 'street-food', servingSize: '1 roll (160g)',    calories: 300, proteinG: 14,   carbsG: 36,   fatG: 12,   fiberG: 2 },
  { id: 'in-102', name: 'Frankies (Paneer)',        category: 'street-food', servingSize: '1 roll (180g)',    calories: 360, proteinG: 14,   carbsG: 46,   fatG: 14,   fiberG: 3 },

  // ── SNACKS ─────────────────────────────────────────────────────────────────
  { id: 'in-103', name: 'Chakli',                   category: 'snack', servingSize: '4 pieces (40g)',    calories: 190, proteinG: 3.5,  carbsG: 24,   fatG: 9,    fiberG: 1.5 },
  { id: 'in-104', name: 'Murukku',                  category: 'snack', servingSize: '4 pieces (40g)',    calories: 195, proteinG: 3,    carbsG: 25,   fatG: 9.5,  fiberG: 1 },
  { id: 'in-105', name: 'Chivda (Poha Mix)',        category: 'snack', servingSize: '1 cup (50g)',       calories: 230, proteinG: 5,    carbsG: 32,   fatG: 9,    fiberG: 2 },
  { id: 'in-106', name: 'Namak Pare',               category: 'snack', servingSize: '1 cup (40g)',       calories: 195, proteinG: 4,    carbsG: 26,   fatG: 9,    fiberG: 1 },
  { id: 'in-107', name: 'Mathri',                   category: 'snack', servingSize: '4 pieces (40g)',    calories: 200, proteinG: 4,    carbsG: 26,   fatG: 9.5,  fiberG: 1 },
  { id: 'in-108', name: 'Mixture (Bombay Mix)',     category: 'snack', servingSize: '1 cup (50g)',       calories: 250, proteinG: 6,    carbsG: 30,   fatG: 12,   fiberG: 2 },
  { id: 'in-109', name: 'Sev',                      category: 'snack', servingSize: '30g',               calories: 160, proteinG: 4,    carbsG: 18,   fatG: 8,    fiberG: 1 },
  { id: 'in-110', name: 'Bhujia',                   category: 'snack', servingSize: '30g',               calories: 150, proteinG: 4.5,  carbsG: 17,   fatG: 7,    fiberG: 2 },
  { id: 'in-111', name: 'Roasted Chana (chhatpata)',category: 'snack', servingSize: '1 cup (50g)',       calories: 190, proteinG: 11,   carbsG: 28,   fatG: 3.5,  fiberG: 6 },
  { id: 'in-112', name: 'Dhokla',                   category: 'snack', servingSize: '4 pieces (100g)',   calories: 165, proteinG: 7,    carbsG: 28,   fatG: 3,    fiberG: 2 },
  { id: 'in-113', name: 'Khandvi',                  category: 'snack', servingSize: '6 pieces (100g)',   calories: 155, proteinG: 7,    carbsG: 22,   fatG: 4,    fiberG: 1 },
  { id: 'in-114', name: 'Fafda',                    category: 'snack', servingSize: '4 pieces (50g)',    calories: 220, proteinG: 5,    carbsG: 28,   fatG: 10,   fiberG: 1.5 },
  { id: 'in-115', name: 'Bhakarwadi',               category: 'snack', servingSize: '4 pieces (50g)',    calories: 235, proteinG: 5,    carbsG: 30,   fatG: 11,   fiberG: 2 },
  { id: 'in-116', name: 'Papdi',                    category: 'snack', servingSize: '6 pieces (30g)',    calories: 140, proteinG: 3,    carbsG: 18,   fatG: 6.5,  fiberG: 1 },
  { id: 'in-117', name: 'Peanuts (roasted, salted)',category: 'snack', servingSize: '1 handful (30g)',   calories: 175, proteinG: 7,    carbsG: 6,    fatG: 14,   fiberG: 2 },

  // ── SWEETS & DESSERTS ──────────────────────────────────────────────────────
  { id: 'in-118', name: 'Gulab Jamun (2 pieces)',   category: 'sweet', servingSize: '2 pieces (80g)',    calories: 280, proteinG: 4,    carbsG: 42,   fatG: 10,   fiberG: 0.5 },
  { id: 'in-119', name: 'Rasgulla (2 pieces)',      category: 'sweet', servingSize: '2 pieces (80g)',    calories: 180, proteinG: 5,    carbsG: 36,   fatG: 2,    fiberG: 0 },
  { id: 'in-120', name: 'Kheer (Rice)',             category: 'sweet', servingSize: '1 bowl (150g)',     calories: 260, proteinG: 6,    carbsG: 40,   fatG: 8,    fiberG: 0.5 },
  { id: 'in-121', name: 'Halwa (Moong Dal)',        category: 'sweet', servingSize: '1 piece (100g)',    calories: 380, proteinG: 8,    carbsG: 54,   fatG: 14,   fiberG: 1 },
  { id: 'in-122', name: 'Jalebi',                   category: 'sweet', servingSize: '3 pieces (50g)',    calories: 220, proteinG: 2,    carbsG: 46,   fatG: 4,    fiberG: 0.5 },
  { id: 'in-123', name: 'Barfi (Milk)',             category: 'sweet', servingSize: '2 pieces (50g)',    calories: 210, proteinG: 5,    carbsG: 32,   fatG: 7,    fiberG: 0 },
  { id: 'in-124', name: 'Ladoo (Bundi)',            category: 'sweet', servingSize: '2 pieces (60g)',    calories: 270, proteinG: 4,    carbsG: 40,   fatG: 10,   fiberG: 1 },
  { id: 'in-125', name: 'Ladoo (Besan)',            category: 'sweet', servingSize: '2 pieces (60g)',    calories: 290, proteinG: 5,    carbsG: 36,   fatG: 14,   fiberG: 1.5 },
  { id: 'in-126', name: 'Peda',                     category: 'sweet', servingSize: '2 pieces (40g)',    calories: 190, proteinG: 5,    carbsG: 28,   fatG: 7,    fiberG: 0 },
  { id: 'in-127', name: 'Mysore Pak',              category: 'sweet', servingSize: '2 pieces (50g)',    calories: 290, proteinG: 5,    carbsG: 28,   fatG: 18,   fiberG: 1.5 },
  { id: 'in-128', name: 'Shrikhand',               category: 'sweet', servingSize: '1 bowl (100g)',     calories: 220, proteinG: 7,    carbsG: 36,   fatG: 6,    fiberG: 0 },
  { id: 'in-129', name: 'Kulfi (1 piece)',          category: 'sweet', servingSize: '1 piece (80g)',     calories: 180, proteinG: 5,    carbsG: 24,   fatG: 7,    fiberG: 0 },
  { id: 'in-130', name: 'Rasmalai (2 pieces)',      category: 'sweet', servingSize: '2 pieces (100g)',   calories: 220, proteinG: 8,    carbsG: 28,   fatG: 9,    fiberG: 0 },

  // ── DAIRY ──────────────────────────────────────────────────────────────────
  { id: 'in-131', name: 'Paneer (100g)',             category: 'dairy', servingSize: '100g',              calories: 265, proteinG: 18,   carbsG: 4,    fatG: 20,   fiberG: 0 },
  { id: 'in-132', name: 'Dahi / Curd (full fat)',   category: 'dairy', servingSize: '1 cup (200g)',      calories: 130, proteinG: 7,    carbsG: 9,    fatG: 7,    fiberG: 0 },
  { id: 'in-133', name: 'Dahi (low fat)',           category: 'dairy', servingSize: '1 cup (200g)',      calories: 100, proteinG: 8,    carbsG: 10,   fatG: 2.5,  fiberG: 0 },
  { id: 'in-134', name: 'Toned Milk (250ml)',       category: 'dairy', servingSize: '250ml',             calories: 125, proteinG: 8.5,  carbsG: 12,   fatG: 4,    fiberG: 0 },
  { id: 'in-135', name: 'Full Cream Milk (250ml)',  category: 'dairy', servingSize: '250ml',             calories: 165, proteinG: 8,    carbsG: 12,   fatG: 9,    fiberG: 0 },
  { id: 'in-136', name: 'Chaas / Buttermilk',       category: 'dairy', servingSize: '1 glass (250ml)',   calories: 55,  proteinG: 4,    carbsG: 5,    fatG: 2,    fiberG: 0 },
  { id: 'in-137', name: 'Lassi (sweet)',            category: 'dairy', servingSize: '1 glass (300ml)',   calories: 250, proteinG: 8,    carbsG: 40,   fatG: 7,    fiberG: 0 },
  { id: 'in-138', name: 'Lassi (salted)',           category: 'dairy', servingSize: '1 glass (300ml)',   calories: 140, proteinG: 7,    carbsG: 12,   fatG: 7,    fiberG: 0 },
  { id: 'in-139', name: 'Paneer Tikka',             category: 'dairy', servingSize: '1 serving (150g)',  calories: 320, proteinG: 22,   carbsG: 8,    fatG: 22,   fiberG: 1 },
  { id: 'in-140', name: 'Makhana (Fox Nuts)',       category: 'snack', servingSize: '1 cup (30g)',       calories: 110, proteinG: 4,    carbsG: 20,   fatG: 0.5,  fiberG: 0.5 },

  // ── BEVERAGES ──────────────────────────────────────────────────────────────
  { id: 'in-141', name: 'Masala Chai (with milk)',  category: 'beverage', servingSize: '1 cup (200ml)',   calories: 70,  proteinG: 2.5,  carbsG: 10,   fatG: 2.5,  fiberG: 0 },
  { id: 'in-142', name: 'Black Tea',                category: 'beverage', servingSize: '1 cup (200ml)',   calories: 5,   proteinG: 0.5,  carbsG: 1,    fatG: 0,    fiberG: 0 },
  { id: 'in-143', name: 'Coffee (with milk)',       category: 'beverage', servingSize: '1 cup (200ml)',   calories: 60,  proteinG: 2,    carbsG: 8,    fatG: 2,    fiberG: 0 },
  { id: 'in-144', name: 'Mango Shake',              category: 'beverage', servingSize: '1 glass (300ml)', calories: 260, proteinG: 5,    carbsG: 48,   fatG: 7,    fiberG: 1 },
  { id: 'in-145', name: 'Haldi Doodh (Golden Milk)',category: 'beverage', servingSize: '1 glass (250ml)', calories: 160, proteinG: 8,    carbsG: 14,   fatG: 8,    fiberG: 0.5 },
  { id: 'in-146', name: 'Jaljeera',                 category: 'beverage', servingSize: '1 glass (200ml)', calories: 30,  proteinG: 0.5,  carbsG: 6,    fatG: 0.5,  fiberG: 0.5 },
  { id: 'in-147', name: 'Coconut Water',            category: 'beverage', servingSize: '1 glass (250ml)', calories: 55,  proteinG: 0.5,  carbsG: 13,   fatG: 0,    fiberG: 0 },
  { id: 'in-148', name: 'Aam Panna',                category: 'beverage', servingSize: '1 glass (200ml)', calories: 90,  proteinG: 0.5,  carbsG: 22,   fatG: 0,    fiberG: 1 },
  { id: 'in-149', name: 'Rose Sharbat',             category: 'beverage', servingSize: '1 glass (200ml)', calories: 100, proteinG: 0,    carbsG: 25,   fatG: 0,    fiberG: 0 },

  // ── EGGS & CHICKEN (COMMON) ────────────────────────────────────────────────
  { id: 'in-150', name: 'Boiled Egg',               category: 'protein', servingSize: '1 large (50g)',    calories: 78,  proteinG: 6,    carbsG: 0.6,  fatG: 5,    fiberG: 0 },
  { id: 'in-151', name: 'Egg Bhurji',               category: 'protein', servingSize: '2 eggs (120g)',    calories: 200, proteinG: 13,   carbsG: 4,    fatG: 15,   fiberG: 0.5 },
  { id: 'in-152', name: 'Omelette (2 egg)',         category: 'protein', servingSize: '1 piece (100g)',   calories: 180, proteinG: 13,   carbsG: 2,    fatG: 13,   fiberG: 0.5 },
  { id: 'in-153', name: 'Grilled Chicken Breast',  category: 'protein', servingSize: '100g',             calories: 165, proteinG: 31,   carbsG: 0,    fatG: 3.6,  fiberG: 0 },
  { id: 'in-154', name: 'Tandoori Chicken',         category: 'protein', servingSize: '1 piece (150g)',   calories: 250, proteinG: 32,   carbsG: 5,    fatG: 11,   fiberG: 0.5 },
  { id: 'in-155', name: 'Chicken Seekh Kebab',      category: 'protein', servingSize: '2 pieces (120g)',  calories: 230, proteinG: 28,   carbsG: 4,    fatG: 12,   fiberG: 0.5 },
  { id: 'in-156', name: 'Mutton Seekh Kebab',       category: 'protein', servingSize: '2 pieces (120g)',  calories: 270, proteinG: 25,   carbsG: 4,    fatG: 17,   fiberG: 0.5 },
  { id: 'in-157', name: 'Boiled Chicken (skinless)',category: 'protein', servingSize: '100g',             calories: 150, proteinG: 30,   carbsG: 0,    fatG: 3,    fiberG: 0 },

  // ── GRAINS & CEREALS ──────────────────────────────────────────────────────
  { id: 'in-158', name: 'Oats Porridge (plain)',    category: 'grain', servingSize: '1 bowl (200g)',     calories: 145, proteinG: 5,    carbsG: 25,   fatG: 3,    fiberG: 4 },
  { id: 'in-159', name: 'Ragi Porridge',            category: 'grain', servingSize: '1 bowl (200g)',     calories: 170, proteinG: 5,    carbsG: 34,   fatG: 1.5,  fiberG: 4 },
  { id: 'in-160', name: 'Dalia (Broken Wheat)',     category: 'grain', servingSize: '1 bowl (200g)',     calories: 200, proteinG: 6,    carbsG: 38,   fatG: 2,    fiberG: 5 },
  { id: 'in-161', name: 'Wheat Flakes',             category: 'grain', servingSize: '1 cup (40g)',       calories: 145, proteinG: 4.5,  carbsG: 30,   fatG: 1,    fiberG: 3 },

  // ── FRUITS ────────────────────────────────────────────────────────────────
  { id: 'in-162', name: 'Mango (1 medium)',         category: 'fruit', servingSize: '1 medium (200g)',   calories: 135, proteinG: 1,    carbsG: 35,   fatG: 0.5,  fiberG: 3 },
  { id: 'in-163', name: 'Banana (1 medium)',        category: 'fruit', servingSize: '1 medium (120g)',   calories: 105, proteinG: 1.3,  carbsG: 27,   fatG: 0.4,  fiberG: 3.1 },
  { id: 'in-164', name: 'Apple (1 medium)',         category: 'fruit', servingSize: '1 medium (182g)',   calories: 95,  proteinG: 0.5,  carbsG: 25,   fatG: 0.3,  fiberG: 4.4 },
  { id: 'in-165', name: 'Pomegranate',              category: 'fruit', servingSize: '1 cup arils (174g)',calories: 144, proteinG: 3,    carbsG: 33,   fatG: 2,    fiberG: 7 },
  { id: 'in-166', name: 'Papaya',                   category: 'fruit', servingSize: '1 cup (145g)',      calories: 62,  proteinG: 0.7,  carbsG: 16,   fatG: 0.4,  fiberG: 2.5 },
  { id: 'in-167', name: 'Guava',                    category: 'fruit', servingSize: '1 medium (100g)',   calories: 68,  proteinG: 2.6,  carbsG: 14,   fatG: 1,    fiberG: 5.4 },
  { id: 'in-168', name: 'Watermelon',               category: 'fruit', servingSize: '2 cups (280g)',     calories: 84,  proteinG: 1.7,  carbsG: 21,   fatG: 0.4,  fiberG: 1.1 },
  { id: 'in-169', name: 'Grapes',                   category: 'fruit', servingSize: '1 cup (92g)',       calories: 62,  proteinG: 0.6,  carbsG: 16,   fatG: 0.3,  fiberG: 0.8 },
  { id: 'in-170', name: 'Orange',                   category: 'fruit', servingSize: '1 medium (130g)',   calories: 62,  proteinG: 1.2,  carbsG: 15,   fatG: 0.2,  fiberG: 3.1 },
  { id: 'in-171', name: 'Chickoo / Sapota',         category: 'fruit', servingSize: '1 medium (100g)',   calories: 83,  proteinG: 0.4,  carbsG: 20,   fatG: 1.1,  fiberG: 5.3 },

  // ── CONDIMENTS & SAUCES ───────────────────────────────────────────────────
  { id: 'in-172', name: 'Green Chutney',            category: 'condiment', servingSize: '2 tbsp (30g)',   calories: 20,  proteinG: 1,    carbsG: 3,    fatG: 0.5,  fiberG: 1 },
  { id: 'in-173', name: 'Tamarind Chutney',         category: 'condiment', servingSize: '2 tbsp (30g)',   calories: 50,  proteinG: 0.5,  carbsG: 12,   fatG: 0.2,  fiberG: 0.5 },
  { id: 'in-174', name: 'Ghee (clarified butter)',  category: 'condiment', servingSize: '1 tsp (5g)',     calories: 45,  proteinG: 0,    carbsG: 0,    fatG: 5,    fiberG: 0 },
  { id: 'in-175', name: 'Coconut Chutney',          category: 'condiment', servingSize: '3 tbsp (45g)',   calories: 80,  proteinG: 1.5,  carbsG: 5,    fatG: 6,    fiberG: 2 },
  { id: 'in-176', name: 'Pickle (Mango)',           category: 'condiment', servingSize: '1 tsp (10g)',    calories: 25,  proteinG: 0.2,  carbsG: 2,    fatG: 2,    fiberG: 0.5 },

  // ── SOUTH INDIAN SPECIALS ──────────────────────────────────────────────────
  { id: 'in-177', name: 'Appam',                    category: 'south-indian', servingSize: '2 pieces (80g)', calories: 180, proteinG: 4,   carbsG: 34,   fatG: 2.5,  fiberG: 1 },
  { id: 'in-178', name: 'Idiyappam',                category: 'south-indian', servingSize: '2 pieces (80g)', calories: 150, proteinG: 2.5, carbsG: 32,   fatG: 1,    fiberG: 0.5 },
  { id: 'in-179', name: 'Kerala Puttu',             category: 'south-indian', servingSize: '2 pieces (100g)',calories: 195, proteinG: 3.5, carbsG: 42,   fatG: 1,    fiberG: 1 },
  { id: 'in-180', name: 'Chettinad Chicken Curry',  category: 'south-indian', servingSize: '1 bowl (200g)',   calories: 310, proteinG: 28,  carbsG: 8,    fatG: 18,   fiberG: 2 },
  { id: 'in-181', name: 'Prawn Koliwada',           category: 'south-indian', servingSize: '1 serving (150g)',calories: 240, proteinG: 22,  carbsG: 14,   fatG: 10,   fiberG: 1.5 },
  { id: 'in-182', name: 'Kerala Fish Fry',          category: 'south-indian', servingSize: '1 piece (120g)',  calories: 200, proteinG: 24,  carbsG: 5,    fatG: 10,   fiberG: 0.5 },
  { id: 'in-183', name: 'Olan',                     category: 'south-indian', servingSize: '1 bowl (180g)',   calories: 140, proteinG: 5,   carbsG: 18,   fatG: 6,    fiberG: 5 },
  { id: 'in-184', name: 'Thoran (Cabbage)',         category: 'south-indian', servingSize: '1 bowl (150g)',   calories: 135, proteinG: 4,   carbsG: 14,   fatG: 7,    fiberG: 4 },
  { id: 'in-185', name: 'Kozhikodan Halwa',         category: 'south-indian', servingSize: '2 pieces (60g)',  calories: 290, proteinG: 1,   carbsG: 60,   fatG: 7,    fiberG: 0.5 },

  // ── NORTH INDIAN SPECIALS ──────────────────────────────────────────────────
  { id: 'in-186', name: 'Saag (Sarson)',            category: 'north-indian', servingSize: '1 bowl (200g)',  calories: 210, proteinG: 7,   carbsG: 22,   fatG: 10,   fiberG: 6 },
  { id: 'in-187', name: 'Dal Baati Churma',         category: 'north-indian', servingSize: '1 plate (350g)', calories: 650, proteinG: 18,  carbsG: 90,   fatG: 22,   fiberG: 8 },
  { id: 'in-188', name: 'Litti Chokha',             category: 'north-indian', servingSize: '2 pieces (220g)',calories: 480, proteinG: 14,  carbsG: 70,   fatG: 16,   fiberG: 7 },
  { id: 'in-189', name: 'Kebab (Galouti)',          category: 'north-indian', servingSize: '2 pieces (100g)',calories: 280, proteinG: 16,  carbsG: 14,   fatG: 18,   fiberG: 1 },
  { id: 'in-190', name: 'Amritsari Kulcha',         category: 'north-indian', servingSize: '1 piece (120g)', calories: 330, proteinG: 8,   carbsG: 52,   fatG: 10,   fiberG: 3 },

  // ── PROTEIN-RICH FOODS ─────────────────────────────────────────────────────
  { id: 'in-191', name: 'Soya Chunks (cooked)',     category: 'protein', servingSize: '1 cup (80g)',     calories: 90,  proteinG: 15,   carbsG: 6,    fatG: 0.5,  fiberG: 1.5 },
  { id: 'in-192', name: 'Sprouts Salad',            category: 'protein', servingSize: '1 cup (100g)',    calories: 80,  proteinG: 7,    carbsG: 12,   fatG: 0.5,  fiberG: 4 },
  { id: 'in-193', name: 'Chana Chaat',              category: 'protein', servingSize: '1 bowl (150g)',   calories: 210, proteinG: 10,   carbsG: 34,   fatG: 4,    fiberG: 8 },
  { id: 'in-194', name: 'Moong Dal Chilla',         category: 'protein', servingSize: '2 pieces (100g)', calories: 175, proteinG: 12,   carbsG: 24,   fatG: 3,    fiberG: 4 },
  { id: 'in-195', name: 'Besan Chilla',             category: 'protein', servingSize: '2 pieces (100g)', calories: 200, proteinG: 10,   carbsG: 26,   fatG: 6,    fiberG: 4 },
  { id: 'in-196', name: 'Paneer Bhurji',            category: 'protein', servingSize: '1 bowl (150g)',   calories: 310, proteinG: 20,   carbsG: 6,    fatG: 23,   fiberG: 1 },
  { id: 'in-197', name: 'Tofu (plain)',             category: 'protein', servingSize: '100g',            calories: 76,  proteinG: 8,    carbsG: 2,    fatG: 4.5,  fiberG: 0.3 },
  { id: 'in-198', name: 'Chicken Tikka',            category: 'protein', servingSize: '1 serving (150g)',calories: 225, proteinG: 32,   carbsG: 4,    fatG: 9,    fiberG: 0.5 },
  { id: 'in-199', name: 'Fish Tikka',               category: 'protein', servingSize: '1 serving (150g)',calories: 195, proteinG: 28,   carbsG: 4,    fatG: 7,    fiberG: 0.5 },
  { id: 'in-200', name: 'Tuna (canned)',            category: 'protein', servingSize: '1 can (120g)',    calories: 130, proteinG: 28,   carbsG: 0,    fatG: 1.5,  fiberG: 0 },

  // ── OILS & FATS ───────────────────────────────────────────────────────────
  { id: 'in-201', name: 'Mustard Oil',              category: 'fat', servingSize: '1 tbsp (14g)',       calories: 124, proteinG: 0,    carbsG: 0,    fatG: 14,   fiberG: 0 },
  { id: 'in-202', name: 'Coconut Oil',              category: 'fat', servingSize: '1 tbsp (14g)',       calories: 121, proteinG: 0,    carbsG: 0,    fatG: 14,   fiberG: 0 },
  { id: 'in-203', name: 'Groundnut Oil',            category: 'fat', servingSize: '1 tbsp (14g)',       calories: 124, proteinG: 0,    carbsG: 0,    fatG: 14,   fiberG: 0 },

  // ── NUTS & DRY FRUITS ─────────────────────────────────────────────────────
  { id: 'in-204', name: 'Almonds',                  category: 'nuts', servingSize: '1 handful (28g)',   calories: 164, proteinG: 6,    carbsG: 6,    fatG: 14,   fiberG: 3.5 },
  { id: 'in-205', name: 'Cashews',                  category: 'nuts', servingSize: '1 handful (28g)',   calories: 157, proteinG: 5,    carbsG: 9,    fatG: 12,   fiberG: 1 },
  { id: 'in-206', name: 'Walnuts',                  category: 'nuts', servingSize: '1 handful (28g)',   calories: 185, proteinG: 4.3,  carbsG: 4,    fatG: 18.5, fiberG: 2 },
  { id: 'in-207', name: 'Dates (Khajoor)',          category: 'nuts', servingSize: '3 pieces (24g)',    calories: 66,  proteinG: 0.6,  carbsG: 18,   fatG: 0.1,  fiberG: 1.6 },
  { id: 'in-208', name: 'Raisins (Kishmish)',       category: 'nuts', servingSize: '1 tbsp (15g)',      calories: 45,  proteinG: 0.5,  carbsG: 11,   fatG: 0,    fiberG: 0.6 },
  { id: 'in-209', name: 'Pistachios',               category: 'nuts', servingSize: '1 handful (28g)',   calories: 159, proteinG: 5.7,  carbsG: 8,    fatG: 13,   fiberG: 3 },

  // ── VEGETABLES ────────────────────────────────────────────────────────────
  { id: 'in-210', name: 'Spinach (cooked)',         category: 'vegetable', servingSize: '1 cup (180g)',  calories: 41,  proteinG: 5.4,  carbsG: 7,    fatG: 0.5,  fiberG: 4.3 },
  { id: 'in-211', name: 'Potato (boiled)',          category: 'vegetable', servingSize: '1 medium (150g)',calories: 130, proteinG: 2.5,  carbsG: 30,   fatG: 0.2,  fiberG: 2 },
  { id: 'in-212', name: 'Sweet Potato (boiled)',   category: 'vegetable', servingSize: '1 medium (150g)',calories: 135, proteinG: 2,    carbsG: 31,   fatG: 0.1,  fiberG: 3.8 },
  { id: 'in-213', name: 'Broccoli (steamed)',       category: 'vegetable', servingSize: '1 cup (91g)',   calories: 31,  proteinG: 3,    carbsG: 6,    fatG: 0.3,  fiberG: 2.4 },
  { id: 'in-214', name: 'Cauliflower (cooked)',     category: 'vegetable', servingSize: '1 cup (124g)',  calories: 28,  proteinG: 2,    carbsG: 5.5,  fatG: 0.5,  fiberG: 2.5 },
  { id: 'in-215', name: 'Tomato (raw)',             category: 'vegetable', servingSize: '1 medium (123g)',calories: 22,  proteinG: 1,    carbsG: 5,    fatG: 0.2,  fiberG: 1.5 },
  { id: 'in-216', name: 'Onion (raw)',              category: 'vegetable', servingSize: '1 medium (110g)',calories: 44,  proteinG: 1.2,  carbsG: 10,   fatG: 0.1,  fiberG: 1.9 },
  { id: 'in-217', name: 'Peas (green, cooked)',     category: 'vegetable', servingSize: '1 cup (160g)',  calories: 118, proteinG: 8,    carbsG: 21,   fatG: 0.6,  fiberG: 7 },
  { id: 'in-218', name: 'Cucumber',                 category: 'vegetable', servingSize: '1 cup (119g)',  calories: 16,  proteinG: 0.7,  carbsG: 3.8,  fatG: 0.1,  fiberG: 0.5 },
  { id: 'in-219', name: 'Drumstick / Moringa',      category: 'vegetable', servingSize: '100g',          calories: 37,  proteinG: 2.1,  carbsG: 8.5,  fatG: 0.2,  fiberG: 2 },
  { id: 'in-220', name: 'Raw Banana (green)',       category: 'vegetable', servingSize: '1 medium (120g)',calories: 110, proteinG: 1.5,  carbsG: 27,   fatG: 0.3,  fiberG: 3 },
];

export function searchIndianFoods(query: string): IndianFood[] {
  if (!query.trim()) return INDIAN_FOODS.slice(0, 30);
  const q = query.toLowerCase();
  return INDIAN_FOODS.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
  );
}
