import { useState, useEffect } from 'react';
import { API_URL } from '../config/api.js';

const getImg = (name) => new URL(`../assets/img/${name}`, import.meta.url).href;
// Sample product data. Images are placeholders (a tinted block with the product type).
// Later this can be replaced with data from an API / database.

const defaultProducts = [
  // ---------- Men ----------
  {
    id: 1,
    image: getImg('Cotton Straight Kurta.jpg'),
    name: 'Cotton Straight Kurta',
    category: 'Men',
    type: 'Kurta',
    price: 899,
    oldPrice: 1199,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Off White', hex: '#f1ede3' },
      { name: 'Sky Blue', hex: '#9cc3de' },
      { name: 'Mustard', hex: '#d4a62a' },
    ],
    tint: '#e8e2d3',
    fabric: '100% Cotton',
    isNew: false,
    featured: true,
    description:
      'A soft, breathable cotton kurta with a mandarin collar and side slits. Good for daily wear, pujas and family functions.',
  },
  {
    id: 2,
    image: getImg('Linen Blend Casual Shirt.jpg'),
    name: 'Linen Blend Casual Shirt',
    category: 'Men',
    type: 'Shirt',
    price: 1199,
    oldPrice: 1499,
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Beige', hex: '#d9c7a5' },
      { name: 'Olive', hex: '#7b7f4b' },
      { name: 'Navy', hex: '#27375a' },
    ],
    tint: '#dfe3d5',
    fabric: 'Linen Cotton Blend',
    isNew: false,
    featured: true,
    description:
      'Full sleeve regular-fit shirt in a light linen blend. Stays comfortable in hot weather and looks neat for office or outings.',
  },
  {
    id: 3,
    image: getImg('Silk Blend Nehru Jacket.webp'),
    name: 'Silk Blend Nehru Jacket',
    category: 'Men',
    type: 'Jacket',
    price: 2499,
    oldPrice: null,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Maroon', hex: '#7a1f2b' },
      { name: 'Black', hex: '#222222' },
      { name: 'Royal Blue', hex: '#2c4a9a' },
    ],
    tint: '#e6d4d6',
    fabric: 'Silk Blend',
    isNew: true,
    featured: false,
    description:
      'Sleeveless Nehru jacket with a self-woven texture. Wear it over a kurta for weddings and festive occasions.',
  },
  {
    id: 4,
    image: getImg('Slim Fit Cotton Chinos.jpg'),
    name: 'Slim Fit Cotton Chinos',
    category: 'Men',
    type: 'Trousers',
    price: 1099,
    oldPrice: null,
    sizes: ['28', '30', '32', '34', '36'],
    colors: [
      { name: 'Khaki', hex: '#b8a37a' },
      { name: 'Grey', hex: '#8a8d91' },
      { name: 'Black', hex: '#222222' },
    ],
    tint: '#e4e0d6',
    fabric: 'Stretch Cotton',
    isNew: false,
    featured: false,
    description:
      'Everyday chinos with a little stretch for comfort. Mid-rise, slim fit, with two side pockets and two back pockets.',
  },
  {
    id: 5,
    image: getImg('Pathani Kurta Pyjama Set.jpg'),
    name: 'Pathani Kurta Pyjama Set',
    category: 'Men',
    type: 'Ethnic Set',
    price: 1799,
    oldPrice: 2299,
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'White', hex: '#f5f3ee' },
      { name: 'Cream', hex: '#eadfc4' },
      { name: 'Charcoal', hex: '#4a4d52' },
    ],
    tint: '#e9e6df',
    fabric: 'Cotton Blend',
    isNew: false,
    featured: true,
    description:
      'Two-piece Pathani set with a relaxed fit kurta and matching pyjama. A good pick for Eid, weddings and festive gatherings.',
  },

  // ---------- Women ----------
  {
    id: 6,
    image: getImg('Chanderi Silk Saree.webp'),
    name: 'Chanderi Silk Saree',
    category: 'Women',
    type: 'Saree',
    price: 3499,
    oldPrice: 3999,
    sizes: ['Free Size'],
    colors: [
      { name: 'Teal', hex: '#1f7a7a' },
      { name: 'Pink', hex: '#d9718f' },
      { name: 'Gold', hex: '#c9a227' },
    ],
    tint: '#d6e5e3',
    fabric: 'Chanderi Silk',
    isNew: false,
    featured: true,
    description:
      'Light Chanderi saree with a woven zari border and a matching blouse piece. Comes with a 5.5 m saree length and 0.8 m blouse piece.',
  },
  {
    id: 7,
    image: getImg('Cotton Anarkali Kurti.webp'),
    name: 'Cotton Anarkali Kurti',
    category: 'Women',
    type: 'Kurti',
    price: 1299,
    oldPrice: 1599,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Indigo', hex: '#2f3e7e' },
      { name: 'Rust', hex: '#b5522d' },
      { name: 'Green', hex: '#3f7d58' },
    ],
    tint: '#dfe2ee',
    fabric: 'Pure Cotton',
    isNew: false,
    featured: true,
    description:
      'Flared Anarkali kurti with a block-print yoke and three-quarter sleeves. Soft cotton that is easy to wash and wear.',
  },
  {
    id: 8,
    image: getImg('Rayon Printed Straight Kurti.jpg'),
    name: 'Rayon Printed Straight Kurti',
    category: 'Women',
    type: 'Kurti',
    price: 799,
    oldPrice: null,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    colors: [
      { name: 'Blue', hex: '#3d6fa8' },
      { name: 'Maroon', hex: '#7a1f2b' },
      { name: 'Black', hex: '#222222' },
    ],
    tint: '#e3e8f0',
    fabric: 'Rayon',
    isNew: false,
    featured: false,
    description:
      'Simple printed straight kurti with a round neck. Light on the skin and a good everyday option for work or college.',
  },
  {
    id: 9,
    image: getImg('Kurta with Palazzo Set.jpg'),
    name: 'Kurta with Palazzo Set',
    category: 'Women',
    type: 'Kurta Set',
    price: 1599,
    oldPrice: 1999,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Mustard', hex: '#d4a62a' },
      { name: 'Pink', hex: '#d9718f' },
      { name: 'Sea Green', hex: '#4a9a85' },
    ],
    tint: '#f0e6c8',
    fabric: 'Cotton Silk',
    isNew: true,
    featured: true,
    description:
      'Two-piece set with an embroidered kurta and flared palazzo. Comfortable fit that works for both festivals and office wear.',
  },
  {
    id: 10,
    image: getImg('Georgette Party Wear Saree.webp'),
    name: 'Georgette Party Wear Saree',
    category: 'Women',
    type: 'Saree',
    price: 2299,
    oldPrice: 2899,
    sizes: ['Free Size'],
    colors: [
      { name: 'Wine', hex: '#6d1f3a' },
      { name: 'Navy', hex: '#27375a' },
      { name: 'Peach', hex: '#e8a78c' },
    ],
    tint: '#ecd9dc',
    fabric: 'Georgette',
    isNew: false,
    featured: true,
    description:
      'Flowy georgette saree with sequin work on the border. Includes an unstitched blouse piece.',
  },
  {
    id: 11,
    image: getImg('Block Print Cotton Dupatta.jpg'),
    name: 'Block Print Cotton Dupatta',
    category: 'Women',
    type: 'Dupatta',
    price: 599,
    oldPrice: null,
    sizes: ['Free Size'],
    colors: [
      { name: 'Red', hex: '#b5322d' },
      { name: 'Indigo', hex: '#2f3e7e' },
      { name: 'Yellow', hex: '#e0b93a' },
    ],
    tint: '#efdcd5',
    fabric: 'Cotton Mulmul',
    isNew: true,
    featured: false,
    description:
      'Hand block printed cotton dupatta, 2.25 m long. Goes well with plain kurtis and suits.',
  },
  {
    id: 12,
    image: getImg('Embroidered Cotton Salwar Suit.jpg'),
    name: 'Embroidered Cotton Salwar Suit',
    category: 'Women',
    type: 'Salwar Suit',
    price: 1999,
    oldPrice: 2499,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Turquoise', hex: '#2c9aa3' },
      { name: 'Lavender', hex: '#a592c9' },
      { name: 'Coral', hex: '#e0705a' },
    ],
    tint: '#dcecec',
    fabric: 'Cotton',
    isNew: true,
    featured: false,
    description:
      'Three-piece salwar suit with neck embroidery, a plain bottom and a printed dupatta. Available in semi-stitched sizes.',
  },

  // ---------- Kids ----------
  {
    id: 13,
    image: getImg('Boys Kurta Pyjama Set.jpg'),
    name: 'Boys Kurta Pyjama Set',
    category: 'Kids',
    type: 'Ethnic Set',
    price: 999,
    oldPrice: 1299,
    sizes: ['2-3 Y', '4-5 Y', '6-7 Y', '8-9 Y', '10-11 Y'],
    colors: [
      { name: 'Cream', hex: '#eadfc4' },
      { name: 'Blue', hex: '#5f8fc4' },
      { name: 'Maroon', hex: '#7a1f2b' },
    ],
    tint: '#e8e1cf',
    fabric: 'Cotton',
    isNew: false,
    featured: false,
    description:
      'Soft cotton kurta pyjama set for boys with an elastic waist pyjama. Easy to wear for festivals and family events.',
  },
  {
    id: 14,
    image: getImg('Girls Cotton Frock.jpg'),
    name: 'Girls Cotton Frock',
    category: 'Kids',
    type: 'Frock',
    price: 749,
    oldPrice: null,
    sizes: ['2-3 Y', '4-5 Y', '6-7 Y', '8-9 Y'],
    colors: [
      { name: 'Pink', hex: '#e58aa3' },
      { name: 'Yellow', hex: '#ecc94b' },
      { name: 'Sky Blue', hex: '#8fbfe0' },
    ],
    tint: '#f2dce3',
    fabric: 'Cotton',
    isNew: false,
    featured: false,
    description:
      'Printed cotton frock with a gathered skirt and short sleeves. Comfortable for the whole day.',
  },
  {
    id: 15,
    image: getImg('Girls Lehenga Choli.jpg'),
    name: 'Girls Lehenga Choli',
    category: 'Kids',
    type: 'Lehenga',
    price: 1499,
    oldPrice: 1899,
    sizes: ['3-4 Y', '5-6 Y', '7-8 Y', '9-10 Y', '11-12 Y'],
    colors: [
      { name: 'Pink', hex: '#d9718f' },
      { name: 'Orange', hex: '#e0813a' },
      { name: 'Green', hex: '#3f7d58' },
    ],
    tint: '#f0d6dd',
    fabric: 'Cotton Silk',
    isNew: false,
    featured: true,
    description:
      'Three-piece lehenga set with choli and dupatta. Lined inside so it is soft on the skin.',
  },
  {
    id: 16,
    image: getImg('Kids Cotton T-Shirt.webp'),
    name: 'Kids Cotton T-Shirt (Pack of 2)',
    category: 'Kids',
    type: 'T-Shirt',
    price: 599,
    oldPrice: 799,
    sizes: ['2-3 Y', '4-5 Y', '6-7 Y', '8-9 Y', '10-11 Y'],
    colors: [
      { name: 'Red', hex: '#c0392b' },
      { name: 'Blue', hex: '#3d6fa8' },
      { name: 'Grey', hex: '#9a9da1' },
    ],
    tint: '#dde6ef',
    fabric: 'Combed Cotton',
    isNew: true,
    featured: false,
    description:
      'Pack of two round neck t-shirts in assorted prints. Pre-washed cotton that stays soft after many washes.',
  },
];

export const categories = ['Men', 'Women', 'Kids'];

let liveApiProducts = [];
let isLiveApiLoaded = false;

function getDeletedItems() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem('skt_deleted_items');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr.map((s) => String(s).toLowerCase().trim()));
      }
    }
  } catch (_) {}
  return new Set();
}

function isDeleted(product, deletedSet) {
  if (!product || deletedSet.size === 0) return false;
  if (product.id && deletedSet.has(String(product.id).toLowerCase().trim())) return true;
  if (product.itemCode && deletedSet.has(String(product.itemCode).toLowerCase().trim())) return true;
  if (product.name && deletedSet.has(product.name.toLowerCase().trim())) return true;
  return false;
}

export function getCustomProducts() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem('skt_custom_products');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    }
  } catch (e) {
    console.error('Error reading custom products', e);
  }
  return [];
}

export function saveCustomProduct(product) {
  try {
    const current = getCustomProducts();
    const idx = current.findIndex(
      (p) =>
        String(p.id) === String(product.id) ||
        (product.itemCode && p.itemCode === product.itemCode) ||
        (product.name && p.name?.toLowerCase() === product.name?.toLowerCase())
    );
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...product };
    } else {
      current.unshift(product);
    }

    // Also update in-memory liveApiProducts if present
    const liveIdx = liveApiProducts.findIndex(
      (p) =>
        String(p.id) === String(product.id) ||
        (product.itemCode && p.itemCode === product.itemCode) ||
        (product.name && p.name?.toLowerCase() === product.name?.toLowerCase())
    );
    if (liveIdx >= 0) {
      liveApiProducts[liveIdx] = { ...liveApiProducts[liveIdx], ...product };
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('skt_custom_products', JSON.stringify(current));

      // Remove from deleted list if it was re-added
      try {
        const rawDel = localStorage.getItem('skt_deleted_items');
        if (rawDel) {
          const arr = JSON.parse(rawDel);
          const cleaned = arr.filter(
            (val) =>
              val !== String(product.id)?.toLowerCase() &&
              val !== product.itemCode?.toLowerCase() &&
              val !== product.name?.toLowerCase()
          );
          localStorage.setItem('skt_deleted_items', JSON.stringify(cleaned));
        }
      } catch (_) {}

      window.dispatchEvent(new Event('productsUpdated'));
    }
    return current;
  } catch (e) {
    console.error('Error saving custom product', e);
  }
}

export function deleteCustomProduct(idOrCode, name) {
  try {
    const idStr = String(idOrCode || '').toLowerCase().trim();
    const nameStr = String(name || '').toLowerCase().trim();

    // Remove from custom products
    let current = getCustomProducts();
    current = current.filter(
      (p) =>
        String(p.id).toLowerCase().trim() !== idStr &&
        String(p.itemCode || '').toLowerCase().trim() !== idStr &&
        (!nameStr || p.name?.toLowerCase().trim() !== nameStr)
    );

    // Remove from in-memory live products
    liveApiProducts = liveApiProducts.filter(
      (p) =>
        String(p.id).toLowerCase().trim() !== idStr &&
        String(p.itemCode || '').toLowerCase().trim() !== idStr &&
        (!nameStr || p.name?.toLowerCase().trim() !== nameStr)
    );

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('skt_custom_products', JSON.stringify(current));

      // Also clean cached live products
      const cached = localStorage.getItem('skt_cached_live_products');
      if (cached) {
        try {
          const list = JSON.parse(cached);
          const updated = list.filter(
            (p) =>
              String(p.id).toLowerCase().trim() !== idStr &&
              String(p.itemCode || '').toLowerCase().trim() !== idStr &&
              (!nameStr || p.name?.toLowerCase().trim() !== nameStr)
          );
          localStorage.setItem('skt_cached_live_products', JSON.stringify(updated));
        } catch (_) {}
      }

      // Add to deleted items registry
      try {
        const raw = localStorage.getItem('skt_deleted_items');
        const list = raw ? JSON.parse(raw) : [];
        if (idStr && !list.includes(idStr)) list.push(idStr);
        if (nameStr && !list.includes(nameStr)) list.push(nameStr);
        localStorage.setItem('skt_deleted_items', JSON.stringify(list));
      } catch (_) {}

      window.dispatchEvent(new Event('productsUpdated'));
    }
    return current;
  } catch (e) {
    console.error('Error deleting product from client state', e);
  }
}

export async function fetchLiveProducts() {
  try {
    const res = await fetch(`${API_URL}/products?limit=100`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products)) {
        liveApiProducts = data.products;
        isLiveApiLoaded = true;
        if (typeof window !== 'undefined') {
          try {
            // Wipe any old custom products to ensure 100% exact sync with Admin Stock Management
            localStorage.removeItem('skt_custom_products');
            localStorage.setItem('skt_cached_live_products', JSON.stringify(liveApiProducts));
          } catch (_) {}
          window.dispatchEvent(new Event('productsUpdated'));
        }
      }
    }
  } catch (e) {
    // offline or backend sleeping
  }
}

// Load cached live products on startup if available
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    localStorage.removeItem('skt_custom_products');
    localStorage.removeItem('skt_products');
    const cached = localStorage.getItem('skt_cached_live_products');
    if (cached) {
      liveApiProducts = JSON.parse(cached);
      isLiveApiLoaded = true;
    }
  } catch (_) {}
  // Fetch fresh products from backend
  fetchLiveProducts();
}

export function getAllProducts() {
  const deleted = getDeletedItems();
  const live = liveApiProducts.filter((p) => !isDeleted(p, deleted));

  // Single Source of Truth: ONLY return live products originating from Admin Stock Management!
  return live;
}

export const products = new Proxy(defaultProducts, {
  get(target, prop) {
    const all = getAllProducts();
    if (prop === 'length') return all.length;
    if (typeof all[prop] === 'function') {
      return all[prop].bind(all);
    }
    return all[prop];
  },
});

export function useProducts() {
  const [items, setItems] = useState(() => getAllProducts());

  useEffect(() => {
    const handler = () => setItems(getAllProducts());
    window.addEventListener('productsUpdated', handler);
    fetchLiveProducts();
    return () => window.removeEventListener('productsUpdated', handler);
  }, []);

  return items;
}

export function getProductById(id) {
  return getAllProducts().find((p) => String(p.id) === String(id) || (p.itemCode && p.itemCode === id));
}
