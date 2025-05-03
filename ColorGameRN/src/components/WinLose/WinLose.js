import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { winText } from '../../helpers/constants.js';
import { rand } from '../../helpers/helpers.js';

const WinLose = props => {
  let winner = props.won;
  let winLen = winText.length;
  let resultsText;

  if (winner === true) {
    resultsText = (
      <View>
        <Text style={styles.text}>{winText[rand(winLen)]}</Text>
        <TouchableOpacity onPress={props.restart} style={styles.btn}>
          <Text style={styles.btnText}>Next Level</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (winner === false) {
    resultsText = (
      <View>
        <Text style={styles.text}>Maybe Next Time!</Text>
        <TouchableOpacity onPress={props.restart} style={styles.btn}>
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (winner === 'almost') {
    resultsText = (
      <View>
        <Text style={styles.text}>Mismatch!</Text>
        <Text style={styles.text}>Make sure the last color you click matches the background.</Text>
        <TouchableOpacity onPress={props.restart} style={styles.btn}>
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (winner === null) {
    return null;
  }

  return (
    <View style={styles.winlose}>
      {resultsText}
    </View>
  );
};

const styles = StyleSheet.create({
  winlose: {
    position: 'absolute',
    width: '80%',
    alignSelf: 'center',
    top: '40%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
  },
  btn: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default WinLose;