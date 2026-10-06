"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");
    setEmailError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const data = {
      restaurantName: formData.get("restaurantName"),
      restaurantType: formData.get("restaurantType"),
      numberOfTables: formData.get("numberOfTables"),

      ownerName: formData.get("ownerName"),
      email: formData.get("email"),
      phone: formData.get("phone"),

      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      pincode: formData.get("pincode"),
    };

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show duplicate email error directly under email field
        if (
          response.status === 409 &&
          typeof result.message === "string" &&
          result.message.toLowerCase().includes("email")
        ) {
          setEmailError(result.message);
          setLoading(false);
          return;
        }

        throw new Error(
          result.message || "Failed to submit application."
        );
      }

      setSuccess(
        "Your application has been submitted successfully. Our team will review it shortly."
      );

      form.reset();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
              R
            </div>

            <div>
              <p className="text-lg font-bold leading-none tracking-tight text-slate-950">
                Restova
              </p>

              <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Restaurant OS
              </p>
            </div>
          </Link>

          <Link
            href="/auth/login"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            Already have an account?{" "}
            <span className="font-semibold text-slate-950">
              Login
            </span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          {/* Heading */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Building2 size={22} />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Bring your restaurant to Restova
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Submit your restaurant details to get started. Our team will
              review your application before your Restova account is created.
            </p>
          </div>

          {/* Success */}
          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
              <CheckCircle2
                className="mt-0.5 shrink-0"
                size={20}
              />

              <div>
                <p className="font-semibold">
                  Application submitted
                </p>

                <p className="mt-1 text-sm">
                  {success}
                </p>
              </div>
            </div>
          )}

          {/* General Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Application Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            {/* Restaurant Information */}
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-950">
                  Restaurant information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tell us about the restaurant you want to manage with
                  Restova.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Restaurant Name */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="restaurantName"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Restaurant name
                  </label>

                  <input
                    id="restaurantName"
                    name="restaurantName"
                    type="text"
                    placeholder="e.g. The Food House"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </div>

                {/* Restaurant Type */}
                <div>
                  <label
                    htmlFor="restaurantType"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Restaurant type
                  </label>

                  <select
                    id="restaurantType"
                    name="restaurantType"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  >
                    <option value="" disabled>
                      Select type
                    </option>

                    <option value="restaurant">Restaurant</option>
                    <option value="cafe">Cafe</option>
                    <option value="fast-food">Fast Food</option>
                    <option value="bakery">Bakery</option>
                    <option value="cloud-kitchen">
                      Cloud Kitchen
                    </option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Number of Tables */}
                <div>
                  <label
                    htmlFor="numberOfTables"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Number of tables
                  </label>

                  <input
                    id="numberOfTables"
                    name="numberOfTables"
                    type="number"
                    min="1"
                    placeholder="e.g. 20"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </div>
              </div>
            </div>

            <div className="my-8 border-t border-slate-100" />

            {/* Owner Information */}
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-950">
                  Owner information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  These details will be used to contact the restaurant
                  owner.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Owner Name */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="ownerName"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Owner name
                  </label>

                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="ownerName"
                      name="ownerName"
                      type="text"
                      placeholder="Full name"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                        emailError
                          ? "text-red-500"
                          : "text-slate-400"
                      }`}
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="owner@example.com"
                      required
                      onChange={() => {
                        if (emailError) {
                          setEmailError("");
                        }
                      }}
                      className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                        emailError
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                          : "border-slate-200 focus:border-slate-950 focus:ring-slate-950/10"
                      }`}
                    />
                  </div>

                  {/* Email Error */}
                  {emailError && (
                    <div className="mt-2 flex items-start gap-2 text-sm text-red-600">
                      <span className="mt-0.5">●</span>

                      <p>{emailError}</p>
                    </div>
                  )}

                  {!emailError && (
                    <p className="mt-2 text-xs text-slate-400">
                      This email will be used for your Restova owner
                      account.
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Phone number
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="my-8 border-t border-slate-100" />

            {/* Location */}
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-950">
                  Restaurant location
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Where is your restaurant located?
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Address */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Address
                  </label>

                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-3.5 top-3.5 text-slate-400"
                    />

                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      placeholder="Enter complete restaurant address"
                      required
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Lucknow"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </div>

                {/* State */}
                <div>
                  <label
                    htmlFor="state"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    State
                  </label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    placeholder="Uttar Pradesh"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label
                    htmlFor="pincode"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    PIN code
                  </label>

                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    inputMode="numeric"
                    placeholder="226010"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </div>
              </div>
            </div>

            <div className="my-8 border-t border-slate-100" />

            {/* Terms */}
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="terms"
                required
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
              />

              <span className="text-sm leading-6 text-slate-600">
                I confirm that the information provided above is accurate
                and I agree to the Restova application and onboarding
                process.
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Submitting Application..."
                : "Submit Application"}

              {!loading && <CheckCircle2 size={18} />}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Your application will be reviewed by the Restova Super Admin
              before your restaurant account is created.
            </p>
          </form>

          {/* Back */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Back to Restova
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}