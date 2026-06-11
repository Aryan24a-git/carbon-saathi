/**
 * @fileoverview Sustainability tips database for CarbonSaathi AI.
 * Sourced for urban Indian college students living in hostels/PGs.
 * @module server/data/tipsDatabase
 */

const tipsDatabase = [
  // Travel Tips
  {
    id: 'travel_metro',
    category: 'travel',
    tip: 'Take metro instead of auto/cab for distances over 5km — saves 0.29 kg CO2/km.',
    savingKg: 5,
    difficulty: 'easy',
    icon: '🚇',
    collegeStudentRelevant: true
  },
  {
    id: 'travel_carpool',
    category: 'travel',
    tip: 'Carpool with fellow students for weekend trips or coaching classes.',
    savingKg: 3,
    difficulty: 'easy',
    icon: '🚗',
    collegeStudentRelevant: true
  },
  {
    id: 'travel_walk',
    category: 'travel',
    tip: 'Walk or cycle for short runs under 2km instead of taking a scooter.',
    savingKg: 1,
    difficulty: 'easy',
    icon: '🚶',
    collegeStudentRelevant: true
  },
  {
    id: 'travel_shuttle',
    category: 'travel',
    tip: 'Utilize the university electric shuttle or public bus route.',
    savingKg: 2,
    difficulty: 'easy',
    icon: '🚌',
    collegeStudentRelevant: true
  },
  {
    id: 'travel_bus',
    category: 'travel',
    tip: 'Switch daily scooter commute to public bus transport.',
    savingKg: 4,
    difficulty: 'medium',
    icon: '🚌',
    collegeStudentRelevant: true
  },

  // Food Tips
  {
    id: 'food_dal_chawal',
    category: 'food',
    tip: 'Choose dal-chawal over chicken curry — saves 6 kg CO2 per meal.',
    savingKg: 6,
    difficulty: 'easy',
    icon: '🫘',
    collegeStudentRelevant: true
  },
  {
    id: 'food_veg_day',
    category: 'food',
    tip: 'Opt for a vegetarian mess/canteen day once a week.',
    savingKg: 4,
    difficulty: 'easy',
    icon: '🥦',
    collegeStudentRelevant: true
  },
  {
    id: 'food_waste',
    category: 'food',
    tip: 'Take only what you can eat at the dining hall to reduce organic waste.',
    savingKg: 2,
    difficulty: 'easy',
    icon: '🍽️',
    collegeStudentRelevant: true
  },
  {
    id: 'food_tea',
    category: 'food',
    tip: 'Use a reusable bottle or mug at the local chai tapri instead of paper/plastic cups.',
    savingKg: 1,
    difficulty: 'easy',
    icon: '☕',
    collegeStudentRelevant: true
  },
  {
    id: 'food_meat_limit',
    category: 'food',
    tip: 'Limit online meat-heavy fast food orders to once a week.',
    savingKg: 10,
    difficulty: 'medium',
    icon: '🍔',
    collegeStudentRelevant: true
  },

  // Energy Tips
  {
    id: 'energy_fan_lights',
    category: 'energy',
    tip: 'Turn off fan and lights when leaving hostel room — saves 0.4 kg CO2/day.',
    savingKg: 1,
    difficulty: 'easy',
    icon: '💡',
    collegeStudentRelevant: true
  },
  {
    id: 'energy_unplug',
    category: 'energy',
    tip: 'Unplug chargers and adapters when gadgets are fully charged to avoid phantom drain.',
    savingKg: 1,
    difficulty: 'easy',
    icon: '🔌',
    collegeStudentRelevant: true
  },
  {
    id: 'energy_ac_temp',
    category: 'energy',
    tip: 'Keep PG/hostel room AC at 24°C instead of a freezing 18°C.',
    savingKg: 3,
    difficulty: 'easy',
    icon: '❄️',
    collegeStudentRelevant: true
  },
  {
    id: 'energy_library',
    category: 'energy',
    tip: 'Study in the college library or common area to reduce individual room power consumption.',
    savingKg: 2,
    difficulty: 'easy',
    icon: '📚',
    collegeStudentRelevant: true
  },
  {
    id: 'energy_laundry',
    category: 'energy',
    tip: 'Wash clothes in cold water and air-dry on laundry lines rather than using dryers.',
    savingKg: 2,
    difficulty: 'easy',
    icon: '👕',
    collegeStudentRelevant: true
  },

  // Shopping Tips
  {
    id: 'shopping_books',
    category: 'shopping',
    tip: 'Purchase textbooks and reference guides second-hand from seniors or local markets.',
    savingKg: 5,
    difficulty: 'easy',
    icon: '📚',
    collegeStudentRelevant: true
  },
  {
    id: 'shopping_thrift',
    category: 'shopping',
    tip: 'Choose thrifted or rental outfits for college fests instead of fast-fashion purchases.',
    savingKg: 15,
    difficulty: 'medium',
    icon: '👕',
    collegeStudentRelevant: true
  },
  {
    id: 'shopping_delivery',
    category: 'shopping',
    tip: 'Consolidate online e-commerce shopping orders to minimize transit packaging.',
    savingKg: 2,
    difficulty: 'easy',
    icon: '📦',
    collegeStudentRelevant: true
  },
  {
    id: 'shopping_tote',
    category: 'shopping',
    tip: 'Carry a reusable canvas tote bag for local grocers and department store shopping.',
    savingKg: 1,
    difficulty: 'easy',
    icon: '🛍️',
    collegeStudentRelevant: true
  },
  {
    id: 'shopping_refurbished',
    category: 'shopping',
    tip: 'Buy refurbished laptops or smartphones when upgrades are required.',
    savingKg: 50,
    difficulty: 'hard',
    icon: '📱',
    collegeStudentRelevant: true
  },

  // Flights Tips
  {
    id: 'flight_train',
    category: 'flights',
    tip: 'Take overnight trains for semester breaks instead of short-haul domestic flights.',
    savingKg: 40,
    difficulty: 'medium',
    icon: '🚂',
    collegeStudentRelevant: true
  },
  {
    id: 'flight_light',
    category: 'flights',
    tip: 'Pack lighter baggage to reduce aircraft payload weight on flights back home.',
    savingKg: 2,
    difficulty: 'easy',
    icon: '🧳',
    collegeStudentRelevant: true
  },
  {
    id: 'flight_direct',
    category: 'flights',
    tip: 'Book direct flights instead of multi-leg layovers when budget allows to avoid takeoff fuel spikes.',
    savingKg: 20,
    difficulty: 'medium',
    icon: '✈️',
    collegeStudentRelevant: true
  },
  {
    id: 'flight_offset',
    category: 'flights',
    tip: 'Participate in carbon offset initiatives offered during flight ticket checkouts.',
    savingKg: 15,
    difficulty: 'easy',
    icon: '🌱',
    collegeStudentRelevant: true
  },
  {
    id: 'flight_limit',
    category: 'flights',
    tip: 'Limit non-essential domestic flights to once a year, choosing trains instead.',
    savingKg: 80,
    difficulty: 'hard',
    icon: '🌍',
    collegeStudentRelevant: true
  }
];

module.exports = tipsDatabase;
