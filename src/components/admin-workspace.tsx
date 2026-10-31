"use client";
import { useCallback, useState } from "react";
import { Avatar } from "./avatar";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  approveRequest,
  correctEmail,
  getCallLogs,
  getRequestDetail,
  getRequests,
  getUsers,
  getRevokedUsers,
  revokeUserAccess,
  rejectRequest,
  resendCredentials,
} from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import type {
  MemberRole,
  Pagination,
  RegistrationStatus,
  RevokedAccount,
  UserProfile,
} from "@/types";
import { EmptyState, Modal, Notice, Spinner } from "./ui";
import { useResource } from "./use-resource";

export function PaginationControls({
  pagination,
  onPage,
}: {
  pagination: Pagination;
  onPage: (page: number) => void;
}) {
  const tCommon = useTranslations("Common");
  return (
    <div className="pagination">
      <span>{tCommon("results", { count: pagination.total })}</span>
      <div>
        <button
          aria-label={tCommon("previousPage")}
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          <ChevronLeft size={14} />
        </button>
        <span>
          {tCommon("pageOf", {
            page: pagination.page,
            totalPages: Math.max(pagination.totalPages, 1),
          })}
        </span>
        <button
          aria-label={tCommon("nextPage")}
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function RequestPanel({
  overview = false,
  onChanged,
}: {
  overview?: boolean;
  onChanged?: () => void;
}) {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const [status, setStatus] = useState<RegistrationStatus | "all">("pending");
  const [role, setRole] = useState<MemberRole | "">("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const fetcher = useCallback(
    () => getRequests({ status, role: role || undefined, page, limit: 12 }),
    [status, role, page],
  );
  const result = useResource(fetcher);
  const requests =
    result.data?.data.requests.filter((item) =>
      `${item.full_name} ${item.email} ${item.city}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) || [];

  const statusLabel = (val: RegistrationStatus | "all") => {
    switch (val) {
      case "all":
        return t("requests.allRequests");
      case "pending":
        return t("requests.pending");
      case "approved":
        return t("requests.approved");
      case "rejected":
        return t("requests.rejected");
    }
  };

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>
              {overview
                ? t("requests.overviewTitle")
                : t("requests.panelTitle")}
            </h2>
            <p>{t("requests.subtitle")}</p>
          </div>
          <button
            className="icon-button"
            aria-label={t("requests.refreshAria")}
            onClick={result.reload}
            disabled={result.isLoading}
          >
            <RefreshCw size={15} />
          </button>
        </div>
        {message && <Notice kind="info">{message}</Notice>}
        <div className="toolbar">
          <div className="filter-tabs" aria-label="Request status">
            {(["pending", "approved", "rejected", "all"] as const).map(
              (value) => (
                <button
                  key={value}
                  className={status === value ? "selected" : ""}
                  onClick={() => {
                    setStatus(value);
                    setPage(1);
                  }}
                >
                  {statusLabel(value)}
                </button>
              ),
            )}
          </div>
          <label className="search-input">
            <Search />
            <input
              aria-label={t("requests.searchAria")}
              placeholder={t("requests.searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="sr-only">{t("requests.allRoles")}</span>
            <select
              aria-label={t("requests.allRoles")}
              value={role}
              onChange={(event) => {
                setRole(event.target.value as MemberRole | "");
                setPage(1);
              }}
              style={{ padding: "9px 12px", minHeight: 35, fontSize: 14 }}
            >
              <option value="">{t("requests.allRoles")}</option>
              <option value="farmer">{t("requests.farmers")}</option>
              <option value="buyer">{t("requests.buyers")}</option>
            </select>
          </label>
        </div>
        {result.error ? (
          <Notice>
            {result.error}
            <button onClick={result.reload} className="text-link">
              {tCommon("tryAgain")}
              <RefreshCw size={13} />
            </button>
          </Notice>
        ) : result.isLoading ? (
          <div className="workspace-loading">
            <Spinner label={t("requests.loading")} />
          </div>
        ) : !requests.length ? (
          <EmptyState
            title={
              search ? t("requests.noSearchTitle") : t("requests.emptyTitle")
            }
            description={
              search ? t("requests.noSearchDesc") : t("requests.emptyDesc")
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("requests.applicant")}</th>
                  <th>{t("requests.role")}</th>
                  <th>{t("requests.location")}</th>
                  <th>{t("requests.submitted")}</th>
                  <th>{t("requests.status")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {requests.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-person">
                        <Avatar name={item.full_name} photo={item.photo_url} />
                        <div>
                          <strong>{item.full_name}</strong>
                          <small>
                            {item.email || t("requests.emailNeeded")}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {item.role === "farmer"
                        ? t("requests.farmers")
                        : t("requests.buyers")}
                    </td>
                    <td>
                      {[item.city, item.state].filter(Boolean).join(", ") ||
                        "—"}
                    </td>
                    <td>
                      {item.created_at ? formatDate(item.created_at) : "—"}
                    </td>
                    <td>
                      <span className={`badge badge-${item.status}`}>
                        {item.status === "pending"
                          ? t("requests.pending")
                          : item.status === "approved"
                            ? t("requests.approved")
                            : t("requests.rejected")}
                      </span>
                    </td>
                    <td>
                      <button
                        className="table-action"
                        onClick={() => setSelected(item.id)}
                      >
                        {t("requests.review")}
                        <ArrowUpRight />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {result.data && !result.isLoading && (
          <PaginationControls
            pagination={result.data.data.pagination}
            onPage={setPage}
          />
        )}
      </section>
      {selected && (
        <RequestDialog
          id={selected}
          onClose={() => setSelected(null)}
          onUpdated={(msg) => {
            setMessage(msg);
            result.reload();
            onChanged?.();
          }}
        />
      )}
    </>
  );
}

function RequestDialog({
  id,
  onClose,
  onUpdated,
}: {
  id: string;
  onClose: () => void;
  onUpdated: (message: string) => void;
}) {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const fetcher = useCallback(() => getRequestDetail(id), [id]);
  const result = useResource(fetcher);
  const request = result.data?.data;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [editedEmail, setEmail] = useState<string | null>(null);
  const email = editedEmail ?? request?.email ?? "";

  const act = async (kind: "approve" | "reject" | "resend" | "email") => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (kind === "email") {
        await correctEmail(id, email.trim());
        setNotice(t("dialog.emailCorrection.success"));
        onUpdated(t("dialog.emailCorrection.notification"));
      } else if (kind === "reject") {
        if (!reason.trim()) throw new Error(t("dialog.rejection.error"));
        const response = await rejectRequest(id, reason.trim());
        const msg = response.message || t("dialog.messages.rejected");
        setNotice(msg);
        onUpdated(msg);
        setRejecting(false);
      } else {
        const response = await (kind === "approve"
          ? approveRequest(id)
          : resendCredentials(id));
        const message =
          response.message ||
          (response.data?.email_sent
            ? t("dialog.messages.approvedWithEmail")
            : t("dialog.messages.approvedNoEmail"));
        setNotice(message);
        onUpdated(message);
      }
      result.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  const langNames: Record<string, string> = {
    en: tCommon("english"),
    hi: tCommon("hindi"),
    gu: tCommon("gujarati"),
    mr: tCommon("marathi"),
  };

  const details = request
    ? [
        [
          t("dialog.labels.email"),
          request.email || t("dialog.labels.notProvided"),
        ],
        [t("dialog.labels.contactNumber"), request.mobile_number],
        [t("dialog.labels.age"), request.age || t("dialog.labels.notProvided")],
        [
          t("dialog.labels.nationality"),
          request.nationality || t("dialog.labels.notProvided"),
        ],
        [t("dialog.labels.state"), request.state],
        [t("dialog.labels.city"), request.city],
        [
          t("dialog.labels.taluka"),
          request.taluka || t("dialog.labels.notProvided"),
        ],
        [
          t("dialog.labels.language"),
          langNames[request.preferred_language || "en"] ||
            request.preferred_language ||
            "en",
        ],
        [t("dialog.labels.fullAddress"), request.full_address],
        ...(request.role === "farmer"
          ? [[t("dialog.labels.farmLocation"), request.land_location]]
          : []),
      ]
    : [];

  return (
    <Modal
      title={t("dialog.title")}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {result.isLoading ? (
        <Spinner />
      ) : result.error ? (
        <Notice>{result.error}</Notice>
      ) : (
        request && (
          <>
            {error && <Notice>{error}</Notice>}
            {notice && <Notice kind="info">{notice}</Notice>}
            <div className="request-person">
              <Avatar name={request.full_name} photo={request.photo_url} />
              <div>
                <h3>{request.full_name}</h3>
                <p>
                  {t("dialog.appSubtitle", {
                    role:
                      request.role === "farmer"
                        ? t("requests.farmers")
                        : t("requests.buyers"),
                    date: request.created_at
                      ? formatDate(request.created_at)
                      : "",
                  })}
                </p>
              </div>
            </div>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span className={`badge badge-${request.status}`}>
                {request.status === "pending"
                  ? t("requests.pending")
                  : request.status === "approved"
                    ? t("requests.approved")
                    : t("requests.rejected")}
              </span>
              {request.status === "approved" && (
                <span
                  className={`badge badge-${request.credentials_email_status}`}
                >
                  {t("dialog.emailStatus", {
                    status:
                      request.credentials_email_status ||
                      t("dialog.emailPending"),
                  })}
                </span>
              )}
            </div>
            <dl className="detail-grid">
              {details.map(([label, value]) => (
                <div
                  key={label}
                  className={
                    label === t("dialog.labels.fullAddress") ||
                    label === t("dialog.labels.farmLocation")
                      ? "full-span"
                      : ""
                  }
                >
                  <dt>{label}</dt>
                  <dd>{value || "—"}</dd>
                </div>
              ))}
            </dl>
            {request.status === "pending" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void act("email");
                }}
                className="form-stack"
              >
                <label className="field" htmlFor="correct-email">
                  <span>
                    {t("dialog.emailCorrection.label")}
                    <small>{t("dialog.emailCorrection.hint")}</small>
                  </span>
                  <input
                    id="correct-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="applicant@example.com"
                  />
                </label>
                {email !== (request.email || "") && (
                  <button
                    className="button button-outline button-small"
                    disabled={busy}
                  >
                    {t("dialog.emailCorrection.button")}
                    <Check size={14} />
                  </button>
                )}
              </form>
            )}
            {request.rejection_reason && (
              <Notice kind="info">
                {t("dialog.rejection.reasonLabel", {
                  reason: request.rejection_reason,
                })}
              </Notice>
            )}
            {rejecting && (
              <div style={{ marginTop: 20 }}>
                <label className="field" htmlFor="rejection-reason">
                  <span>{t("dialog.rejection.question")}</span>
                  <textarea
                    id="rejection-reason"
                    rows={3}
                    maxLength={2000}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={t("dialog.rejection.placeholder")}
                  />
                </label>
              </div>
            )}
            <div className="dialog-actions">
              {request.status === "pending" && !rejecting && (
                <>
                  <button
                    className="button"
                    disabled={
                      busy ||
                      request.is_processing ||
                      !request.email ||
                      email.trim().toLowerCase() !== request.email.toLowerCase()
                    }
                    onClick={() => void act("approve")}
                  >
                    {busy ? (
                      <Spinner label={t("dialog.actions.approving")} />
                    ) : (
                      <>
                        <ShieldCheck size={15} />
                        {t("dialog.actions.approve")}
                      </>
                    )}
                  </button>
                  <button
                    className="button button-outline"
                    disabled={busy}
                    onClick={() => setRejecting(true)}
                  >
                    {t("dialog.actions.reject")}
                    <X size={14} />
                  </button>
                </>
              )}
              {rejecting && (
                <>
                  <button
                    className="button button-danger"
                    disabled={busy || !reason.trim()}
                    onClick={() => void act("reject")}
                  >
                    {busy ? (
                      <Spinner label={t("dialog.rejection.rejecting")} />
                    ) : (
                      t("dialog.rejection.rejectButton")
                    )}
                  </button>
                  <button
                    className="button button-outline"
                    disabled={busy}
                    onClick={() => setRejecting(false)}
                  >
                    {t("dialog.rejection.cancel")}
                  </button>
                </>
              )}
              {request.status === "approved" && (
                <button
                  className="button"
                  disabled={busy || request.is_processing}
                  onClick={() => void act("resend")}
                >
                  {busy ? (
                    <Spinner label={t("dialog.actions.resending")} />
                  ) : (
                    <>
                      <Mail size={16} />
                      {t("dialog.actions.resend")}
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="muted" style={{ marginTop: 15, fontSize: 14 }}>
              {t("dialog.note")}
            </p>
          </>
        )
      )}
    </Modal>
  );
}

export function AdminMetrics() {
  const t = useTranslations("Admin");
  const fetcher = useCallback(async () => {
    const [requests, farmers, buyers] = await Promise.all([
      getRequests({ status: "pending", limit: 1 }),
      getUsers("farmer"),
      getUsers("buyer"),
    ]);
    return {
      requests: requests.data.pagination.total,
      farmers: farmers.data.total,
      buyers: buyers.data.total,
    };
  }, []);
  const result = useResource(fetcher);
  return (
    <>
      {result.error && <Notice>{result.error}</Notice>}
      <div className="metric-grid">
        {[
          {
            label: t("metrics.awaitingReview"),
            value: result.data?.requests,
            note: t("metrics.awaitingReviewNote"),
            Icon: ClipboardList,
          },
          {
            label: t("metrics.approvedFarmers"),
            value: result.data?.farmers,
            note: t("metrics.approvedFarmersNote"),
            Icon: Sprout,
          },
          {
            label: t("metrics.approvedBuyers"),
            value: result.data?.buyers,
            note: t("metrics.approvedBuyersNote"),
            Icon: Users,
          },
        ].map(({ label, value, note, Icon }) => (
          <div className="metric" key={label}>
            <div className="metric-header">
              {label}
              <Icon />
            </div>
            <strong>{result.isLoading ? "—" : (value ?? "—")}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
    </>
  );
}

function RevokeUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserProfile;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const [selectedReason, setSelectedReason] = useState<string>("Fake User");
  const [customReason, setCustomReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const PREDEFINED_REASONS = [
    {
      id: "fake",
      label: t("people.revocationModal.reasons.fake") || "Fake User",
    },
    {
      id: "fraud",
      label: t("people.revocationModal.reasons.fraud") || "Fraudulent Activity",
    },
    {
      id: "incorrect",
      label:
        t("people.revocationModal.reasons.incorrect") ||
        "Incorrect Information",
    },
    {
      id: "suspicious",
      label:
        t("people.revocationModal.reasons.suspicious") || "Suspicious Account",
    },
    {
      id: "violation",
      label:
        t("people.revocationModal.reasons.violation") ||
        "Violation of Platform Policies",
    },
    {
      id: "other",
      label:
        t("people.revocationModal.reasons.other") ||
        "Other (custom description)",
    },
  ];

  const handleConfirm = async () => {
    setError("");
    let finalReason = selectedReason;
    if (selectedReason === "Other" || selectedReason.startsWith("Other")) {
      finalReason = customReason.trim();
    } else if (customReason.trim()) {
      finalReason = `${selectedReason} — ${customReason.trim()}`;
    }

    if (!finalReason || finalReason.trim().length < 3) {
      setError(
        t("people.revocationModal.errorRequired") ||
          "A mandatory reason for account removal must be provided.",
      );
      return;
    }

    setBusy(true);
    try {
      const res = await revokeUserAccess(user.id, finalReason.trim());
      onSuccess(
        res.message ||
          t("people.revocationModal.success") ||
          "User access revoked and account deleted successfully.",
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={
        t("people.revocationModal.title") || "Revoke Access / Delete Account"
      }
      onClose={onClose}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <Notice kind="info">{t("people.revocationModal.warning")}</Notice>

        {error && <Notice>{error}</Notice>}

        <div
          style={{
            backgroundColor: "var(--background-soft, #f8fafc)",
            border: "1px solid var(--border-soft, #e2e8f0)",
            borderRadius: "10px",
            padding: "16px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                color: "var(--text-muted, #64748b)",
              }}
            >
              {t("people.revocationModal.name")}
            </span>
            <p
              style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: "600" }}
            >
              {user.full_name}
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                color: "var(--text-muted, #64748b)",
              }}
            >
              {t("people.revocationModal.userType")}
            </span>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "14px",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {user.role === "farmer"
                ? t("people.farmers")
                : t("people.buyers")}
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                color: "var(--text-muted, #64748b)",
              }}
            >
              {t("people.revocationModal.mobile")}
            </span>
            <p
              style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: "600" }}
            >
              {user.mobile_number || "—"}
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                color: "var(--text-muted, #64748b)",
              }}
            >
              {t("people.revocationModal.email")}
            </span>
            <p
              style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: "600" }}
            >
              {user.email || "—"}
            </p>
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "700",
              marginBottom: "8px",
            }}
          >
            {t("people.revocationModal.reasonHeading")}{" "}
            <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            {PREDEFINED_REASONS.map((item) => (
              <label
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  border: "1px solid",
                  borderColor:
                    selectedReason === item.label
                      ? "#dc2626"
                      : "var(--border-soft, #e2e8f0)",
                  borderRadius: "8px",
                  backgroundColor:
                    selectedReason === item.label ? "#fff1f2" : "transparent",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: selectedReason === item.label ? "600" : "normal",
                  color: selectedReason === item.label ? "#991b1b" : "inherit",
                }}
              >
                <input
                  type="radio"
                  name="revocation_reason"
                  value={item.label}
                  checked={selectedReason === item.label}
                  onChange={() => setSelectedReason(item.label)}
                />
                {item.label}
              </label>
            ))}
          </div>

          <label className="field" htmlFor="custom-revocation-reason">
            <span style={{ fontSize: "12px", fontWeight: "600" }}>
              {selectedReason.startsWith("Other")
                ? `${t("people.revocationModal.customDetailsLabel")} *`
                : t("people.revocationModal.customDetailsLabel")}
            </span>
            <textarea
              id="custom-revocation-reason"
              rows={3}
              maxLength={2000}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={t("people.revocationModal.customPlaceholder")}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border-soft, #e2e8f0)",
                fontSize: "14px",
              }}
            />
          </label>
        </div>

        <div
          className="dialog-actions"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          <button
            type="button"
            className="button button-outline"
            onClick={onClose}
            disabled={busy}
          >
            {t("people.revocationModal.cancel")}
          </button>
          <button
            type="button"
            className="button"
            style={{
              backgroundColor: "#dc2626",
              borderColor: "#dc2626",
              color: "#ffffff",
            }}
            disabled={busy}
            onClick={handleConfirm}
          >
            {busy ? (
              <Spinner label={t("people.revocationModal.confirming")} />
            ) : (
              <>
                <ShieldAlert size={16} />
                {t("people.revocationModal.confirm")}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function PeoplePanel() {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const [activeTab, setActiveTab] = useState<"approved" | "revoked">(
    "approved",
  );
  const [role, setRole] = useState<MemberRole | "">("farmer");
  const [page, setPage] = useState(1);
  const [revokeTarget, setRevokeTarget] = useState<UserProfile | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const approvedFetcher = useCallback(
    () => getUsers((role || "farmer") as MemberRole, page, "approved"),
    [role, page],
  );
  const revokedFetcher = useCallback(
    () => getRevokedUsers(role ? (role as MemberRole) : undefined, page),
    [role, page],
  );

  const approvedResult = useResource(approvedFetcher);
  const revokedResult = useResource(revokedFetcher);
  const currentResult =
    activeTab === "approved" ? approvedResult : revokedResult;

  const handleRevokeSuccess = (msg: string) => {
    setNotice(msg);
    approvedResult.reload();
    revokedResult.reload();
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t("people.title")}</h2>
          <p>{t("people.subtitle")}</p>
        </div>
        <button
          className="icon-button"
          aria-label={t("people.refreshAria")}
          onClick={currentResult.reload}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {notice && <Notice kind="info">{notice}</Notice>}

      <div
        className="toolbar"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          justifyContent: "space-between",
        }}
      >
        <div className="filter-tabs">
          <button
            className={activeTab === "approved" ? "selected" : ""}
            onClick={() => {
              setActiveTab("approved");
              if (!role) setRole("farmer");
              setPage(1);
              setNotice(null);
            }}
          >
            {t("people.activeTab")}
          </button>
          <button
            className={activeTab === "revoked" ? "selected" : ""}
            onClick={() => {
              setActiveTab("revoked");
              setPage(1);
              setNotice(null);
            }}
          >
            {t("people.revokedTab")}
          </button>
        </div>

        <div className="filter-tabs">
          {activeTab === "revoked" && (
            <button
              className={role === "" ? "selected" : ""}
              onClick={() => {
                setRole("");
                setPage(1);
              }}
            >
              {t("people.allRoles")}
            </button>
          )}
          {(["farmer", "buyer"] as const).map((value) => (
            <button
              className={role === value ? "selected" : ""}
              onClick={() => {
                setRole(value);
                setPage(1);
              }}
              key={value}
            >
              {value === "farmer" ? t("people.farmers") : t("people.buyers")}
            </button>
          ))}
        </div>
      </div>

      {currentResult.error ? (
        <Notice>{currentResult.error}</Notice>
      ) : currentResult.isLoading ? (
        <div className="workspace-loading">
          <Spinner label={t("people.loading")} />
        </div>
      ) : activeTab === "approved" ? (
        !approvedResult.data?.data?.users?.length ? (
          <EmptyState
            title={t("people.emptyTitle")}
            description={t("people.emptyDesc")}
          />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("people.member")}</th>
                    <th>{t("people.location")}</th>
                    <th>{t("people.contact")}</th>
                    <th>{t("people.joined")}</th>
                    <th>{t("people.status")}</th>
                    <th>{tCommon("action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedResult.data.data.users.map((user: UserProfile) => (
                    <tr key={user.id}>
                      <td>
                        <div className="table-person">
                          <Avatar
                            name={user.full_name}
                            photo={user.photo_url}
                          />
                          <div>
                            <strong>{user.full_name}</strong>
                            <small>{user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {[user.city, user.state].filter(Boolean).join(", ") ||
                          "—"}
                      </td>
                      <td>{user.mobile_number || "—"}</td>
                      <td>
                        {user.created_at ? formatDate(user.created_at) : "—"}
                      </td>
                      <td>
                        <span className="badge badge-approved">
                          {t("people.approved")}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="button button-outline"
                          style={{
                            color: "#b91c1c",
                            borderColor: "#fca5a5",
                            backgroundColor: "#fff5f5",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            gap: "6px",
                          }}
                          onClick={() => setRevokeTarget(user)}
                          title={t("people.revokeButton")}
                        >
                          <ShieldAlert size={14} />
                          {t("people.revokeButton")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              pagination={approvedResult.data.data}
              onPage={setPage}
            />
          </>
        )
      ) : !revokedResult.data?.data?.revoked_users?.length ? (
        <EmptyState
          title={t("people.emptyRevokedTitle")}
          description={t("people.emptyRevokedDesc")}
        />
      ) : (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("people.member")}</th>
                  <th>{t("people.location")}</th>
                  <th>{t("people.contact")}</th>
                  <th>{t("people.removalDate")}</th>
                  <th>{t("people.status")}</th>
                  <th>{t("people.removalReason")}</th>
                </tr>
              </thead>
              <tbody>
                {revokedResult.data.data.revoked_users.map(
                  (user: RevokedAccount) => (
                    <tr key={user.id || user.user_id}>
                      <td>
                        <div className="table-person">
                          <Avatar name={user.full_name} />
                          <div>
                            <strong>{user.full_name}</strong>
                            <small>{user.email}</small>
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: "3px",
                                fontSize: "11px",
                                fontWeight: "600",
                                textTransform: "capitalize",
                                color: "var(--text-muted, #64748b)",
                              }}
                            >
                              {user.role === "farmer"
                                ? t("people.farmers")
                                : t("people.buyers")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {[user.metadata?.city, user.metadata?.state]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>
                      <td>{user.mobile_number || "—"}</td>
                      <td>
                        {user.revoked_at ? formatDate(user.revoked_at) : "—"}
                      </td>
                      <td>
                        <span className="badge badge-rejected">
                          {t("people.revoked")}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            backgroundColor: "#fff1f2",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: "#991b1b",
                            maxWidth: "280px",
                            wordBreak: "break-word",
                          }}
                        >
                          {user.reason}
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            pagination={revokedResult.data.data}
            onPage={setPage}
          />
        </>
      )}

      {revokeTarget && (
        <RevokeUserModal
          user={revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onSuccess={handleRevokeSuccess}
        />
      )}
    </section>
  );
}

export function CallActivity() {
  const t = useTranslations("Admin");
  const result = useResource(useCallback(() => getCallLogs(), []));

  const callStatusLabel = (status: string) => {
    switch (status) {
      case "permitted":
        return t("calls.permitted");
      case "blocked_no_interest":
        return t("calls.blockedNoInterest");
      case "blocked_receiver_unavailable":
        return t("calls.blockedUnavailable");
      default:
        return status.replaceAll("_", " ");
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t("calls.title")}</h2>
          <p>{t("calls.subtitle")}</p>
        </div>
        <button
          className="icon-button"
          onClick={result.reload}
          aria-label={t("calls.refreshAria")}
        >
          <RefreshCw size={15} />
        </button>
      </div>
      {result.error ? (
        <Notice>{result.error}</Notice>
      ) : result.isLoading ? (
        <Spinner />
      ) : !result.data?.data.length ? (
        <EmptyState
          title={t("calls.emptyTitle")}
          description={t("calls.emptyDesc")}
        />
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("calls.date")}</th>
                <th>{t("calls.from")}</th>
                <th>{t("calls.to")}</th>
                <th>{t("calls.result")}</th>
              </tr>
            </thead>
            <tbody>
              {result.data.data.map((call) => (
                <tr key={call.id}>
                  <td>{formatDate(call.created_at)}</td>
                  <td>
                    {call.caller_role === "farmer"
                      ? t("people.farmers")
                      : t("people.buyers")}
                    <small style={{ display: "block", marginTop: 5 }}>
                      {call.caller_id.slice(0, 8)}
                    </small>
                  </td>
                  <td>
                    {call.receiver_role === "farmer"
                      ? t("people.farmers")
                      : t("people.buyers")}
                    <small style={{ display: "block", marginTop: 5 }}>
                      {call.receiver_id.slice(0, 8)}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`badge ${call.status === "permitted" ? "badge-approved" : "badge-pending"}`}
                    >
                      {callStatusLabel(call.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
