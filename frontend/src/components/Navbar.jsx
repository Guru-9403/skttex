import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { SearchIcon, CartIcon, UserIcon, MenuIcon, CloseIcon } from './Icons.jsx';
import { site, navLinks } from '../data/site.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
    setSearchOpen(false);
    setQuery('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    closeMenu();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-backdrop ${menuOpen ? 'show' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <header className="header">
        <div className="container header-main">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>

          {/* Brand Logo */}
          <Link to="/" className="logo" onClick={closeMenu}>
            <span className="logo-title">{site.name}</span>
            <span className="logo-tag">{site.tagline}</span>
          </Link>

          {/* Navigation Drawer (Desktop bar + Mobile Slide-out Drawer) */}
          <nav className={`nav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
            {/* Mobile Drawer Top Header */}
            <div className="drawer-header">
              <span className="drawer-title">Menu</span>
              <button
                type="button"
                className="icon-btn drawer-close-btn"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Mobile User Profile Card */}
            <div className="drawer-user-card">
              {user ? (
                <div className="drawer-user-info">
                  <div className="drawer-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="drawer-user-meta">
                    <strong>Hi, {user.name}</strong>
                    <span className="drawer-user-role">
                      {isAdmin ? '👑 Administrator' : 'Customer Account'}
                    </span>
                  </div>
                  {isAdmin && (
                    <Link
                      to="/admin/stock"
                      className="btn drawer-admin-btn"
                      onClick={closeMenu}
                    >
                      📦 Stock Management Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="drawer-logout-btn"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="drawer-guest-box">
                  <p>Welcome to Sree Kavinya Tex</p>
                  <Link to="/login" className="btn btn-primary btn-block" onClick={closeMenu}>
                    Sign In / Register
                  </Link>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="drawer-links-wrap">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                  onClick={closeMenu}
                >
                  {link.label}
                </NavLink>
              ))}

              {isAdmin && (
                <NavLink
                  to="/admin/stock"
                  className={({ isActive }) =>
                    isActive ? 'nav-link active nav-link-admin' : 'nav-link nav-link-admin'
                  }
                  onClick={closeMenu}
                >
                  📦 Stock Admin
                </NavLink>
              )}
            </div>
          </nav>

          {/* Header Action Icons */}
          <div className="header-actions">
            {/* Search Icon */}
            <button
              type="button"
              className="icon-btn"
              aria-label="Search"
              onClick={() => setSearchOpen((open) => !open)}
            >
              <SearchIcon size={20} />
            </button>

            {/* Desktop User Section (Hidden on Mobile) */}
            <div className="header-user-desktop">
              {user ? (
                <div className="user-pill">
                  {isAdmin && (
                    <Link to="/admin/stock" className="btn btn-admin-header">
                      Admin Panel
                    </Link>
                  )}
                  <span className="user-greeting">Hi, {user.name.split(' ')[0]}</span>
                  <button type="button" onClick={handleLogout} className="btn-logout-header">
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="icon-btn" aria-label="Login">
                  <UserIcon size={20} />
                </Link>
              )}
            </div>

            {/* Cart Icon */}
            <Link to="/cart" className="icon-btn cart-link" aria-label="Cart" onClick={closeMenu}>
              <CartIcon size={20} />
              {count > 0 && <span className="cart-count">{count}</span>}
            </Link>
          </div>
        </div>

        {/* Collapsible Search bar */}
        {searchOpen && (
          <form className="search-bar" onSubmit={handleSearch}>
            <div className="container search-bar-inner">
              <input
                type="search"
                placeholder="Search kurtas, sarees, shirts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </div>
          </form>
        )}
      </header>
    </>
  );
}
