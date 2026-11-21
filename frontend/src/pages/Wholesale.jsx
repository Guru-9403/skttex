import PageHeader from '../components/PageHeader.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import WholesaleForm from '../components/WholesaleForm.jsx';

const buyerTypes = [
  {
    title: 'Retailers',
    text: 'Stock your clothing shop with ready designs in regular sizes. Repeat orders are easy once you have picked your best sellers.',
  },
  {
    title: 'Boutiques',
    text: 'Choose from sarees, kurtis, suits and kids ethnic wear. Smaller quantities per design are fine for boutique buyers.',
  },
  {
    title: 'Resellers',
    text: 'Selling online or through WhatsApp groups? Get good rates on bulk quantities and a steady supply of new designs.',
  },
];

const priceSlabs = [
  { qty: '20 – 49 pieces', discount: 'Up to 10% off' },
  { qty: '50 – 99 pieces', discount: 'Up to 15% off' },
  { qty: '100 – 299 pieces', discount: 'Up to 20% off' },
  { qty: '300+ pieces', discount: 'Special rates on request' },
];

const steps = [
  { title: 'Send an enquiry', text: 'Fill in the form below with what you need and your approximate quantity.' },
  { title: 'Get a quote', text: 'Our team calls or messages you with designs, rates and available sizes.' },
  { title: 'Confirm and pay', text: 'Confirm your order and finalise the payment details with us.' },
  { title: 'We dispatch', text: 'Your order is packed and sent to your city by transport or courier.' },
];

export default function Wholesale() {
  return (
    <>
      <PageHeader
        title="Wholesale"
        text="Bulk clothing supply for retailers, boutiques and resellers across India."
      />

      {/* Introduction */}
      <section className="section">
        <div className="container two-col">
          <div>
            <h2>Supplying clothing businesses</h2>
            <div className="about-text" style={{ marginTop: 14 }}>
              <p>
                Along with our retail store, we supply men's, women's and kids' clothing in bulk.
                Whether you run a small shop or sell online, you can buy directly from us at
                wholesale rates.
              </p>
              <p>
                We keep regular stock of popular designs and add new collections every month, so
                you always have something fresh to offer your customers.
              </p>
            </div>
          </div>
          <div className="wholesale-points">
            <ul className="check-list">
              <li>Minimum order: 20 pieces per design, or 50 pieces mixed</li>
              <li>Mixed size and colour sets available</li>
              <li>Ready stock and made-to-order options</li>
              <li>Transport or courier dispatch to your city</li>
              <li>GST invoice on all orders</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Who we serve */}
      <section className="section section-soft">
        <div className="container">
          <SectionHeading title="Who We Work With" />
          <div className="info-grid">
            {buyerTypes.map((type) => (
              <div className="info-card" key={type.title}>
                <h3>{type.title}</h3>
                <p>{type.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bulk order info */}
      <section className="section">
        <div className="container two-col">
          <div>
            <SectionHeading title="Bulk Order Rates" />
            <div className="table-wrap">
              <table className="price-table">
                <thead>
                  <tr>
                    <th>Order quantity</th>
                    <th>Wholesale discount</th>
                  </tr>
                </thead>
                <tbody>
                  {priceSlabs.map((slab) => (
                    <tr key={slab.qty}>
                      <td>{slab.qty}</td>
                      <td>{slab.discount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="details-note" style={{ marginTop: 10 }}>
              Discounts are on the retail price and may vary by product category.
            </p>
          </div>

          <div>
            <SectionHeading title="How It Works" />
            <ol className="steps">
              {steps.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>
                  <span>{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Enquiry form */}
      <section className="section section-soft" id="enquiry">
        <div className="container">
          <SectionHeading
            title="Wholesale Enquiry"
            subtitle="Fill in your details and we will get back to you within one working day."
          />
          <div className="form-card">
            <WholesaleForm />
          </div>
        </div>
      </section>
    </>
  );
}
