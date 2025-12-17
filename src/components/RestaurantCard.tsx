import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../design/tokens';
import MetaRow from './MetaRow';
import Chip from './Chip';
import SparklesIcon from './SparklesIcon';
import { YelpBusiness } from '../services/types';
import { generateWhyThisTable } from '../utils/aiTemplates';
import { getUserPreferences } from '../utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const CARD_HEIGHT = CARD_WIDTH * 1.2; // 5:6 aspect ratio

interface RestaurantCardProps {
  restaurant: YelpBusiness;
  onPress?: () => void;
  onChatPress?: () => void;
  userPreferences?: import('../utils/storage').UserPreferences | null;
}

export default function RestaurantCard({ restaurant, userPreferences, onChatPress }: RestaurantCardProps) {
  const [whyTableText, setWhyTableText] = useState<string>('Based on your preferences');
  const [isLoadingWhyTable, setIsLoadingWhyTable] = useState(true);
  
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

  // Load "Why this table" text asynchronously
  useEffect(() => {
    let cancelled = false;
    
    const loadWhyTable = async () => {
      setIsLoadingWhyTable(true);
      try {
        const text = await generateWhyThisTable(restaurant, userPreferences || null);
        if (!cancelled) {
          setWhyTableText(text);
        }
      } catch (error) {
        console.error('Error generating why this table:', error);
        if (!cancelled) {
          setWhyTableText('Based on your preferences');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingWhyTable(false);
        }
      }
    };

    loadWhyTable();

    return () => {
      cancelled = true;
    };
  }, [restaurant.id, userPreferences?.cuisines?.join(','), userPreferences?.budget?.join(',')]);

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
        {/* Chat Button */}
        {onChatPress && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={onChatPress}
            activeOpacity={0.7}
          >
            <SparklesIcon size={20} color={colors.accent} />
          </TouchableOpacity>
        )}
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
          
          {/* Why this table */}
          {isLoadingWhyTable ? (
            <View style={styles.whyTableLoading}>
              <ActivityIndicator size="small" color={colors.gray200} />
            </View>
          ) : (
            <Text style={styles.whyTable}>
              {whyTableText}
            </Text>
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
  whyTable: {
    ...typography.small,
    color: colors.gray200,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  whyTableLoading: {
    marginTop: spacing.xs,
    alignItems: 'flex-start',
  },
  chatButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});

