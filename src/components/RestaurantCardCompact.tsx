import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../design/tokens';
import MetaRow from './MetaRow';
import { YelpBusiness } from '../services/types';

const CARD_HEIGHT = 120; // Compact height

interface RestaurantCardCompactProps {
  restaurant: YelpBusiness;
  onPress?: () => void;
}

export default function RestaurantCardCompact({ restaurant, onPress }: RestaurantCardCompactProps) {
  const photoUrl = restaurant.contextual_info?.photos?.[0]?.original_url || '';
  const cuisine = restaurant.categories[0]?.title || '';
  const neighborhood = restaurant.location.city || '';
  const rating = restaurant.rating;
  const reviewCount = restaurant.review_count;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Photo thumbnail */}
      <View style={styles.imageContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholderImage]} />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <MetaRow neighborhood={neighborhood} cuisine={cuisine} price={restaurant.price} />
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>⭐ {rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}> · {reviewCount.toLocaleString()} reviews</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: CARD_HEIGHT,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.sm,
  },
  imageContainer: {
    width: CARD_HEIGHT,
    height: CARD_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: colors.gray200,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  name: {
    ...typography.subtitle,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    ...typography.small,
    color: colors.gray700,
  },
  reviewCount: {
    ...typography.small,
    color: colors.gray500,
  },
});



