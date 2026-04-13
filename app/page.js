import TrainerDashboard from "./trainer-dashboard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME, isAuthenticatedValue } from "../lib/auth";
import { getDashboardData } from "../lib/trainer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!isAuthenticatedValue(authCookie)) {
    redirect("/login");
  }

  return <TrainerDashboard dashboard={getDashboardData()} />;
}
