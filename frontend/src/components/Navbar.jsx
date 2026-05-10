import { FiShoppingCart, FiSearch } from "react-icons/fi";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { clearTokens, getAccessToken } from "../utils/auth.js";
import { useEffect, useState } from "react";

function Navbar() {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const isLoggedIn = !!getAccessToken();

  const handleLogout = () => {
    clearTokens();
    clearCart();
    navigate("/login");
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (category) =>
    location.search.includes(`category=${category}`);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") {
      navigate(`/products?search=${searchTerm}`);
      setSearchTerm("");
    }
  };

  return (
    <nav
      className={`fixed w-full top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white shadow-md py-3"
          : "bg-white py-6"
      } border-b border-gray-100`}
    >
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">

        {/* LEFT - LOGO */}
        <Link to="/" className="group">
          <h1 className="text-3xl font-extrabold tracking-wide transition-all duration-300 group-hover:scale-105">
            <span className="text-black">Fashion</span>
            <span className="text-pink-600 group-hover:text-pink-700 transition duration-300">
              Hub
            </span>
          </h1>
        </Link>

        {/* CENTER - CATEGORIES */}
        <div className="hidden md:flex items-center gap-10 text-lg font-medium">
          {["men", "women", "kids"].map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${cat}`}
              className={`relative capitalize transition-all duration-300 pb-1 ${
                isActive(cat)
                  ? "text-pink-600 font-semibold"
                  : "text-gray-800 hover:text-pink-600"
              }`}
            >
              {cat}
              <span
                className={`absolute left-0 -bottom-1 h-[2px] bg-pink-600 transition-all duration-300 ${
                  isActive(cat)
                    ? "w-full"
                    : "w-0 group-hover:w-full"
                }`}
              ></span>
            </Link>
          ))}
        </div>

        {/* SEARCH BAR */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-full overflow-hidden w-[400px] lg:w-[500px] transition duration-300 focus-within:border-pink-500 focus-within:shadow-md"
        >
          <input
            type="text"
            placeholder="Search for products, brands and more..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-6 py-3 bg-transparent outline-none text-gray-700"
          />
          <button
            type="submit"
            className="px-5 text-gray-600 hover:text-pink-600 transition duration-300"
          >
            <FiSearch size={20} />
          </button>
        </form>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-6">

          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="relative font-medium text-gray-800 hover:text-pink-600 transition duration-300"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-full font-semibold shadow-sm hover:shadow-md transition duration-300 hover:scale-105"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="font-medium text-gray-800 hover:text-pink-600 transition duration-300"
            >
              Logout
            </button>
          )}

          {/* CART */}
          <Link
            to="/cart"
            className="relative p-2 text-gray-800 text-2xl hover:text-pink-600 transition duration-300"
          >
            <FiShoppingCart />

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;