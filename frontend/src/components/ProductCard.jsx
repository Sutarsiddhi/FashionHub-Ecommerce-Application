import { Link } from "react-router-dom";

function ProductCard({ product }) {
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

  const imageUrl =
    product.image?.startsWith("http")
      ? product.image
      : `${BASEURL}${product.image}`;

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden 
                      transition-all duration-500 
                      shadow-sm hover:shadow-2xl 
                      hover:-translate-y-2">

        {/* Image Section */}
        <div className="relative overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-72 md:h-80 object-cover 
                       transition-transform duration-700 
                       group-hover:scale-110"
          />

          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-black/0 
                          group-hover:bg-black/5 
                          transition duration-500"></div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h2 className="text-base md:text-lg font-semibold 
                         text-gray-800 
                         truncate 
                         group-hover:text-pink-600 
                         transition-colors duration-300">
            {product.name}
          </h2>

          <p className="text-gray-900 font-bold text-lg mt-2">
            ₹ {product.price}
          </p>
        </div>

      </div>
    </Link>
  );
}

export default ProductCard;