import { useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";

const FOOTWEAR_KEYWORDS = [
  "footwear",
  "shoe",
  "shoes",
  "sneaker",
  "sneakers",
  "heel",
  "heels",
  "boot",
  "boots",
  "sandal",
  "sandals",
  "slipper",
  "slippers",
  "loafer",
  "loafers",
];

const ACCESSORY_KEYWORDS = [
  "accessories",
  "accessory",
  "bag",
  "bags",
  "belt",
  "belts",
  "cap",
  "caps",
  "hat",
  "hats",
  "wallet",
  "wallets",
  "watch",
  "watches",
  "sunglasses",
  "jewellery",
  "jewelry",
  "bracelet",
  "necklace",
  "id card",
  "id",
];

const SUBCATEGORY_OPTIONS = ["all", "clothing", "footwear", "accessories"];

function inferSubCategory(product) {
  const categoryName = (product.category_name || "").toLowerCase();
  const productName = (product.name || "").toLowerCase();
  const searchText = `${categoryName} ${productName}`;

  if (FOOTWEAR_KEYWORDS.some((keyword) => searchText.includes(keyword))) {
    return "footwear";
  }

  if (ACCESSORY_KEYWORDS.some((keyword) => searchText.includes(keyword))) {
    return "accessories";
  }

  return "clothing";
}

function ProductSection({ title, products, sectionRef }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div ref={sectionRef} className="mt-16 first:mt-0 scroll-mt-32">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-pink-200 to-transparent"></div>
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
        <div className="h-px flex-1 bg-gradient-to-l from-pink-200 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-10">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function FeaturedCollection({ products, title, description }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          {title}
        </h2>
        <div className="w-24 h-1 bg-pink-600 mx-auto mt-4 rounded-full"></div>
        <p className="mt-5 max-w-2xl mx-auto text-base md:text-lg text-gray-500 px-4">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-10">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const search = new URLSearchParams(location.search).get("search");
  const category = searchParams.get("category");

  const productSectionRef = useRef(null);
  const clothingSectionRef = useRef(null);
  const footwearSectionRef = useRef(null);
  const accessoriesSectionRef = useRef(null);
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

  const groupedProducts = products.reduce(
    (groups, product) => {
      const subCategory = inferSubCategory(product);
      groups[subCategory].push(product);
      return groups;
    },
    {
      clothing: [],
      footwear: [],
      accessories: [],
    }
  );

  const hasVisibleProducts = !category
    ? products.length > 0
    : Object.values(groupedProducts).some((group) => group.length > 0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let url = `${BASEURL}/api/products/`;

    if (category) {
      url += `?category=${category}`;
    }

    if (search) {
      if (category) {
        url += `&search=${search}`;
      } else {
        url += `?search=${search}`;
      }
    }

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        return response.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);

        if (category) {
          setTimeout(() => {
            productSectionRef.current?.scrollIntoView({
              behavior: "smooth",
            });
          }, 200);
        }
      })
      .catch((fetchError) => {
        setError(fetchError.message);
        setLoading(false);
      });
  }, [BASEURL, category, search]);

  const handleSubCategoryChange = (nextSubCategory) => {
    const sectionMap = {
      all: productSectionRef,
      clothing: clothingSectionRef,
      footwear: footwearSectionRef,
      accessories: accessoriesSectionRef,
    };

    sectionMap[nextSubCategory]?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center pt-24 bg-gray-50">
        <p className="text-lg font-medium animate-pulse">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center pt-24 bg-gray-50">
        <p className="text-red-500 text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100">
      {!category && !search && (
        <div
          className="relative h-[75vh] bg-cover bg-center flex items-center justify-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1529139574466-a303027c1d8b')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>

          <div className="relative text-center text-white px-6 max-w-3xl backdrop-blur-md bg-white/10 rounded-2xl p-10 shadow-2xl border border-white/20">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
              Discover Your
              <span className="block bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                Signature Style
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-200 mb-8">
              Elevate your wardrobe with curated collections designed for confidence and elegance.
            </p>

            <button
              onClick={() =>
                productSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                })
              }
              className="bg-pink-600 hover:bg-pink-700 px-8 py-3 rounded-full font-semibold transition duration-300 shadow-lg hover:scale-105"
            >
              Shop Now
            </button>
          </div>
        </div>
      )}

      {category && (
        <div className="pt-28 pb-10 text-center bg-white">
          <h1 className="text-4xl font-bold capitalize text-gray-900">
            {category} Collection
          </h1>
          <div className="w-24 h-1 bg-pink-600 mx-auto mt-4 rounded-full"></div>
          <p className="mt-5 text-gray-500 max-w-2xl mx-auto px-6">
            Browse {category} clothing, footwear, and accessories separately from one page.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 px-6">
            {SUBCATEGORY_OPTIONS.map((option) => {
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSubCategoryChange(option)}
                  className="px-5 py-2.5 rounded-full border text-sm font-semibold capitalize transition duration-300 bg-white text-gray-700 border-gray-200 hover:border-pink-300 hover:text-pink-600"
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <section
        ref={productSectionRef}
        className={`${!category ? "-mt-20 rounded-t-[40px]" : ""} relative z-10 bg-white pt-20 pb-24 shadow-xl`}
      >
        <div className="px-6 md:px-12 lg:px-20">
          {!hasVisibleProducts && (
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold text-gray-800">No products found</h2>
              <p className="mt-3 text-gray-500">
                Try another category or add products for this section.
              </p>
            </div>
          )}

          {!category && (
            <FeaturedCollection
              title={search ? `Results for "${search}"` : "Featured Collection"}
              description={
                search
                  ? "Browse matching styles from across the store in one clean collection."
                  : "A single showcase of all your products, designed to feel premium on the homepage while keeping category browsing focused."
              }
              products={products}
            />
          )}

          {category && (
            <>
              <ProductSection
                title={`${category} Clothing`}
                products={groupedProducts.clothing}
                sectionRef={clothingSectionRef}
              />

              <ProductSection
                title={`${category} Footwear`}
                products={groupedProducts.footwear}
                sectionRef={footwearSectionRef}
              />

              <ProductSection
                title={`${category} Accessories`}
                products={groupedProducts.accessories}
                sectionRef={accessoriesSectionRef}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProductList;
