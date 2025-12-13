import { StatusBar } from 'expo-status-bar';
import React from 'react';
import ApiTestScreen from './src/screens/ApiTestScreen';

export default function App() {
  return (
    <>
      <ApiTestScreen />
      <StatusBar style="auto" />
    </>
  );
}
