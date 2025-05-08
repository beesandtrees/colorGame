import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import DragAndDropExample from './DND-example';

// Simple wrapper around the DND-example component to make it work with our game system
const DndExampleWrapper = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Drag and Drop Example</Text>
      <Text style={styles.subtitle}>Try dragging and dropping the colored circles</Text>
      
      <DragAndDropExample />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default DndExampleWrapper;