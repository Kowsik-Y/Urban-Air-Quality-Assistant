import type { City } from './types';

export const CITIES: City[] = [
  // National Capital Region (NCR) & North India (Smog Inversion Hotspots)
  { value: 'delhi', label: 'Delhi NCR', state: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { value: 'noida', label: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lon: 77.3910 },
  { value: 'ghaziabad', label: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lon: 77.4538 },
  { value: 'gurgaon', label: 'Gurugram', state: 'Haryana', lat: 28.4595, lon: 77.0266 },
  { value: 'faridabad', label: 'Faridabad', state: 'Haryana', lat: 28.4089, lon: 77.3178 },
  { value: 'meerut', label: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lon: 77.7064 },
  { value: 'chandigarh', label: 'Chandigarh', state: 'Punjab & Haryana', lat: 30.7333, lon: 76.7794 },
  { value: 'ludhiana', label: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573 },
  { value: 'amritsar', label: 'Amritsar', state: 'Punjab', lat: 31.6340, lon: 74.8723 },
  { value: 'jalandhar', label: 'Jalandhar', state: 'Punjab', lat: 31.3260, lon: 75.5762 },
  { value: 'dehradun', label: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lon: 78.0322 },
  { value: 'srinagar', label: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lon: 74.7973 },

  // Uttar Pradesh & Indo-Gangetic Plain
  { value: 'lucknow', label: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { value: 'kanpur', label: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319 },
  { value: 'varanasi', label: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
  { value: 'agra', label: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081 },
  { value: 'patna', label: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
  { value: 'gaya', label: 'Gaya', state: 'Bihar', lat: 24.7914, lon: 85.0002 },

  // Western India
  { value: 'mumbai', label: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  { value: 'pune', label: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { value: 'nagpur', label: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
  { value: 'nashik', label: 'Nashik', state: 'Maharashtra', lat: 19.9975, lon: 73.7898 },
  { value: 'ahmedabad', label: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  { value: 'surat', label: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311 },
  { value: 'vadodara', label: 'Vadodara', state: 'Gujarat', lat: 22.3072, lon: 73.1812 },
  { value: 'rajkot', label: 'Rajkot', state: 'Gujarat', lat: 22.3039, lon: 70.8022 },
  { value: 'jaipur', label: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { value: 'jodhpur', label: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lon: 73.0243 },
  { value: 'udaipur', label: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lon: 73.7125 },

  // Central India
  { value: 'bhopal', label: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
  { value: 'indore', label: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
  { value: 'gwalior', label: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lon: 78.1828 },
  { value: 'jabalpur', label: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lon: 79.9864 },
  { value: 'raipur', label: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lon: 81.6296 },

  // Eastern & North-Eastern India
  { value: 'kolkata', label: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { value: 'howrah', label: 'Howrah', state: 'West Bengal', lat: 22.5958, lon: 88.2636 },
  { value: 'bhubaneswar', label: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lon: 85.8245 },
  { value: 'ranchi', label: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lon: 85.3096 },
  { value: 'jamshedpur', label: 'Jamshedpur', state: 'Jharkhand', lat: 22.8046, lon: 86.2029 },
  { value: 'guwahati', label: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362 },

  // Southern India
  { value: 'bengaluru', label: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { value: 'mysuru', label: 'Mysuru', state: 'Karnataka', lat: 12.2958, lon: 76.6394 },
  { value: 'hyderabad', label: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
  { value: 'visakhapatnam', label: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185 },
  { value: 'vijayawada', label: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480 },
  { value: 'chennai', label: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { value: 'coimbatore', label: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558 },
  { value: 'madurai', label: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198 },
  { value: 'kochi', label: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
  { value: 'thiruvananthapuram', label: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lon: 76.9366 }
];

/**
 * Calculates Haversine distance in kilometers between two geo-coordinates
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest Indian city in the catalog based on latitude and longitude
 */
export function findNearestCity(
  userLat: number,
  userLon: number,
  citiesList: City[] = CITIES
): { city: City; distanceKm: number } {
  let minDistance = Infinity;
  let nearestCity = citiesList[0];

  for (const city of citiesList) {
    if (city.lat != null && city.lon != null) {
      const distance = haversineDistance(userLat, userLon, city.lat, city.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }
  }

  return {
    city: nearestCity,
    distanceKm: Math.round(minDistance * 10) / 10,
  };
}

/**
 * Searches and filters cities by label, state, or value query
 */
export function searchCities(query: string, citiesList: City[] = CITIES): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return citiesList;
  return citiesList.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      (c.state && c.state.toLowerCase().includes(q)) ||
      c.value.toLowerCase().includes(q)
  );
}
