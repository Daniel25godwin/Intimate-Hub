import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "intimate-hub-cart";

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

// Cart lives in localStorage, not Firestore — it's throwaway client state
// until checkout, when the server re-validates everything anyway.
export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const lineKey = (productId, variant) => `${productId}::${variant || ""}`;

  const addItem = (product, qty = 1, variant = null) => {
    setItems((prev) => {
      const key = lineKey(product.id, variant);
      const existing = prev.find((i) => lineKey(i.productId, i.variant) === key);
      if (existing) {
        return prev.map((i) =>
          lineKey(i.productId, i.variant) === key
            ? { ...i, qty: Math.min(i.qty + qty, product.stock || 99) }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          image: product.images?.[0] || "",
          price: product.discountPrice || product.price,
          stock: product.stock,
          variant,
          qty,
        },
      ];
    });
  };

  const setQty = (productId, variant, qty) => {
    setItems((prev) =>
      prev.map((i) =>
        lineKey(i.productId, i.variant) === lineKey(productId, variant)
          ? { ...i, qty: Math.max(1, Math.min(qty, i.stock || 99)) }
          : i
      )
    );
  };

  const removeItem = (productId, variant) => {
    setItems((prev) => prev.filter((i) => lineKey(i.productId, i.variant) !== lineKey(productId, variant)));
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, setQty, removeItem, clearCart, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
