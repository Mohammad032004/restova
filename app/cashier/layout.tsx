import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";

interface CashierLayoutProps {
  children: ReactNode;
}

export default async function CashierLayout({
  children,
}: CashierLayoutProps) {
  const session = await getServerSession(authOptions);

  // ------------------------------------------------------------
  // 1. Authentication
  // ------------------------------------------------------------

  if (!session?.user) {
    redirect("/auth/login");
  }

  // ------------------------------------------------------------
  // 2. Role authorization
  // ------------------------------------------------------------

  if (session.user.role !== "CASHIER") {
    redirect("/auth/login");
  }

  // ------------------------------------------------------------
  // 3. Restaurant association
  // ------------------------------------------------------------

  if (!session.user.restaurantId) {
    redirect("/auth/login");
  }

  // ------------------------------------------------------------
  // 4. Verify active restaurant
  // ------------------------------------------------------------

  await connectDB();

  const restaurant = await Restaurant.findOne({
    _id: session.user.restaurantId,
    status: "ACTIVE",
  })
    .select("_id name status")
    .lean();

  if (!restaurant) {
    redirect("/auth/login");
  }

  // ------------------------------------------------------------
  // 5. Render cashier panel
  // ------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              Restova
            </p>

            <h1 className="text-lg font-bold text-slate-900">
              {restaurant.name}
            </h1>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">
              {session.user.name || "Cashier"}
            </p>

            <p className="text-xs text-slate-500">
              Cashier
            </p>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}