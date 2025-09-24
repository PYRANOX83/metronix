import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import EnhancedAdminDashboard from "./EnhancedDashboard";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return <EnhancedAdminDashboard />;
}