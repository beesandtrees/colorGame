// Test file for HueMove color gradient variations
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import * as hueMoveHelpers from './hueMoveMode.js';
import { 
  rgbGenerators,
  generateRGBClassic,
  generateRGBSmooth,
  generateRGBHighContrast,
  generateRGBSubtle,
  generateRGBRadial,
  generateRGBSpiral,
  generateRGBWave,
  generateRGBDiagonal
} from './hueMoveColorGeneration.js';

// A component to view all gradient variants
export default function HueMoveGradientDemo() {
  // Generate a sample of each gradient type
  const generateAllSamples = () => {
    const samples = {};
    const generatorTypes = Object.keys(rgbGenerators);
    
    // Generate for different modifiers (1-6)
    for (let i = 1; i <= 6; i++) {
      samples[`modifier_${i}`] = {};
      
      // Generate for each type
      for (const type of generatorTypes) {
        // Generate a sample with this generator and modifier
        samples[`modifier_${i}`][type] = hueMoveHelpers.generateColorSample(5, type, i, 128);
      }
    }
    
    return samples;
  };
  
  // Function to render a gradient sample
  const renderSample = (sample, title) => {
    const size = sample.length;
    const cellSize = 30; // Size of each color cell
    
    return (
      <View style={styles.sampleContainer}>
        <Text style={styles.sampleTitle}>{title}</Text>
        <View style={styles.grid}>
          {sample.map((row, i) => (
            <View key={`row-${i}`} style={styles.row}>
              {row.map((color, j) => (
                <View 
                  key={`cell-${i}-${j}`} 
                  style={[
                    styles.cell, 
                    { 
                      backgroundColor: color,
                      width: cellSize,
                      height: cellSize
                    }
                  ]} 
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Generate all samples
  const allSamples = generateAllSamples();
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>HueMove Gradient Variations</Text>
      
      {Object.keys(allSamples).map(modifierKey => {
        const modifierSamples = allSamples[modifierKey];
        const modifierNumber = modifierKey.split('_')[1];
        
        return (
          <View key={modifierKey} style={styles.modifierSection}>
            <Text style={styles.modifierTitle}>Color Modifier {modifierNumber}</Text>
            
            {Object.keys(modifierSamples).map(type => (
              renderSample(modifierSamples[type], `${type}`)
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modifierSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modifierTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sampleContainer: {
    marginBottom: 16,
  },
  sampleTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  grid: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});

// Helper function to generate and view test samples
export function createGradientSamples() {
  const samples = {
    classic: hueMoveHelpers.generateColorSample(5, 'classic', 1, 128),
    smooth: hueMoveHelpers.generateColorSample(5, 'smooth', 1, 128),
    highContrast: hueMoveHelpers.generateColorSample(5, 'highContrast', 1, 128),
    subtle: hueMoveHelpers.generateColorSample(5, 'subtle', 1, 128),
    radial: hueMoveHelpers.generateColorSample(5, 'radial', 1, 128),
    spiral: hueMoveHelpers.generateColorSample(5, 'spiral', 1, 128),
    wave: hueMoveHelpers.generateColorSample(5, 'wave', 1, 128),
    diagonal: hueMoveHelpers.generateColorSample(5, 'diagonal', 1, 128),
  };
  
  return samples;
}