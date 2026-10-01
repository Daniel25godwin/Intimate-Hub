import { useEffect, useState } from "react";
import { Outlet, Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search, ShoppingCart, User, Home, LayoutGrid, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { logoutUser } from "../services/authService";
import { listCategories } from "../services/categoryService";
import { BRAND } from "../config/brand";
import "./storefront.css";

function Mark() {
  return (
    <svg className="hdr-mark" viewBox="0 0 64 56" aria-hidden="true">
      <defs>
        <linearGradient id="tp-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6bf4a" /><stop offset="1" stopColor="#c98414" /></linearGradient>
      </defs>
      <path d="M4 6h34v9H26v35h-9V15H4z" fill="url(#tp-gold)" />
      <path fillRule="evenodd" d="M36 6h18a13 13 0 0 1 0 26h-8v18H36zM46 15v8h7a4 4 0 0 0 0-8z" fill="#151515" />
    </svg>
  );
}

function Logo() {
  if (BRAND.logo) return <img src={BRAND.logo} alt={BRAND.name} className="hdr-logo-img" />;
  return (
    <>
      <Mark />
      <span className="hdr-brand"><b>{BRAND.name}</b>{BRAND.tagline && <small>{BRAND.tagline}</small>}</span>
    </>
  );
}

export default function StorefrontLayout() {
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    listCategories().then((c) => setCategories(c.filter((x) => x.isEnabled !== false))).catch(() => {});
  }, []);

  // every page change: close the menu and start at the top
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenu(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [menu]);

  function onSearch(e) {
    e.preventDefault();
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
  }

  const homeActive = pathname === "/";
  const shopActive = pathname.startsWith("/shop") || pathname.startsWith("/product");
  const hideTabs = pathname.startsWith("/product") || pathname.startsWith("/checkout");

  return (
    <div className="storefront">
      <header className="hdr">
        <div className="hdr-in">
          <button className="hdr-btn hdr-burger" onClick={() => setMenu(true)} aria-label="Open menu"><Menu size={28} /></button>
          <Link to="/" className="hdr-logo" aria-label={`${BRAND.name} home`}><Logo /></Link>
          <nav className="hdr-nav" aria-label="Main">
            <NavLink to="/shop">Shop</NavLink>
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
            {user ? <button type="button" onClick={logoutUser}>Log out</button> : <NavLink to="/login">Sign in</NavLink>}
          </nav>
          <div className="hdr-icons">
            <Link to={user ? "/account" : "/login"} className="hdr-btn hdr-acct" aria-label="Account"><User size={26} /></Link>
            <Link to="/cart" className="hdr-btn hdr-cart" aria-label={`Cart, ${itemCount} items`}>
              <ShoppingCart size={26} />
              {itemCount > 0 && <span className="hdr-count">{itemCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      <div className="searchband">
        <form className="searchform" onSubmit={onSearch} role="search">
          <input type="search" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
          <button aria-label="Search"><Search size={22} /></button>
        </form>
      </div>

      {/* slide-in menu */}
      <div className={`drawer-scrim ${menu ? "open" : ""}`} onClick={() => setMenu(false)} />
      <aside className={`drawer ${menu ? "open" : ""}`} aria-hidden={!menu} aria-label="Menu">
        <div className="drawer-head">Menu<button className="hdr-btn dark" onClick={() => setMenu(false)} aria-label="Close menu"><X size={24} /></button></div>
        <Link to="/">Home</Link>
        <Link to="/shop">Shop all</Link>
        {categories.length > 0 && <div className="d-label">Categories</div>}
        {categories.map((c) => <Link key={c.id} to={`/shop?category=${c.id}`}>{c.name}</Link>)}
        <hr />
        {user ? (
          <>
            <Link to="/account">My account</Link>
            <Link to="/account/orders">My orders</Link>
            {isAdmin && <Link to="/admin">Admin</Link>}
            <button className="d-link" onClick={logoutUser}>Log out</button>
          </>
        ) : <Link to="/login">Sign in / Register</Link>}
      </aside>

      <main><Outlet /></main>

      <footer className="storefront-footer">
        <div className="ft-in">
          <div>
            <div className="ft-logo">{BRAND.name}</div>
            <p>{BRAND.freeDelivery}. Secure online payment.</p>
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
        <div className="ft-copy">
          <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p className="ft-credit">
            Designed by{" "}
            <a href={`https://wa.me/${BRAND.designer.whatsapp}?text=${encodeURIComponent(BRAND.designer.text)}`} target="_blank" rel="noreferrer">
              {BRAND.designer.name}
            </a>
            {" "}— website deals on WhatsApp
          </p>
        </div>
      </footer>

      {BRAND.whatsapp && (
        <a className="wa-fab" href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><MessageCircle size={28} /></a>
      )}

      {!hideTabs && (
        <nav className="tabbar" aria-label="Quick navigation">
          <Link to="/" className={homeActive ? "active" : ""}><Home size={24} />Home</Link>
          <Link to="/shop" className={shopActive ? "active" : ""}><LayoutGrid size={24} />Shop</Link>
          <Link to="/cart" className={pathname.startsWith("/cart") ? "active" : ""}>
            <ShoppingCart size={24} />Cart{itemCount > 0 && <span className="cnt">{itemCount}</span>}
          </Link>
          <Link to={user ? "/account" : "/login"} className={pathname.startsWith("/account") ? "active" : ""}><User size={24} />Account</Link>
        </nav>
      )}
    </div>
  );
}
