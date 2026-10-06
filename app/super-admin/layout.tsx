import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { authOptions } from "@/auth";
import SuperAdminShell from "./SuperAdminShell";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export default async function SuperAdminLayout({
  children,
}: SuperAdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/auth/login");
  }

  return <SuperAdminShell>{children}</SuperAdminShell>;
}