"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Category = {
  _id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
};

type MenuItem = {
  _id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  sortOrder: number;
};

type ModalType = "CATEGORY" | "ITEM" | null;

export default function RestaurantMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modal, setModal] = useState<ModalType>(null);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);
  const [editingItem, setEditingItem] =
    useState<MenuItem | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const [itemCategoryId, setItemCategoryId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [itemIsAvailable, setItemIsAvailable] = useState(true);

  const sortedCategories = useMemo(() => {
    return [...categories].sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name)
    );
  }, [categories]);

  function showMessage(message: string) {
    setSuccess(message);

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);
  }

  async function loadMenu() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/restaurant/menu", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load menu."
        );
      }

      setCategories(data.categories || []);
      setItems(data.items || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load menu."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  function resetForms() {
    setCategoryName("");
    setCategoryDescription("");

    setItemCategoryId("");
    setItemName("");
    setItemDescription("");
    setItemPrice("");
    setItemImageUrl("");
    setItemIsVeg(true);
    setItemIsAvailable(true);

    setEditingCategory(null);
    setEditingItem(null);
  }

  function closeModal() {
    if (saving) return;

    setModal(null);
    resetForms();
  }

  function openCreateCategory() {
    resetForms();
    setModal("CATEGORY");
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setModal("CATEGORY");
  }

  function openCreateItem(categoryId?: string) {
    resetForms();

    const firstCategory =
      categoryId ||
      sortedCategories.find((category) => category.isActive)?._id ||
      "";

    setItemCategoryId(firstCategory);
    setModal("ITEM");
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item);
    setItemCategoryId(item.categoryId);
    setItemName(item.name);
    setItemDescription(item.description || "");
    setItemPrice(String(item.price));
    setItemImageUrl(item.imageUrl || "");
    setItemIsVeg(item.isVeg);
    setItemIsAvailable(item.isAvailable);
    setModal("ITEM");
  }

  async function createCategory(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/restaurant/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "CATEGORY",
          name: categoryName,
          description: categoryDescription,
          sortOrder: categories.length,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to create category."
        );
      }

      closeModal();
      await loadMenu();
      showMessage("Category created successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateCategory(event: FormEvent) {
    event.preventDefault();

    if (!editingCategory) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/restaurant/menu/${editingCategory._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "CATEGORY",
            name: categoryName,
            description: categoryDescription,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update category."
        );
      }

      closeModal();
      await loadMenu();
      showMessage("Category updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createItem(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!itemCategoryId) {
        throw new Error("Please select a category.");
      }

      const response = await fetch("/api/restaurant/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "ITEM",
          categoryId: itemCategoryId,
          name: itemName,
          description: itemDescription,
          price: Number(itemPrice),
          imageUrl: itemImageUrl,
          isVeg: itemIsVeg,
          isAvailable: itemIsAvailable,
          sortOrder: items.filter(
            (item) => item.categoryId === itemCategoryId
          ).length,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to create menu item."
        );
      }

      closeModal();
      await loadMenu();
      showMessage("Menu item created successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create menu item."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(event: FormEvent) {
    event.preventDefault();

    if (!editingItem) return;

    try {
      setSaving(true);
      setError("");

      if (!itemCategoryId) {
        throw new Error("Please select a category.");
      }

      const response = await fetch(
        `/api/restaurant/menu/${editingItem._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "ITEM",
            categoryId: itemCategoryId,
            name: itemName,
            description: itemDescription,
            price: Number(itemPrice),
            imageUrl: itemImageUrl,
            isVeg: itemIsVeg,
            isAvailable: itemIsAvailable,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update menu item."
        );
      }

      closeModal();
      await loadMenu();
      showMessage("Menu item updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update menu item."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCategory(category: Category) {
    try {
      setError("");

      const response = await fetch(
        `/api/restaurant/menu/${category._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "CATEGORY",
            isActive: !category.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update category."
        );
      }

      await loadMenu();
      showMessage(
        category.isActive
          ? "Category hidden."
          : "Category activated."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update category."
      );
    }
  }

  async function toggleItem(item: MenuItem) {
    try {
      setError("");

      const response = await fetch(
        `/api/restaurant/menu/${item._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "ITEM",
            isAvailable: !item.isAvailable,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update item."
        );
      }

      await loadMenu();
      showMessage(
        item.isAvailable
          ? `${item.name} marked unavailable.`
          : `${item.name} marked available.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update item."
      );
    }
  }

  async function deleteCategory(category: Category) {
    const categoryItems = items.filter(
      (item) => item.categoryId === category._id
    );

    if (categoryItems.length > 0) {
      setError(
        "This category contains menu items. Delete or move those items first."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete "${category.name}" category?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        `/api/restaurant/menu/${category._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "CATEGORY",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete category."
        );
      }

      await loadMenu();
      showMessage("Category deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete category."
      );
    }
  }

  async function deleteItem(item: MenuItem) {
    const confirmed = window.confirm(
      `Delete "${item.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        `/api/restaurant/menu/${item._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "ITEM",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete item."
        );
      }

      await loadMenu();
      showMessage("Menu item deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete item."
      );
    }
  }

  function getCategoryItems(categoryId: string) {
    return items
      .filter((item) => item.categoryId === categoryId)
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.name.localeCompare(b.name)
      );
  }

  const totalItems = items.length;
  const availableItems = items.filter(
    (item) => item.isAvailable
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Restaurant Menu
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Manage your menu
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create categories and manage the food items
              customers will see through the QR menu.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCreateCategory}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              + Category
            </button>

            <button
              type="button"
              onClick={() => openCreateItem()}
              disabled={categories.length === 0}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              + Menu Item
            </button>

            <button
              type="button"
              onClick={loadMenu}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Categories</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {categories.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Menu Items</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalItems}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Available Items
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {availableItems}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            <p className="mt-4 text-sm text-slate-500">
              Loading menu...
            </p>
          </div>
        ) : categories.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
              🍽️
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Your menu is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Start by creating a category such as Starters,
              Main Course, Beverages, or Desserts.
            </p>

            <button
              type="button"
              onClick={openCreateCategory}
              className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Create First Category
            </button>
          </div>
        ) : (
          /* Categories */
          <div className="space-y-6">
            {sortedCategories.map((category) => {
              const categoryItems = getCategoryItems(
                category._id
              );

              return (
                <section
                  key={category._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* Category Header */}
                  <div className="border-b border-slate-100 bg-slate-50/70 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900">
                            {category.name}
                          </h2>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              category.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {category.isActive
                              ? "Active"
                              : "Hidden"}
                          </span>
                        </div>

                        {category.description && (
                          <p className="mt-1 text-sm text-slate-500">
                            {category.description}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-slate-400">
                          {categoryItems.length}{" "}
                          {categoryItems.length === 1
                            ? "item"
                            : "items"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openCreateItem(category._id)
                          }
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          + Add Item
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditCategory(category)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleCategory(category)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {category.isActive
                            ? "Hide"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteCategory(category)
                          }
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  {categoryItems.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-slate-400">
                        No menu items in this category.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          openCreateItem(category._id)
                        }
                        className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Add your first item
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {categoryItems.map((item) => (
                        <div
                          key={item._id}
                          className="p-5 transition hover:bg-slate-50/50"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex min-w-0 gap-4">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                                  🍽️
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-semibold text-slate-900">
                                    {item.name}
                                  </h3>

                                  <span
                                    className={`h-2.5 w-2.5 rounded-full ${
                                      item.isVeg
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                    }`}
                                    title={
                                      item.isVeg
                                        ? "Vegetarian"
                                        : "Non-vegetarian"
                                    }
                                  />

                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                      item.isAvailable
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {item.isAvailable
                                      ? "Available"
                                      : "Unavailable"}
                                  </span>
                                </div>

                                {item.description && (
                                  <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-slate-500">
                                    {item.description}
                                  </p>
                                )}

                                <p className="mt-2 text-base font-bold text-slate-900">
                                  ₹
                                  {item.price.toLocaleString(
                                    "en-IN",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleItem(item)
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                {item.isAvailable
                                  ? "Mark Unavailable"
                                  : "Mark Available"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditItem(item)
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteItem(item)
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {modal === "CATEGORY"
                      ? editingCategory
                        ? "Edit Category"
                        : "Create Category"
                      : editingItem
                        ? "Edit Menu Item"
                        : "Create Menu Item"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {modal === "CATEGORY"
                      ? "Organize your menu into categories."
                      : "Add the food details customers will see."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              {modal === "CATEGORY" ? (
                <form
                  onSubmit={
                    editingCategory
                      ? updateCategory
                      : createCategory
                  }
                  className="space-y-5 p-5"
                >
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Category Name
                    </label>

                    <input
                      value={categoryName}
                      onChange={(e) =>
                        setCategoryName(e.target.value)
                      }
                      placeholder="e.g. Starters"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Description
                    </label>

                    <textarea
                      value={categoryDescription}
                      onChange={(e) =>
                        setCategoryDescription(e.target.value)
                      }
                      placeholder="Optional description"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? "Saving..."
                        : editingCategory
                          ? "Save Changes"
                          : "Create Category"}
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={
                    editingItem ? updateItem : createItem
                  }
                  className="space-y-5 p-5"
                >
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Category
                    </label>

                    <select
                      value={itemCategoryId}
                      onChange={(e) =>
                        setItemCategoryId(e.target.value)
                      }
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">
                        Select category
                      </option>

                      {sortedCategories.map((category) => (
                        <option
                          key={category._id}
                          value={category._id}
                          disabled={!category.isActive}
                        >
                          {category.name}
                          {!category.isActive
                            ? " (Hidden)"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Item Name
                    </label>

                    <input
                      value={itemName}
                      onChange={(e) =>
                        setItemName(e.target.value)
                      }
                      placeholder="e.g. Paneer Tikka"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Description
                    </label>

                    <textarea
                      value={itemDescription}
                      onChange={(e) =>
                        setItemDescription(e.target.value)
                      }
                      placeholder="Describe the dish"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Price (₹)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={itemPrice}
                        onChange={(e) =>
                          setItemPrice(e.target.value)
                        }
                        placeholder="0.00"
                        required
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Image URL
                      </label>

                      <input
                        type="url"
                        value={itemImageUrl}
                        onChange={(e) =>
                          setItemImageUrl(e.target.value)
                        }
                        placeholder="https://..."
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
                      <input
                        type="checkbox"
                        checked={itemIsVeg}
                        onChange={(e) =>
                          setItemIsVeg(e.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Vegetarian
                        </p>
                        <p className="text-xs text-slate-500">
                          Mark this item as vegetarian.
                        </p>
                      </div>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
                      <input
                        type="checkbox"
                        checked={itemIsAvailable}
                        onChange={(e) =>
                          setItemIsAvailable(
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Available
                        </p>
                        <p className="text-xs text-slate-500">
                          Customers can order this item.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? "Saving..."
                        : editingItem
                          ? "Save Changes"
                          : "Create Item"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}