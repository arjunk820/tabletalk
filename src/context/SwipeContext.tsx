import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { YelpBusiness } from '../services/types';
import {
  saveLikedRestaurant,
  savePassedRestaurant,
  getLikedRestaurants,
  getPassedRestaurants,
  Table,
  getTableByRestaurantId,
  saveTable,
  getTables,
} from '../utils/storage';
import { addMockMembersToTable } from '../utils/mockData';

interface SwipeContextType {
  likedRestaurants: YelpBusiness[];
  likedRestaurantIds: string[];
  passedRestaurantIds: string[];
  tables: Table[];
  currentSwipeIndex: number;
  setCurrentSwipeIndex: (index: number) => void;
  addLikedRestaurant: (restaurant: YelpBusiness) => Promise<void>;
  addPassedRestaurant: (restaurantId: string) => Promise<void>;
  removeLikedRestaurant: (restaurantId: string) => Promise<void>;
  isRestaurantLiked: (restaurantId: string) => boolean;
  isRestaurantPassed: (restaurantId: string) => boolean;
  joinTable: (restaurant: YelpBusiness) => Promise<Table>;
  getTableForRestaurant: (restaurantId: string) => Table | null;
  loadSavedData: () => Promise<void>;
}

const SwipeContext = createContext<SwipeContextType | undefined>(undefined);

export function SwipeProvider({ children }: { children: React.ReactNode }) {
  const [likedRestaurants, setLikedRestaurants] = useState<YelpBusiness[]>([]);
  const [likedRestaurantIds, setLikedRestaurantIds] = useState<string[]>([]);
  const [passedRestaurantIds, setPassedRestaurantIds] = useState<string[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState<number>(0);

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = useCallback(async () => {
    const likedIds = await getLikedRestaurants();
    const passedIds = await getPassedRestaurants();
    const savedTables = await getTables();
    setLikedRestaurantIds(likedIds);
    setPassedRestaurantIds(passedIds);
    setTables(savedTables);
    // Note: We'll need to fetch full restaurant data if we want to display it
    // For now, we just store IDs
  }, []);

  const addLikedRestaurant = useCallback(async (restaurant: YelpBusiness) => {
    await saveLikedRestaurant(restaurant.id);
    setLikedRestaurantIds((prev) => {
      if (!prev.includes(restaurant.id)) {
        return [...prev, restaurant.id];
      }
      return prev;
    });
    setLikedRestaurants((prev) => {
      if (!prev.find((r) => r.id === restaurant.id)) {
        return [...prev, restaurant];
      }
      return prev;
    });
  }, []);

  const addPassedRestaurant = useCallback(async (restaurantId: string) => {
    await savePassedRestaurant(restaurantId);
    setPassedRestaurantIds((prev) => {
      if (!prev.includes(restaurantId)) {
        return [...prev, restaurantId];
      }
      return prev;
    });
  }, []);

  const removeLikedRestaurant = useCallback(async (restaurantId: string) => {
    const { removeLikedRestaurant: removeFromStorage } = await import('../utils/storage');
    await removeFromStorage(restaurantId);
    setLikedRestaurantIds((prev) => prev.filter((id) => id !== restaurantId));
    setLikedRestaurants((prev) => prev.filter((r) => r.id !== restaurantId));
  }, []);

  const isRestaurantLiked = useCallback(
    (restaurantId: string) => {
      return likedRestaurantIds.includes(restaurantId);
    },
    [likedRestaurantIds]
  );

  const isRestaurantPassed = useCallback(
    (restaurantId: string) => {
      return passedRestaurantIds.includes(restaurantId);
    },
    [passedRestaurantIds]
  );

  const joinTable = useCallback(async (restaurant: YelpBusiness): Promise<Table> => {
    // Check if table already exists
    let table = await getTableByRestaurantId(restaurant.id);
    
    if (!table) {
      // Create new table
      const userId = 'current_user'; // TODO: Get from user context
      table = {
        id: `table_${restaurant.id}`,
        restaurantId: restaurant.id,
        restaurant,
        memberIds: [userId],
        memberCount: 1,
        timeIntent: {
          tonight: 0,
          thisWeek: 0,
          weekend: 0,
        },
        createdAt: new Date(),
      };
      
      // Add mock members for demo (only if table is new)
      const mockData = addMockMembersToTable(table);
      table.memberIds = mockData.memberIds;
      table.memberCount = mockData.memberCount;
      table.timeIntent = mockData.timeIntent;
    } else {
      // Add user to existing table if not already a member
      const userId = 'current_user'; // TODO: Get from user context
      if (!table.memberIds.includes(userId)) {
        table.memberIds.push(userId);
        table.memberCount = table.memberIds.length;
      }
      
      // Ensure table has mock members if it only has the current user
      // This handles cases where tables were created without mock members
      const hasOnlyCurrentUser = table.memberCount === 1 && 
                                 table.memberIds.length === 1 && 
                                 table.memberIds[0] === userId;
      
      if (hasOnlyCurrentUser) {
        // Add mock members to existing table
        const mockData = addMockMembersToTable(table);
        table.memberIds = mockData.memberIds;
        table.memberCount = mockData.memberCount;
        table.timeIntent = mockData.timeIntent;
      }
    }
    
    await saveTable(table);
    setTables((prev) => {
      const updated = prev.filter((t) => t.id !== table!.id);
      updated.push(table!);
      return updated;
    });
    
    return table;
  }, []);

  const getTableForRestaurant = useCallback(
    (restaurantId: string): Table | null => {
      return tables.find((t) => t.restaurantId === restaurantId) || null;
    },
    [tables]
  );

  return (
    <SwipeContext.Provider
      value={{
        likedRestaurants,
        likedRestaurantIds,
        passedRestaurantIds,
        tables,
        currentSwipeIndex,
        setCurrentSwipeIndex,
        addLikedRestaurant,
        addPassedRestaurant,
        removeLikedRestaurant,
        isRestaurantLiked,
        isRestaurantPassed,
        joinTable,
        getTableForRestaurant,
        loadSavedData,
      }}
    >
      {children}
    </SwipeContext.Provider>
  );
}

export function useSwipe() {
  const context = useContext(SwipeContext);
  if (context === undefined) {
    throw new Error('useSwipe must be used within a SwipeProvider');
  }
  return context;
}


