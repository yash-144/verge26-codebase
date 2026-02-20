import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleCheckBig, CircleX } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../src/constants/Theme';

export default function OrderStatus() {
    const router = useRouter();
    const { status, orderId, paymentId } = useLocalSearchParams();
    const isSuccess = status === 'success';

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <View style={[
                    styles.iconContainer,
                    isSuccess ? styles.iconSuccess : styles.iconError
                ]}>
                    {isSuccess ? (
                        <CircleCheckBig
                            size={48}
                            color={THEME.colors.success}
                            strokeWidth={2.2}
                        />
                    ) : (
                        <CircleX
                            size={48}
                            color={THEME.colors.danger}
                            strokeWidth={2.2}
                        />
                    )}
                </View>

                <Text style={styles.title}>
                    {isSuccess ? "ORDER CONFIRMED" : "PAYMENT FAILED"}
                </Text>

                <Text style={styles.subtitle}>
                    {isSuccess ? "Your gear is being prepared for pickup." : "The transaction could not be completed. Please try again."}
                </Text>

                {isSuccess && (
                    <View style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>ORDER ID</Text>
                            <Text style={styles.detailValue}>{orderId}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>PAYMENT ID</Text>
                            <Text style={styles.detailValue}>{paymentId}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.verificationRow}>
                            <Text style={styles.verificationText}>PAYMENT VERIFIED</Text>
                        </View>
                    </View>
                )}

                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        onPress={() => router.replace('/(tabs)/merch')}
                        style={styles.primaryButton}
                    >
                        <LinearGradient
                            colors={[THEME.colors.accent, '#FF8C00']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.primaryButtonText}>BACK TO STORE</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.replace('/MerchStore/orders')}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryButtonText}>VIEW ORDERS</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
  },
  iconSuccess: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    borderColor: 'rgba(0, 200, 83, 0.3)',
  },
  iconError: {
    backgroundColor: 'rgba(255, 61, 0, 0.1)',
    borderColor: 'rgba(255, 61, 0, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.colors.text,
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 32,
    textTransform: 'uppercase',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  detailValue: {
    color: THEME.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 16,
  },
  verificationRow: {
    alignItems: 'center',
  },
  verificationText: {
    color: THEME.colors.success,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionsContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: THEME.colors.surface,
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  secondaryButtonText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
