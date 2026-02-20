import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { THEME } from '@/constants/Theme';

interface VergeHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const VergeHeader = ({ title, showBack = true, onBack, rightElement }: VergeHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <ArrowLeft size={20} color={THEME.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        </View>

        <View style={styles.headerActions}>
          {rightElement}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: THEME.fonts.display,
    color: THEME.colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
});

export default VergeHeader;
