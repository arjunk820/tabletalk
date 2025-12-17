import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../design/tokens';
import { YelpBusiness } from '../services/types';
import { chatWithRestaurant, getRestaurantFacts, GroqMessage } from '../services/groqApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RestaurantAssistantScreenProps {
  restaurant: YelpBusiness;
  onBack?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

const CHAT_STORAGE_KEY = '@tabletalk:restaurant_chat:';

export default function RestaurantAssistantScreen({ 
  restaurant, 
  onBack 
}: RestaurantAssistantScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<GroqMessage[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load conversation history on mount
  useEffect(() => {
    const initializeChat = async () => {
      const stored = await loadConversationHistory();
      
      // Only add welcome message if no stored messages exist
      if (!stored || stored.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          text: `Hi! I'm here to help you plan your visit to ${restaurant.name}. What would you like to know?`,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    };
    
    initializeChat();
  }, [restaurant.id]);

  const loadConversationHistory = async (): Promise<ChatMessage[] | null> => {
    try {
      const key = `${CHAT_STORAGE_KEY}${restaurant.id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConversationHistory(parsed.history || []);
        if (parsed.messages && parsed.messages.length > 0) {
          setMessages(parsed.messages);
          return parsed.messages;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading conversation history:', error);
      return null;
    }
  };

  const saveConversationHistory = async (newHistory: GroqMessage[], newMessages: ChatMessage[]) => {
    try {
      const key = `${CHAT_STORAGE_KEY}${restaurant.id}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        history: newHistory,
        messages: newMessages,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
    };

    const question = inputText.trim();
    setInputText('');
    setIsLoading(true);
    
    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Update conversation history
      const updatedHistory: GroqMessage[] = [
        ...conversationHistory,
        { role: 'user', content: question },
      ];

      // Get restaurant data
      const restaurantData = {
        cuisine: restaurant.categories[0]?.title,
        price: restaurant.price || undefined,
        rating: restaurant.rating,
        location: restaurant.location.formatted_address || restaurant.location.city,
      };

      // Chat with restaurant assistant
      const { response, shouldUseYelp } = await chatWithRestaurant(
        restaurant.name,
        restaurantData,
        question,
        conversationHistory
      );

      // If Yelp data is needed, use Yelp response as primary for factual queries
      let finalResponse = response;
      if (shouldUseYelp) {
        try {
          const yelpFacts = await getRestaurantFacts(
            restaurant.name, 
            question,
            restaurant.coordinates.latitude,
            restaurant.coordinates.longitude
          );
          // Use Yelp response as primary for factual queries
          finalResponse = yelpFacts;
        } catch (yelpError) {
          // Use Groq response if Yelp fails
          console.warn('Yelp API failed, using Groq response:', yelpError);
          finalResponse = response;
        }
      } else {
        // For conversational queries, use Groq response
        finalResponse = response;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: finalResponse,
        timestamp: new Date(),
      };

      // Update conversation history
      const newHistory: GroqMessage[] = [
        ...updatedHistory,
        { role: 'assistant', content: finalResponse },
      ];

      setConversationHistory(newHistory);
      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        // Save conversation with updated messages (async, don't await)
        saveConversationHistory(newHistory, updated).catch(err => 
          console.error('Error saving conversation:', err)
        );
        return updated;
      });

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const photoUrl = restaurant.contextual_info?.photos?.[0]?.original_url || '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerContent}>
            {photoUrl && (
              <Image 
                source={{ uri: photoUrl }} 
                style={styles.headerImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{restaurant.name}</Text>
              <Text style={styles.headerSubtitle}>AI Assistant</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.message,
                message.role === 'user' ? styles.messageUser : styles.messageAssistant,
              ]}
            >
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
          {isLoading && (
            <View style={[styles.message, styles.messageAssistant]}>
              <ActivityIndicator size="small" color={colors.gray600} />
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about hours, menu, reservations..."
            multiline
            maxLength={500}
            editable={!isLoading}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  backButtonText: {
    ...typography.body,
    color: colors.accent,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...typography.subtitle,
    color: colors.black,
    marginBottom: spacing.xs / 2,
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
  message: {
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  messageUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  messageAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  messageText: {
    ...typography.body,
    color: colors.black,
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
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  sendButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});

