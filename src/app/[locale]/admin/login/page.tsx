import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";
export const metadata: Metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false },
};
export default function AdminLogin() {
  return <LoginForm adminMode />;
}
