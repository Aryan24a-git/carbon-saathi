/**
 * @fileoverview Emission factors database for CarbonSaathi AI.
 * All factors sourced from IPCC 2023 data.
 * India electricity grid factor: 0.82 kg CO2/kWh.
 * @module server/data/emissionFactors
 */

const EMISSION_FACTORS = {
  travel: {
    scooter_petrol: { factor: 0.092, unit: 'kg CO2/km', label: 'Petrol Scooter', icon: '🛵' },
    car_petrol: { factor: 0.21, unit: 'kg CO2/km', label: 'Petrol Car', icon: '🚗' },
    car_electric: { factor: 0.05, unit: 'kg CO2/km', label: 'Electric Car', icon: '⚡' },
    auto_rickshaw: { factor: 0.065, unit: 'kg CO2/km', label: 'Auto Rickshaw', icon: '🛺' },
    bus: { factor: 0.089, unit: 'kg CO2/km', label: 'Bus', icon: '🚌' },
    metro: { factor: 0.031, unit: 'kg CO2/km', label: 'Metro', icon: '🚇' },
    train: { factor: 0.041, unit: 'kg CO2/km', label: 'Train', icon: '🚂' },
    flight_domestic: { factor: 0.255, unit: 'kg CO2/km', label: 'Domestic Flight', icon: '✈️' },
    walking: { factor: 0, unit: 'kg CO2/km', label: 'Walking', icon: '🚶' },
    cycling: { factor: 0, unit: 'kg CO2/km', label: 'Cycling', icon: '🚲' }
  },
  food: {
    beef: { factor: 27.0, unit: 'kg CO2/kg', label: 'Beef', icon: '🥩' },
    mutton: { factor: 39.2, unit: 'kg CO2/kg', label: 'Mutton', icon: '🍖' },
    chicken: { factor: 6.9, unit: 'kg CO2/kg', label: 'Chicken', icon: '🍗' },
    fish: { factor: 6.1, unit: 'kg CO2/kg', label: 'Fish', icon: '🐟' },
    dairy: { factor: 3.2, unit: 'kg CO2/kg', label: 'Dairy', icon: '🥛' },
    eggs: { factor: 4.5, unit: 'kg CO2/kg', label: 'Eggs', icon: '🥚' },
    vegetables: { factor: 2.0, unit: 'kg CO2/kg', label: 'Vegetables', icon: '🥦' },
    rice: { factor: 2.7, unit: 'kg CO2/kg', label: 'Rice', icon: '🍚' },
    pulses: { factor: 0.9, unit: 'kg CO2/kg', label: 'Pulses/Dal', icon: '🫘' }
  },
  energy: {
    electricity: { factor: 0.82, unit: 'kg CO2/kWh', label: 'Electricity', icon: '⚡' },
    lpg_cooking: { factor: 1.51, unit: 'kg CO2/litre', label: 'LPG Cooking', icon: '🍳' },
    ac_usage: { factor: 1.23, unit: 'kg CO2/hour', label: 'Air Conditioning', icon: '❄️' }
  },
  shopping: {
    clothing: { factor: 20.0, unit: 'kg CO2/item', label: 'Clothing', icon: '👕' },
    electronics: { factor: 70.0, unit: 'kg CO2/item', label: 'Electronics', icon: '📱' },
    online_delivery: { factor: 0.5, unit: 'kg CO2/order', label: 'Online Delivery', icon: '📦' }
  },
  flights: {
    domestic: { factor: 0.255, unit: 'kg CO2/km', label: 'Domestic Flight', icon: '✈️' },
    international: { factor: 0.195, unit: 'kg CO2/km', label: 'International', icon: '🌍' }
  }
};

const INDIA_DAILY_AVERAGE_KG = 11.5;
const INDIA_ANNUAL_AVERAGE_KG = 1900;
const TREE_ABSORPTION_KG_PER_YEAR = 21;
const TREE_ABSORPTION_KG_PER_DAY = 0.057;

module.exports = {
  EMISSION_FACTORS,
  INDIA_DAILY_AVERAGE_KG,
  INDIA_ANNUAL_AVERAGE_KG,
  TREE_ABSORPTION_KG_PER_YEAR,
  TREE_ABSORPTION_KG_PER_DAY
};
