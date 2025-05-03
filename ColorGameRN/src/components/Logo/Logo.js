import React from 'react';
import { View, StyleSheet } from 'react-native';

const Logo = () => {
  return (
    <View style={styles.logo}>
      <View style={[styles.dot, { backgroundColor: '#FF5A5A' }]} />
      <View style={[styles.dot, { backgroundColor: '#FF9440' }]} />
      <View style={[styles.dot, { backgroundColor: '#93C039' }]} />
      <View style={[styles.dot, { backgroundColor: '#00A8E1' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    margin: 2,
  },
});

export default Logo;