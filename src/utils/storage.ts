import AsyncStorage from '@react-native-async-storage/async-storage';
import { YelpBusiness } from '../services/types';

const STORAGE_KEYS = {
  LIKED_RESTAURANTS: '@tabletalk:liked_restaurants',
  PASSED_RESTAURANTS: '@tabletalk:passed_restaurants',
  SAVED_TABLES: '@tabletalk:saved_tables',
  TABLES: '@tabletalk:tables',
  PLANS: '@tabletalk:plans',
  USER_PROFILE: '@tabletalk:user_profile',
  ONBOARDING_COMPLETE: '@tabletalk:onboarding_complete',
  USER_PREFERENCES: '@tabletalk:user_preferences',
} as const;

export interface UserPreferences {
  name?: string; // User's name
  profilePhoto?: string; // URI to profile photo
  cuisines: string[]; // Max 3 selections
  budget: string[]; // ['$', '$$', '$$$', '$$$$']
  distance: number; // in miles
  dietary: string[]; // ['vegetarian', 'vegan', 'gluten-free', etc.]
  intent?: 'solo' | 'date' | 'friends' | 'family'; // Optional intent toggle
  location?: {
    latitude: number;
    longitude: number;
  }; // User's current location
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  cuisines: [],
  budget: ['$', '$$', '$$$'],
  distance: 5, // 5 miles default
  dietary: [],
};

export interface Table {
  id: string;
  restaurantId: string;
  restaurant: YelpBusiness;
  memberIds: string[]; // Users who joined this table
  memberCount: number;
  timeIntent: {
    tonight: number;
    thisWeek: number;
    weekend: number;
  };
  createdAt: Date;
}

export interface TableMember {
  userId: string;
  name: string;
  avatar?: string;
  joinedAt: Date;
  timeIntent?: 'tonight' | 'thisWeek' | 'weekend';
}

export interface Plan {
  id: string;
  tableId: string;
  restaurant: YelpBusiness;
  proposedBy: string; // userId
  timeWindow: 'tonight' | 'thisWeek' | 'weekend';
  vibe: 'quickBite' | 'drinks' | 'dinner';
  status: 'pending' | 'accepted' | 'declined';
  inviteCopy?: string; // AI-generated 1-line invite
  createdAt: Date;
}

export const saveLikedRestaurant = async (restaurantId: string): Promise<void> => {
  try {
    const liked = await getLikedRestaurants();
    if (!liked.includes(restaurantId)) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LIKED_RESTAURANTS,
        JSON.stringify([...liked, restaurantId])
      );
    }
  } catch (error) {
    console.error('Error saving liked restaurant:', error);
  }
};

export const savePassedRestaurant = async (restaurantId: string): Promise<void> => {
  try {
    const passed = await getPassedRestaurants();
    if (!passed.includes(restaurantId)) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PASSED_RESTAURANTS,
        JSON.stringify([...passed, restaurantId])
      );
    }
  } catch (error) {
    console.error('Error saving passed restaurant:', error);
  }
};

export const getLikedRestaurants = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LIKED_RESTAURANTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting liked restaurants:', error);
    return [];
  }
};

export const getPassedRestaurants = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PASSED_RESTAURANTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting passed restaurants:', error);
    return [];
  }
};

export const removeLikedRestaurant = async (restaurantId: string): Promise<void> => {
  try {
    const liked = await getLikedRestaurants();
    const updated = liked.filter((id) => id !== restaurantId);
    await AsyncStorage.setItem(STORAGE_KEYS.LIKED_RESTAURANTS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing liked restaurant:', error);
  }
};

export const isRestaurantLiked = async (restaurantId: string): Promise<boolean> => {
  const liked = await getLikedRestaurants();
  return liked.includes(restaurantId);
};

export const isRestaurantPassed = async (restaurantId: string): Promise<boolean> => {
  const passed = await getPassedRestaurants();
  return passed.includes(restaurantId);
};

export const saveUserPreferences = async (preferences: UserPreferences): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PREFERENCES,
      JSON.stringify(preferences)
    );
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

export const getUserPreferences = async (): Promise<UserPreferences | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
};

export const setOnboardingComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  } catch (error) {
    console.error('Error setting onboarding complete:', error);
  }
};

export const isOnboardingComplete = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

export const saveTable = async (table: Table): Promise<void> => {
  try {
    const tables = await getTables();
    const updated = tables.filter((t) => t.id !== table.id);
    updated.push(table);
    await AsyncStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving table:', error);
  }
};

export const getTables = async (): Promise<Table[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TABLES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting tables:', error);
    return [];
  }
};

export const getTableByRestaurantId = async (restaurantId: string): Promise<Table | null> => {
  try {
    const tables = await getTables();
    return tables.find((t) => t.restaurantId === restaurantId) || null;
  } catch (error) {
    console.error('Error getting table by restaurant ID:', error);
    return null;
  }
};

export const savePlan = async (plan: Plan): Promise<void> => {
  try {
    const plans = await getPlans();
    const updated = plans.filter((p) => p.id !== plan.id);
    updated.push(plan);
    await AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving plan:', error);
  }
};

export const getPlans = async (): Promise<Plan[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PLANS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting plans:', error);
    return [];
  }
};

export const getPlansForTable = async (tableId: string): Promise<Plan[]> => {
  try {
    const plans = await getPlans();
    return plans.filter((p) => p.tableId === tableId);
  } catch (error) {
    console.error('Error getting plans for table:', error);
    return [];
  }
};

export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.LIKED_RESTAURANTS,
      STORAGE_KEYS.PASSED_RESTAURANTS,
      STORAGE_KEYS.SAVED_TABLES,
      STORAGE_KEYS.TABLES,
      STORAGE_KEYS.PLANS,
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.ONBOARDING_COMPLETE,
      STORAGE_KEYS.USER_PREFERENCES,
    ]);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

