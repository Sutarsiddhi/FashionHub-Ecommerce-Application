import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

function CartPage() {
    const { cartItems, total, removeFromCart, updateQuantity } = useCart();
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    return (
        <div className="pt-20 min-h-screen bg-gray-100 p-8">
            

            {cartItems.length === 0 ? (
                // ✅ FIXED EMPTY STATE (CENTERED)
                <div className="min-h-[70vh] flex flex-col justify-center items-center text-center">
                    
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                        Your Cart is Empty 🛒
                    </h2>

                    <p className="text-gray-500 mb-6">
                        Looks like you haven’t added anything yet.
                    </p>

                    <Link
                        to="/"
                        className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg transition"
                    >
                        Continue Shopping
                    </Link>

                </div>
            ) : (
                <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">

                    {cartItems.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between mb-6 border-b pb-4"
                        >
                            {/* LEFT SIDE */}
                            <div className="flex items-center gap-4">
                                {item.product_image && (
                                    <img
                                        src={`${BASEURL}${item.product_image}`}
                                        alt={item.product_name}
                                        className="w-20 h-20 object-cover rounded"
                                    />
                                )}

                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {item.product_name}
                                    </h2>

                                    <p className="text-gray-600">
                                        ${item.product_price}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        Size: {item.size}
                                    </p>
                                </div>
                            </div>

                            {/* RIGHT SIDE */}
                            <div className="flex items-center gap-3">
                                <button
                                    className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
                                    onClick={() =>
                                        item.quantity > 1 &&
                                        updateQuantity(
                                            item.id,
                                            item.quantity - 1
                                        )
                                    }
                                >
                                    -
                                </button>

                                <span className="font-medium">
                                    {item.quantity}
                                </span>

                                <button
                                    className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
                                    onClick={() =>
                                        updateQuantity(
                                            item.id,
                                            item.quantity + 1
                                        )
                                    }
                                >
                                    +
                                </button>

                                <button
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() =>
                                        removeFromCart(item.id)
                                    }
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* TOTAL SECTION */}
                    <div className="pt-4 flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            Total:
                        </h2>

                        <p className="text-xl font-semibold">
                            ${total.toFixed(2)}
                        </p>

                        <Link
                            to="/checkout"
                            className="bg-pink-600 hover:bg-pink-700 px-8 py-3 rounded-lg font-semibold transition duration-300 shadow-lg hover:scale-105 text-white"
                        >
                            Proceed to Checkout
                        </Link>
                    </div>

                </div>
            )}
        </div>
    );
}

export default CartPage;