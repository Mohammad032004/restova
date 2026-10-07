"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  Check,
  Clock3,
  Home,
  Info,
  MapPin,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Table2,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";

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
  isAvailable?: boolean;
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

  const [activeCategory, setActiveCategory] = useState("all");

  const [loading, setLoading] = useState(true);

  const [placingOrder, setPlacingOrder] = useState(false);

  const [error, setError] = useState("");

  const [showCart, setShowCart] = useState(false);

  const [customerName, setCustomerName] = useState("");

  const [customerPhone, setCustomerPhone] = useState("");

  const [orderNotes, setOrderNotes] = useState("");

  const [orderPlaced, setOrderPlaced] = useState(false);

  const [orderNumber, setOrderNumber] =
    useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [heroWord, setHeroWord] = useState("Delicious");

  const [imageErrors, setImageErrors] = useState<
    Record<string, boolean>
  >({});

  /* =========================================================
     LOAD QR TOKEN
  ========================================================= */

  useEffect(() => {
    async function loadToken() {
      const resolvedParams = await params;

      setQrToken(resolvedParams.qrToken);
    }

    loadToken();
  }, [params]);

  /* =========================================================
     LOAD MENU
  ========================================================= */

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

  /* =========================================================
     HERO WORD ANIMATION
  ========================================================= */

  useEffect(() => {
    const words = [
      "Delicious",
      "Fresh",
      "Premium",
      "Memorable",
    ];

    let index = 0;

    const interval = window.setInterval(() => {
      index = (index + 1) % words.length;

      setHeroWord(words[index]);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  /* =========================================================
     VISIBLE CATEGORIES
  ========================================================= */

  const visibleCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    return categories.filter((category) =>
      filteredItems.some(
        (item) => item.categoryId === category._id
      )
    );
  }, [categories, filteredItems, searchQuery]);

  /* =========================================================
     DISPLAY CATEGORIES
  ========================================================= */

  const displayCategories = useMemo(() => {
    if (activeCategory === "all") {
      return visibleCategories;
    }

    return visibleCategories.filter(
      (category) => category._id === activeCategory
    );
  }, [visibleCategories, activeCategory]);

  /* =========================================================
     CART
  ========================================================= */

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total, cartItem) =>
        total + cartItem.quantity,
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
      cart.find(
        (cartItem) =>
          cartItem.item._id === itemId
      )?.quantity || 0
    );
  }

  function addItem(item: MenuItem) {
    if (item.isAvailable === false) return;

    setCart((currentCart) => {
      const existing = currentCart.find(
        (cartItem) =>
          cartItem.item._id === item._id
      );

      if (existing) {
        return currentCart.map((cartItem) =>
          cartItem.item._id === item._id
            ? {
                ...cartItem,
                quantity:
                  cartItem.quantity + 1,
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
        (cartItem) =>
          cartItem.item._id === itemId
      );

      if (!existing) {
        return currentCart;
      }

      if (existing.quantity <= 1) {
        return currentCart.filter(
          (cartItem) =>
            cartItem.item._id !== itemId
        );
      }

      return currentCart.map((cartItem) =>
        cartItem.item._id === itemId
          ? {
              ...cartItem,
              quantity:
                cartItem.quantity - 1,
            }
          : cartItem
      );
    });
  }

  function removeItem(itemId: string) {
    setCart((currentCart) =>
      currentCart.filter(
        (cartItem) =>
          cartItem.item._id !== itemId
      )
    );
  }

  function formatPrice(price: number) {
    return `₹${price.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /* =========================================================
     CATEGORY FILTER
  ========================================================= */

  function selectCategory(categoryId: string) {
    setActiveCategory(categoryId);

    document
      .getElementById("menu")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  /* =========================================================
     PLACE ORDER
  ========================================================= */

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
        `/api/menu/${encodeURIComponent(
          qrToken
        )}/order`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            items: cart.map((cartItem) => ({
              menuItemId:
                cartItem.item._id,

              quantity:
                cartItem.quantity,
            })),

            customerName:
              customerName.trim() ||
              undefined,

            customerPhone:
              customerPhone.trim() ||
              undefined,

            notes:
              orderNotes.trim() ||
              undefined,
          }),
        }
      );

      const data: OrderResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.order
      ) {
        throw new Error(
          data.message ||
            "Unable to place your order."
        );
      }

      setOrderNumber(
        data.order.orderNumber
      );

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

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <div className="text-center text-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-white/10 border-t-orange-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>

          <p className="mt-5 text-sm text-white/60">
            Preparing your menu...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error && !restaurant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] p-6">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            Menu unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!restaurant || !table) {
    return null;
  }

  /* =========================================================
     ORDER SUCCESS
  ========================================================= */

  if (orderPlaced) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] p-6">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
            <Check
              size={38}
              className="text-emerald-500"
            />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            Order placed successfully
          </p>

          <h1 className="mt-2 text-5xl font-black text-slate-900">
            #{orderNumber}
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Your order has been sent to the
            restaurant. Please wait while the
            kitchen prepares your food.
          </p>

          <div className="mt-7 rounded-2xl bg-slate-50 p-5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Restaurant
              </span>

              <span className="max-w-[55%] truncate text-sm font-bold text-slate-900">
                {restaurant.name}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Table
              </span>

              <span className="text-sm font-bold text-slate-900">
                {table.name ||
                  `Table ${table.number}`}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Status
              </span>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
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
            className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            Order More
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-32 text-slate-900">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="fixed left-0 right-0 top-0 z-50 w-full border-b border-white/10 bg-black/35 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full items-center justify-between px-5 lg:px-10">
          {/* LOGO */}

          <a
            href="#home"
            className="group flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/20 transition group-hover:rotate-3 group-hover:scale-105">
              <UtensilsCrossed
                size={21}
              />
            </div>

            <div className="hidden sm:block">
              <p className="text-xl font-black tracking-tight">
                Restova
              </p>

              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50">
                Dine • Order • Enjoy
              </p>
            </div>
          </a>

          {/* NAV LINKS */}

          <div className="hidden items-center gap-1 md:flex">
            {[
              ["Home", "#home"],
              ["About", "#about"],
              ["Menu", "#menu"],
              ["Reviews", "#reviews"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                {label}
              </a>
            ))}
          </div>

          {/* TABLE + CART */}

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur sm:flex">
              <Table2
                size={16}
                className="text-orange-400"
              />

              <span>
                Table{" "}
                {table.number}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowCart(true)
              }
              className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 transition hover:bg-orange-500 hover:text-white"
              aria-label="Open cart"
            >
              <ShoppingBag
                size={19}
                className="transition group-hover:scale-110"
              />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        id="home"
        className="relative flex min-h-[720px] items-center justify-center overflow-hidden bg-slate-950"
      >
        {/* IMAGE */}

        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-105"
          style={{
            backgroundImage:
              "url('/restaurant-hero.jpg')",
          }}
        />

        {/* OVERLAY */}

        <div className="absolute inset-0 bg-black/65" />

        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/45 to-[#09090b]" />

        {/* GLOW */}

        <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-orange-500/20 blur-[120px]" />

        {/* HERO CONTENT */}

        <div className="relative z-10 mx-auto max-w-5xl px-5 pt-24 text-center text-white">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-300 backdrop-blur-xl">
            <Sparkles size={14} />

            Welcome to{" "}
            {restaurant.name}
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
            A taste worth remembering
          </p>

          <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            Taste the
            <br />

            <span className="inline-block min-w-[280px] bg-gradient-to-r from-orange-300 via-amber-400 to-orange-500 bg-clip-text text-transparent transition-all duration-500">
              {heroWord}
            </span>
            <br />

            Experience.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
            Discover delicious dishes prepared
            with passion, served fresh to your
            table.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#menu"
              className="group inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-orange-500/20 transition hover:-translate-y-1 hover:bg-orange-400"
            >
              Explore Menu

              <ArrowRight
                size={17}
                className="transition group-hover:translate-x-1"
              />
            </a>

            <a
              href="#about"
              className="rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              Our Story
            </a>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60">
              Fresh Ingredients
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60">
              Made with Love
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60">
              Served Fresh
            </span>
          </div>
        </div>

        {/* BOTTOM FADE */}

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#faf9f6] to-transparent" />
      </section>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <section className="relative z-20 -mt-10 px-5">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10">
            <div className="flex items-center gap-3 rounded-[1.4rem] bg-slate-50 px-5 py-1">
              <Search
                size={21}
                className="shrink-0 text-orange-500"
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(
                    e.target.value
                  );

                  if (
                    e.target.value.trim()
                  ) {
                    setActiveCategory(
                      "all"
                    );
                  }
                }}
                placeholder="Search for dishes, drinks, desserts..."
                className="h-14 w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchQuery("")
                  }
                  className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-slate-900"
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          RESTAURANT INFO
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-5 pt-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl">
            <MapPin
              className="text-orange-500"
              size={24}
            />

            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Location
            </p>

            <p className="mt-1 font-bold">
              {restaurant.city},{" "}
              {restaurant.state}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl">
            <Table2
              className="text-orange-500"
              size={24}
            />

            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Your Table
            </p>

            <p className="mt-1 font-bold">
              {table.name ||
                `Table ${table.number}`}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl">
            <UtensilsCrossed
              className="text-orange-500"
              size={24}
            />

            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Dining
            </p>

            <p className="mt-1 font-bold">
              {table.capacity} seats
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          MENU
      ===================================================== */}

      <section
        id="menu"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20"
      >
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">
            Our Menu
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Choose your favorite
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">
            Explore our carefully prepared dishes
            and find something perfect for your
            table.
          </p>
        </div>

        {/* CATEGORY BOXES */}

        {visibleCategories.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                selectCategory("all")
              }
              className={`group rounded-2xl border px-5 py-3.5 text-sm font-bold transition-all ${
                activeCategory === "all"
                  ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:-translate-y-1 hover:border-orange-200 hover:text-orange-500 hover:shadow-lg"
              }`}
            >
              <span className="flex items-center gap-2">
                <UtensilsCrossed
                  size={16}
                />

                All
              </span>
            </button>

            {visibleCategories.map(
              (category) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() =>
                    selectCategory(
                      category._id
                    )
                  }
                  className={`group rounded-2xl border px-5 py-3.5 text-sm font-bold transition-all ${
                    activeCategory ===
                    category._id
                      ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "border-slate-200 bg-white text-slate-600 hover:-translate-y-1 hover:border-orange-200 hover:text-orange-500 hover:shadow-lg"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-current opacity-70" />

                    {category.name}
                  </span>
                </button>
              )
            )}
          </div>
        )}

        {/* SEARCH RESULT */}

        {searchQuery && (
          <div className="mt-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                Search Results
              </p>

              <h3 className="mt-1 text-2xl font-black">
                {filteredItems.length}{" "}
                {filteredItems.length === 1
                  ? "dish"
                  : "dishes"}{" "}
                found
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                setSearchQuery("")
              }
              className="text-sm font-bold text-slate-500 transition hover:text-orange-500"
            >
              Clear
            </button>
          </div>
        )}

        {/* CATEGORY CONTENT */}

        <div className="mt-14">
          {displayCategories.map(
            (category, categoryIndex) => {
              const categoryItems =
                filteredItems
                  .filter(
                    (item) =>
                      item.categoryId ===
                      category._id
                  )
                  .sort(
                    (a, b) =>
                      a.sortOrder -
                        b.sortOrder ||
                      a.name.localeCompare(
                        b.name
                      )
                  );

              if (
                categoryItems.length === 0
              ) {
                return null;
              }

              return (
                <section
                  key={category._id}
                  id={`category-${category._id}`}
                  className="mb-16"
                >
                  <div className="mb-7 flex items-end justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-xs font-black text-orange-600">
                          {String(
                            categoryIndex +
                              1
                          ).padStart(2, "0")}
                        </span>

                        <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                          Category
                        </p>
                      </div>

                      <h3 className="mt-3 text-3xl font-black tracking-tight">
                        {category.name}
                      </h3>

                      {category.description && (
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                          {
                            category.description
                          }
                        </p>
                      )}
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                      {categoryItems.length}{" "}
                      {categoryItems.length ===
                      1
                        ? "item"
                        : "items"}
                    </span>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {categoryItems.map(
                      (item) => {
                        const quantity =
                          getItemQuantity(
                            item._id
                          );

                        const unavailable =
                          item.isAvailable ===
                          false;

                        return (
                          <article
                            key={item._id}
                            className={`group overflow-hidden rounded-[2rem] border bg-white transition-all duration-300 ${
                              unavailable
                                ? "border-slate-200 opacity-60"
                                : "border-slate-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-900/5"
                            }`}
                          >
                            <div className="flex gap-4 p-4">
                              {/* IMAGE */}

                              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                                {item.imageUrl &&
                                !imageErrors[
                                  item._id
                                ] ? (
                                  <img
                                    src={
                                      item.imageUrl
                                    }
                                    alt={
                                      item.name
                                    }
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                    onError={() =>
                                      setImageErrors(
                                        (
                                          current
                                        ) => ({
                                          ...current,
                                          [item._id]:
                                            true,
                                        })
                                      )
                                    }
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 text-4xl">
                                    🍽️
                                  </div>
                                )}

                                {unavailable && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase">
                                      Unavailable
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* CONTENT */}

                              <div className="min-w-0 flex-1 py-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`flex h-4 w-4 items-center justify-center rounded-[4px] border-2 ${
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

                                      <h4 className="font-black text-slate-900">
                                        {
                                          item.name
                                        }
                                      </h4>
                                    </div>

                                    <span
                                      className={`mt-1 inline-block text-[10px] font-bold uppercase tracking-wide ${
                                        item.isVeg
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {item.isVeg
                                        ? "Vegetarian"
                                        : "Non-Vegetarian"}
                                    </span>
                                  </div>
                                </div>

                                {item.description && (
                                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                                    {
                                      item.description
                                    }
                                  </p>
                                )}

                                <div className="mt-4 flex items-center justify-between gap-3">
                                  <p className="text-lg font-black">
                                    {formatPrice(
                                      item.price
                                    )}
                                  </p>

                                  {unavailable ? (
                                    <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-400">
                                      Not available
                                    </span>
                                  ) : quantity ===
                                    0 ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addItem(
                                          item
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-orange-600 hover:shadow-lg active:scale-95"
                                    >
                                      <Plus
                                        size={
                                          16
                                        }
                                      />

                                      Add
                                    </button>
                                  ) : (
                                    <div className="flex items-center overflow-hidden rounded-xl border border-orange-200 bg-orange-50">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          decreaseItem(
                                            item._id
                                          )
                                        }
                                        className="flex h-10 w-9 items-center justify-center text-orange-600 transition hover:bg-orange-100"
                                      >
                                        <Minus
                                          size={
                                            16
                                          }
                                        />
                                      </button>

                                      <span className="flex h-10 min-w-9 items-center justify-center border-x border-orange-200 px-1 text-sm font-black text-orange-600">
                                        {
                                          quantity
                                        }
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          addItem(
                                            item
                                          )
                                        }
                                        className="flex h-10 w-9 items-center justify-center text-orange-600 transition hover:bg-orange-100"
                                      >
                                        <Plus
                                          size={
                                            16
                                          }
                                        />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                </section>
              );
            }
          )}

          {filteredItems.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                🔍
              </div>

              <h3 className="mt-5 text-2xl font-black">
                No dishes found
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Try searching for another dish
                or clear the search.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory(
                    "all"
                  );
                }}
                className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-500"
              >
                Show Full Menu
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section
        id="about"
        className="scroll-mt-24 bg-[#11100e] px-5 py-24 text-white"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[2.5rem]">
            <img
              src="/restaurant-hero.jpg"
              alt="Restaurant"
              className="h-[450px] w-full object-cover transition duration-700 hover:scale-105"
            />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">
              About Us
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Good food.
              <br />
              Good moments.
              <br />
              Great memories.
            </h2>

            <p className="mt-6 text-sm leading-7 text-white/60">
              At {restaurant.name}, we believe
              food is more than just a meal.
              It is an experience shared with
              friends, family and the people
              who matter.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/60">
              Every dish is prepared with fresh
              ingredients and attention to detail
              so that every visit feels special.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-3xl font-black text-orange-400">
                  100%
                </p>

                <p className="mt-1 text-xs text-white/50">
                  Fresh Ingredients
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-3xl font-black text-orange-400">
                  ♥
                </p>

                <p className="mt-1 text-xs text-white/50">
                  Made With Love
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          REVIEWS
      ===================================================== */}

      <section
        id="reviews"
        className="scroll-mt-24 px-5 py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">
              Customer Reviews
            </p>

            <h2 className="mt-3 text-4xl font-black sm:text-5xl">
              Loved by our customers
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm text-slate-500">
              Great food becomes even better when
              shared with great people.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                name: "Aarav Sharma",
                text: "Amazing food and a beautiful dining experience. Everything tasted fresh.",
              },
              {
                name: "Priya Singh",
                text: "The ordering system was super easy and the food was absolutely delicious.",
              },
              {
                name: "Rahul Verma",
                text: "Loved the ambience, service and especially the food. Definitely coming back!",
              },
            ].map((review) => (
              <div
                key={review.name}
                className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex gap-1 text-orange-400">
                  {Array.from({
                    length: 5,
                  }).map((_, index) => (
                    <Star
                      key={index}
                      size={16}
                      fill="currentColor"
                    />
                  ))}
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-600">
                  “{review.text}”
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-black text-orange-600">
                    {review.name.charAt(
                      0
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-black">
                      {review.name}
                    </p>

                    <p className="text-xs text-slate-400">
                      Verified Customer
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTACT
      ===================================================== */}

      <section
        id="contact"
        className="scroll-mt-24 px-5 pb-24"
      >
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-orange-500">
          <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-100">
                Contact
              </p>

              <h2 className="mt-4 text-4xl font-black text-white sm:text-5xl">
                Need help?
                <br />
                We are here for you.
              </h2>

              <p className="mt-5 max-w-lg text-sm leading-7 text-orange-50">
                Have a question about your order,
                menu or table? Feel free to contact
                the restaurant staff.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-black/15 p-6 backdrop-blur">
                <Phone
                  size={24}
                  className="text-white"
                />

                <p className="mt-5 text-xs font-bold uppercase tracking-widest text-orange-100">
                  Call Us
                </p>

                <p className="mt-2 font-black text-white">
                  Restaurant Staff
                </p>
              </div>

              <div className="rounded-3xl bg-black/15 p-6 backdrop-blur">
                <MapPin
                  size={24}
                  className="text-white"
                />

                <p className="mt-5 text-xs font-bold uppercase tracking-widest text-orange-100">
                  Visit Us
                </p>

                <p className="mt-2 font-black text-white">
                  {restaurant.city},{" "}
                  {restaurant.state}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-[#09090b] px-5 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500">
                  <UtensilsCrossed
                    size={21}
                  />
                </div>

                <div>
                  <p className="text-xl font-black">
                    Restova
                  </p>

                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/40">
                    Smart Restaurant
                  </p>
                </div>
              </div>

              <p className="mt-4 max-w-sm text-sm leading-6 text-white/40">
                A modern digital dining experience
                that makes ordering simple,
                beautiful and fast.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-white/50">
              <a
                href="#home"
                className="transition hover:text-orange-400"
              >
                Home
              </a>

              <a
                href="#about"
                className="transition hover:text-orange-400"
              >
                About
              </a>

              <a
                href="#menu"
                className="transition hover:text-orange-400"
              >
                Menu
              </a>

              <a
                href="#reviews"
                className="transition hover:text-orange-400"
              >
                Reviews
              </a>

              <a
                href="#contact"
                className="transition hover:text-orange-400"
              >
                Contact
              </a>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/30">
            © {new Date().getFullYear()}{" "}
            {restaurant.name}. Powered by
            Restova.
          </div>
        </div>
      </footer>

      {/* =====================================================
          FLOATING CART
      ===================================================== */}

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4">
          <div className="mx-auto max-w-4xl">
            <button
              type="button"
              onClick={() =>
                setShowCart(true)
              }
              className="group flex w-full items-center gap-4 rounded-2xl bg-slate-950 px-4 py-3.5 text-white shadow-2xl transition hover:bg-orange-600"
            >
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500">
                <ShoppingBag size={20} />

                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-slate-950">
                  {cartCount}
                </span>
              </div>

              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs text-white/50">
                  {cartCount}{" "}
                  {cartCount === 1
                    ? "item"
                    : "items"}{" "}
                  in cart
                </p>

                <p className="mt-0.5 text-base font-black">
                  {formatPrice(cartTotal)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-sm font-bold">
                View Cart
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          CART DRAWER
      ===================================================== */}

      {showCart && (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Close cart"
            onClick={() =>
              setShowCart(false)
            }
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="absolute inset-x-0 bottom-0 max-h-[94vh] overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                  Your order
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Cart
                </h2>

                <p className="text-xs text-slate-500">
                  {cartCount}{" "}
                  {cartCount === 1
                    ? "item"
                    : "items"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCart(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="space-y-3">
                {cart.map((cartItem) => (
                  <div
                    key={cartItem.item._id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex gap-3">
                      {cartItem.item.imageUrl &&
                      !imageErrors[
                        cartItem.item._id
                      ] ? (
                        <img
                          src={
                            cartItem.item.imageUrl
                          }
                          alt={
                            cartItem.item.name
                          }
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                          onError={() =>
                            setImageErrors(
                              (current) => ({
                                ...current,
                                [cartItem.item
                                  ._id]: true,
                              })
                            )
                          }
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                          🍽️
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <div>
                            <h3 className="font-bold">
                              {
                                cartItem.item
                                  .name
                              }
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatPrice(
                                cartItem.item
                                  .price
                              )}{" "}
                              each
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                cartItem.item
                                  ._id
                              )
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2
                              size={15}
                            />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center overflow-hidden rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() =>
                                decreaseItem(
                                  cartItem.item
                                    ._id
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center transition hover:bg-slate-100"
                            >
                              <Minus
                                size={15}
                              />
                            </button>

                            <span className="flex h-9 min-w-10 items-center justify-center border-x border-slate-200 px-2 text-sm font-black">
                              {
                                cartItem.quantity
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                addItem(
                                  cartItem.item
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center text-orange-500 transition hover:bg-orange-50"
                            >
                              <Plus
                                size={15}
                              />
                            </button>
                          </div>

                          <p className="font-black">
                            {formatPrice(
                              cartItem.item
                                .price *
                                cartItem.quantity
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CUSTOMER DETAILS */}

              <div className="mt-7">
                <h3 className="text-sm font-black">
                  Customer Details
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Optional
                </p>

                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) =>
                      setCustomerName(
                        e.target.value
                      )
                    }
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                  />

                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) =>
                      setCustomerPhone(
                        e.target.value
                      )
                    }
                    placeholder="Phone number"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                  />

                  <textarea
                    value={orderNotes}
                    onChange={(e) =>
                      setOrderNotes(
                        e.target.value
                      )
                    }
                    placeholder="Any special instructions?"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* SUMMARY */}

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    {formatPrice(
                      cartTotal
                    )}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-slate-500">
                    Tax
                  </span>

                  <span className="font-semibold">
                    ₹0.00
                  </span>
                </div>

                <div className="my-3 border-t border-slate-200" />

                <div className="flex items-center justify-between">
                  <span className="font-black">
                    Total
                  </span>

                  <span className="text-xl font-black">
                    {formatPrice(
                      cartTotal
                    )}
                  </span>
                </div>
              </div>

              {/* PLACE ORDER */}

              <button
                type="button"
                onClick={placeOrder}
                disabled={
                  placingOrder ||
                  cart.length === 0
                }
                className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placingOrder ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order
                    <ArrowRight
                      size={17}
                    />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Clock3 size={13} />
                Payment will be handled
                separately by the restaurant.
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}