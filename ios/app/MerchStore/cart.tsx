import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, CreditCard, ShoppingBag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../src/store/useCartStore';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';

export default function Cart() {
  const router = useRouter();

  const { cart, removeFromCart, updateQuantity, clearCart } = useCartStore();

  const subtotal = cart?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
  const platformFee = cart?.length > 0 ? 20 : 0;
  const finalTotal = subtotal + platformFee;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.push('/(tabs)/merch');
  };

  const internalRemove = (id: string) => {
    removeFromCart(id);
  };

  const updateQty = (id: string, delta: number) => {
    const item = cart.find(i => i._id === id);
    if (item) {
      updateQuantity(id, item.quantity + delta);
    }
  };

  const internalClear = () => {
    clearCart();
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    router.push("MerchStore/checkout" as any);
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
        style={styles.itemImage}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />

      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>

      <View style={styles.qtyBar}>
        <Pressable
          onPress={() => updateQty(item._id, -1)}
          style={styles.qtyButton}
          hitSlop={8}
        >
          <Minus size={16} color={THEME.colors.text} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
        <Pressable
          onPress={() => updateQty(item._id, 1)}
          style={styles.qtyButton}
          hitSlop={8}
        >
          <Plus size={16} color={THEME.colors.text} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />

      <VergeHeader
        title="CART"
        onBack={handleBack}
        rightElement={
          cart?.length > 0 && (
            <TouchableOpacity onPress={internalClear}>
              <Text style={styles.clearText}>CLEAR</Text>
            </TouchableOpacity>
          )
        }
      />

      {cart?.length > 0 ? (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item._id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SUBTOTAL</Text>
              <Text style={styles.summaryValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>PLATFORM FEE</Text>
              <Text style={styles.summaryValue}>₹{platformFee}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>₹{finalTotal}</Text>
            </View>

            <TouchableOpacity
              onPress={handleCheckout}
              style={styles.checkoutButton}
            >
              <LinearGradient
                colors={[THEME.colors.accent, '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.checkoutGradient}
              >
                <CreditCard color="#000" size={18} strokeWidth={2.2} />
                <Text style={styles.checkoutText}>
                  CHECKOUT
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <ShoppingBag size={64} color={THEME.colors.border} strokeWidth={2.2} />
          </View>
          <Text style={styles.emptyTitle}>YOUR BAG IS EMPTY</Text>
          <Text style={styles.emptyDesc}>
            Acquire official Verge gear from the Supply Depot to see them here.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/merch" as any)}
            style={styles.goStoreButton}
          >
            <Text style={styles.goStoreText}>GO TO STORE</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  clearText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 220,
  },
  cartItem: {
    backgroundColor: THEME.colors.cardBg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: THEME.colors.surface,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  itemTitle: {
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemPrice: {
    color: THEME.colors.accent,
    fontSize: 16,
    fontWeight: '900',
  },
  qtyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 6,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  qtyValue: {
    minWidth: 18,
    textAlign: 'center',
    color: THEME.colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  summaryContainer: {
    backgroundColor: THEME.colors.cardBg,
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: THEME.colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summaryValue: {
    color: THEME.colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    marginBottom: 24,
  },
  totalLabel: {
    color: THEME.colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalValue: {
    color: THEME.colors.accent,
    fontSize: 24,
    fontWeight: '900',
  },
  checkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkoutGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  checkoutText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: THEME.colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emptyTitle: {
    color: THEME.colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDesc: {
    color: THEME.colors.textMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 32,
  },
  goStoreButton: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  goStoreText: {
    color: THEME.colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
