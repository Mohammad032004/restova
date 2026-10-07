import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";

export default async function RestaurantPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (!session.user.restaurantId) {
    redirect("/auth/login");
  }

  await connectDB();

  const restaurant = await Restaurant.findById(
    session.user.restaurantId
  ).lean();

  if (!restaurant) {
    redirect("/auth/login");
  }

  const location = [
    restaurant.address,
    restaurant.city,
    restaurant.state,
    restaurant.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            Restaurant Panel
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {session.user.name}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your restaurant operations from one place.
          </p>
        </div>

        {/* Restaurant Overview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
                  {restaurant.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {restaurant.name}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {restaurant.type}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Location
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {location}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                restaurant.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {restaurant.status}
            </span>
          </div>
        </section>

        {/* Basic Restaurant Information */}
        <section className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Restaurant Type
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              {restaurant.type}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Tables
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              {restaurant.numberOfTables}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Account Status
            </p>

            <p className="mt-2 text-lg font-bold text-emerald-600">
              {restaurant.status}
            </p>
          </div>
        </section>

        {/* Coming Modules */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Restaurant Operations
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your restaurant management modules will appear here.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Tables",
                description: "Manage tables and availability.",
              },
              {
                title: "Menu",
                description: "Manage categories and menu items.",
              },
              {
                title: "Orders",
                description: "Track and manage restaurant orders.",
              },
              {
                title: "Staff",
                description: "Manage your restaurant team.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="font-semibold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}