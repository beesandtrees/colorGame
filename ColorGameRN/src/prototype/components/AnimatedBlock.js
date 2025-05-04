import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet, View } from 'react-native';

const AnimatedBlock = ({ 
  id,
  row,
  col,
  color,
  size,
  selected = false,
  matched = false,
  isNew = false,
  isAnimating = false,
  swapDirection = null,
  onPress,
  style = {},
}) => {
  // Create animated values for position and scale
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const opacity = useRef(new Animated.Value(isNew ? 0 : 1)).current;

  // Handle new blocks appearing
  useEffect(() => {
    if (isNew) {
      // Animate new blocks appearing
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isNew]);

  // Handle selection animation
  useEffect(() => {
    if (selected) {
      // Create a pulsing effect when selected
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selected]);

  // Handle match animation
  useEffect(() => {
    if (matched) {
      // Animate matched blocks
      Animated.sequence([
        // First scale up
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        // Then fade out while shrinking
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [matched]);
  
  // Handle swap animation with a comprehensive approach
  useEffect(() => {
    // Reset animation values when a new component is rendered
    const resetAnimations = () => {
      translateX.setValue(0);
      translateY.setValue(0);
    };
    
    // When component mounts, reset animations
    resetAnimations();
    
    // Special case: if this is a matched block, don't animate it back
    if (matched) {
      return;
    }
    
    // For swapping animation
    if (swapDirection) {
      const distance = size; // Move the full size of a block
      
      // Set target based on direction
      let xTarget = 0;
      let yTarget = 0;
      
      // Determine the direction
      const isForwardSwap = ['right', 'down'].includes(swapDirection);
      const isHorizontal = ['right', 'left'].includes(swapDirection);
      
      // Set the correct distance based on direction
      if (isHorizontal) {
        xTarget = isForwardSwap ? distance : -distance;
      } else {
        yTarget = isForwardSwap ? distance : -distance;
      }
      
      // Immediately set the animation values to their starting positions
      translateX.setValue(0);
      translateY.setValue(0);
      
      // Then animate to the target
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: xTarget,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: yTarget,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // When swapDirection is cleared and block is not matched, 
      // reset animations to initial state
      translateX.setValue(0);
      translateY.setValue(0);
    }
    
    // Cleanup function
    return () => {
      // Reset animation values when component unmounts or swapDirection changes
      translateX.setValue(0);
      translateY.setValue(0);
    };
  }, [swapDirection, size, matched, translateX, translateY]);

  // Determine background and border colors based on the provided color
  const backgroundColor = color.backgroundColor || color;
  const borderColor = color.borderColor || color;

  // When the block is matched, use the same color for both inner and outer
  const innerBackgroundColor = matched ? borderColor : backgroundColor;

  // Transform for animations
  const animatedStyle = {
    transform: [
      { translateX },
      { translateY },
      { scale },
    ],
    opacity,
  };

  return (
    <Animated.View 
      style={[
        styles.blockContainer,
        { width: size, height: size },
        style, // Apply the position style here
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        style={styles.touchableArea}
        onPress={() => onPress && onPress(row, col, id)}
        disabled={isAnimating || matched || isNew} // Also disable if it's a new block
        activeOpacity={0.7}
      >
        <View 
          style={[
            styles.outerCircle,
            { backgroundColor: selected ? '#FFFFFF' : borderColor },
          ]}
        >
          <View 
            style={[
              styles.innerCircle,
              { 
                backgroundColor: innerBackgroundColor,
                width: matched ? '100%' : '80%',
                height: matched ? '100%' : '80%',
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  blockContainer: {
    padding: 2,
    position: 'absolute', // This is key for animations
  },
  touchableArea: {
    width: '100%',
    height: '100%',
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

export default AnimatedBlock;