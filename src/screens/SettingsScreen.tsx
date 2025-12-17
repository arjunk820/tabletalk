import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../design/tokens';
import Chip from '../components/Chip';
import { getUserPreferences, saveUserPreferences, UserPreferences } from '../utils/storage';

const CUISINES = [
  'Italian', 'Mexican', 'Japanese', 'Chinese', 'Thai', 'Indian',
  'French', 'Mediterranean', 'American', 'Korean', 'Vietnamese',
  'Greek', 'Spanish', 'Middle Eastern', 'BBQ', 'Seafood',
];

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo',
];

const BUDGET_OPTIONS = ['$', '$$', '$$$', '$$$$'];

const DISTANCE_OPTIONS = [1, 3, 5, 10, 15, 20]; // miles

const INTENT_OPTIONS: Array<{ value: 'solo' | 'date' | 'friends' | 'family'; label: string }> = [
  { value: 'solo', label: 'Solo' },
  { value: 'date', label: 'Date' },
  { value: 'friends', label: 'Friends' },
  { value: 'family', label: 'Family' },
];

export default function SettingsScreen() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [name, setName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getUserPreferences();
      if (prefs) {
        setPreferences(prefs);
        setName(prefs.name || '');
        setProfilePhoto(prefs.profilePhoto || null);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const requestLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'TableTalk needs your location to find nearby restaurants.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setPreferences(prev => prev ? {
        ...prev,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      } : null);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const toggleCuisine = (cuisine: string) => {
    if (!preferences) return;
    
    setPreferences(prev => {
      if (!prev) return prev;
      const isSelected = prev.cuisines.includes(cuisine);
      
      if (isSelected) {
        return {
          ...prev,
          cuisines: prev.cuisines.filter(c => c !== cuisine),
        };
      } else {
        if (prev.cuisines.length >= 3) {
          Alert.alert('Maximum Reached', 'Please select your top 3 cuisines only.');
          return prev;
        }
        return {
          ...prev,
          cuisines: [...prev.cuisines, cuisine],
        };
      }
    });
  };

  const toggleBudget = (price: string) => {
    if (!preferences) return;
    setPreferences(prev => prev ? {
      ...prev,
      budget: prev.budget.includes(price)
        ? prev.budget.filter(b => b !== price)
        : [...prev.budget, price],
    } : null);
  };

  const toggleDietary = (option: string) => {
    if (!preferences) return;
    setPreferences(prev => prev ? {
      ...prev,
      dietary: prev.dietary.includes(option)
        ? prev.dietary.filter(d => d !== option)
        : [...prev.dietary, option],
    } : null);
  };

  const handleSave = async () => {
    if (!preferences) return;
    
    if (preferences.cuisines.length !== 3) {
      Alert.alert('Invalid Selection', 'Please select exactly 3 cuisines.');
      return;
    }

    if (!preferences.budget.length) {
      Alert.alert('Invalid Selection', 'Please select at least one budget range.');
      return;
    }

    try {
      setSaving(true);
      const updatedPrefs: UserPreferences = {
        ...preferences,
        name: name.trim() || undefined,
        profilePhoto: profilePhoto || undefined,
      };
      await saveUserPreferences(updatedPrefs);
      Alert.alert('Success', 'Preferences saved!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (!preferences) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        {/* Profile Photo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <TouchableOpacity
            onPress={showImagePickerOptions}
            style={styles.profilePhotoContainer}
            activeOpacity={0.7}
          >
            {profilePhoto ? (
              <Image 
                source={{ uri: profilePhoto }} 
                style={styles.profilePhoto}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Text style={styles.profilePhotoPlaceholderText}>+</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Enter your name"
            placeholderTextColor={colors.gray400}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            maxLength={50}
          />
        </View>

        {/* Cuisines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuisines</Text>
          <Text style={styles.sectionHint}>
            Select your top 3 ({preferences.cuisines.length}/3)
          </Text>
          <View style={styles.chipContainer}>
            {CUISINES.map(cuisine => (
              <TouchableOpacity
                key={cuisine}
                onPress={() => toggleCuisine(cuisine)}
                activeOpacity={0.7}
                disabled={!preferences.cuisines.includes(cuisine) && preferences.cuisines.length >= 3}
              >
                <Chip
                  label={cuisine}
                  selected={preferences.cuisines.includes(cuisine)}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget</Text>
          <Text style={styles.sectionHint}>Select price ranges</Text>
          <View style={styles.chipContainer}>
            {BUDGET_OPTIONS.map(price => (
              <TouchableOpacity
                key={price}
                onPress={() => toggleBudget(price)}
                activeOpacity={0.7}
              >
                <Chip
                  label={price}
                  selected={preferences.budget.includes(price)}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Distance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distance</Text>
          <Text style={styles.sectionHint}>Maximum distance in miles</Text>
          <View style={styles.chipContainer}>
            {DISTANCE_OPTIONS.map(distance => (
              <TouchableOpacity
                key={distance}
                onPress={() => setPreferences(prev => prev ? { ...prev, distance } : null)}
                activeOpacity={0.7}
              >
                <Chip
                  label={`${distance} mi`}
                  selected={preferences.distance === distance}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          {locationLoading ? (
            <View style={styles.locationStatus}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.locationText}>Getting location...</Text>
            </View>
          ) : preferences.location ? (
            <View style={styles.locationStatus}>
              <Text style={styles.locationText}>✓ Location saved</Text>
              <TouchableOpacity
                onPress={requestLocation}
                style={styles.updateLocationButton}
              >
                <Text style={styles.updateLocationText}>Update Location</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={requestLocation}
              style={styles.updateLocationButton}
            >
              <Text style={styles.updateLocationText}>Set Location</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dietary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <Text style={styles.sectionHint}>Optional</Text>
          <View style={styles.chipContainer}>
            {DIETARY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                onPress={() => toggleDietary(option)}
                activeOpacity={0.7}
              >
                <Chip
                  label={option}
                  selected={preferences.dietary.includes(option)}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Intent */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intent</Text>
          <Text style={styles.sectionHint}>Optional</Text>
          <View style={styles.chipContainer}>
            {INTENT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setPreferences(prev => prev ? { ...prev, intent: option.value } : null)}
                activeOpacity={0.7}
              >
                <Chip
                  label={option.label}
                  selected={preferences.intent === option.value}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.gray600,
    marginTop: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.black,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    ...typography.meta,
    color: colors.gray500,
    marginBottom: spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  profilePhotoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  profilePhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhotoPlaceholderText: {
    fontSize: 36,
    color: colors.gray400,
  },
  nameInput: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    color: colors.black,
    marginTop: spacing.xs,
  },
  locationStatus: {
    marginTop: spacing.xs,
  },
  locationText: {
    ...typography.body,
    color: colors.gray700,
    marginBottom: spacing.sm,
  },
  updateLocationButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
    alignSelf: 'flex-start',
  },
  updateLocationText: {
    ...typography.meta,
    color: colors.accent,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...typography.subtitle,
    color: colors.white,
  },
});

