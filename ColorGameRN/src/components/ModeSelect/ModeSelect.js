import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

const ModeSelect = ({ visible, onSelect, onClose }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => onClose()}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.title}>Select Game Mode</Text>
          
          <TouchableOpacity 
            style={styles.modeButton} 
            onPress={() => onSelect('classic')}
          >
            <Text style={styles.modeTitle}>Classic Mode</Text>
            <Text style={styles.modeDescription}>
              Change colors to flood the board with a single color
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modeButton} 
            onPress={() => onSelect('match3')}
          >
            <Text style={styles.modeTitle}>Match 3 Mode</Text>
            <Text style={styles.modeDescription}>
              Match 3 or more colors in a row to score points
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modeButton} 
            onPress={() => onSelect('huemove')}
          >
            <Text style={styles.modeTitle}>Hue Move Mode</Text>
            <Text style={styles.modeDescription}>
              Tap tiles to swap and arrange them in their original gradient pattern
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modeButton} 
            onPress={() => onSelect('huemovednd')}
          >
            <Text style={styles.modeTitle}>Hue Move DnD Mode</Text>
            <Text style={styles.modeDescription}>
              Drag and drop tiles to arrange them in their original gradient pattern
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modeButton: {
    backgroundColor: '#f0f0f0',
    width: '100%',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#0066cc',
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ModeSelect;