import { useEffect, useState } from 'react';
import { CartContext } from './cart-context.js';

const CART_STORAGE_KEY = 'print-it-cart';

const readStoredCart = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : [];
  } catch {
    return [];
  }
};

const createCartItemId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeServiceDetails = (serviceDetails = {}) =>
  Object.fromEntries(Object.entries(serviceDetails).filter(([, value]) => value));

const sameServiceDetails = (left, right) =>
  JSON.stringify(normalizeServiceDetails(left)) === JSON.stringify(normalizeServiceDetails(right));

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readStoredCart);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addItem = (product, quantity, serviceDetails = {}) => {
    const normalizedQuantity = Math.max(1, Number.parseInt(quantity, 10) || 1);
    const normalizedDetails = normalizeServiceDetails(serviceDetails);

    setCartItems((currentItems) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.productId === product.id && sameServiceDetails(item.serviceDetails, normalizedDetails),
      );

      if (existingIndex >= 0) {
        return currentItems.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: Math.min(999, item.quantity + normalizedQuantity) }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          cartItemId: createCartItemId(),
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          image: product.image,
          description: product.description,
          category: product.category,
          quantity: normalizedQuantity,
          serviceDetails: normalizedDetails,
        },
      ];
    });
  };

  const updateQuantity = (cartItemId, nextQuantity) => {
    const normalizedQuantity = Math.max(1, Number.parseInt(nextQuantity, 10) || 1);

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: Math.min(999, normalizedQuantity) } : item,
      ),
    );
  };

  const removeItem = (cartItemId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        addItem,
        cartItems,
        clearCart,
        itemCount,
        removeItem,
        subtotal,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
