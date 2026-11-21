import { Link } from 'react-router-dom';
import SectionHeading from '../components/SectionHeading.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import { useProducts } from '../data/products.js';

const heroImg = new URL('../assets/img/Girls Lehenga Choli.jpg', import.meta.url).href;

const categoryTiles = [
  { name: "Men's Wear", note: 'Kurtas, shirts, jackets', to: '/men', tint: '#f8edf0' },
  { name: "Women's Wear", note: 'Kurtis, suits, dupattas', to: '/women', tint: '#fae4eb' },
  { name: "Kids' Wear", note: 'Ethnic sets, frocks, tees', to: '/kids', tint: '#fbeff3' },
  { name: 'Sarees', note: 'Silk, cotton, georgette', to: '/products?type=Saree', tint: '#f5e4ea' },
];

const reasons = [
  {
    title: 'Quality Fabrics',
    text: 'We pick cotton, linen, silk and rayon that feel good and last through regular washing.',
  },
  {
    title: 'Fair Prices',
    text: 'Direct sourcing from manufacturers keeps our retail prices affordable with unbeatable value.',
  },
  {
    title: 'Easy Returns',
    text: 'Wrong size or damaged piece? Retail orders can be exchanged within 7 days.',
  },
  {
    title: 'Delivery Across India',
    text: 'We ship to all major cities and towns, with free shipping on orders above ₹1,999.',
  },
];

export default function Home() {
  const allProducts = useProducts();
  const featured = (allProducts.filter((p) => p.featured).length > 0
    ? allProducts.filter((p) => p.featured)
    : allProducts
  ).slice(0, 8);
  const newArrivals = (allProducts.filter((p) => p.isNew).length > 0
    ? allProducts.filter((p) => p.isNew)
    : allProducts
  ).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="hero-eyebrow">Festive Collection 2026</p>
            <h1>Clothing for the whole family, for every occasion</h1>
            <p>
              From everyday cotton kurtas to wedding-season sarees, find quality ethnic and casual
              wear for men, women and kids at honest prices.
            </p>
            <div className="hero-buttons">
              <Link to="/products" className="btn btn-primary">
                Shop Now
              </Link>
              <Link to="/women" className="btn btn-outline">
                Explore Collection
              </Link>
            </div>
          </div>
          <div className="hero-image"><img src={heroImg} alt="Festive collection" /></div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <SectionHeading title="Shop by Category" />
          <div className="category-grid">
            {categoryTiles.map((tile) => (
              <Link
                key={tile.name}
                to={tile.to}
                className="category-card"
                style={{ backgroundColor: tile.tint }}
              >
                <h3>{tile.name}</h3>
                <span>{tile.note}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="section section-soft">
        <div className="container">
          <SectionHeading
            title="Featured Products"
            subtitle="Our most popular pieces this season"
            linkText="View all"
            linkTo="/products"
          />
          <ProductGrid products={featured} />
        </div>
      </section>

      {/* New arrivals */}
      <section className="section">
        <div className="container">
          <SectionHeading
            title="New Arrivals"
            subtitle="Just added to the store"
            linkText="View all"
            linkTo="/products"
          />
          <ProductGrid products={newArrivals} />
        </div>
      </section>

      {/* Retail Benefits Banner */}
      <section className="section section-soft">
        <div className="container wholesale-banner">
          <div>
            <h2>Direct Manufacturer Prices. Unbeatable Value.</h2>
            <p>
              Shop fashion for the entire family at direct-from-weaver retail prices.
              Affordable daily wear, festive collections, and simple UPI checkout with fast doorstep delivery.
            </p>
            <Link to="/products" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
          <div className="wholesale-points">
            <ul className="check-list">
              <li>Direct manufacturer pricing on all items</li>
              <li>100% Quality inspected fabrics</li>
              <li>Instant, secure UPI payment</li>
              <li>Reliable doorstep delivery across India</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="section">
        <div className="container">
          <SectionHeading title="Why Choose Us" />
          <div className="feature-grid">
            {reasons.map((reason) => (
              <div className="feature" key={reason.title}>
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
