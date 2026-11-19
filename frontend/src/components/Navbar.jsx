import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { SearchIcon, CartIcon, UserIcon, MenuIcon, CloseIcon } from './Icons.jsx';
import { site, navLinks } from '../data/site.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { totalItemsCount } = useCart();
  const { user } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
    setSearchOpen(false);
    setQuery('');
  };

  return (
    <header className="header">
      <div className="topbar">
        Free shipping on orders above ₹1,999 &nbsp;|&nbsp; Wholesale enquiries welcome
      </div>

      <div className="container header-main">
        <button
          type="button"
          className="icon-btn menu-btn"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <Link to="/" className="logo" onClick={closeMenu}>
          {site.name}
          <span>{site.tagline}</span>
        </Link>

        <nav className={`nav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
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
          {user?.role === 'admin' && (
            <NavLink
              to="/admin/stock"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              style={{ color: 'var(--primary)', fontWeight: 600 }}
              onClick={closeMenu}
            >
              📦 Stock Admin
            </NavLink>
          )}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label="Search"
            onClick={() => setSearchOpen((open) => !open)}
          >
            <SearchIcon />
          </button>
          <Link
            to="/login"
            className="icon-btn"
            aria-label={user ? `Logged in as ${user.name}` : 'Login'}
            title={user ? `Signed in as ${user.name}` : 'Login'}
            onClick={closeMenu}
            style={user ? { color: 'var(--primary)', borderColor: 'var(--primary)' } : {}}
          >
            <UserIcon />
          </Link>
          <Link to="/cart" className="icon-btn cart-link" aria-label="Cart" onClick={closeMenu}>
            <CartIcon />
            {totalItemsCount > 0 && <span className="cart-count">{totalItemsCount}</span>}
          </Link>
        </div>
      </div>

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
  );
}
