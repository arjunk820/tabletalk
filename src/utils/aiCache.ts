import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@tabletalk:ai_cache:';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedResponse {
  value: string;
  timestamp: number;
}

function getCacheKey(restaurantId: string, queryType: string): string {
  return `${CACHE_PREFIX}${restaurantId}:${queryType}`;
}

export async function getCachedAIResponse(
  restaurantId: string,
  queryType: string
): Promise<string | null> {
  try {
    const key = getCacheKey(restaurantId, queryType);
    const cached = await AsyncStorage.getItem(key);
    
    if (!cached) {
      return null;
    }

    const parsed: CachedResponse = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - parsed.timestamp > CACHE_EXPIRY_MS) {
      // Remove expired cache
      await AsyncStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch (error) {
    console.error('Error getting cached AI response:', error);
    return null;
  }
}

export async function cacheAIResponse(
  restaurantId: string,
  queryType: string,
  value: string
): Promise<void> {
  try {
    const key = getCacheKey(restaurantId, queryType);
    const cached: CachedResponse = {
      value,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error('Error caching AI response:', error);
    // Don't throw - caching failure shouldn't break the app
  }
}

export async function clearAICache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error('Error clearing AI cache:', error);
  }
}

export async function clearRestaurantCache(restaurantId: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.startsWith(`${CACHE_PREFIX}${restaurantId}:`)
    );
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error('Error clearing restaurant cache:', error);
  }
}

