"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/context";
import { Avatar } from "./avatar";
export function AvatarMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  if (!user) return null;
  const signOut = async () => {
    setBusy(true);
    setError("");
    try {
      await logout();
      setOpen(false);
      router.replace(
        user.role === "admin" ? "/admin/login" : `/login?role=${user.role}`,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not sign out. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="avatar-menu"
      ref={wrapper}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setOpen(false);
      }}
    >
      <button
        className="avatar-trigger"
        ref={trigger}
        aria-label="Open account menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <Avatar name={user.full_name} photo={user.photo_url} />
        <span className="avatar-trigger-name">
          {user.full_name}
          <small>
            {user.role === "admin"
              ? "Administrator"
              : user.role === "farmer"
                ? "Farmer"
                : "Buyer"}
          </small>
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div
          className="avatar-dropdown"
          id={id}
          role="group"
          aria-label="Account actions"
        >
          <div className="avatar-menu-identity">
            <strong>{user.full_name}</strong>
            <span>{user.email}</span>
          </div>
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <LayoutDashboard size={18} />
            My workspace
          </Link>
          <Link href="/dashboard?view=account" onClick={() => setOpen(false)}>
            <Settings size={18} />
            My account
          </Link>
          <button onClick={() => void signOut()} disabled={busy}>
            <LogOut size={18} />
            {busy ? "Signing out…" : "Sign out"}
          </button>
          {error && (
            <p className="avatar-menu-error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
