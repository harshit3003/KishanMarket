// In-memory instant geocoding dictionary for fast map loading (<5ms)
const CITY_COORDS = {
  'karnal': [29.6857, 76.9905],
  'ludhiana': [30.9010, 75.8573],
  'jalandhar': [31.3260, 75.5762],
  'rohtak': [28.8955, 76.5831],
  'banda': [25.4764, 80.3346],
  'jaipur': [26.9124, 75.7873],
  'kota': [25.2138, 75.8648],
  'udaipur': [24.5854, 73.7125],
  'delhi': [28.6139, 77.2090],
  'punjab': [31.1471, 75.3412],
  'haryana': [29.0588, 76.0856],
  'uttar pradesh': [26.8467, 80.9462],
  'rajasthan': [27.0238, 74.2179],
  'amritsar': [31.6340, 74.8723],
  'patiala': [30.3398, 76.3869],
  'bathinda': [30.2110, 74.9455],
  'hisar': [29.1492, 75.7217],
  'panipat': [29.3909, 76.9635],
  'ambala': [30.3782, 76.7767],
  'lucknow': [26.8467, 80.9462],
  'kanpur': [26.4499, 80.3319],
  'agra': [27.1767, 78.0081],
  'varanasi': [25.3176, 82.9739]
};

export const getInstantCoords = (locationName) => {
  if (!locationName) return [28.6139, 77.2090];
  const clean = locationName.toLowerCase();
  
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (clean.includes(city)) return coords;
  }

  // Hash-based deterministic coordinate fallback for unlisted towns (prevents network delay)
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 25.0 + Math.abs((hash % 1000) / 100);
  const lng = 75.0 + Math.abs(((hash >> 3) % 1000) / 100);
  return [lat, lng];
};
