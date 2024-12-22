import { Link } from "react-router-dom";

export function NavLinks() {
  return (
    <nav className="hidden md:flex items-center space-x-4">
      <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
        Home
      </Link>
      <Link to="/admin" className="text-sm font-medium transition-colors hover:text-primary">
        Admin
      </Link>
    </nav>
  );
}