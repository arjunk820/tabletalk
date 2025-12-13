/**
 * API Test Screen
 * Temporary screen to test Yelp API connectivity
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { searchBusinesses, askBusinessQuestion } from '../services/yelpApi';

export default function ApiTestScreen() {
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [result, setResult] = useState<string>('');
  const [query, setQuery] = useState('Popular Mexican restaurants in Los Angeles');

  const testBusinessSearch = async () => {
    setLoadingSearch(true);
    setResult('');
    try {
      const response = await searchBusinesses(query, 34.0522, -118.2437);
      setResult(JSON.stringify(response, null, 2));
      console.log('API Response:', response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`Error: ${errorMessage}`);
      Alert.alert('API Error', errorMessage);
      console.error('API Error:', error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const testOneShotQuestion = async () => {
    setLoadingQuestion(true);
    setResult('');
    try {
      const response = await askBusinessQuestion(
        'Does Capital Grille in Costa Mesa, CA offer vegan options?'
      );
      setResult(JSON.stringify(response, null, 2));
      console.log('API Response:', response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`Error: ${errorMessage}`);
      Alert.alert('API Error', errorMessage);
      console.error('API Error:', error);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <Text style={styles.title}>Yelp API Test</Text>
          
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Enter search query"
            multiline
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={dismissKeyboard}
          />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={testBusinessSearch}
            disabled={loadingSearch || loadingQuestion}
          >
            {loadingSearch ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Test Business Search</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testOneShotQuestion}
            disabled={loadingSearch || loadingQuestion}
          >
            {loadingQuestion ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Test One-Shot Question</Text>
            )}
          </TouchableOpacity>
        </View>

        {result ? (
          <ScrollView 
            style={styles.resultContainer}
            contentContainerStyle={styles.resultContent}
            showsVerticalScrollIndicator={true}
            onScrollBeginDrag={dismissKeyboard}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.resultText}>{result}</Text>
          </ScrollView>
        ) : (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                Click a button above to test the API
              </Text>
            </View>
          </TouchableWithoutFeedback>
        )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 60,
    maxHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 16,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
  },
  secondaryButton: {
    backgroundColor: '#4ECDC4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  resultContent: {
    padding: 12,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

