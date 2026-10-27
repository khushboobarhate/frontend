import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  backend,
  clearSession,
  sameOrigin,
  saveSession,
  SESSION,
} from "@/lib/server/backend";
import type { UserProfile } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (request.method !== "GET" && !sameOrigin(request))
    return NextResponse.json(
      { success: false, message: "Request origin was not accepted." },
      { status: 403 },
    );
  const { path } = await params;
  if (
    path[0] !== "api" ||
    !["farmer", "buyer", "admin"].includes(path[1]) ||
    path.some(
      (part) => part === ".." || part.includes("/") || part.includes("\\"),
    )
  ) {
    return NextResponse.json(
      { success: false, message: "Endpoint not found." },
      { status: 404 },
    );
  }
  try {
    const type = request.headers.get("content-type") || "";
    if (
      type &&
      !/^(application\/json|multipart\/form-data|application\/x-www-form-urlencoded)(;|$)/i.test(
        type,
      )
    )
      return NextResponse.json(
        { success: false, message: "Use JSON or a multipart form." },
        { status: 415 },
      );
    const cropUpload =
      request.method === "POST" && path.join("/") === "api/farmer/crops";
    if (cropUpload) {
      if (!(await cookies()).has(SESSION.token))
        return NextResponse.json(
          { success: false, message: "Sign in before uploading crops." },
          { status: 401 },
        );
      const check = await backend("/api/farmer/profile");
      if (!check.ok)
        return NextResponse.json(
          {
            success: false,
            message: "An approved farmer account is required.",
          },
          { status: check.status },
        );
    }
    let body: ArrayBuffer | undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      const maximum = type.startsWith("multipart/form-data")
        ? (cropUpload ? 105 : 6) * 1024 * 1024
        : 64 * 1024;
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > maximum) {
            await reader.cancel();
            return NextResponse.json(
              { success: false, message: "The request is too large." },
              { status: 413 },
            );
          }
          chunks.push(value);
        }
      }
      const merged = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      body = merged.buffer;
    }
    const headers = new Headers();
    if (request.headers.has("content-type"))
      headers.set("content-type", request.headers.get("content-type")!);
    const response = await backend(
      `/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        ...(request.method !== "GET" && request.method !== "HEAD"
          ? { body }
          : {}),
      },
    );
    const json = await response.json();
    if (
      response.ok &&
      request.method === "POST" &&
      path.length === 3 &&
      path[2] === "login"
    ) {
      const data = json.data;
      const identity = data?.admin || data?.user;
      if (!data?.token || !identity || identity.role !== path[1])
        throw new Error("Invalid sign-in response.");
      const profile: UserProfile = {
        ...identity,
        email: identity.email || identity.login_id,
        is_approved: true,
        must_change_password: data.must_change_password === true,
      };
      const result = NextResponse.json({
        success: true,
        message: json.message,
        data: {
          expiresIn: data.expiresIn,
          must_change_password: profile.must_change_password,
          ...(profile.role === "admin"
            ? { admin: profile }
            : { user: profile }),
        },
      });
      result.headers.set("Cache-Control", "no-store");
      return saveSession(result, data.token, profile, data.expiresIn);
    }
    const result = NextResponse.json(json, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
    if (response.headers.has("retry-after"))
      result.headers.set("Retry-After", response.headers.get("retry-after")!);
    if (response.status === 401) clearSession(result);
    if (response.ok && path[2] === "change-password") clearSession(result);
    return result;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "We couldn’t reach SetuMoolya right now. Please try again shortly.",
      },
      { status: 502 },
    );
  }
}
export {
  proxy as GET,
  proxy as POST,
  proxy as PATCH,
  proxy as PUT,
  proxy as DELETE,
};
