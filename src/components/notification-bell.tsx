"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Phone,
  RefreshCw,
  Sprout,
  X,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  approveCallRequest,
  assetUrl,
  getFarmerCallRequests,
  rejectCallRequest,
} from "@/lib/api/client";
import type { CallRequest } from "@/types";

export function NotificationBell() {
  const t = useTranslations("CallNotifications");
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<CallRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; kind: "success" | "error" } | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchRequests = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await getFarmerCallRequests();
      if (response.success && response.data) {
        setRequests(response.data.requests || []);
        setPendingCount(response.data.pendingCount || 0);
      }
    } catch (err) {
      console.warn("Failed to fetch farmer call requests:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchRequests(true);
    }, 0);
    // Poll every 15 seconds for incoming buyer call requests
    const interval = setInterval(() => {
      void fetchRequests(true);
    }, 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Close panel on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    setNotice(null);
    try {
      const res = await approveCallRequest(id);
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)),
        );
        setPendingCount((prev) => Math.max(0, prev - 1));
        setNotice({ text: t("acceptSuccess"), kind: "success" });
      }
    } catch (err) {
      setNotice({
        text: err instanceof Error ? err.message : t("actionFailed"),
        kind: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    setNotice(null);
    try {
      const res = await rejectCallRequest(id);
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)),
        );
        setPendingCount((prev) => Math.max(0, prev - 1));
        setNotice({ text: t("rejectSuccess"), kind: "success" });
      }
    } catch (err) {
      setNotice({
        text: err instanceof Error ? err.message : t("actionFailed"),
        kind: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const displayedRequests = requests.filter((r) =>
    filter === "pending" ? r.status === "pending" : true,
  );

  return (
    <div className="notification-bell-container" ref={panelRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="icon-button notification-bell-button"
        aria-label={t("title")}
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          if (!open) fetchRequests();
        }}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: open ? "var(--cream)" : "transparent",
          border: "1px solid var(--line)",
          cursor: "pointer",
          color: "var(--ink)",
        }}
      >
        <Bell size={18} strokeWidth={1.8} />
        {pendingCount > 0 && (
          <span
            className="notification-badge"
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              padding: "0 4px",
              borderRadius: 9,
              background: "#d9534f",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            }}
          >
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="notification-dropdown-panel"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "min(390px, 92vw)",
            maxHeight: "80vh",
            background: "var(--paper, #fff)",
            border: "1px solid var(--line, #e1e5d9)",
            borderRadius: 12,
            boxShadow: "0 14px 38px rgba(24, 49, 35, 0.12), 0 4px 12px rgba(0,0,0,0.06)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--cream, #f1f0e7)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Phone size={16} strokeWidth={2} color="var(--forest, #203e2d)" />
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "var(--forest, #203e2d)" }}>
                {t("title")}
              </h3>
              {pendingCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    background: "#203e2d",
                    color: "#fff",
                    padding: "2px 6px",
                    borderRadius: 10,
                    fontWeight: 600,
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={() => fetchRequests()}
                className="icon-button"
                aria-label={t("refresh")}
                title={t("refresh")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "var(--muted)",
                }}
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="icon-button"
                aria-label={t("close")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "var(--muted)",
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Toast / Notification Notice */}
          {notice && (
            <div
              style={{
                padding: "8px 14px",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: notice.kind === "success" ? "#eef6e8" : "#fdf0ed",
                color: notice.kind === "success" ? "#285c25" : "#a82d24",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span>{notice.text}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "inherit",
                }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--line)",
              padding: "0 12px",
              background: "#fff",
            }}
          >
            <button
              type="button"
              onClick={() => setFilter("pending")}
              style={{
                padding: "10px 14px",
                fontSize: 12,
                fontWeight: filter === "pending" ? 600 : 400,
                color: filter === "pending" ? "var(--forest)" : "var(--muted)",
                borderBottom: filter === "pending" ? "2px solid var(--forest)" : "2px solid transparent",
                background: "transparent",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                cursor: "pointer",
              }}
            >
              {t("pendingTab", { count: pendingCount })}
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              style={{
                padding: "10px 14px",
                fontSize: 12,
                fontWeight: filter === "all" ? 600 : 400,
                color: filter === "all" ? "var(--forest)" : "var(--muted)",
                borderBottom: filter === "all" ? "2px solid var(--forest)" : "2px solid transparent",
                background: "transparent",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                cursor: "pointer",
              }}
            >
              {t("allTab")}
            </button>
          </div>

          {/* List of Request Cards */}
          <div
            style={{
              padding: "12px",
              overflowY: "auto",
              maxHeight: "360px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {displayedRequests.length === 0 ? (
              <div
                style={{
                  padding: "36px 16px",
                  textAlign: "center",
                  color: "var(--muted)",
                }}
              >
                <Clock size={28} strokeWidth={1.2} style={{ margin: "0 auto 8px" }} />
                <p style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>
                  {filter === "pending" ? t("emptyPending") : t("empty")}
                </p>
                <p style={{ fontSize: 12, marginTop: 4 }}>{t("emptyDesc")}</p>
              </div>
            ) : (
              displayedRequests.map((req) => {
                const isPending = req.status === "pending";
                const isApproved = req.status === "approved";
                const isRejected = req.status === "rejected";
                const isBusy = processingId === req.id;
                const buyerInitial = (req.buyer?.full_name || "B")[0].toUpperCase();
                const cropPhotoUrl = req.crop?.photos?.[0] ? assetUrl(req.crop.photos[0]) : null;

                return (
                  <article
                    key={req.id}
                    className="call-request-card"
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: isPending ? "1px solid #c2d8b0" : "1px solid var(--line)",
                      background: isPending ? "#f9fcf7" : "#fff",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      boxShadow: isPending ? "0 2px 6px rgba(32, 62, 45, 0.05)" : "none",
                    }}
                  >
                    {/* Buyer & Status Row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "var(--forest, #203e2d)",
                            color: "var(--lime, #d8ed9b)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {buyerInitial}
                        </div>
                        <div>
                          <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                            {req.buyer?.full_name || t("anonymousBuyer")}
                          </h4>
                          {(req.buyer?.city || req.buyer?.state) && (
                            <small style={{ fontSize: 11, color: "var(--muted)" }}>
                              {[req.buyer?.city, req.buyer?.state].filter(Boolean).join(", ")}
                            </small>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: isPending ? "#fef3c7" : isApproved ? "#dcfce7" : "#fee2e2",
                          color: isPending ? "#92400e" : isApproved ? "#166534" : "#991b1b",
                        }}
                      >
                        {isPending && <Clock size={11} />}
                        {isApproved && <CheckCircle2 size={11} />}
                        {isRejected && <XCircle size={11} />}
                        {isPending ? t("pending") : isApproved ? t("accepted") : t("rejected")}
                      </span>
                    </div>

                    {/* Linked Crop Info */}
                    {req.crop && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "var(--cream, #f1f0e7)",
                          padding: "6px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      >
                        {cropPhotoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={cropPhotoUrl}
                            alt=""
                            style={{ width: 24, height: 24, borderRadius: 4, objectFit: "cover" }}
                          />
                        ) : (
                          <Sprout size={14} color="var(--forest)" />
                        )}
                        <span style={{ fontWeight: 500, color: "var(--forest)" }}>
                          {req.crop.crop_name}
                        </span>
                        <span style={{ color: "var(--muted)", marginLeft: "auto" }}>
                          ₹{req.crop.price} / {req.crop.quantity_unit || "kg"}
                        </span>
                      </div>
                    )}

                    {/* Buyer Note */}
                    {req.buyer_note && (
                      <p style={{ fontSize: 12, color: "var(--ink)", fontStyle: "italic", margin: 0 }}>
                        &ldquo;{req.buyer_note}&rdquo;
                      </p>
                    )}

                    {/* Footer Row with Timestamp & Action Buttons */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 4,
                        borderTop: isPending ? "1px dashed #d5e6cb" : "none",
                      }}
                    >
                      <small style={{ fontSize: 10, color: "var(--muted)" }}>
                        {new Date(req.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>

                      {isPending && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleReject(req.id)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              background: "#fff",
                              border: "1px solid var(--line)",
                              color: "var(--muted)",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <X size={12} />
                            {t("reject")}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleApprove(req.id)}
                            style={{
                              padding: "4px 12px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              background: "var(--forest, #203e2d)",
                              border: "1px solid var(--forest, #203e2d)",
                              color: "var(--lime, #d8ed9b)",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <Check size={12} />
                            {isBusy ? t("saving") : t("accept")}
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
