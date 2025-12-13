/**
 * SwipeScreen
 * Main swipe interface with restaurant cards
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator, 
  Text,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { colors, spacing } from '../design/tokens';
import RestaurantCard from '../components/RestaurantCard';
import ActionBar from '../components/ActionBar';
import { searchBusinesses } from '../services/yelpApi';
import { YelpBusiness } from '../services/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const VERTICAL_DAMPING = 0.1; // Reduce vertical movement
const SCALE_DIVISOR = 1000; // For scale calculation

export default function SwipeScreen() {
  const [restaurants, setRestaurants] = useState<YelpBusiness[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation values using React Native Animated API
  const position = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Load restaurants on mount
  useEffect(() => {
    loadRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      // Default to Los Angeles for testing
      const response = await searchBusinesses(
        'Popular restaurants in Los Angeles',
        34.0522,
        -118.2437
      );
      
      if (response.entities && response.entities[0]?.businesses) {
        setRestaurants(response.entities[0].businesses);
      } else {
        setError('No restaurants found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurants');
      console.error('Error loading restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex >= restaurants.length) return;
    
    // Save swipe action (right = like, left = pass)
    if (direction === 'right') {
      console.log('Liked:', restaurants[currentIndex].name);
    } else {
      console.log('Passed:', restaurants[currentIndex].name);
    }
    
    // Animate card off screen
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH, y: 0 },
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move to next card
      setCurrentIndex(prev => prev + 1);
      // Reset animation
      position.setValue({ x: 0, y: 0 });
      scale.setValue(1);
    });
  };

  const handlePass = () => {
    handleSwipe('left');
  };

  const handleLike = () => {
    handleSwipe('right');
  };

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy * VERTICAL_DAMPING });
        scale.setValue(1 - Math.abs(gestureState.dx) / SCALE_DIVISOR);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          const direction = gestureState.dx > 0 ? 'right' : 'left';
          handleSwipe(direction);
        } else {
          // Spring back
          Animated.parallel([
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const animatedStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { scale: scale },
    ],
  };

  const currentRestaurant = restaurants[currentIndex];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentRestaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No more restaurants</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Card stack - show next 2 cards behind */}
        {restaurants.slice(currentIndex, currentIndex + 3).map((restaurant, index) => {
          if (index === 0) {
            // Current card with gestures
            return (
              <Animated.View
                key={restaurant.id}
                style={[styles.card, animatedStyle]}
                {...panResponder.panHandlers}
              >
                <RestaurantCard restaurant={restaurant} />
              </Animated.View>
            );
          }
          // Background cards
          return (
            <View 
              key={restaurant.id} 
              style={[
                styles.card, 
                styles.backgroundCard,
                { zIndex: -index }
              ]}
            >
              <RestaurantCard restaurant={restaurant} />
            </View>
          );
        })}
      </View>

      <ActionBar onPass={handlePass} onLike={handleLike} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    position: 'absolute',
  },
  backgroundCard: {
    opacity: 0.3,
    transform: [{ scale: 0.95 }],
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
});

