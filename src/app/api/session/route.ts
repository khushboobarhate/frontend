import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  backend,
  clearSession,
  SESSION,
  sessionRole,
  sameOrigin,
} from "@/lib/server/backend";

export const dynamic = "force-dynamic";
export async function GET() {
  const role = await sessionRole();
  const cookieStore = await cookies();
  if (!role || !cookieStore.has(SESSION.token))
    return NextResponse.json({ user: null });
  try {
    const response = await backend(
      role === "admin"
        ? "/api/admin/dashboard?limit=1"
        : `/api/${role}/profile`,
    );
    if (response.status === 401 || response.status === 403)
      return clearSession(NextResponse.json({ user: null }));
    if (!response.ok)
      return NextResponse.json(
        { message: "Your session could not be checked. Please try again." },
        { status: 503 },
      );
    const json = await response.json();
    const user =
      role === "admin"
        ? JSON.parse(cookieStore.get(SESSION.user)?.value || "null")
        : json.data;
    return NextResponse.json(
      { user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { message: "We couldn’t connect. Please try again." },
      { status: 503 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ success: false }, { status: 403 });
  return clearSession(NextResponse.json({ success: true }));
}
