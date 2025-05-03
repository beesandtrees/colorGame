import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';

const Block = (props) => {
  // The board is 90% of the screen width, we need to adjust the math
  const blockSize = 100 / props.cols;
  
  return (
    <TouchableOpacity
      style={[
        styles.blockContainer,
        {
          width: `${blockSize}%`,
          height: `${blockSize}%`,
        }
      ]}
      onPress={() => props.clickbox(props.xcoord, props.ycoord)}
    >
      <View 
        style={[
          styles.outerCircle,
          { backgroundColor: props.border }
        ]}
      >
        <View 
          style={[
            styles.innerCircle,
            { backgroundColor: props.bgcolor }
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  blockContainer: {
    aspectRatio: 1,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: '80%',
    height: '80%',
    borderRadius: 999,
  },
});

export default Block;