"use client";

import { useEffect, useMemo, useState } from "react";

type Restaurant = {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
};

type Table = {
  id: string;
  name: string;
  number: number;
  capacity: number;
  status: string;
};

type Category = {
  _id: string;
  name: string;
  description?: string;
  sortOrder: number;
};

type MenuItem = {
  _id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  sortOrder: number;
};

type CartItem = {
  item: MenuItem;
  quantity: number;
};

interface MenuResponse {
  success: boolean;
  message?: string;
  restaurant?: Restaurant;
  table?: Table;
  categories?: Category[];
  items?: MenuItem[];
}

interface OrderResponse {
  success: boolean;
  message?: string;
  order?: {
    id: string;
    orderNumber: number;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  };
}

interface CustomerMenuPageProps {
  params: Promise<{
    qrToken: string;
  }>;
}

export default function CustomerMenuPage({
  params,
}: CustomerMenuPageProps) {
  const [qrToken, setQrToken] = useState("");

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [table, setTable] = useState<Table | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [activeCategory, setActiveCategory] =
    useState<string>("");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [error, setError] = useState("");

  const [showCart, setShowCart] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(
    null
  );

  useEffect(() => {
    async function loadToken() {
      const resolvedParams = await params;
      setQrToken(resolvedParams.qrToken);
    }

    loadToken();
  }, [params]);

  useEffect(() => {
    if (!qrToken) return;

    async function loadMenu() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/menu/${encodeURIComponent(qrToken)}`,
          {
            cache: "no-store",
          }
        );

        const data: MenuResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load menu."
          );
        }

        setRestaurant(data.restaurant || null);
        setTable(data.table || null);
        setCategories(data.categories || []);
        setItems(data.items || []);

        if (data.categories?.length) {
          setActiveCategory(data.categories[0]._id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load menu."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, [qrToken]);

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total, cartItem) => total + cartItem.quantity,
      0
    );
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (total, cartItem) =>
        total +
        cartItem.item.price * cartItem.quantity,
      0
    );
  }, [cart]);

  function getItemQuantity(itemId: string) {
    return (
      cart.find((cartItem) => cartItem.item._id === itemId)
        ?.quantity || 0
    );
  }

  function addItem(item: MenuItem) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (cartItem) => cartItem.item._id === item._id
      );

      if (existing) {
        return currentCart.map((cartItem) =>
          cartItem.item._id === item._id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      return [
        ...currentCart,
        {
          item,
          quantity: 1,
        },
      ];
    });
  }

  function decreaseItem(itemId: string) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (cartItem) => cartItem.item._id === itemId
      );

      if (!existing) {
        return currentCart;
      }

      if (existing.quantity <= 1) {
        return currentCart.filter(
          (cartItem) => cartItem.item._id !== itemId
        );
      }

      return currentCart.map((cartItem) =>
        cartItem.item._id === itemId
          ? {
              ...cartItem,
              quantity: cartItem.quantity - 1,
            }
          : cartItem
      );
    });
  }

  function removeItem(itemId: string) {
    setCart((currentCart) =>
      currentCart.filter(
        (cartItem) => cartItem.item._id !== itemId
      )
    );
  }

  function formatPrice(price: number) {
    return `₹${price.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  async function placeOrder() {
    if (!qrToken) {
      setError("Invalid QR code.");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setPlacingOrder(true);
      setError("");

      const response = await fetch(
        `/api/menu/${encodeURIComponent(qrToken)}/order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cart.map((cartItem) => ({
              menuItemId: cartItem.item._id,
              quantity: cartItem.quantity,
            })),

            customerName: customerName.trim() || undefined,

            customerPhone:
              customerPhone.trim() || undefined,

            notes: orderNotes.trim() || undefined,
          }),
        }
      );

      const data: OrderResponse = await response.json();

      if (!response.ok || !data.success || !data.order) {
        throw new Error(
          data.message || "Unable to place your order."
        );
      }

      setOrderNumber(data.order.orderNumber);

      setCart([]);

      setShowCart(false);

      setOrderPlaced(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to place your order."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center text-white">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />

          <p className="mt-4 text-sm text-white/70">
            Loading menu...
          </p>
        </div>
      </main>
    );
  }

  if (error && !restaurant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Menu unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!restaurant || !table) {
    return null;
  }

  if (orderPlaced) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
            ✓
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Order placed
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Order #{orderNumber}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your order has been sent to the restaurant.
            Please wait while the kitchen prepares your
            food.
          </p>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">
                Restaurant
              </span>

              <span className="text-sm font-semibold text-slate-900">
                {restaurant.name}
              </span>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-sm text-slate-500">
                Table
              </span>

              <span className="text-sm font-semibold text-slate-900">
                {table.name || `Table ${table.number}`}
              </span>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-sm text-slate-500">
                Status
              </span>

              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                Placed
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setOrderPlaced(false);
              setOrderNumber(null);
              setCustomerName("");
              setCustomerPhone("");
              setOrderNotes("");
            }}
            className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Order More
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-32">
      {/* Restaurant Header */}
      <header className="bg-slate-950 px-5 pb-6 pt-8 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                Digital Menu
              </p>

              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                {restaurant.name}
              </h1>

              <p className="mt-1 text-sm text-white/60">
                {restaurant.city}, {restaurant.state}
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-white/50">
                Table
              </p>

              <p className="mt-1 text-lg font-bold">
                {table.name || `#${table.number}`}
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70">
              👥 {table.capacity} seats
            </span>

            <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300">
              ● Ordering available
            </span>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-3xl px-5 pt-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Category Navigation */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-5 py-3">
            {categories.map((category) => (
              <button
                key={category._id}
                type="button"
                onClick={() =>
                  setActiveCategory(category._id)
                }
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === category._id
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="mx-auto max-w-3xl px-5 py-6">
        {categories.map((category) => {
          const categoryItems = items.filter(
            (item) => item.categoryId === category._id
          );

          if (categoryItems.length === 0) {
            return null;
          }

          return (
            <section
              key={category._id}
              id={`category-${category._id}`}
              className="mb-10 scroll-mt-20"
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  {category.name}
                </h2>

                {category.description && (
                  <p className="mt-1 text-sm text-slate-500">
                    {category.description}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {categoryItems.map((item) => {
                  const quantity = getItemQuantity(
                    item._id
                  );

                  return (
                    <article
                      key={item._id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="flex gap-4 p-4">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-24 w-24 shrink-0 rounded-xl object-cover sm:h-28 sm:w-28"
                          />
                        ) : (
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl sm:h-28 sm:w-28">
                            🍽️
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border-2 ${
                                item.isVeg
                                  ? "border-green-600"
                                  : "border-red-600"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  item.isVeg
                                    ? "bg-green-600"
                                    : "bg-red-600"
                                }`}
                              />
                            </span>

                            <h3 className="font-semibold text-slate-900">
                              {item.name}
                            </h3>
                          </div>

                          {item.description && (
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                              {item.description}
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <p className="font-bold text-slate-900">
                              {formatPrice(item.price)}
                            </p>

                            {quantity === 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  addItem(item)
                                }
                                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
                              >
                                Add
                              </button>
                            ) : (
                              <div className="flex items-center overflow-hidden rounded-xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() =>
                                    decreaseItem(item._id)
                                  }
                                  className="flex h-9 w-9 items-center justify-center text-lg font-bold text-slate-600 hover:bg-slate-100"
                                >
                                  −
                                </button>

                                <span className="flex h-9 min-w-9 items-center justify-center border-x border-slate-200 px-2 text-sm font-bold text-slate-900">
                                  {quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    addItem(item)
                                  }
                                  className="flex h-9 w-9 items-center justify-center text-lg font-bold text-indigo-600 hover:bg-indigo-50"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-4xl">🍽️</div>

            <h2 className="mt-4 font-bold text-slate-900">
              Menu currently unavailable
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Please ask a restaurant staff member for
              assistance.
            </p>
          </div>
        )}
      </div>

      {/* Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">
                {cartCount}{" "}
                {cartCount === 1 ? "item" : "items"}
              </p>

              <p className="text-lg font-bold text-slate-900">
                {formatPrice(cartTotal)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCart(true)}
              className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 sm:flex-none"
            >
              View Cart →
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setShowCart(false)}
            className="absolute inset-0 bg-slate-950/50"
          />

          <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Your Cart
                </h2>

                <p className="text-xs text-slate-500">
                  {cartCount}{" "}
                  {cartCount === 1 ? "item" : "items"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCart(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-lg text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="p-5">
              {/* Cart Items */}
              <div className="space-y-4">
                {cart.map((cartItem) => (
                  <div
                    key={cartItem.item._id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {cartItem.item.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatPrice(cartItem.item.price)} each
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(cartItem.item._id)
                        }
                        className="text-xs font-semibold text-red-500"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center overflow-hidden rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseItem(cartItem.item._id)
                          }
                          className="flex h-9 w-9 items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                        >
                          −
                        </button>

                        <span className="flex h-9 min-w-10 items-center justify-center border-x border-slate-200 text-sm font-bold">
                          {cartItem.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            addItem(cartItem.item)
                          }
                          className="flex h-9 w-9 items-center justify-center font-bold text-indigo-600 hover:bg-indigo-50"
                        >
                          +
                        </button>
                      </div>

                      <p className="font-bold text-slate-900">
                        {formatPrice(
                          cartItem.item.price *
                            cartItem.quantity
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Details */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-900">
                  Customer Details
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Optional — you can order without providing
                  these details.
                </p>

                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) =>
                      setCustomerName(e.target.value)
                    }
                    placeholder="Your name"
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) =>
                      setCustomerPhone(e.target.value)
                    }
                    placeholder="Phone number"
                    maxLength={30}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  <textarea
                    value={orderNotes}
                    onChange={(e) =>
                      setOrderNotes(e.target.value)
                    }
                    placeholder="Any special instructions?"
                    maxLength={1000}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Total */}
              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatPrice(cartTotal)}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-slate-500">
                    Tax
                  </span>

                  <span className="font-semibold text-slate-900">
                    ₹0.00
                  </span>
                </div>

                <div className="my-3 border-t border-slate-200" />

                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">
                    Total
                  </span>

                  <span className="text-lg font-bold text-slate-900">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
              </div>

              {/* Place Order */}
              <button
                type="button"
                onClick={placeOrder}
                disabled={placingOrder || cart.length === 0}
                className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placingOrder
                  ? "Placing Order..."
                  : `Place Order · ${formatPrice(cartTotal)}`}
              </button>

              <p className="mt-3 text-center text-xs text-slate-400">
                Payment will be handled separately by the
                restaurant.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}