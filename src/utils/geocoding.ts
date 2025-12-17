import * as Location from 'expo-location';

export const geocodeCity = async (cityName: string): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const results = await Location.geocodeAsync(cityName);
    if (results && results.length > 0) {
      return {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding city:', error);
    return null;
  }
};

