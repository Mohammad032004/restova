import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";

interface KitchenLayoutProps {
  children: ReactNode;
}

export default async function KitchenLayout({
  children,
}: KitchenLayoutProps) {
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

  if (session.user.role !== "KITCHEN") {
    redirect("/auth/login");
  }

  // ------------------------------------------------------------
  // 3. Restaurant authorization
  // ------------------------------------------------------------

  if (!session.user.restaurantId) {
    redirect("/auth/login");
  }

  // ------------------------------------------------------------
  // 4. Verify restaurant
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
  // 5. Kitchen shell
  // ------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between px-5 sm:px-7">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
              R
            </div>

            <div>
              <p className="text-base font-bold leading-tight text-slate-950">
                Restova
              </p>

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Kitchen
              </p>
            </div>
          </div>

          {/* Restaurant */}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {restaurant.name}
            </p>

            <p className="text-xs text-slate-500">
              Kitchen Panel
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main>{children}</main>
    </div>
  );
}