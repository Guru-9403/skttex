import { Link } from 'react-router-dom';

export default function SectionHeading({ title, subtitle, linkText, linkTo }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {linkText && linkTo && (
        <Link to={linkTo} className="section-link">
          {linkText} →
        </Link>
      )}
    </div>
  );
}
