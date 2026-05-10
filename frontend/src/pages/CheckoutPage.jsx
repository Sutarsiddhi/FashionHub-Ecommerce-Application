import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { authFetch } from "../utils/auth";

const PAYMENT_OPTIONS = [
  {
    value: "COD",
    label: "Cash on Delivery",
    description: "Pay when your order arrives at your doorstep.",
  },
  {
    value: "ONLINE",
    label: "Online Payment",
    description: "Complete your payment securely with Razorpay.",
  },
];

function CheckoutPage() {
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
  const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const navigate = useNavigate();
  const { cartItems, total, clearCart } = useCart();

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    payment_method: "COD",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const deliveryFee = total > 0 ? 0 : 0;
  const finalTotal = total + deliveryFee;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const setStatus = (nextMessage, type = "info") => {
    setMessage(nextMessage);
    setMessageType(type);
  };

  useEffect(() => {
    const existingScript = document.getElementById("razorpay-checkout-js");
    if (existingScript) return;

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const createCodOrder = async () => {
    const res = await authFetch(`${BASEURL}/api/orders/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Order failed");
    }

    setStatus("Order placed successfully!", "success");
    clearCart();
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  const openRazorpayCheckout = async () => {
    const res = await authFetch(`${BASEURL}/api/payments/razorpay/create-order/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Unable to initiate payment");
    }

    if (!window.Razorpay) {
      throw new Error("Razorpay SDK failed to load");
    }

    const options = {
      key: data.key || RAZORPAY_KEY_ID,
      amount: data.amount,
      currency: data.currency,
      name: "Ecommerce Store",
      description: `Order #${data.order_id}`,
      order_id: data.razorpay_order_id,
      prefill: {
        name: data.name || form.name,
        email: data.email || "",
        contact: data.contact || form.phone,
      },
      theme: {
        color: "#db2777",
      },
      handler: async (response) => {
        try {
          const verifyRes = await authFetch(`${BASEURL}/api/payments/razorpay/verify/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              order_id: data.order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            throw new Error(verifyData.error || "Payment verification failed");
          }

          setStatus("Payment successful! Order placed.", "success");
          clearCart();
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } catch (error) {
          setStatus(error.message || "Payment verification failed", "error");
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          setStatus("Payment cancelled.", "warning");
        },
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.on("payment.failed", (response) => {
      setStatus(response.error?.description || "Payment failed", "error");
      setLoading(false);
    });

    paymentObject.open();
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      setStatus("Your cart is empty. Add items before checkout.", "warning");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (form.payment_method === "ONLINE") {
        await openRazorpayCheckout();
      } else {
        await createCodOrder();
      }
    } catch (error) {
      setStatus(error.message || "Checkout error", "error");
    } finally {
      setLoading(false);
    }
  };

  const messageStyles = {
    success: "border-green-200 bg-green-50 text-green-700",
    error: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    info: "border-gray-200 bg-gray-50 text-gray-700",
  };

  const submitLabel = loading
    ? "Processing..."
    : form.payment_method === "ONLINE"
      ? "Continue to Payment"
      : "Place Order";

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Checkout</h1>
          <p className="mt-3 text-gray-500">
            Enter your details and place your order.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.85fr] items-start">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 sm:p-8"
          >
            <div className="border-b border-gray-100 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Shipping Details</h2>
                <p className="mt-2 text-sm text-gray-500">
                  We will use these details for delivery and order updates.
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-8">
              <section>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Contact Details</h3>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block sm:col-span-1">
                    <span className="mb-2 block text-sm font-medium text-gray-700">Full Name</span>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                    />
                  </label>

                  <label className="block sm:col-span-1">
                    <span className="mb-2 block text-sm font-medium text-gray-700">Phone Number</span>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      required
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                    />
                  </label>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Shipping Address</h3>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">Delivery Address</span>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="House number, street, city, state, PIN code"
                    required
                    rows="4"
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                  />
                </label>
              </section>

              <section>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Payment Method</h3>

                <div className="grid gap-4">
                  {PAYMENT_OPTIONS.map((option) => {
                    const isSelected = form.payment_method === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm({ ...form, payment_method: option.value })}
                        className={`rounded-2xl border p-4 text-left transition duration-300 ${
                          isSelected
                            ? "border-pink-500 bg-pink-50 shadow-sm ring-2 ring-pink-100"
                            : "border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{option.label}</h4>
                            <p className="mt-1 text-sm text-gray-500">{option.description}</p>
                          </div>
                          <span
                            className={`mt-1 h-5 w-5 rounded-full border-2 ${
                              isSelected ? "border-pink-600 bg-pink-600" : "border-gray-300"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {message && (
              <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${messageStyles[messageType]}`}>
                {message}
              </div>
            )}

            <div className="mt-8 border-t border-gray-100 pt-6">
              <button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className="w-full rounded-xl bg-pink-600 py-3.5 text-base font-semibold text-white shadow-lg transition duration-300 hover:bg-pink-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitLabel}
              </button>

              <p className="mt-4 text-center text-sm text-gray-500">
                Secure checkout with cash on delivery or online payment.
              </p>
            </div>
          </form>

          <aside className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 sm:p-8 lg:sticky lg:top-28">
            <div className="border-b border-gray-100 pb-6">
              <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
              <p className="mt-2 text-sm text-gray-500">
                {itemCount} item{itemCount === 1 ? "" : "s"} ready for checkout.
              </p>
            </div>

            {cartItems.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-lg font-semibold text-gray-800">Your cart is empty</p>
                <p className="mt-2 text-sm text-gray-500">Add a few pieces you love and come back here to place your order.</p>
                <Link
                  to="/"
                  className="mt-5 inline-flex rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-4">
                  {cartItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-2xl bg-gray-50 p-3">
                      {item.product_image ? (
                        <img
                          src={`${BASEURL}${item.product_image}`}
                          alt={item.product_name}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold text-gray-400">
                          Item
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">{item.product_name}</p>
                        <p className="mt-1 text-sm text-gray-500">Size {item.size} . Qty {item.quantity}</p>
                      </div>

                      <p className="text-sm font-semibold text-gray-800">
                        ${(Number(item.product_price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}

                  {cartItems.length > 3 && (
                    <p className="text-sm text-gray-500">
                      + {cartItems.length - 3} more item{cartItems.length - 3 === 1 ? "" : "s"} in your cart
                    </p>
                  )}
                </div>

                <div className="mt-8 space-y-4 rounded-2xl bg-gray-50 p-5">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-800">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Delivery</span>
                    <span className="font-medium text-green-600">{deliveryFee === 0 ? "Free" : `$${deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-base font-semibold text-gray-900">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  to="/cart"
                  className="mt-6 inline-flex text-sm font-semibold text-pink-600 transition hover:text-pink-700"
                >
                  Back to cart
                </Link>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
