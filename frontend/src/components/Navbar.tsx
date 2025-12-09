import { Link, NavLink } from "react-router-dom";

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "text-white" : "text-neutral-400 hover:text-white";

export default function Navbar() {
  return (
    <header className="border-b border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-extrabold tracking-wider text-lg">
          PFM Barbershop
        </Link>
        <nav className="flex gap-4 text-sm">
          <NavLink to="/" className={navClass}>Home</NavLink>
          <NavLink to="/booking" className={navClass}>Booking</NavLink>
          <NavLink to="/promotions" className={navClass}>Promotions</NavLink>
          <NavLink to="/reviews" className={navClass}>Reviews</NavLink>
        </nav>
      </div>
    </header>
  );
}
