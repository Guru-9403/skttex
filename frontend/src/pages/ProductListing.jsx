import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import { products, categories } from '../data/products.js';

export default function ProductListing() {
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('featured');

  const category = params.get('category') || 'All';
  const type = params.get('type');
  const query = (params.get('q') || '').trim();

  let list = products.filter((p) => {
    const matchCategory = category === 'All' || p.category === category;
    const matchType = !type || p.type === type;
    const matchQuery =
      !query || `${p.name} ${p.type} ${p.category}`.toLowerCase().includes(query.toLowerCase());
    return matchCategory && matchType && matchQuery;
  });

  list = [...list];
  if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') list.sort((a, b) => b.price - a.price);

  const changeCategory = (name) => {
    const next = new URLSearchParams(params);
    if (name === 'All') next.delete('category');
    else next.set('category', name);
    next.delete('type');
    setParams(next);
  };

  let title = 'All Products';
  if (query) title = `Search results for "${query}"`;
  else if (type) title = `${type} Collection`;
  else if (category !== 'All') title = `${category} Products`;

  return (
    <>
      <PageHeader title={title} text="Browse our full range of clothing for men, women and kids." />

      <section className="page-content">
        <div className="container">
          <div className="listing-toolbar">
            <div className="filter-chips">
              {['All', ...categories].map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`chip ${category === name ? 'active' : ''}`}
                  onClick={() => changeCategory(name)}
                >
                  {name}
                </button>
              ))}
            </div>

            <div className="sort-box">
              <label htmlFor="sort">Sort by</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          <p className="result-count">{list.length} products</p>

          {list.length > 0 ? (
            <ProductGrid products={list} />
          ) : (
            <div className="empty-state">
              <p>No products found.</p>
              <Link to="/products" className="btn btn-outline">
                View all products
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
