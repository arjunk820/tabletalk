import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing } from '../design/tokens';
import RestaurantCard from '../components/RestaurantCard';
import ActionBar from '../components/ActionBar';
import { searchBusinesses } from '../services/yelpApi';
import { YelpBusiness } from '../services/types';
import { useSwipe } from '../context/SwipeContext';
import { getUserPreferences, UserPreferences } from '../utils/storage';
import { calculateDistance } from '../utils/distance';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Increase threshold slightly for a more decisive swipe
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VERTICAL_DAMPING = 0.1;

interface SwipeScreenProps {
  onChatPress?: (restaurant: YelpBusiness) => void;
}

export default function SwipeScreen({ onChatPress }: SwipeScreenProps = {}) {
  const [restaurants, setRestaurants] = useState<YelpBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false); // Prevent gestures during animation
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false); // Prevent duplicate calls
  const { 
    addLikedRestaurant, 
    addPassedRestaurant, 
    passedRestaurantIds, 
    likedRestaurantIds,
    currentSwipeIndex,
    setCurrentSwipeIndex,
    joinTable,
  } = useSwipe();
  
  // Use context index instead of local state
  const currentIndex = currentSwipeIndex;
  const setCurrentIndex = setCurrentSwipeIndex;

  // Animation values for the CURRENT card
  const position = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  // New: Animation value for the NEXT card (to scale it up)
  const nextCardScale = useRef(new Animated.Value(0.9)).current; // Start at 0.9 (background scale)
  const nextCardOpacity = useRef(new Animated.Value(0.5)).current; // Start at 0.5 (background opacity)

  // Load user preferences on mount
  useEffect(() => {
    loadUserPreferences();
  }, []);

  // Track previous preferences key to detect preference changes
  const prevPrefsKeyRef = useRef<string | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load restaurants on mount and when passed/liked restaurants or preferences change
  useEffect(() => {
    if (!userPreferences) {
      return;
    }
    
    const prefsKey = JSON.stringify({
      location: userPreferences.location,
      distance: userPreferences.distance,
      cuisines: userPreferences.cuisines,
    });
    
    // Reset index when preferences change (not when just liked/passed changes)
    const preferencesChanged = prevPrefsKeyRef.current !== null && prevPrefsKeyRef.current !== prefsKey;
    if (preferencesChanged) {
      setCurrentIndex(0);
    }
    
    prevPrefsKeyRef.current = prefsKey;
    
    // Debounce API calls to prevent rate limiting (300ms delay)
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    loadTimeoutRef.current = setTimeout(() => {
      loadRestaurants();
    }, 300);
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passedRestaurantIds.length, likedRestaurantIds.length, userPreferences?.location, userPreferences?.distance, userPreferences?.cuisines]);

  const loadUserPreferences = async () => {
    try {
      const prefs = await getUserPreferences();
      setUserPreferences(prefs);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  // New: Start the next card's scale-up animation whenever currentIndex changes
  useEffect(() => {
    if (currentIndex < restaurants.length) {
      // Animate the next card to its foreground state when the index updates
      Animated.parallel([
        Animated.timing(nextCardScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(nextCardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentIndex, restaurants.length, nextCardScale, nextCardOpacity]);

  const loadRestaurants = async () => {
    if (!userPreferences) {
      setError('Please complete onboarding first');
      setLoading(false);
      return;
    }

    // Prevent duplicate calls
    if (isLoadingRestaurants) {
      return;
    }

    try {
      setIsLoadingRestaurants(true);
      setLoading(true);
      setError(null);

      // Determine which location to use (city takes precedence over GPS)
      const location = userPreferences.location;
      if (!location) {
        setError('Location not set. Please update your settings.');
        setLoading(false);
        return;
      }

      // Build cuisine query
      const cuisineQuery = userPreferences.cuisines.length > 0
        ? userPreferences.cuisines.join(', ')
        : 'restaurants';

      // Build query string - include city name if city is set
      let query = `Popular ${cuisineQuery} restaurants`;
      if (userPreferences.city) {
        query += ` in ${userPreferences.city}`;
      } else {
        query += ` near me`;
      }

      // Search with location coordinates (from city if set, otherwise GPS)
      const response = await searchBusinesses(
        query,
        location.latitude,
        location.longitude
      );
      
      if (response.entities && response.entities[0]?.businesses) {
        let allRestaurants = response.entities[0].businesses;
        
        // Filter out already passed AND liked restaurants
        allRestaurants = allRestaurants.filter(
          (restaurant) => 
            !passedRestaurantIds.includes(restaurant.id) &&
            !likedRestaurantIds.includes(restaurant.id)
        );

        // Filter by distance
        const maxDistance = userPreferences.distance || 5;
        allRestaurants = allRestaurants.filter((restaurant) => {
          if (!restaurant.coordinates) return false;
          
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            restaurant.coordinates.latitude,
            restaurant.coordinates.longitude
          );
          
          return distance <= maxDistance;
        });

        // Filter by budget if specified
        if (userPreferences.budget && userPreferences.budget.length > 0) {
          allRestaurants = allRestaurants.filter((restaurant) => {
            if (!restaurant.price) return false;
            return userPreferences.budget!.includes(restaurant.price);
          });
        }

        // Sort: prioritize restaurants matching user's cuisines
        if (userPreferences.cuisines.length > 0) {
          allRestaurants.sort((a, b) => {
            const aMatches = a.categories.some(cat =>
              userPreferences.cuisines.some(cuisine =>
                cat.title.toLowerCase().includes(cuisine.toLowerCase()) ||
                cuisine.toLowerCase().includes(cat.title.toLowerCase())
              )
            );
            const bMatches = b.categories.some(cat =>
              userPreferences.cuisines.some(cuisine =>
                cat.title.toLowerCase().includes(cuisine.toLowerCase()) ||
                cuisine.toLowerCase().includes(cat.title.toLowerCase())
              )
            );
            
            if (aMatches && !bMatches) return -1;
            if (!aMatches && bMatches) return 1;
            return 0;
          });
        }

        setRestaurants(allRestaurants);
        
        // Reset index if it's beyond the new list length or if we have a fresh list
        if (currentIndex >= allRestaurants.length) {
          setCurrentIndex(0);
        }
        
        if (allRestaurants.length === 0) {
          setError('No restaurants found matching your preferences. Try adjusting your settings.');
        }
      } else {
        setError('No restaurants found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load restaurants';
      setError(errorMessage);
      console.error('Error loading restaurants:', err);
      setLoading(false);
    } finally {
      setIsLoadingRestaurants(false);
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= restaurants.length || isAnimating) {
      return;
    }
    
    const currentRestaurant = restaurants[currentIndex];
    
    // Set animating flag to prevent multiple swipes
    setIsAnimating(true);
    
    // Save swipe action immediately (don't wait for animation)
    if (direction === 'right') {
      await addLikedRestaurant(currentRestaurant);
      await joinTable(currentRestaurant); // Join table when swiping right
      console.log('Joined table:', currentRestaurant.name);
    } else {
      await addPassedRestaurant(currentRestaurant.id);
      console.log('Passed:', currentRestaurant.name);
    }
    
    // Reset background card's animation values BEFORE starting the swipe out
    nextCardScale.setValue(0.9);
    nextCardOpacity.setValue(0.5);
    
    // Calculate end position
    const endX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    
    // Stop any ongoing animations first
    position.stopAnimation();
    scale.stopAnimation();
    
    // Animate card off screen from current position
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: endX, y: 0 },
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move to next card
      setCurrentIndex(currentIndex + 1);
      // Reset current card's animation for the next card
      position.setValue({ x: 0, y: 0 });
      scale.setValue(1);
      // Reset animating flag
      setIsAnimating(false);
    });
  };

  const handlePass = () => {
    handleSwipe('left');
  };

  const handleLike = () => {
    handleSwipe('right');
  };

  // Use refs to access current values in pan responder without recreating it
  const currentIndexRef = useRef(currentIndex);
  const restaurantsRef = useRef(restaurants);
  
  useEffect(() => {
    currentIndexRef.current = currentIndex;
    restaurantsRef.current = restaurants;
  }, [currentIndex, restaurants]);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Don't respond if already animating
        if (isAnimating) return false;
        // Only activate on horizontal movement (swipe)
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        // Stop any active animations
        position.stopAnimation();
        scale.stopAnimation();
        // Set offset to current position so we can track relative movement
        position.setOffset({
          x: (position.x as any)._value || 0,
          y: (position.y as any)._value || 0,
        });
        position.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        // Use gestureState.dx/dy directly since we set offset in Grant
        position.setValue({ x: gestureState.dx, y: gestureState.dy * VERTICAL_DAMPING });
        
        // This scale reduction is now applied through the PanResponder
        // The scale for background cards is handled by nextCardScale
        scale.setValue(1 - Math.abs(gestureState.dx) / 1500); // Slight scale down during drag
        
        // **Bonus:** Interpolate the next card's scale during the drag for a smoother transition
        const progress = Math.abs(gestureState.dx) / SWIPE_THRESHOLD;
        const nextScaleValue = 0.9 + (1 - 0.9) * Math.min(progress, 1);
        nextCardScale.setValue(nextScaleValue);
        const nextOpacityValue = 0.5 + (1 - 0.5) * Math.min(progress, 1);
        nextCardOpacity.setValue(nextOpacityValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Flatten offset into value before checking threshold
        position.flattenOffset();
        
        // Right swipe: dx > threshold → like (checkmark)
        if (gestureState.dx > SWIPE_THRESHOLD) {
          handleSwipe('right');
        } 
        // Left swipe: dx < -threshold → pass (X)
        else if (gestureState.dx < -SWIPE_THRESHOLD) {
          handleSwipe('left');
        } 
        // Not enough swipe distance → spring back
        else {
          // Spring back (reset current card)
          const nextIndex = currentIndexRef.current + 1;
          const restaurantsLength = restaurantsRef.current.length;
          
          Animated.parallel([
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }),
            // Spring back next card's temporary scale/opacity changes
            Animated.parallel([
              Animated.timing(nextCardScale, {
                toValue: nextIndex < restaurantsLength ? 0.9 : 1, // Stay 0.9 if it's still a background card
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(nextCardOpacity, {
                toValue: nextIndex < restaurantsLength ? 0.5 : 1, // Stay 0.5 if it's still a background card
                duration: 200,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        // Handle interruption (e.g., by another gesture)
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      },
    })
  ).current;

  // Added rotation interpolation
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const animatedStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate: rotate }, // Apply rotation
      { scale: scale },
    ],
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    const isRateLimit = error.includes('Rate limit');
    const isNetworkError = error.includes('Network error');
    
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          {(isRateLimit || isNetworkError) && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                loadRestaurants();
              }}
              disabled={isLoadingRestaurants}
            >
              <Text style={styles.retryButtonText}>
                {isLoadingRestaurants ? 'Loading...' : 'Retry'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (currentIndex >= restaurants.length) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No more restaurants</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Render cards in reverse order to ensure proper zIndex layering in React Native */}
        {restaurants.slice(currentIndex, currentIndex + 3).reverse().map((restaurant, index, arr) => {
          const actualIndex = arr.length - 1 - index; // Map back to 0, 1, 2...
          const isCurrentCard = actualIndex === 0;
          const isNextCard = actualIndex === 1;
          
          if (isCurrentCard) {
            // Current card with gestures
            return (
              <Animated.View
                key={restaurant.id}
                style={[styles.card, animatedStyle]}
                collapsable={false}
                {...panResponder.panHandlers}
              >
                <RestaurantCard 
                  restaurant={restaurant} 
                  userPreferences={userPreferences}
                  onChatPress={onChatPress ? () => onChatPress(restaurant) : undefined}
                />
              </Animated.View>
            );
          }
          
          let backgroundStyle: any = {};
          
          if (isNextCard) {
            // Next card (index 1) uses the animated scale/opacity
            backgroundStyle = {
              transform: [{ scale: nextCardScale }],
              opacity: nextCardOpacity,
            };
          } else {
            // Further background cards (index 2+) use static, smaller values
            backgroundStyle = {
              opacity: 0.3,
              transform: [{ scale: 0.85 }], // Made this slightly smaller for more depth
            };
          }
          
          // Background cards
          return (
            <Animated.View 
              key={restaurant.id} 
              style={[
                styles.card, 
                styles.backgroundCard,
                backgroundStyle,
                { zIndex: -actualIndex } // Use negative index for layering
              ]}
              // Must not have panHandlers
            >
              <RestaurantCard 
                restaurant={restaurant}
                onChatPress={onChatPress ? () => onChatPress(restaurant) : undefined}
              />
            </Animated.View>
          );
        })}
      </View>

      <ActionBar onPass={handlePass} onLike={handleLike} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
    paddingBottom: 80, // Space for bottom nav bar (NavBar height + padding)
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - spacing.md * 2,
    // Add border radius for visual appeal
    borderRadius: spacing.sm,
    // Add shadow (optional, but good for card effect)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  // The static backgroundCard style is now mostly decorative/structural
  backgroundCard: {
    backgroundColor: colors.white, // Explicit background color is important for stacking
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.gray600,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    color: colors.gray600,
    fontSize: 18,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: spacing.sm,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

