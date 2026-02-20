'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

export interface CartItem {
  id: string;
  cartItemId: string; // Unique ID for this specific cart entry (variant)
  name: string;
  slug: string;
  price: string;
  featuredImage: string | null;
  quantity: number;
  stock: number;
  categoryName?: string | null;
  selectedOptions?: Record<string, string>;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'cartItemId'>) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'shilpini-cart';

// Helper to compare options
const optionsMatch = (
  opts1: Record<string, string> = {},
  opts2: Record<string, string> = {},
) => {
  const keys1 = Object.keys(opts1).sort();
  const keys2 = Object.keys(opts2).sort();
  if (keys1.length !== keys2.length) return false;
  if (!keys1.every((key, index) => key === keys2[index])) return false;
  return keys1.every((key) => opts1[key] === opts2[key]);
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure legacy items have cartItemId
        const migrated = parsed.map(
          (item: CartItem & { cartItemId?: string }) => ({
            ...item,
            cartItemId: item.cartItemId || crypto.randomUUID(),
          }),
        );
        // eslint-disable-next-line
        setItems(migrated);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = (newItem: Omit<CartItem, 'quantity' | 'cartItemId'>) => {
    setItems((prev) => {
      // Find item with same ID AND same options
      const existingIndex = prev.findIndex(
        (item) =>
          item.id === newItem.id &&
          optionsMatch(item.selectedOptions, newItem.selectedOptions),
      );

      if (existingIndex > -1) {
        // Item exists, increase quantity (respecting stock)
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        const maxQty = updated[existingIndex].stock;

        if (currentQty < maxQty) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: currentQty + 1,
          };
        }
        return updated;
      } else {
        // New item, add with quantity 1
        return [
          ...prev,
          {
            ...newItem,
            quantity: 1,
            cartItemId: crypto.randomUUID(),
          },
        ];
      }
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  // Revised updateQuantity to match original pattern
  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const newQty = Math.min(quantity, item.stock);
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items
    .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
    .toFixed(2);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
