import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Match3Prototype from './src/prototype/Match3Prototype';

export default function PrototypeApp() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Match3Prototype />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});