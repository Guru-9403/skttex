import { useState } from 'react';

const initialForm = {
  name: '',
  business: '',
  phone: '',
  email: '',
  city: '',
  category: '',
  quantity: '',
  message: '',
};

// UI only: the form does not send data anywhere yet.
export default function WholesaleForm() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setForm(initialForm);
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
            name="business"
            type="text"
            value={form.business}
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
          <select id="ws-category" name="category" value={form.category} onChange={handleChange} required>
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
        <label htmlFor="ws-message">Message</label>
        <textarea
          id="ws-message"
          name="message"
          rows="4"
          placeholder="Tell us what you are looking for – fabrics, sizes, budget, etc."
          value={form.message}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Send Enquiry
      </button>
    </form>
  );
}
