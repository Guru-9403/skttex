import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container center-block">
      <h1>Page not found</h1>
      <p>Sorry, we could not find the page you were looking for.</p>
      <Link to="/" className="btn btn-primary">
        Go to Home
      </Link>
    </div>
  );
}
