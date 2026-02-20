import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
    _id: string;
    title: string;
    price: number;
    images: string[];
    quantity: number;
    category?: string;
    [key: string]: any;
}

interface CartState {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            cart: [],
            addToCart: (item) => {
                const { cart } = get();
                const existingItem = cart.find((i) => i._id === item._id);
                if (existingItem) {
                    set({
                        cart: cart.map((i) =>
                            i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
                        ),
                    });
                } else {
                    set({ cart: [...cart, { ...item, quantity: 1 }] });
                }
            },
            removeFromCart: (id) => {
                set({ cart: get().cart.filter((i) => i._id !== id) });
            },
            updateQuantity: (id, quantity) => {
                set({
                    cart: get().cart.map((i) =>
                        i._id === id ? { ...i, quantity: Math.max(0, quantity) } : i
                    ).filter((i) => i.quantity > 0),
                });
            },
            clearCart: () => set({ cart: [] }),
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
