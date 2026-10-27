import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { SESSION, sessionRole } from "@/lib/server/backend";
export const dynamic = "force-dynamic";
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(await cookies()).has(SESSION.token) || !(await sessionRole()))
    redirect(`/${locale}/login`);
  // Workspace restoration validates the role with the authenticated backend.
  return <Workspace />;
}
