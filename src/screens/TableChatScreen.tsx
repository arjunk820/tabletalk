import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../design/tokens';
import { Table, Plan, getPlansForTable, getUserPreferences } from '../utils/storage';
import { generatePlanCopilot } from '../utils/aiTemplates';
import { generateMockMessages } from '../utils/mockData';

interface TableChatScreenProps {
  table: Table;
  onBack?: () => void;
}

export default function TableChatScreen({ table, onBack }: TableChatScreenProps) {
  const [messages, setMessages] = useState<Array<{ id: string; userId: string; name: string; text: string; timestamp: Date }>>([]);
  const [inputText, setInputText] = useState('');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('You');

  useEffect(() => {
    // Load user preferences to get name
    const loadUserName = async () => {
      const prefs = await getUserPreferences();
      if (prefs?.name) {
        setCurrentUserName(prefs.name);
      }
    };
    loadUserName();

    // Load plan for this table
    const loadPlan = async () => {
      const plans = await getPlansForTable(table.id);
      const activePlan = plans.find((p) => p.status === 'pending') || null;
      setPlan(activePlan);
    };
    loadPlan();

    // Generate mock messages for demo
    // Use memberCount - 1 to exclude current user, but ensure at least 1 mock member for messages
    const mockMemberCount = Math.max(1, table.memberCount - 1);
    const mockMessages = generateMockMessages(table, mockMemberCount);
    setMessages(mockMessages);
  }, [table.id, table.memberCount]);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          userId: 'current_user',
          name: currentUserName,
          text: inputText,
          timestamp: new Date(),
        },
      ]);
      setInputText('');
    }
  };

  const handlePlanCopilot = async (action: 'suggest-times' | 'draft-invite' | 'make-group-friendly') => {
    try {
      const plan = await getPlansForTable(table.id);
      const activePlan = plan.find((p) => p.status === 'pending') || null;
      const suggestion = await generatePlanCopilot(action, table.restaurant, activePlan || undefined);
      setInputText(suggestion);
    } catch (error) {
      console.error('Error generating plan copilot suggestion:', error);
      // Fallback handled by generatePlanCopilot
    }
  };

  const handlePlanAction = (action: 'accept' | 'propose' | 'decline') => {
    if (!plan) return;
    
    // Update plan status
    if (action === 'accept') {
      // Update plan to accepted
      setPlan({ ...plan, status: 'accepted' });
    } else if (action === 'decline') {
      setPlan({ ...plan, status: 'declined' });
    }
    // propose would open plan builder
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{table.restaurant.name}</Text>
        <Text style={styles.headerSubtitle}>{table.memberCount} members</Text>
      </View>

      <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
        {/* Plan Proposal Card */}
        {plan && plan.status === 'pending' && (
          <View style={styles.planCard}>
            <Text style={styles.planCardTitle}>Plan Proposal</Text>
            <Text style={styles.planCardRestaurant}>{plan.restaurant.name}</Text>
            <View style={styles.planCardDetails}>
              <Text style={styles.planCardDetail}>
                {plan.timeWindow === 'tonight' ? 'Tonight' : plan.timeWindow === 'thisWeek' ? 'This week' : 'Weekend'}
              </Text>
              <Text style={styles.planCardDetail}>
                {plan.vibe === 'quickBite' ? 'Quick bite' : plan.vibe === 'drinks' ? 'Drinks' : 'Dinner'}
              </Text>
            </View>
            {plan.inviteCopy && (
              <Text style={styles.planCardInvite}>{plan.inviteCopy}</Text>
            )}
            <View style={styles.planCardActions}>
              <TouchableOpacity
                style={[styles.planActionButton, styles.acceptButton]}
                onPress={() => handlePlanAction('accept')}
              >
                <Text style={styles.planActionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.planActionButton, styles.proposeButton]}
                onPress={() => handlePlanAction('propose')}
              >
                <Text style={styles.planActionButtonText}>Propose new time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.planActionButton, styles.declineButton]}
                onPress={() => handlePlanAction('decline')}
              >
                <Text style={styles.planActionButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.message,
              message.userId === 'current_user' ? styles.messageRight : styles.messageLeft,
            ]}
          >
            <Text style={styles.messageName}>{message.name}</Text>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Plan Copilot Chips */}
      <View style={styles.copilotContainer}>
        <TouchableOpacity
          style={styles.copilotChip}
          onPress={() => handlePlanCopilot('suggest-times')}
        >
          <Text style={styles.copilotChipText}>Suggest times</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.copilotChip}
          onPress={() => handlePlanCopilot('draft-invite')}
        >
          <Text style={styles.copilotChipText}>Draft invite</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.copilotChip}
          onPress={() => handlePlanCopilot('make-group-friendly')}
        >
          <Text style={styles.copilotChipText}>Make it group-friendly</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
  },
  backButton: {
    marginBottom: spacing.xs,
  },
  backButtonText: {
    ...typography.body,
    color: colors.accent,
  },
  headerTitle: {
    ...typography.title,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.meta,
    color: colors.gray600,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.md,
  },
  planCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  planCardTitle: {
    ...typography.subtitle,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  planCardRestaurant: {
    ...typography.body,
    color: colors.black,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  planCardDetails: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  planCardDetail: {
    ...typography.meta,
    color: colors.gray600,
    marginRight: spacing.md,
  },
  planCardInvite: {
    ...typography.body,
    color: colors.gray700,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  planCardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  planActionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  acceptButton: {
    backgroundColor: colors.accent,
  },
  proposeButton: {
    backgroundColor: colors.gray200,
  },
  declineButton: {
    backgroundColor: colors.gray200,
  },
  planActionButtonText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '600',
  },
  message: {
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  messageLeft: {
    alignSelf: 'flex-start',
  },
  messageRight: {
    alignSelf: 'flex-end',
  },
  messageName: {
    ...typography.small,
    color: colors.gray600,
    marginBottom: spacing.xs / 2,
  },
  messageText: {
    ...typography.body,
    color: colors.black,
    backgroundColor: colors.gray100,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  copilotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.gray50,
  },
  copilotChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  copilotChipText: {
    ...typography.small,
    color: colors.gray700,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
  },
  sendButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});


