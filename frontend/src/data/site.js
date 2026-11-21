// Basic store details used in the navbar, footer and contact page.
export const site = {
  name: 'Sree Kavinya Tex',
  tagline: 'Clothing Co.',
  phone: '+91 98765 43210',
  email: 'hello@sreekavinyatex.example',
  address: 'Erode, Tamil Nadu 638003',
  hours: 'Mon – Sat, 10:00 AM – 8:00 PM',
};

export const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Men', to: '/men' },
  { label: 'Women', to: '/women' },
  { label: 'Kids', to: '/kids' },
  { label: 'Wholesale', to: '/wholesale' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

// ---- UPI payment settings ----
// CHANGE THESE to your real shop UPI ID and name before going live.
export const payment = {
  upiId: 'guruprasath.k1212@ybl',
  payeeName: 'Sree Kavinya Tex',
};
