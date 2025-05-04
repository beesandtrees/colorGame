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

  // Handle initial setup and reset when the ID changes
  useEffect(() => {
    // When a block gets a new ID, it's a completely new block
    // This is the most important reset - must happen on every ID change
    
    // Reset position immediately
    translateX.setValue(0);
    translateY.setValue(0);
    
    // New blocks need to animate in from nothing
    if (isNew) {
      // Stop any ongoing animations first
      scale.stopAnimation();
      opacity.stopAnimation();
      
      // Set initial values - start invisible
      scale.setValue(0);
      opacity.setValue(0);
      
      // Brief delay to ensure layout is complete
      const animationTimeout = setTimeout(() => {
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
      }, 50);
      
      return () => {
        clearTimeout(animationTimeout);
      };
    } else {
      // Existing blocks should be fully visible
      scale.setValue(1);
      opacity.setValue(1);
    }
  }, [id, isNew]);

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
  
  // Handle swap animation - completely revised
  useEffect(() => {
    // Skip all animations for matched blocks
    if (matched) {
      return;
    }
    
    // Skip animations for new blocks
    if (isNew) {
      return;
    }
    
    // Reference to animation to allow cleanup
    let animationRef = { current: null };
    
    // Function to handle the animation
    const animateBlock = () => {
      // Stop any ongoing animations
      translateX.stopAnimation();
      translateY.stopAnimation();
      
      // The direction determines the target position
      if (swapDirection) {
        const distance = size;
        let xTarget = 0;
        let yTarget = 0;
        
        // Set the right distance based on direction
        if (swapDirection === 'right') xTarget = distance;
        else if (swapDirection === 'left') xTarget = -distance;
        else if (swapDirection === 'down') yTarget = distance;
        else if (swapDirection === 'up') yTarget = -distance;
        
        // Always start from position 0,0
        translateX.setValue(0);
        translateY.setValue(0);
        
        // Create a single animation for the swap
        animationRef.current = Animated.parallel([
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
        ]);
        
        // Start the animation
        animationRef.current.start();
      } else {
        // If no direction, ensure we're at position 0,0
        // Use immediate setValue instead of animation to avoid conflicts
        translateX.setValue(0);
        translateY.setValue(0);
      }
    };
    
    // Run the animation
    animateBlock();
    
    // Cleanup function to stop animations when unmounting or when dependencies change
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      
      // Ensure values are reset when the effect is cleaned up
      translateX.setValue(0);
      translateY.setValue(0);
    };
  }, [swapDirection, size, matched, isNew, translateX, translateY]);
  
  // Ensure scale/opacity are properly reset when selection changes
  useEffect(() => {
    // No animation for matched blocks
    if (matched) return;
    
    // Reset scale to normal if not selected
    if (!selected) {
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [selected, matched, scale]);

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