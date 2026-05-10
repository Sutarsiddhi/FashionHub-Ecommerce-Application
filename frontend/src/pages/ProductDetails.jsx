import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

function ProductDetails() {
  const { id } = useParams();
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");

  const [isWishlisted, setIsWishlisted] = useState(false);

  const { addToCart } = useCart();

  // Wishlist logic
  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    setIsWishlisted(wishlist.includes(Number(id)));
  }, [id]);

  const toggleWishlist = () => {
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    if (wishlist.includes(product.id)) {
      wishlist = wishlist.filter((item) => item !== product.id);
      setIsWishlisted(false);
    } else {
      wishlist.push(product.id);
      setIsWishlisted(true);
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  };

  const handleAddToCart = () => {
    if (!localStorage.getItem("access_token")) {
      window.location.href = "/login";
      return;
    }

    addToCart(product.id, quantity, selectedSize);
  };

  useEffect(() => {
    fetch(`${BASEURL}/api/products/${id}/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch product details");
        }
        return response.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [id, BASEURL]);

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center pt-24">
        <p className="text-lg animate-pulse">Loading product...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex justify-center items-center pt-24">
        <p className="text-red-500">{error}</p>
      </div>
    );

  if (!product) return <div>No product found</div>;

  const discountPrice = (product.price * 0.9).toFixed(2);

  return (
    <div className="min-h-screen bg-neutral-100 pt-28 pb-20 px-6">

      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12">

        <div className="flex flex-col md:flex-row gap-14">

          {/* Product Image */}
          <div className="md:w-1/2 group relative">

            <span className="absolute top-4 left-4 bg-pink-600 text-white text-xs px-3 py-1 rounded-full shadow">
              10% OFF
            </span>

            <img
              src={product.image}
              alt={product.name}
              className="w-full h-[500px] object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Product Details */}
          <div className="flex-1 flex flex-col justify-between">

            <div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center text-yellow-500 mb-4">
                ⭐⭐⭐⭐☆
                <span className="text-gray-500 text-sm ml-2">(4.2 Reviews)</span>
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Price */}
              <div className="flex items-center gap-4 mb-8">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{discountPrice}
                </span>

                <span className="text-gray-400 line-through text-lg">
                  ₹{product.price}
                </span>
              </div>

              {/* Size */}
              <div className="mb-8">
                <h3 className="font-semibold mb-3 text-gray-800">
                  Select Size
                </h3>

                <div className="flex gap-3">
                  {["S", "M", "L", "XL"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2 rounded-lg border transition ${
                        selectedSize === size
                          ? "bg-pink-600 text-white border-pink-600 shadow"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-8">
                <h3 className="font-semibold mb-3 text-gray-800">
                  Quantity
                </h3>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    className="px-3 py-1 border rounded"
                  >
                    -
                  </button>

                  <span className="font-medium">{quantity}</span>

                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 border rounded"
                  >
                    +
                  </button>
                </div>
              </div>

            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4">

              <button
                onClick={handleAddToCart}
                className="bg-pink-600 hover:bg-pink-700 px-10 py-3 rounded-xl 
                           font-semibold transition duration-300 shadow-lg 
                           hover:scale-105 text-white"
              >
                Add to Cart 🛒
              </button>

              <button
                onClick={toggleWishlist}
                className="border border-gray-300 px-8 py-3 rounded-xl hover:bg-gray-100 transition"
              >
                {isWishlisted ? "❤️ Wishlisted" : "🤍 Add to Wishlist"}
              </button>

            </div>

            {/* Back */}
            <div className="mt-6">
              <a href="/" className="text-pink-600 hover:underline">
                ← Back to Home
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;