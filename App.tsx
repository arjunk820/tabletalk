import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SwipeProvider } from './src/context/SwipeContext';
import SwipeScreen from './src/screens/SwipeScreen';
import SavedTablesScreen from './src/screens/SavedTablesScreen';
import TableChatScreen from './src/screens/TableChatScreen';
import RestaurantAssistantScreen from './src/screens/RestaurantAssistantScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NavBar from './src/components/NavBar';
import { colors, spacing, typography } from './src/design/tokens';
import { isOnboardingComplete, setOnboardingComplete, saveUserPreferences, UserPreferences, Table } from './src/utils/storage';
import { YelpBusiness } from './src/services/types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'swipe' | 'list'>('swipe');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<YelpBusiness | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await isOnboardingComplete();
      setShowOnboarding(!completed);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true); // Show onboarding on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async (preferences: UserPreferences) => {
    try {
      await saveUserPreferences(preferences);
      await setOnboardingComplete();
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  if (showSettings) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.container}>
            <View style={styles.settingsHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowSettings(false);
                  // Refresh SwipeScreen when returning from settings
                  setRefreshKey(prev => prev + 1);
                }}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>
            <SettingsScreen />
          </View>
        </SafeAreaView>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  if (selectedRestaurant) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <RestaurantAssistantScreen
            restaurant={selectedRestaurant}
            onBack={() => setSelectedRestaurant(null)}
          />
        </SafeAreaView>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  if (selectedTable) {
    return (
      <SafeAreaProvider>
        <SwipeProvider>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <TableChatScreen
              table={selectedTable}
              onBack={() => setSelectedTable(null)}
            />
          </SafeAreaView>
        </SwipeProvider>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SwipeProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.container}>
            <View style={styles.content}>
              {currentTab === 'swipe' ? (
                <SwipeScreen 
                  key={refreshKey}
                  onChatPress={(restaurant) => setSelectedRestaurant(restaurant)}
                />
              ) : (
                <SavedTablesScreen onTablePress={setSelectedTable} />
              )}
            </View>
            <NavBar 
              currentTab={currentTab} 
              onTabChange={setCurrentTab}
              onSettingsPress={() => setShowSettings(true)}
            />
          </View>
        </SafeAreaView>
        <StatusBar style="auto" />
      </SwipeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
  },
  backButton: {
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    ...typography.body,
    color: colors.accent,
  },
});
