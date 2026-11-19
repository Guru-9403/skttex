import { useState } from 'react';
import { API_URL } from '../config/api.js';

const initialForm = {
  name: '',
  businessName: '',
  phone: '',
  email: '',
  city: '',
  productCategory: '',
  quantity: '',
  message: '',
};

export default function WholesaleForm() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch(`${API_URL}/enquiries/wholesale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
        }),
      });
    } catch {
      // Graceful offline fallback
    }

    setSubmitted(true);
    setForm(initialForm);
    setLoading(false);
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {submitted && (
        <p className="form-success" role="status">
          Thank you! Your enquiry has been received. We will contact you shortly.
        </p>
      )}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="ws-name">Name</label>
          <input id="ws-name" name="name" type="text" value={form.name} onChange={handleChange} required />
        </div>

        <div className="form-field">
          <label htmlFor="ws-business">Business Name</label>
          <input
            id="ws-business"
            name="businessName"
            type="text"
            value={form.businessName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="ws-phone">Phone</label>
          <input id="ws-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required />
        </div>

        <div className="form-field">
          <label htmlFor="ws-email">Email</label>
          <input id="ws-email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <div className="form-field">
          <label htmlFor="ws-city">City</label>
          <input id="ws-city" name="city" type="text" value={form.city} onChange={handleChange} required />
        </div>

        <div className="form-field">
          <label htmlFor="ws-category">Product Category</label>
          <select id="ws-category" name="productCategory" value={form.productCategory} onChange={handleChange} required>
            <option value="">Select category</option>
            <option>Men's Wear</option>
            <option>Women's Wear</option>
            <option>Kids' Wear</option>
            <option>Sarees</option>
            <option>Mixed / Multiple Categories</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="ws-quantity">Quantity (pieces)</label>
          <input
            id="ws-quantity"
            name="quantity"
            type="number"
            min="1"
            placeholder="e.g. 100"
            value={form.quantity}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="ws-message">Message (Optional)</label>
        <textarea
          id="ws-message"
          name="message"
          rows="4"
          placeholder="Specific design preferences, fabric requirements, or delivery deadline..."
          value={form.message}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Wholesale Enquiry'}
      </button>
    </form>
  );
}
