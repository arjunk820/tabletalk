/**
 * RestaurantCard Component
 * Full-bleed hero photo, name, meta row, rating, vibe chips
 */

import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../design/tokens';
import MetaRow from './MetaRow';
import Chip from './Chip';
import { YelpBusiness } from '../services/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const CARD_HEIGHT = CARD_WIDTH * 1.2; // 5:6 aspect ratio

interface RestaurantCardProps {
  restaurant: YelpBusiness;
  onPress?: () => void;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const photoUrl = restaurant.contextual_info?.photos?.[0]?.original_url || '';
  const cuisine = restaurant.categories[0]?.title || '';
  const neighborhood = restaurant.location.city || '';
  const rating = restaurant.rating;
  const reviewCount = restaurant.review_count;
  
  // Get vibe chips (limit to 2)
  const vibeChips: string[] = [];
  if (restaurant.attributes?.Ambience) {
    const ambience = restaurant.attributes.Ambience as Record<string, boolean>;
    if (ambience.casual) vibeChips.push('Casual');
    if (ambience.romantic) vibeChips.push('Date spot');
    if (ambience.trendy) vibeChips.push('Trendy');
    if (ambience.lively || ambience.intimate) vibeChips.push('Lively');
  }
  const displayChips = vibeChips.slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Hero Photo */}
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.placeholderImage]} />
      )}
      
      {/* Content Overlay */}
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Restaurant Name */}
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          
          {/* Meta Row */}
          <MetaRow 
            neighborhood={neighborhood}
            cuisine={cuisine}
            price={restaurant.price}
            variant="white"
          />
          
          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ {rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}> · {reviewCount.toLocaleString()} reviews</Text>
          </View>
          
          {/* Vibe Chips */}
          {displayChips.length > 0 && (
            <View style={styles.chipsContainer}>
              {displayChips.map((chip) => (
                <Chip key={chip} label={chip} />
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  placeholderImage: {
    backgroundColor: colors.gray200,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Subtle scrim for legibility
  },
  content: {
    padding: spacing.md,
  },
  name: {
    ...typography.title,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rating: {
    ...typography.small,
    color: colors.white,
  },
  reviewCount: {
    ...typography.small,
    color: colors.gray200,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
});

