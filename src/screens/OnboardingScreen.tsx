import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../design/tokens';
import Chip from '../components/Chip';
import { UserPreferences as UserPreferencesType } from '../utils/storage';
import { geocodeCity } from '../utils/geocoding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: (preferences: UserPreferencesType) => void;
}

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

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<'welcome' | 'profile' | 'taste'>('welcome');
  const [preferences, setPreferences] = useState<UserPreferencesType>({
    cuisines: [],
    budget: ['$', '$$', '$$$'],
    distance: 5,
    dietary: [],
  });
  const [name, setName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState('');
  const [cityLoading, setCityLoading] = useState(false);

  useEffect(() => {
    if (step === 'taste') {
      requestLocation();
    }
  }, [step]);

  const requestLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        Alert.alert(
          'Location Permission',
          'TableTalk needs your location to find nearby restaurants. You can enable it in settings later.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      setPreferences(prev => ({
        ...prev,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        // Clear city if GPS is used
        city: undefined,
      }));
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCityInput = async () => {
    if (!cityInput.trim()) return;

    try {
      setCityLoading(true);
      setLocationError(null);
      
      // Geocode city name
      const coords = await geocodeCity(cityInput.trim());
      
      if (coords) {
        setPreferences(prev => ({
          ...prev,
          city: cityInput.trim(),
          location: coords,
        }));
        setCityInput('');
      } else {
        setLocationError('Could not find that city. Please try again.');
      }
    } catch (error) {
      console.error('Error geocoding city:', error);
      setLocationError('Failed to geocode city');
    } finally {
      setCityLoading(false);
    }
  };

  const clearCity = () => {
    setCityInput('');
    setPreferences(prev => ({
      ...prev,
      city: undefined,
    }));
  };

  const handleWelcomeContinue = () => {
    setStep('profile');
  };

  const handleProfileContinue = () => {
    setPreferences(prev => ({
      ...prev,
      name: name.trim(),
      profilePhoto: profilePhoto || undefined,
    }));
    setStep('taste');
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photos to set a profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log('Photo selected, URI:', uri);
        setProfilePhoto(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your camera to take a photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log('Photo selected, URI:', uri);
        setProfilePhoto(uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
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
    setPreferences(prev => {
      const isSelected = prev.cuisines.includes(cuisine);
      
      if (isSelected) {
        // Remove if already selected
        return {
          ...prev,
          cuisines: prev.cuisines.filter(c => c !== cuisine),
        };
      } else {
        // Add if not at max (3)
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
    setPreferences(prev => ({
      ...prev,
      budget: prev.budget.includes(price)
        ? prev.budget.filter(b => b !== price)
        : [...prev.budget, price],
    }));
  };

  const toggleDietary = (option: string) => {
    setPreferences(prev => ({
      ...prev,
      dietary: prev.dietary.includes(option)
        ? prev.dietary.filter(d => d !== option)
        : [...prev.dietary, option],
    }));
  };

  const handleComplete = () => {
    onComplete({
      ...preferences,
      name: name.trim() || preferences.name,
      profilePhoto: profilePhoto || preferences.profilePhoto,
    });
  };

  if (step === 'welcome') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.welcomeContainer}>
          <Image
            source={require('../../assets/tabletalk.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeSubtitle}>
            Discover restaurants you'll love and connect with people who want to try them too.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleWelcomeContinue}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'profile') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.profileContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.tasteTitle}>Create your profile</Text>
          <Text style={styles.tasteSubtitle}>Let others know who you are</Text>

          {/* Profile Photo */}
          <View style={styles.profilePhotoSection}>
            <TouchableOpacity
              onPress={showImagePickerOptions}
              style={styles.profilePhotoContainer}
              activeOpacity={0.7}
            >
              {profilePhoto ? (
                <Image 
                  key={profilePhoto}
                  source={{ uri: profilePhoto }} 
                  style={styles.profilePhoto}
                  resizeMode="cover"
                  onError={(error) => {
                    console.error('Image load error:', error);
                    Alert.alert('Error', 'Failed to load image. Please try again.');
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully');
                  }}
                />
              ) : (
                <View style={styles.profilePhotoPlaceholder}>
                  <Text style={styles.profilePhotoPlaceholderText}>+</Text>
                  <Text style={styles.profilePhotoPlaceholderLabel}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {profilePhoto && (
              <TouchableOpacity
                onPress={() => setProfilePhoto(null)}
                style={styles.removePhotoButton}
              >
                <Text style={styles.removePhotoText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Name Input */}
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

          <TouchableOpacity
            style={[
              styles.primaryButton,
              styles.completeButton,
              !name.trim() && styles.buttonDisabled,
            ]}
            onPress={handleProfileContinue}
            activeOpacity={0.7}
            disabled={!name.trim()}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
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
        <Text style={styles.tasteTitle}>Tell us your taste</Text>
        <Text style={styles.tasteSubtitle}>Help us find restaurants you'll love</Text>

        {/* Cuisines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuisines</Text>
          <Text style={styles.sectionHint}>
            Select your top 3 {preferences.cuisines.length > 0 && `(${preferences.cuisines.length}/3)`}
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

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.sectionHint}>Choose how to find restaurants</Text>
          
          {/* Use Current Location Button */}
          <TouchableOpacity
            onPress={requestLocation}
            style={[styles.locationButton, locationLoading && styles.locationButtonDisabled]}
            disabled={locationLoading || cityLoading}
            activeOpacity={0.7}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.locationButtonText}>Use Current Location</Text>
            )}
          </TouchableOpacity>

          {/* OR Separator */}
          <View style={styles.orSeparator}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          {/* City Input */}
          <View style={styles.cityInputContainer}>
            <TextInput
              style={styles.cityInput}
              placeholder="Enter city name (e.g., Los Angeles, CA)"
              placeholderTextColor={colors.gray400}
              value={cityInput}
              onChangeText={setCityInput}
              editable={!cityLoading && !locationLoading}
              onSubmitEditing={handleCityInput}
            />
            {cityInput.trim() && (
              <TouchableOpacity
                onPress={handleCityInput}
                style={[styles.cityButton, cityLoading && styles.cityButtonDisabled]}
                disabled={cityLoading}
                activeOpacity={0.7}
              >
                {cityLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.cityButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Current Location Status */}
          {preferences.location && (
            <View style={styles.locationStatus}>
              <Text style={styles.locationText}>
                ✓ Using: {preferences.city || 'Current Location'}
              </Text>
              {preferences.city && (
                <TouchableOpacity
                  onPress={clearCity}
                  style={styles.clearCityButton}
                >
                  <Text style={styles.clearCityText}>Clear City</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Error Message */}
          {locationError && (
            <View style={styles.locationStatus}>
              <Text style={styles.locationErrorText}>{locationError}</Text>
            </View>
          )}
        </View>

        {/* Distance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distance</Text>
          <Text style={styles.sectionHint}>Maximum distance in miles</Text>
          <View style={styles.chipContainer}>
            {DISTANCE_OPTIONS.map(distance => (
              <TouchableOpacity
                key={distance}
                onPress={() => setPreferences(prev => ({ ...prev, distance }))}
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

        {/* Intent (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intent</Text>
          <Text style={styles.sectionHint}>Optional - helps us personalize</Text>
          <View style={styles.chipContainer}>
            {INTENT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setPreferences(prev => ({ ...prev, intent: option.value }))}
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
            styles.primaryButton,
            styles.completeButton,
            (preferences.cuisines.length !== 3 || !preferences.budget.length) && styles.buttonDisabled,
          ]}
          onPress={handleComplete}
          activeOpacity={0.7}
          disabled={preferences.cuisines.length !== 3 || !preferences.budget.length}
        >
          <Text style={styles.primaryButtonText}>Complete</Text>
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
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  logo: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    maxWidth: 200,
    maxHeight: 200,
    marginBottom: spacing.xl,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  profileContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  profilePhotoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  profilePhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
    fontSize: 48,
    color: colors.gray400,
    marginBottom: spacing.xs,
  },
  profilePhotoPlaceholderLabel: {
    ...typography.meta,
    color: colors.gray500,
  },
  removePhotoButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  removePhotoText: {
    ...typography.meta,
    color: colors.error,
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
  tasteTitle: {
    ...typography.title,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  tasteSubtitle: {
    ...typography.body,
    color: colors.gray600,
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
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minWidth: 200,
  },
  completeButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...typography.subtitle,
    color: colors.white,
  },
  locationStatus: {
    marginTop: spacing.xs,
  },
  locationText: {
    ...typography.body,
    color: colors.gray700,
    marginBottom: spacing.xs,
  },
  locationSubtext: {
    ...typography.meta,
    color: colors.gray500,
  },
  locationErrorText: {
    ...typography.meta,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    ...typography.meta,
    color: colors.accent,
    fontWeight: '600',
  },
  locationButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  orSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray300,
  },
  orText: {
    ...typography.meta,
    color: colors.gray500,
    marginHorizontal: spacing.md,
  },
  cityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cityInput: {
    flex: 1,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    color: colors.black,
    marginRight: spacing.sm,
  },
  cityButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityButtonDisabled: {
    opacity: 0.6,
  },
  cityButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  clearCityButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  clearCityText: {
    ...typography.meta,
    color: colors.error,
  },
});

