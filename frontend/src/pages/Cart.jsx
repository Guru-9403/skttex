import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { TrashIcon } from '../components/Icons.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/format.js';

export default function Cart() {
  const { lines, subtotal, shipping, total, changeQty, removeItem } = useCart();
  const items = lines;

  return (
    <>
      <PageHeader title="Shopping Cart" />

      <section className="page-content">
        <div className="container">
          {items.length === 0 ? (
            <div className="empty-state">
              <p>Your cart is empty.</p>
              <Link to="/products" className="btn btn-primary">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div>
                {items.map((item) => {
                  const product = item.product;
                  return (
                    <div className="cart-item" key={`${item.productId}-${item.size}-${item.colorIndex}`}>
                      <Link to={`/product/${product.id}`}>
                        <ProductImage product={product} />
                      </Link>

                      <div className="cart-item-info">
                        <h3>
                          <Link to={`/product/${product.id}`}>{product.name}</Link>
                        </h3>
                        <p className="cart-item-meta">
                          Size: {item.size} · Colour: {product.colors[item.colorIndex].name}
                        </p>
                        <div className="qty-box">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => changeQty(item, -1)}
                          >
                            −
                          </button>
                          <span>{item.qty}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => changeQty(item, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-side">
                        <span className="cart-item-price">{formatPrice(product.price * item.qty)}</span>
                        <button type="button" className="remove-btn" onClick={() => removeItem(item)}>
                          <TrashIcon size={16} /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}

                <p style={{ marginTop: 20 }}>
                  <Link to="/products" className="section-link">
                    ← Continue shopping
                  </Link>
                </p>
              </div>

              <aside className="summary-card">
                <h2>Order Summary</h2>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <Link to="/checkout" className="btn btn-primary btn-block">
                  Proceed to Checkout
                </Link>
                <p className="summary-note">
                  🔒 100% Safe UPI Payment &bull; Fast Doorstep Delivery
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
