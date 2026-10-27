"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight, LoaderCircle, Sprout, X } from "lucide-react";
import { Link } from "@/i18n/routing";

export function Brand({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="SetuMoolya home"
    >
      <svg
        className="brand-symbol"
        viewBox="0 0 44 44"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 32c0-11 7-19 16-19s16 8 16 19M6 32h32M22 14v17"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M22 14C13 15 9 10 10 4c8 0 13 3 12 10ZM23 13C23 7 28 3 35 4c0 7-5 10-12 9Z"
          fill="currentColor"
        />
      </svg>
      <span>
        <strong>
          Setu<span>Moolya</span>
        </strong>
        {!compact && <small>EVERY ROOT DESERVES ITS WORTH</small>}
      </span>
    </Link>
  );
}
export function Botanical({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 230"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
        <path d="M80 220C95 163 98 99 125 17M86 193C50 172 28 153 13 116c34 8 63 34 73 77ZM95 159c34-12 53-35 65-67-33 8-55 33-65 67ZM104 111C74 94 61 73 61 43c25 13 41 37 43 68ZM115 66c25-6 42-23 52-48-25 5-42 21-52 48ZM80 220c-6-40-17-67-37-96M99 155c21-20 34-37 43-53M105 108c-18-29-29-49-38-58M118 61c19-20 29-29 43-38" />
      </g>
    </svg>
  );
}
export function FieldLines() {
  return (
    <svg viewBox="0 0 380 130" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.2">
        {[0, 1, 2, 3, 4, 5, 6].map((line) => (
          <path
            key={line}
            d={`M-20 ${135 - line * 12} Q110 ${-15 - line * 7} 220 ${75 - line * 8} T410 ${95 - line * 10}`}
          />
        ))}
      </g>
      <circle cx="290" cy="25" r="17" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <span className="loading-line" role="status">
      <LoaderCircle size={18} className="spin" />
      {label}
    </span>
  );
}
export function Notice({
  children,
  kind = "error",
}: {
  children: ReactNode;
  kind?: "error" | "success" | "info";
}) {
  return (
    <div
      className={`notice notice-${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Sprout size={30} strokeWidth={1.3} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    const previousOverflow = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`dialog ${wide ? "dialog-wide" : ""}`}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">SETUMOOLYA</span>
          <h2 id="dialog-title">{title}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ArrowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`text-link ${className}`}>
      {children}
      <ArrowRight size={17} />
    </Link>
  );
}
