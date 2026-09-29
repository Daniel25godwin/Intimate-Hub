import { useEffect, useState } from "react";
import { Outlet, Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { logoutUser } from "../services/authService";
import "./storefront.css";

export default function StorefrontLayout() {
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  // every page change: close the menu and start at the top
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  function onSearch(e) {
    e.preventDefault();
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
  }

  return (
    <div className="storefront">
      <div className="sf-announce">Every order ships in plain, unbranded packaging.</div>
      <header className="sf-header">
        <div className="sf-header-in">
          <Link to="/" className="logo">Intimate Hub</Link>

          <form className="sf-search" onSubmit={onSearch} role="search">
            <Search size={16} />
            <input type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
          </form>

          <nav className={`sf-nav ${open ? "open" : ""}`} aria-label="Main">
            <NavLink to="/shop">Shop</NavLink>
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
            {user ? (
              <>
                <NavLink to="/account">Account</NavLink>
                <button type="button" onClick={logoutUser}>Log out</button>
              </>
            ) : (
              <NavLink to="/login">Sign in</NavLink>
            )}
          </nav>

          <div className="sf-icons">
            <Link to="/cart" className="sf-cart" aria-label={`Cart, ${itemCount} items`}>
              <ShoppingBag size={22} />
              {itemCount > 0 && <span className="sf-badge">{itemCount}</span>}
            </Link>
            <button className="sf-burger" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="storefront-footer">
        <div className="sf-footer-in">
          <div>
            <div className="logo" style={{ marginBottom: 8 }}>Intimate Hub</div>
            <p className="muted" style={{ maxWidth: 340 }}>Thoughtfully chosen products. Plain packaging. Private by default.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <Link to="/shop">All products</Link>
            <Link to="/cart">Cart</Link>
          </div>
          <div>
            <h4>Account</h4>
            <Link to={user ? "/account" : "/login"}>{user ? "My account" : "Sign in"}</Link>
            <Link to="/account/orders">My orders</Link>
          </div>
        </div>
        <p className="sf-copy">&copy; {new Date().getFullYear()} Intimate Hub. Discreet packaging on every order.</p>
      </footer>
    </div>
  );
}
