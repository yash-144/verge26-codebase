import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, StatusBar, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, CircleAlert, Minus, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCartStore } from '../../src/store/useCartStore';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';
import { VergeLoader } from '../../src/components/VergeLoader';
import { VergeAlert } from '../../src/components/VergeAlert';
import { apiHelper } from '../../src/services/api';

import { FadeIn } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { cart, addToCart } = useCartStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: any[];
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await apiHelper.fetch(`${SERVER_URL}/api/products/${id}`);
        const json = await response.json();
        if (json.status && json.data) setProduct(json.data);
        else router.back();
      } catch {
        if (__DEV__) console.error("Detail Fetch Error");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProductDetails();
  }, [id, SERVER_URL]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addToCart({ ...product, quantity });

    showAlert('ADDED TO BAG', `${quantity}x ${product.title} has been moved to your delivery queue.`, [
      { text: 'VIEW BAG', onPress: () => router.push('MerchStore/cart' as any) },
      { text: 'CONTINUE', style: 'cancel' }
    ]);
  }, [product, quantity, addToCart, router]);

  const adjustQuantity = useCallback((amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  }, []);

  const imageUrl = product?.images?.[0] || 'https://via.placeholder.com/400';

  return (
    <View style={{ flex: 1, backgroundColor: THEME.colors.bg }}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <VergeHeader
          title="PRODUCT"
          rightElement={
            <TouchableOpacity
              onPress={() => router.push('MerchStore/cart' as any)}
              style={[styles.cartButton, cart?.length > 0 && styles.cartButtonActive]}
            >
              <ShoppingBag size={20} color={cart?.length > 0 ? THEME.colors.accent : THEME.colors.text} strokeWidth={2.2} />
              {cart?.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeTxt}>{cart.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          }
        />

        {loading ? (
          <VergeLoader message="LOADING..." />
        ) : !product ? null : (
          <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              removeClippedSubviews={true}
            >
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: imageUrl }} 
                  style={{ width: '100%', aspectRatio: 1 }} 
                  contentFit="cover" 
                  transition={200}
                  cachePolicy="memory-disk"
                />
              </View>

              <View style={{ paddingHorizontal: 20 }}>
                <View style={styles.tagPill}>
                  <Text style={styles.tagText}>{product.category.toUpperCase()}</Text>
                </View>

                <Text style={styles.title}>{product.title}</Text>
                <Text style={styles.price}>₹{product.price}</Text>

                <View style={styles.descriptionBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <CircleAlert size={14} color={THEME.colors.textMuted} strokeWidth={2.2} />
                    <Text style={styles.sectionLabel}>DESCRIPTION</Text>
                  </View>
                  <Text style={styles.descriptionText}>
                    {product.description || "Premium quality merchandise from Verge Technical Festival."}
                  </Text>
                </View>

                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>QUANTITY</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                    <TouchableOpacity onPress={() => adjustQuantity(-1)} style={styles.qtyButton}>
                      <Minus size={18} color={THEME.colors.text} strokeWidth={2.2} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{quantity}</Text>
                    <TouchableOpacity onPress={() => adjustQuantity(1)} style={styles.qtyButton}>
                      <Plus size={18} color={THEME.colors.text} strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.bottomBar}>
              <TouchableOpacity onPress={handleAddToCart} style={styles.ctaButton}>
                <ShoppingBag size={18} color="#000" strokeWidth={2.2} />
                <Text style={styles.ctaText}>ADD TO BAG — ₹{product.price * quantity}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <VergeAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cartButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: THEME.colors.surfaceElevated, borderWidth: 1, borderColor: THEME.colors.border, alignItems: 'center', justifyContent: 'center' },
  cartButtonActive: { borderColor: THEME.colors.accent },
  badge: { position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9, backgroundColor: THEME.colors.accent, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { fontSize: 10, fontWeight: '900', color: '#000' },
  imageContainer: { marginHorizontal: 20, marginBottom: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: THEME.colors.surface, borderWidth: 1, borderColor: THEME.colors.border },
  tagPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: THEME.colors.borderLight, marginBottom: 12, backgroundColor: THEME.colors.surface },
  tagText: { color: THEME.colors.text, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  title: { color: THEME.colors.text, fontSize: 24, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
  price: { color: THEME.colors.accent, fontSize: 24, fontWeight: '900', marginBottom: 24, letterSpacing: 1 },
  descriptionBox: { backgroundColor: THEME.colors.cardBg, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: THEME.colors.border, marginBottom: 24 },
  sectionLabel: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  descriptionText: { color: THEME.colors.text, fontSize: 13, lineHeight: 22, fontWeight: '500' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: THEME.colors.cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: THEME.colors.border, marginBottom: 24 },
  quantityLabel: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  qtyButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: THEME.colors.surface, borderWidth: 1, borderColor: THEME.colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: THEME.colors.text, fontSize: 16, fontWeight: '700' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(5,5,5,0.95)', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, borderTopWidth: 1, borderTopColor: THEME.colors.border },
  ctaButton: { backgroundColor: THEME.colors.accent, paddingVertical: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
