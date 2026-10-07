import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import RestaurantShell from "./RestaurantShell";

interface RestaurantLayoutProps {
  children: ReactNode;
}

const ALLOWED_ROLES = ["RESTAURANT_OWNER", "MANAGER"];

export default async function RestaurantLayout({
  children,
}: RestaurantLayoutProps) {
  const session = await getServerSession(authOptions);

  // Authentication
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Authorization
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/auth/login");
  }

  // Restaurant association
  if (!session.user.restaurantId) {
    redirect("/auth/login");
  }

  await connectDB();

  // Verify restaurant
  const restaurant = await Restaurant.findById(
    session.user.restaurantId
  )
    .select("_id name status")
    .lean();

  if (!restaurant) {
    redirect("/auth/login");
  }

  // Restaurant must be active
  if (restaurant.status !== "ACTIVE") {
    redirect("/auth/login");
  }

  return (
    <RestaurantShell
      userName={session.user.name || "User"}
      userRole={session.user.role}
      restaurantName={restaurant.name}
    >
      {children}
    </RestaurantShell>
  );
}