import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { THEME } from '../constants/Theme';

interface VergeLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const VergeLoader = ({ message = 'LOADING', fullScreen = true }: VergeLoaderProps) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedLoaderStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.content}>
        <View style={styles.spinnerContainer}>
          <Animated.View style={[styles.ring, animatedLoaderStyle]} />
        </View>
        <Text style={styles.title}>VERGE</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fullScreen: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContainer: {
    width: 40,
    height: 40,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopColor: THEME.colors.accent,
  },
  title: {
    fontFamily: THEME.fonts.header,
    fontSize: 18,
    color: THEME.colors.text,
    letterSpacing: 8,
    paddingLeft: 8, // Compensate for letter spacing to keep it centered
    lineHeight: 26,
    paddingBottom: 4,
    textAlign: 'center',
  },
  message: {
    fontFamily: THEME.fonts.primaryBold,
    fontSize: 8,
    color: THEME.colors.textMuted,
    letterSpacing: 3,
    paddingLeft: 3, // Compensate for letter spacing to keep it centered
    marginTop: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});

export default VergeLoader;
