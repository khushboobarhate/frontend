import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

export default async function Page() {
  const cookieStore = await cookies();
  const saved = cookieStore.get("NEXT_LOCALE")?.value;
  const locale =
    saved && routing.locales.includes(saved as Locale)
      ? saved
      : routing.defaultLocale;
  redirect(`/${locale}/register`);
}
