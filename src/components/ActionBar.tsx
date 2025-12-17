import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, borderRadius } from '../design/tokens';

interface ActionBarProps {
  onPass: () => void;
  onLike: () => void;
  onInfo?: () => void;
}

interface IconProps {
  size?: number;
  color?: string;
}

// X Icon Component
const XIcon = ({ size = 24, color = colors.gray700 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Check Icon Component
const CheckIcon = ({ size = 24, color = colors.white }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Info Icon Component
const InfoIcon = ({ size = 24, color = colors.gray700 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function ActionBar({ onPass, onLike, onInfo }: ActionBarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, styles.passButton]} 
        onPress={onPass}
        activeOpacity={0.7}
      >
        <XIcon size={22} color={colors.gray600} />
      </TouchableOpacity>
      
      {onInfo && (
        <TouchableOpacity 
          style={[styles.button, styles.infoButton]} 
          onPress={onInfo}
          activeOpacity={0.7}
        >
          <InfoIcon size={20} color={colors.gray600} />
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        style={[styles.button, styles.likeButton]} 
        onPress={onLike}
        activeOpacity={0.7}
      >
        <CheckIcon size={22} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.sm,
  },
  passButton: {
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  infoButton: {
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  likeButton: {
    backgroundColor: colors.accent,
    borderWidth: 0,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

