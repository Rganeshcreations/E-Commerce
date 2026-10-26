import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("marketgrid_user")) || null; }
    catch { return null; }
  });

  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("marketgrid_cart")) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("marketgrid_cart", JSON.stringify(cart));
  }, [cart]);

  const login = (data) => {
    localStorage.setItem("marketgrid_token", data.token);
    localStorage.setItem("marketgrid_user", JSON.stringify(data));
    localStorage.setItem("marketgrid_role", data.role || "");
    localStorage.setItem("marketgrid_user_id", String(data.userId ?? data.id ?? ""));
    localStorage.setItem("marketgrid_customer_id", String(data.userId ?? data.id ?? ""));
    localStorage.setItem("marketgrid_tenant", String(data.tenantId ?? ""));
    localStorage.setItem("marketgrid_email", data.email || "");
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem("marketgrid_token");
    localStorage.removeItem("marketgrid_user");
    setUser(null);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const found = prev.find(x => x.id === product.id);
      if (found) {
        return prev.map(x =>
          x.id === product.id
            ? { ...x, quantity: Math.min(x.quantity + 1, x.stockQuantity || 99) }
            : x
        );
      }

      return [...prev, {
        ...product,
        quantity: 1
      }];
    });
  };

  const changeQuantity = (id, quantity) => {
    setCart(prev =>
      prev.map(x =>
        x.id === id
          ? { ...x, quantity: Math.max(1, Math.min(quantity, x.stockQuantity || 99)) }
          : x
      )
    );
  };

  const removeFromCart = (id) =>
    setCart(prev => prev.filter(x => x.id !== id));

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, x) => sum + x.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, x) => sum + Number(x.price || 0) * x.quantity,
    0
  );

  const value = useMemo(() => ({
    user,
    login,
    logout,
    cart,
    addToCart,
    changeQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal
  }), [user, cart, cartCount, cartTotal]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
