import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductImage from '../components/ProductImage.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import { HeartIcon } from '../components/Icons.jsx';
import { products, getProductById } from '../data/products.js';
import { formatPrice } from '../utils/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

export default function ProductDetails() {
  const { id } = useParams();
  const product = getProductById(id);

  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [size, setSize] = useState(() => (product?.sizes?.length ? product.sizes[0] : null));
  const [colorIndex, setColorIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  if (!product) {
    return (
      <div className="container center-block">
        <h1>Product not found</h1>
        <p>The product you are looking for does not exist.</p>
        <Link to="/products" className="btn btn-primary">
          Back to products
        </Link>
      </div>
    );
  }

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const selectedColor = product.colors[colorIndex] || product.colors[0] || { name: 'Standard' };
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    const chosenSize = size || (product.sizes?.length ? product.sizes[0] : 'Free Size');
    addToCart(product, chosenSize, colorIndex, qty);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  return (
    <section className="page-content">
      <div className="container">
        <p className="breadcrumb">
          <Link to="/">Home</Link> / <Link to={`/${product.category.toLowerCase()}`}>{product.category}</Link> /{' '}
          {product.name}
        </p>

        <div className="details-layout">
          <div className="details-image">
            <ProductImage product={product} />
          </div>

          <div className="details-info">
            <p className="product-category">
              {product.category} · {product.type}
            </p>
            <h1>{product.name}</h1>

            <p className="details-price">
              {formatPrice(product.price)}
              {product.oldPrice && <span className="old-price">{formatPrice(product.oldPrice)}</span>}
            </p>
            <p className="details-note">Inclusive of all taxes</p>

            <p className="details-desc">{product.description}</p>

            {product.sizes?.length > 0 && (
              <div className="option-group">
                <p className="option-label">
                  Size {size && <span>– {size}</span>}
                </p>
                <div className="size-options">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`size-btn ${size === s ? 'selected' : ''}`}
                      onClick={() => setSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors?.length > 0 && (
              <div className="option-group">
                <p className="option-label">
                  Colour <span>– {selectedColor.name}</span>
                </p>
                <div className="color-options">
                  {product.colors.map((c, index) => (
                    <button
                      key={c.name}
                      type="button"
                      className={`color-btn ${colorIndex === index ? 'selected' : ''}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                      aria-label={c.name}
                      onClick={() => setColorIndex(index)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="option-group">
              <p className="option-label">Quantity</p>
              <div className="qty-box">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}>
                  −
                </button>
                <span>{qty}</span>
                <button type="button" aria-label="Increase quantity" onClick={() => setQty(qty + 1)}>
                  +
                </button>
              </div>
            </div>

            <div className="details-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddToCart}
                style={addedToast ? { backgroundColor: 'var(--success)', borderColor: 'var(--success)' } : {}}
              >
                {addedToast ? 'Added to Cart ✓' : 'Add to Cart'}
              </button>
              <button
                type="button"
                className={`wishlist-large ${wishlisted ? 'active' : ''}`}
                aria-pressed={wishlisted}
                onClick={() => toggleWishlist(product.id)}
              >
                <HeartIcon size={18} filled={wishlisted} />
                {wishlisted ? 'Wishlisted' : 'Wishlist'}
              </button>
            </div>

            <table className="info-table">
              <tbody>
                <tr>
                  <th>Fabric</th>
                  <td>{product.fabric}</td>
                </tr>
                <tr>
                  <th>Care</th>
                  <td>Machine wash cold, dry in shade</td>
                </tr>
                <tr>
                  <th>Delivery</th>
                  <td>3–7 working days across India</td>
                </tr>
                <tr>
                  <th>Returns</th>
                  <td>7-day exchange for size issues</td>
                </tr>
              </tbody>
            </table>

            <p className="wholesale-note">
              Need this in bulk for your shop? <Link to="/wholesale">Send a wholesale enquiry</Link>
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <div className="related">
            <SectionHeading title="You may also like" />
            <ProductGrid products={related} />
          </div>
        )}
      </div>
    </section>
  );
}
