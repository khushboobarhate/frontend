import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { UserProfile, UserRole } from "@/types";

const base = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");
export const SESSION = {
  token: "sm_access",
  role: "sm_role",
  user: "sm_identity",
};
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export async function backend(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = (await cookies()).get(SESSION.token)?.value;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${base}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
    redirect: "error",
  });
}
export function clearSession(response: NextResponse) {
  Object.values(SESSION).forEach((name) =>
    response.cookies.set(name, "", { ...cookieOptions, maxAge: 0 }),
  );
  return response;
}
export function saveSession(
  response: NextResponse,
  token: string,
  user: UserProfile,
  expiresIn: number,
) {
  const options = {
    ...cookieOptions,
    maxAge: Math.min(Math.max(expiresIn || 3600, 60), 86400),
  };
  response.cookies.set(SESSION.token, token, options);
  response.cookies.set(SESSION.role, user.role, options);
  // Identity always comes from the authenticated profile endpoint, never a cookie.
  response.cookies.set(SESSION.user, "", { ...cookieOptions, maxAge: 0 });
  return response;
}
export async function sessionRole(): Promise<UserRole | null> {
  const role = (await cookies()).get(SESSION.role)?.value;
  return role === "farmer" || role === "buyer" || role === "admin"
    ? role
    : null;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    // Next can normalize request.url to localhost. Host preserves the public
    // request authority, including a reverse proxy's public port.
    const source = new URL(origin);
    const target = new URL(request.url);
    return (
      source.host === (request.headers.get("host") || target.host) &&
      source.protocol === target.protocol
    );
  } catch {
    return false;
  }
}
