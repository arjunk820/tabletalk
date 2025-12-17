import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../design/tokens';

interface ChipProps {
  label: string;
  variant?: 'default' | 'accent';
  selected?: boolean;
}

export default function Chip({ label, variant = 'default', selected }: ChipProps) {
  const isSelected = selected || variant === 'accent';
  
  return (
    <View style={[styles.container, isSelected && styles.selected]}>
      <Text style={[styles.text, isSelected && styles.selectedText]}>
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
  selected: {
    backgroundColor: colors.accent,
  },
  text: {
    ...typography.small,
    color: colors.gray700,
  },
  accentText: {
    color: colors.white,
  },
  selectedText: {
    color: colors.white,
  },
});

