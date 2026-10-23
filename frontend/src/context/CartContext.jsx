import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("marketgrid_cart") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("marketgrid_cart", JSON.stringify(cart));
  }, [cart]);

  function addToCart(product) {
    setCart(current => {
      const existing = current.find(item => item.productId === product.id);

      if (existing) {
        return current.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          vendorId: product.vendorId,
          productName: product.productName,
          price: Number(product.price || 0),
          quantity: 1
        }
      ];
    });
  }

  function removeFromCart(productId) {
    setCart(current =>
      current.filter(item => item.productId !== productId)
    );
  }

  function changeQuantity(productId, quantity) {
    setCart(current =>
      current.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  }

  function clearCart() {
    setCart([]);
  }

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        count,
        total,
        addToCart,
        removeFromCart,
        changeQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
