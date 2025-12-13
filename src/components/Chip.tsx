/**
 * Chip Component
 * Vibe tags, cuisine tags
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../design/tokens';

interface ChipProps {
  label: string;
  variant?: 'default' | 'accent';
}

export default function Chip({ label, variant = 'default' }: ChipProps) {
  return (
    <View style={[styles.container, variant === 'accent' && styles.accent]}>
      <Text style={[styles.text, variant === 'accent' && styles.accentText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  accent: {
    backgroundColor: colors.accent,
  },
  text: {
    ...typography.small,
    color: colors.gray700,
  },
  accentText: {
    color: colors.white,
  },
});

