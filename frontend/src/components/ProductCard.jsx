import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon } from './Icons.jsx';
import ProductImage from './ProductImage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/format.js';

export default function ProductCard({ product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  const isOutOfStock = product.inStock === false || product.currentStock === 0 || product.status === 'Out of Stock';

  const addToCart = () => {
    if (isOutOfStock) return;
    const defaultSize = (product.sizes && product.sizes.length > 0) ? product.sizes[0] : 'Free Size';
    addItem({ productId: product.id, size: defaultSize, colorIndex: 0, qty: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="product-card">
      <div className="product-card-media">
        <Link to={`/product/${product.id}`} aria-label={product.name}>
          <ProductImage product={product} />
        </Link>

        {isOutOfStock ? (
          <span className="badge" style={{ background: '#64748b', color: '#ffffff' }}>Out of Stock</span>
        ) : (
          <>
            {product.isNew && <span className="badge">New</span>}
            {!product.isNew && discount > 0 && <span className="badge badge-sale">{discount}% off</span>}
          </>
        )}

        <button
          type="button"
          className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
          onClick={() => setWishlisted((value) => !value)}
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
          <span>Sizes:</span> {(Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ['Free Size']).join(', ')}
        </p>

        <div className="color-dots" aria-label="Available colors">
          {(Array.isArray(product.colors) ? product.colors : []).map((color, idx) => (
            <span
              key={color.name || color.hex || idx}
              className="color-dot"
              style={{ backgroundColor: color.hex || '#b8405e' }}
              title={color.name || 'Color'}
            />
          ))}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block btn-sm"
          onClick={addToCart}
          disabled={isOutOfStock}
          style={isOutOfStock ? { background: '#94a3b8', borderColor: '#94a3b8', cursor: 'not-allowed' } : {}}
        >
          {isOutOfStock ? 'Out of Stock' : added ? 'Added ✓' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
