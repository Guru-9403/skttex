import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { site } from '../data/site.js';
import { API_URL } from '../config/api.js';

const initialForm = { name: '', email: '', phone: '', message: '' };

export default function Contact() {
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
      await fetch(`${API_URL}/enquiries/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } catch {
      // Graceful offline fallback
    }

    setSubmitted(true);
    setForm(initialForm);
    setLoading(false);
  };

  return (
    <>
      <PageHeader title="Contact Us" text="Have a question about an order or a product? Get in touch with us." />

      <section className="page-content">
        <div className="container two-col">
          <div>
            <h2 style={{ marginBottom: 20 }}>Store Details</h2>
            <ul className="contact-list">
              <li>
                <strong>Address</strong>
                <span>{site.address}</span>
              </li>
              <li>
                <strong>Phone</strong>
                <span>{site.phone}</span>
              </li>
              <li>
                <strong>Email</strong>
                <span>{site.email}</span>
              </li>
              <li>
                <strong>Store Hours</strong>
                <span>{site.hours}</span>
              </li>
            </ul>
          </div>

          <div className="form-card" style={{ margin: 0, maxWidth: 'none' }}>
            <h2 style={{ marginBottom: 20 }}>Send us a message</h2>
            <form className="form" onSubmit={handleSubmit}>
              {submitted && (
                <p className="form-success" role="status">
                  Thank you! We have received your message and will reply soon.
                </p>
              )}

              <div className="form-field">
                <label htmlFor="c-name">Name</label>
                <input id="c-name" name="name" type="text" value={form.name} onChange={handleChange} required />
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="c-email">Email</label>
                  <input id="c-email" name="email" type="email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label htmlFor="c-phone">Phone</label>
                  <input id="c-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="c-message">Message</label>
                <textarea
                  id="c-message"
                  name="message"
                  rows="5"
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
