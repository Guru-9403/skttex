import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon } from './Icons.jsx';
import ProductImage from './ProductImage.jsx';
import { formatPrice } from '../utils/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [added, setAdded] = useState(false);

  const wishlisted = isWishlisted(product.id);

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  const handleAdd = () => {
    const defaultSize = product.sizes?.length ? product.sizes[0] : 'Free Size';
    addToCart(product, defaultSize, 0, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="product-card">
      <div className="product-card-media">
        <Link to={`/product/${product.id}`} aria-label={product.name}>
          <ProductImage product={product} />
        </Link>

        {product.isNew && <span className="badge">New</span>}
        {!product.isNew && discount > 0 && <span className="badge badge-sale">{discount}% off</span>}

        <button
          type="button"
          className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
          onClick={() => toggleWishlist(product.id)}
        >
          <HeartIcon size={18} filled={wishlisted} />
        </button>
      </div>

      <div className="product-card-body">
        <p className="product-category">
          {product.category} · {product.type}
        </p>

        <h3 className="product-name">
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>

        <p className="product-price">
          {formatPrice(product.price)}
          {product.oldPrice && <span className="old-price">{formatPrice(product.oldPrice)}</span>}
        </p>

        <p className="product-sizes">
          <span>Sizes:</span> {product.sizes?.join(', ')}
        </p>

        <div className="color-dots" aria-label="Available colors">
          {product.colors?.map((color) => (
            <span
              key={color.name}
              className="color-dot"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block btn-sm"
          onClick={handleAdd}
          style={added ? { backgroundColor: 'var(--success)', borderColor: 'var(--success)' } : {}}
        >
          {added ? 'Added! ✓' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
