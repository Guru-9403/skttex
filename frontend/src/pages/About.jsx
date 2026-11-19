import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import SectionHeading from '../components/SectionHeading.jsx';

const stats = [
  { value: '15+', label: 'Years in business' },
  { value: '500+', label: 'Designs in stock' },
  { value: '1,000+', label: 'Wholesale buyers' },
  { value: '25+', label: 'States delivered to' },
];

const values = [
  {
    title: 'Honest quality',
    text: 'We check fabric and stitching before anything goes on the shelf, and we describe our products as they are.',
  },
  {
    title: 'Fair pricing',
    text: 'Buying directly from manufacturers lets us keep prices reasonable for both retail and wholesale customers.',
  },
  {
    title: 'Long-term relationships',
    text: 'Many of our wholesale buyers have been ordering from us for years. We aim to earn that trust on every order.',
  },
];

export default function About() {
  return (
    <>
      <PageHeader title="About Us" text="A family-run clothing business serving customers across India." />

      <section className="section">
        <div className="container two-col">
          <div className="about-image">Store / team photo</div>
          <div className="about-text">
            <h2 style={{ marginBottom: 14 }}>Our Story</h2>
            <p>
              Sree Kavinya Tex started as a small clothing shop and has grown into a trusted name for
              family clothing. We sell kurtas, sarees, kurtis, shirts and kids' wear for everyday
              use and festive occasions.
            </p>
            <p>
              Today we serve both individual customers and clothing businesses. Retail customers
              can shop for their families, and shop owners, boutiques and resellers can buy in
              bulk at wholesale rates.
            </p>
            <p>
              Our goal is simple: good clothes, fair prices and honest service.
            </p>
            <Link to="/contact" className="btn btn-primary" style={{ marginTop: 8 }}>
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container stats-grid">
          {stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading title="What We Believe In" />
          <div className="info-grid">
            {values.map((item) => (
              <div className="info-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
