import { StatusBar } from 'expo-status-bar';
import React from 'react';
import SwipeScreen from './src/screens/SwipeScreen';

export default function App() {
  return (
    <>
      <SwipeScreen />
      <StatusBar style="auto" />
    </>
  );
}
