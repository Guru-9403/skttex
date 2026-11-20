// Product image component: shows actual product photo with tinted fallback.
export default function ProductImage({ product, className = '' }) {
  if (product && product.image) {
    return (
      <div className={`product-image ${className}`} style={{ backgroundColor: product.tint || '#f8f4ef' }}>
        <img
          src={product.image}
          alt={product.name || 'Product'}
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
            if (e.target.parentNode) {
              e.target.parentNode.classList.add('product-image-fallback');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={`product-image product-image-fallback ${className}`} style={{ backgroundColor: product?.tint || '#f8f4ef' }}>
      <span className="product-image-type">{product?.type || 'Clothing'}</span>
      <span className="product-image-note">Product image</span>
    </div>
  );
}
