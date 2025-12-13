/**
 * MetaRow Component
 * Displays: Neighborhood · Cuisine · Price
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../design/tokens';

interface MetaRowProps {
  neighborhood?: string;
  cuisine?: string;
  price?: string | null;
  variant?: 'default' | 'white';
}

export default function MetaRow({ neighborhood, cuisine, price, variant = 'default' }: MetaRowProps) {
  const parts: string[] = [];
  
  if (neighborhood) parts.push(neighborhood);
  if (cuisine) parts.push(cuisine);
  if (price) parts.push(price);
  
  if (parts.length === 0) return null;
  
  return (
    <View style={styles.container}>
      <Text style={[styles.text, variant === 'white' && styles.whiteText]}>
        {parts.join(' · ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xs,
  },
  text: {
    ...typography.meta,
    color: colors.gray600,
  },
  whiteText: {
    color: colors.white,
  },
});

