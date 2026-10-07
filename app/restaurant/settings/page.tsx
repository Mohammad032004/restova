"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings2,
  ShieldCheck,
  Store,
  Table2,
  User,
  UserCircle2,
} from "lucide-react";

interface RestaurantSettings {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  numberOfTables: number;
  status: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  restaurantId: string;
  createdAt: string;
}

export default function RestaurantSettingsPage() {
  const [restaurant, setRestaurant] =
    useState<RestaurantSettings | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profileError, setProfileError] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    numberOfTables: "",
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/restaurant/settings", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load restaurant settings."
        );
      }

      setRestaurant(data.restaurant);

      setForm({
        name: data.restaurant.name || "",
        type: data.restaurant.type || "",
        address: data.restaurant.address || "",
        city: data.restaurant.city || "",
        state: data.restaurant.state || "",
        pincode: data.restaurant.pincode || "",
        numberOfTables:
          data.restaurant.numberOfTables?.toString() || "",
      });
    } catch (error) {
      console.error(
        "Restaurant settings loading error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load restaurant settings."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    try {
      setProfileLoading(true);
      setProfileError("");

      const response = await fetch(
        "/api/restaurant/settings/profile",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load account profile."
        );
      }

      setProfile(data.profile);
    } catch (error) {
      console.error("Profile loading error:", error);

      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to load account profile."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
    loadProfile();
  }, []);

  function handleChange(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Restaurant name is required.");
      return;
    }

    if (!form.type.trim()) {
      setError("Restaurant type is required.");
      return;
    }

    if (!form.address.trim()) {
      setError("Address is required.");
      return;
    }

    if (!form.city.trim()) {
      setError("City is required.");
      return;
    }

    if (!form.state.trim()) {
      setError("State is required.");
      return;
    }

    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError("Pincode must contain exactly 6 digits.");
      return;
    }

    const numberOfTables = Number(form.numberOfTables);

    if (
      !Number.isInteger(numberOfTables) ||
      numberOfTables < 1 ||
      numberOfTables > 1000
    ) {
      setError(
        "Number of tables must be between 1 and 1000."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/restaurant/settings",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            type: form.type.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
            numberOfTables,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update restaurant settings."
        );
      }

      setRestaurant(data.restaurant);

      setForm({
        name: data.restaurant.name || "",
        type: data.restaurant.type || "",
        address: data.restaurant.address || "",
        city: data.restaurant.city || "",
        state: data.restaurant.state || "",
        pincode: data.restaurant.pincode || "",
        numberOfTables:
          data.restaurant.numberOfTables?.toString() || "",
      });

      setSuccess(
        "Restaurant settings updated successfully."
      );
    } catch (error) {
      console.error(
        "Restaurant settings update error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update restaurant settings."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError(
        "Current password is required."
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword.length > 128) {
      setPasswordError(
        "New password cannot exceed 128 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(
        "/api/restaurant/settings/password",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to change your password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordSuccess(
        "Password changed successfully."
      );
    } catch (error) {
      console.error(
        "Password change error:",
        error
      );

      setPasswordError(
        error instanceof Error
          ? error.message
          : "Failed to change your password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  function formatRole(role: string) {
    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function formatDate(date: string) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2
              className="animate-spin"
              size={22}
            />
            <span className="text-sm font-medium">
              Loading restaurant settings...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 shrink-0 text-red-600"
                size={21}
              />

              <div>
                <h2 className="font-semibold text-red-900">
                  Unable to load settings
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error ||
                    "Restaurant information could not be loaded."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Settings2 size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Restaurant Settings
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage your restaurant information and account
                security.
              </p>
            </div>
          </div>
        </div>

        {/* Global Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 shrink-0 text-red-600"
                size={19}
              />

              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Global Success */}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="mt-0.5 shrink-0 text-emerald-600"
                size={19}
              />

              <p className="text-sm font-medium text-emerald-700">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* Account Profile */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UserCircle2 size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Account Profile
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Your account information and role.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {profileLoading ? (
              <div className="flex min-h-[160px] items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                  <Loader2
                    className="animate-spin"
                    size={20}
                  />

                  <span className="text-sm">
                    Loading profile...
                  </span>
                </div>
              </div>
            ) : profileError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="mt-0.5 shrink-0 text-red-600"
                    size={19}
                  />

                  <p className="text-sm font-medium text-red-700">
                    {profileError}
                  </p>
                </div>
              </div>
            ) : profile ? (
              <div className="grid gap-5 md:grid-cols-2">
                {/* Profile Identity */}
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 md:col-span-2">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                    <User size={25} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-slate-900">
                      {profile.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatRole(profile.role)}
                    </p>
                  </div>

                  <div className="ml-auto hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 sm:flex">
                    <ShieldCheck
                      size={15}
                      className="text-emerald-600"
                    />

                    <span className="text-xs font-semibold text-emerald-700">
                      Active Account
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <User size={16} />

                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Full Name
                    </span>
                  </div>

                  <p className="font-medium text-slate-900">
                    {profile.name || "—"}
                  </p>
                </div>

                {/* Email */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <Mail size={16} />

                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Email
                    </span>
                  </div>

                  <p className="break-all font-medium text-slate-900">
                    {profile.email || "—"}
                  </p>
                </div>

                {/* Phone */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <Phone size={16} />

                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Phone
                    </span>
                  </div>

                  <p className="font-medium text-slate-900">
                    {profile.phone || "Not provided"}
                  </p>
                </div>

                {/* Role */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <ShieldCheck size={16} />

                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Role
                    </span>
                  </div>

                  <p className="font-medium text-slate-900">
                    {formatRole(profile.role)}
                  </p>
                </div>

                {/* Joined */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <UserCircle2 size={16} />

                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Account Created
                    </span>
                  </div>

                  <p className="font-medium text-slate-900">
                    {formatDate(profile.createdAt)}
                  </p>
                </div>

                {/* Restaurant ID */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <Store size={16} />

                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Restaurant ID
                    </span>
                  </div>

                  <p className="break-all font-mono text-xs font-medium text-slate-700">
                    {profile.restaurantId || "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-slate-500">
                Profile information is unavailable.
              </div>
            )}
          </div>
        </section>

        {/* Restaurant Information */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Store size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Restaurant Information
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Update the basic information of your restaurant.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 p-6 md:grid-cols-2">
              {/* Restaurant Name */}
              <div className="md:col-span-2">
                <label
                  htmlFor="restaurant-name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Restaurant Name
                </label>

                <input
                  id="restaurant-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleChange(
                      "name",
                      event.target.value
                    )
                  }
                  maxLength={150}
                  placeholder="Enter restaurant name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              {/* Restaurant Type */}
              <div>
                <label
                  htmlFor="restaurant-type"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Restaurant Type
                </label>

                <input
                  id="restaurant-type"
                  type="text"
                  value={form.type}
                  onChange={(event) =>
                    handleChange(
                      "type",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Cafe, Restaurant, Bakery"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              {/* Number of Tables */}
              <div>
                <label
                  htmlFor="number-of-tables"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Number of Tables
                </label>

                <div className="relative">
                  <Table2
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="number-of-tables"
                    type="number"
                    min={1}
                    max={1000}
                    value={form.numberOfTables}
                    onChange={(event) =>
                      handleChange(
                        "numberOfTables",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label
                  htmlFor="restaurant-address"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Address
                </label>

                <div className="relative">
                  <MapPin
                    size={17}
                    className="absolute left-4 top-4 text-slate-400"
                  />

                  <textarea
                    id="restaurant-address"
                    value={form.address}
                    onChange={(event) =>
                      handleChange(
                        "address",
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Enter complete restaurant address"
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label
                  htmlFor="restaurant-city"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  City
                </label>

                <input
                  id="restaurant-city"
                  type="text"
                  value={form.city}
                  onChange={(event) =>
                    handleChange(
                      "city",
                      event.target.value
                    )
                  }
                  placeholder="Enter city"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              {/* State */}
              <div>
                <label
                  htmlFor="restaurant-state"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  State
                </label>

                <input
                  id="restaurant-state"
                  type="text"
                  value={form.state}
                  onChange={(event) =>
                    handleChange(
                      "state",
                      event.target.value
                    )
                  }
                  placeholder="Enter state"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              {/* Pincode */}
              <div>
                <label
                  htmlFor="restaurant-pincode"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Pincode
                </label>

                <input
                  id="restaurant-pincode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(event) =>
                    handleChange(
                      "pincode",
                      event.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  placeholder="6 digit pincode"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Restaurant Status */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Store size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Restaurant Status
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Current status of your restaurant account.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {restaurant.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your restaurant is currently{" "}
                  <span className="font-medium text-slate-700">
                    {restaurant.status.toLowerCase()}
                  </span>
                  .
                </p>
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  restaurant.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    restaurant.status === "ACTIVE"
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                />

                {restaurant.status}
              </div>
            </div>
          </div>
        </section>

        {/* Account Security */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <KeyRound size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Account Security
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Change your account password securely.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordChange}>
            <div className="space-y-5 p-6">
              {/* Password Error */}
              {passwordError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className="mt-0.5 shrink-0 text-red-600"
                      size={19}
                    />

                    <p className="text-sm font-medium text-red-700">
                      {passwordError}
                    </p>
                  </div>
                </div>
              )}

              {/* Password Success */}
              {passwordSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-emerald-600"
                      size={19}
                    />

                    <p className="text-sm font-medium text-emerald-700">
                      {passwordSuccess}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-3">
                {/* Current Password */}
                <div>
                  <label
                    htmlFor="current-password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Current Password
                  </label>

                  <div className="relative">
                    <input
                      id="current-password"
                      type={
                        showCurrentPassword
                          ? "text"
                          : "password"
                      }
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(
                          event.target.value
                        )
                      }
                      placeholder="Current password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(
                          (current) => !current
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      aria-label={
                        showCurrentPassword
                          ? "Hide current password"
                          : "Show current password"
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      id="new-password"
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                      placeholder="New password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (current) => !current
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      aria-label={
                        showNewPassword
                          ? "Hide new password"
                          : "Show new password"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Minimum 8 characters.
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      placeholder="Confirm new password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) => !current
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Keep your account secure
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Never share your password with staff or
                      other users. Use a strong password that
                      is unique to your Restova account.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changingPassword ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <KeyRound size={17} />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}