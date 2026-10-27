import { redirect } from "next/navigation";
export default async function AdminEntry({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin/login`);
}
