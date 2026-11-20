import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/format.js';

export default function OrderSuccess() {
  const { id } = useParams();
  const { orders } = useCart();
  const order = orders.find((o) => o.id === id);

  return (
    <>
      <PageHeader title="Order placed" />
      <section className="page-content">
        <div className="container empty-state">
          {order ? (
            <>
              <h2>Thank you, {order.customer.name}! 🎉</h2>
              <p>Order <strong>{order.id}</strong> · {formatPrice(order.total)} via UPI (UTR {order.payment.utr})</p>
              <p>We will verify your payment and confirm delivery to {order.customer.address}, {order.customer.city} – {order.customer.pincode}.</p>
            </>
          ) : (
            <p>Order not found on this device.</p>
          )}
          <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
        </div>
      </section>
    </>
  );
}
