import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../design/tokens';
import { Table, Plan, savePlan } from '../utils/storage';
import { generateTableStarter } from '../utils/aiTemplates';

interface PlanBuilderScreenProps {
  table: Table;
  onPlanCreated: (plan: Plan) => void;
  onBack?: () => void;
}

export default function PlanBuilderScreen({ table, onPlanCreated, onBack }: PlanBuilderScreenProps) {
  const [timeWindow, setTimeWindow] = useState<'tonight' | 'thisWeek' | 'weekend' | null>(null);
  const [vibe, setVibe] = useState<'quickBite' | 'drinks' | 'dinner' | null>(null);
  const [starter, setStarter] = useState<{
    timeWindow: string[];
    vibe: string[];
    inviteCopy: string;
  }>({
    timeWindow: ['Tonight', 'This week', 'Weekend'],
    vibe: ['Quick bite', 'Drinks', 'Dinner'],
    inviteCopy: `Want to try ${table.restaurant.name}? Let's make it happen!`,
  });
  const [inviteCopy, setInviteCopy] = useState<string>('');
  const [isLoadingStarter, setIsLoadingStarter] = useState(true);

  // Load table starter suggestions
  useEffect(() => {
    let cancelled = false;

    const loadStarter = async () => {
      setIsLoadingStarter(true);
      try {
        const result = await generateTableStarter(table.restaurant);
        if (!cancelled) {
          setStarter(result);
          setInviteCopy(result.inviteCopy);
        }
      } catch (error) {
        console.error('Error generating table starter:', error);
        // Fallback already set in initial state
      } finally {
        if (!cancelled) {
          setIsLoadingStarter(false);
        }
      }
    };

    loadStarter();

    return () => {
      cancelled = true;
    };
  }, [table.restaurant.id]);

  const handleCreatePlan = async () => {
    if (!timeWindow || !vibe) return;

    const plan: Plan = {
      id: `plan_${Date.now()}`,
      tableId: table.id,
      restaurant: table.restaurant,
      proposedBy: 'current_user', // TODO: Get from user context
      timeWindow,
      vibe,
      status: 'pending',
      inviteCopy,
      createdAt: new Date(),
    };

    await savePlan(plan);
    onPlanCreated(plan);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.title}>Create Plan</Text>
      <Text style={styles.subtitle}>{table.restaurant.name}</Text>

      {/* Time Window */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>When?</Text>
        <View style={styles.optionsContainer}>
          {starter.timeWindow.map((option) => {
            const value = option.toLowerCase().replace(' ', '') as 'tonight' | 'thisweek' | 'weekend';
            const normalizedValue = value === 'thisweek' ? 'thisWeek' : value;
            const isSelected = timeWindow === normalizedValue;
            
            return (
              <TouchableOpacity
                key={option}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setTimeWindow(normalizedValue)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Vibe */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vibe</Text>
        <View style={styles.optionsContainer}>
          {starter.vibe.map((option) => {
            const value = option.toLowerCase().replace(' ', '') as 'quickbite' | 'drinks' | 'dinner';
            const normalizedValue = value === 'quickbite' ? 'quickBite' : value;
            const isSelected = vibe === normalizedValue;
            
            return (
              <TouchableOpacity
                key={option}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setVibe(normalizedValue)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Table Starter AI Suggestion */}
      <View style={styles.aiSuggestion}>
        <Text style={styles.aiSuggestionLabel}>Table Starter suggests:</Text>
        {isLoadingStarter ? (
          <View style={styles.aiSuggestionLoading}>
            <ActivityIndicator size="small" color={colors.gray600} />
          </View>
        ) : (
          <Text style={styles.aiSuggestionText}>{inviteCopy}</Text>
        )}
      </View>

      {/* Create Plan Button */}
      <TouchableOpacity
        style={[styles.createButton, (!timeWindow || !vibe) && styles.createButtonDisabled]}
        onPress={handleCreatePlan}
        disabled={!timeWindow || !vibe}
        activeOpacity={0.7}
      >
        <Text style={styles.createButtonText}>Create Plan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backButtonText: {
    ...typography.body,
    color: colors.accent,
  },
  title: {
    ...typography.title,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.gray600,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.black,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  optionText: {
    ...typography.body,
    color: colors.gray700,
  },
  optionTextSelected: {
    color: colors.white,
  },
  aiSuggestion: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  aiSuggestionLabel: {
    ...typography.small,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  aiSuggestionText: {
    ...typography.body,
    color: colors.black,
  },
  aiSuggestionLoading: {
    paddingVertical: spacing.xs,
  },
  createButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  createButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});


