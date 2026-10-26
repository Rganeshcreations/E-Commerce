import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";

import VendorDashboard from "./pages/VendorDashboard";
import VendorProducts from "./pages/VendorProducts";
import VendorInventory from "./pages/VendorInventory";
import VendorOrders from "./pages/VendorOrders";

import AdminDashboard from "./pages/AdminDashboard";
import Tenants from "./pages/Tenants";
import MainLayout from "./layouts/MainLayout";

export default function AppRoutes() {

  return (
    <Routes>

      <Route element={<MainLayout />}>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/orders"
          element={<Orders />}
        />

        <Route
          path="/vendor"
          element={<VendorDashboard />}
        />

        <Route
          path="/vendor/products"
          element={<VendorProducts />}
        />

        <Route
          path="/vendor/inventory"
          element={<VendorInventory />}
        />

        <Route
          path="/vendor/orders"
          element={<VendorOrders />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />
        <Route
          path="/admin/tenants"
          element={<Tenants />}
        />



        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Route>

    </Routes>
  );
}

