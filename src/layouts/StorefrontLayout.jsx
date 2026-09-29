import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { logoutUser } from "../services/authService";

export default function StorefrontLayout() {
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  return (
    <div className="storefront">
      <header className="storefront-header">
        <Link to="/" className="logo">Intimate Hub</Link>
        <nav>
          <Link to="/shop">Shop</Link>
          <Link to="/cart">Cart{itemCount > 0 ? ` (${itemCount})` : ""}</Link>
          {isAdmin && <Link to="/admin">Admin</Link>}
          {user ? (
            <>
              <Link to="/account">Account</Link>
              <a href="#" onClick={(e) => { e.preventDefault(); logoutUser(); }}>Log out</a>
            </>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="storefront-footer">
        <p>&copy; {new Date().getFullYear()} Intimate Hub. Discreet packaging on every order.</p>
      </footer>
    </div>
  );
}
