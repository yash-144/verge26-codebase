import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleCheckBig, Receipt } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/auth';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';
import { VergeLoader } from '../../src/components/VergeLoader';
import { apiHelper } from '../../src/services/api';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const user = await authService.getUserSession();
      if (!user) return;

      const userId = user._id;
      if (!userId) return;

      const response = await apiHelper.fetch(`${SERVER_URL}/api/orders/my-orders/${userId}`);
      const json = await response.json();

      if (Array.isArray(json)) {
        setOrders(json);
      } else if (json.data && Array.isArray(json.data)) {
        setOrders(json.data);
      } else if (json.orders && Array.isArray(json.orders)) {
        setOrders(json.orders);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.push('/(tabs)/merch');
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.label}>ORDER REFERENCE</Text>
          <Text style={styles.value}>{item.orderId}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          item.orderStatus === 'delivered' ? styles.statusDelivered : styles.statusPending
        ]}>
          <Text style={[
            styles.statusText,
            item.orderStatus === 'delivered' ? { color: THEME.colors.success } : { color: THEME.colors.accent }
          ]}>
            {item.orderStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        {item.items.map((prod: any, i: number) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemName}>{prod.quantity}x {prod.name}</Text>
            <Text style={styles.itemPrice}>₹{prod.variant.price * prod.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.paymentText}>PAID VIA RAZORPAY</Text>
        <CircleCheckBig size={18} color={THEME.colors.success} strokeWidth={2.2} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: THEME.colors.bg }}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top']} style={styles.container}>
        <VergeHeader title="ORDERS" onBack={handleBack} />

        {loading ? (
          <VergeLoader message="LOADING..." />
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item._id}
            renderItem={renderOrderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Receipt size={48} color={THEME.colors.border} strokeWidth={2.2} />
                <Text style={styles.emptyText}>NO DATA LOGS FOUND</Text>
              </View>
            }
            refreshControl={<RefreshControl refreshing={false} onRefresh={fetchOrders} tintColor={THEME.colors.accent} progressBackgroundColor={THEME.colors.surface} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  value: {
    color: THEME.colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusDelivered: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    borderColor: 'rgba(0, 200, 83, 0.3)',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 12,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  itemPrice: {
    color: THEME.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  paymentText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
