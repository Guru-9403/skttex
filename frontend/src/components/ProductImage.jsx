// Product image component: shows actual product photo with tinted fallback.
export default function ProductImage({ product, className = '' }) {
  if (product.image) {
    return (
      <div className={`product-image ${className}`} style={{ backgroundColor: product.tint }}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.classList.add('product-image-fallback');
          }}
        />
      </div>
    );
  }

  // Fallback when no image URL is set
  return (
    <div className={`product-image product-image-fallback ${className}`} style={{ backgroundColor: product.tint }}>
      <span className="product-image-type">{product.type}</span>
      <span className="product-image-note">Product image</span>
    </div>
  );
}
