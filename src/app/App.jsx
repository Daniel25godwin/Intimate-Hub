import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import RequireAdmin from "../components/shared/RequireAdmin";

import StorefrontLayout from "../layouts/StorefrontLayout";
import AdminLayout from "../layouts/AdminLayout";

import Home from "../pages/storefront/Home";
import Shop from "../pages/storefront/Shop";
import ProductDetail from "../pages/storefront/ProductDetail";
import Cart from "../pages/storefront/Cart";
import Checkout from "../pages/storefront/Checkout";
import OrderConfirmation from "../pages/storefront/OrderConfirmation";
import PaymentCallback from "../pages/storefront/PaymentCallback";
import Login from "../pages/storefront/Login";
import Register from "../pages/storefront/Register";
import ForgotPassword from "../pages/storefront/ForgotPassword";
import VerifyEmail from "../pages/storefront/VerifyEmail";

import AccountOverview from "../pages/storefront/account/Overview";
import AccountOrders from "../pages/storefront/account/Orders";
import AccountProfile from "../pages/storefront/account/Profile";
import AccountAddresses from "../pages/storefront/account/Addresses";
import AccountWishlist from "../pages/storefront/account/Wishlist";
import AccountSecurity from "../pages/storefront/account/Security";

import Dashboard from "../pages/admin/Dashboard";
import Products from "../pages/admin/Products";
import ProductForm from "../pages/admin/ProductForm";
import Categories from "../pages/admin/Categories";
import Orders from "../pages/admin/Orders";
import OrderDetail from "../pages/admin/OrderDetail";
import Customers from "../pages/admin/Customers";
import Reviews from "../pages/admin/Reviews";
import Coupons from "../pages/admin/Coupons";
import Inventory from "../pages/admin/Inventory";
import Analytics from "../pages/admin/Analytics";
import Settings from "../pages/admin/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Auth screens: full-screen, no storefront header/footer */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Storefront */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:category" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />

            <Route path="/account" element={<AccountOverview />} />
            <Route path="/account/orders" element={<AccountOrders />} />
            <Route path="/account/profile" element={<AccountProfile />} />
            <Route path="/account/addresses" element={<AccountAddresses />} />
            <Route path="/account/wishlist" element={<AccountWishlist />} />
            <Route path="/account/security" element={<AccountSecurity />} />
          </Route>

          {/* Admin — gated by RequireAdmin, real enforcement is in Firestore/Storage rules */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
