import React from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { THEME } from '@/constants/Theme';

interface VergeButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const VergeButton = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
  variant = 'primary',
  style,
  labelStyle,
}: VergeButtonProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[styles.container, animatedStyle, style]}
    >
      <LinearGradient
        colors={
          isPrimary
            ? [THEME.colors.accent, '#FF8C00']
            : ['transparent', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          isOutline && styles.outline,
          variant === 'secondary' && styles.secondary,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? '#000' : THEME.colors.accent} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text
              style={[
                styles.label,
                { color: isPrimary ? '#000' : THEME.colors.text },
                labelStyle,
              ]}
            >
              {label}
            </Text>
          </View>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.lg,
  },
  outline: {
    borderWidth: 1,
    borderColor: THEME.colors.accent,
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: THEME.fonts.primaryBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default VergeButton;
