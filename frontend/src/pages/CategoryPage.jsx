import PageHeader from '../components/PageHeader.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import { products } from '../data/products.js';

// Shared layout for the Men, Women and Kids pages.
export default function CategoryPage({ category, title, text }) {
  const items = products.filter((p) => p.category === category);

  return (
    <>
      <PageHeader title={title} text={text} />
      <section className="page-content">
        <div className="container">
          <p className="result-count">{items.length} products</p>
          <ProductGrid products={items} />
        </div>
      </section>
    </>
  );
}
