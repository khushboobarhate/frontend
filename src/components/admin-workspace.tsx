"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Sprout,
  Users,
  X,
} from "lucide-react";
import {
  approveRequest,
  assetUrl,
  correctEmail,
  getCallLogs,
  getRequestDetail,
  getRequests,
  getUsers,
  rejectRequest,
  resendCredentials,
} from "@/lib/api/client";
import { formatDate, getInitials } from "@/lib/utils";
import type {
  MemberRole,
  Pagination,
  RegistrationRequest,
  RegistrationStatus,
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
  return (
    <div className="pagination">
      <span>
        {pagination.total} {pagination.total === 1 ? "result" : "results"}
      </span>
      <div>
        <button
          aria-label="Previous page"
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          <ChevronLeft size={14} />
        </button>
        <span>
          Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
        </span>
        <button
          aria-label="Next page"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
export function Avatar({
  name,
  photo,
}: {
  name: string;
  photo?: string | null;
}) {
  const url = assetUrl(photo);
  return (
    <div className="user-avatar">
      {url ? (
        <Image src={url} alt="" width={60} height={60} unoptimized />
      ) : (
        getInitials(name)
      )}
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
  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>
              {overview ? "Your registration inbox" : "Registration requests"}
            </h2>
            <p>Every new connection begins with a thoughtful review.</p>
          </div>
          <button
            className="icon-button"
            aria-label="Refresh registrations"
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
                  {value === "all"
                    ? "All requests"
                    : value[0].toUpperCase() + value.slice(1)}
                </button>
              ),
            )}
          </div>
          <label className="search-input">
            <Search />
            <input
              aria-label="Search this page of requests"
              placeholder="Search this page…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="sr-only">Filter account role</span>
            <select
              aria-label="Filter account role"
              value={role}
              onChange={(event) => {
                setRole(event.target.value as MemberRole | "");
                setPage(1);
              }}
              style={{ padding: "9px 12px", minHeight: 35, fontSize: 10 }}
            >
              <option value="">All roles</option>
              <option value="farmer">Farmers</option>
              <option value="buyer">Buyers</option>
            </select>
          </label>
        </div>
        {result.error ? (
          <Notice>
            {result.error}
            <button onClick={result.reload} className="text-link">
              Try again
              <RefreshCw size={13} />
            </button>
          </Notice>
        ) : result.isLoading ? (
          <div className="workspace-loading">
            <Spinner label="Opening your registration inbox…" />
          </div>
        ) : !requests.length ? (
          <EmptyState
            title={
              search ? "No matching applications" : "A little room to grow."
            }
            description={
              search
                ? "Try another name or email, or clear the filters."
                : "There are no applications in this view. New registrations will appear here for your review."
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>APPLICANT</th>
                  <th>ROLE</th>
                  <th>LOCATION</th>
                  <th>SUBMITTED</th>
                  <th>STATUS</th>
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
                          <small>{item.email || "Contact email needed"}</small>
                        </div>
                      </div>
                    </td>
                    <td>{item.role === "farmer" ? "Farmer" : "Buyer"}</td>
                    <td>
                      {[item.city, item.state].filter(Boolean).join(", ") ||
                        "—"}
                    </td>
                    <td>
                      {item.created_at ? formatDate(item.created_at) : "—"}
                    </td>
                    <td>
                      <span className={`badge badge-${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="table-action"
                        onClick={() => setSelected(item.id)}
                      >
                        Review
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
          onUpdated={(message) => {
            setMessage(message);
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
  const fetcher = useCallback(() => getRequestDetail(id), [id]);
  const result = useResource(fetcher);
  const request = result.data?.data;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [email, setEmail] = useState("");
  useEffect(() => {
    if (request) setEmail(request.email || "");
  }, [request]);
  const act = async (kind: "approve" | "reject" | "resend" | "email") => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (kind === "email") {
        await correctEmail(id, email.trim());
        setNotice("Contact email updated.");
        onUpdated("The applicant’s contact email was updated.");
      } else if (kind === "reject") {
        if (!reason.trim())
          throw new Error(
            "Add a short reason to help the applicant correct their details.",
          );
        const response = await rejectRequest(id, reason.trim());
        setNotice(response.message || "Application rejected.");
        onUpdated(response.message || "Application rejected.");
        setRejecting(false);
      } else {
        const response = await (kind === "approve"
          ? approveRequest(id)
          : resendCredentials(id));
        const message = response.data.email_sent
          ? "Account approved. Temporary credentials were accepted by the email service."
          : "Account approved, but the email could not be sent. Use Send credentials to try again.";
        setNotice(message);
        onUpdated(message);
      }
      result.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const details = request
    ? [
        ["Email", request.email || "Not provided"],
        ["Contact number", request.mobile_number],
        ["Age", request.age || "Not provided"],
        ["Nationality", request.nationality || "Not provided"],
        ["State", request.state],
        ["City / village", request.city],
        ["Taluka", request.taluka || "Not provided"],
        ["Language", request.preferred_language || "en"],
        ["Full address", request.full_address],
        ...(request.role === "farmer"
          ? [["Farm location", request.land_location]]
          : []),
      ]
    : [];
  return (
    <Modal
      title="A new connection to review"
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
                  {request.role === "farmer" ? "Farmer" : "Buyer"} application ·{" "}
                  {request.created_at ? formatDate(request.created_at) : ""}
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
                {request.status}
              </span>
              {request.status === "approved" && (
                <span
                  className={`badge badge-${request.credentials_email_status}`}
                >
                  Email {request.credentials_email_status || "pending"}
                </span>
              )}
            </div>
            <dl className="detail-grid">
              {details.map(([label, value]) => (
                <div
                  key={label}
                  className={
                    label === "Full address" || label === "Farm location"
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
                    Contact email
                    <small>Correct before approval if needed</small>
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
                    Save email correction
                    <Check size={14} />
                  </button>
                )}
              </form>
            )}
            {request.rejection_reason && (
              <Notice kind="info">Reason: {request.rejection_reason}</Notice>
            )}
            {rejecting && (
              <div style={{ marginTop: 20 }}>
                <label className="field" htmlFor="rejection-reason">
                  <span>What should the applicant correct?</span>
                  <textarea
                    id="rejection-reason"
                    rows={3}
                    maxLength={2000}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Please explain which details need attention."
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
                      <Spinner label="Processing…" />
                    ) : (
                      <>
                        <ShieldCheck size={15} />
                        Approve & email credentials
                      </>
                    )}
                  </button>
                  <button
                    className="button button-outline"
                    disabled={busy}
                    onClick={() => setRejecting(true)}
                  >
                    Reject
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
                      <Spinner label="Rejecting…" />
                    ) : (
                      "Reject with this reason"
                    )}
                  </button>
                  <button
                    className="button button-outline"
                    disabled={busy}
                    onClick={() => setRejecting(false)}
                  >
                    Cancel
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
                    <Spinner label="Sending…" />
                  ) : (
                    <>
                      <Mail size={16} />
                      Send new temporary credentials
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="muted" style={{ marginTop: 15, fontSize: 9 }}>
              Passwords are sent only to the contact email. If the member has
              already changed their password, they should use Forgot password.
            </p>
          </>
        )
      )}
    </Modal>
  );
}
export function AdminMetrics() {
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
            label: "Awaiting review",
            value: result.data?.requests,
            note: "Farmer & buyer applications",
            Icon: ClipboardList,
          },
          {
            label: "Approved farmers",
            value: result.data?.farmers,
            note: "The people behind the harvest",
            Icon: Sprout,
          },
          {
            label: "Approved buyers",
            value: result.data?.buyers,
            note: "Connections ready to grow",
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
export function PeoplePanel() {
  const [role, setRole] = useState<MemberRole>("farmer");
  const [page, setPage] = useState(1);
  const fetcher = useCallback(() => getUsers(role, page), [role, page]);
  const result = useResource(fetcher);
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>The people in your community</h2>
          <p>Approved farmers and buyers, all in one place.</p>
        </div>
        <button
          className="icon-button"
          aria-label="Refresh people"
          onClick={result.reload}
        >
          <RefreshCw size={15} />
        </button>
      </div>
      <div className="toolbar">
        <div className="filter-tabs">
          {(["farmer", "buyer"] as const).map((value) => (
            <button
              className={role === value ? "selected" : ""}
              onClick={() => {
                setRole(value);
                setPage(1);
              }}
              key={value}
            >
              {value === "farmer" ? "Farmers" : "Buyers"}
            </button>
          ))}
        </div>
      </div>
      {result.error ? (
        <Notice>{result.error}</Notice>
      ) : result.isLoading ? (
        <div className="workspace-loading">
          <Spinner label="Finding your community…" />
        </div>
      ) : !result.data?.data.users.length ? (
        <EmptyState
          title="Your community is taking root."
          description="Approved members will appear here after their applications have been reviewed."
        />
      ) : (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th>LOCATION</th>
                  <th>CONTACT</th>
                  <th>JOINED</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {result.data.data.users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="table-person">
                        <Avatar name={user.full_name} photo={user.photo_url} />
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
                      <span className="badge badge-approved">Approved</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls pagination={result.data.data} onPage={setPage} />
        </>
      )}
    </section>
  );
}
export function CallActivity() {
  const result = useResource(useCallback(() => getCallLogs(), []));
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Conversations that can become connections</h2>
          <p>Contact requests and their availability checks.</p>
        </div>
        <button
          className="icon-button"
          onClick={result.reload}
          aria-label="Refresh call activity"
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
          title="The conversation starts here."
          description="Contact activity will appear as members begin connecting."
        />
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>FROM</th>
                <th>TO</th>
                <th>RESULT</th>
              </tr>
            </thead>
            <tbody>
              {result.data.data.map((call) => (
                <tr key={call.id}>
                  <td>{formatDate(call.created_at)}</td>
                  <td>
                    {call.caller_role}
                    <small style={{ display: "block", marginTop: 5 }}>
                      {call.caller_id.slice(0, 8)}
                    </small>
                  </td>
                  <td>
                    {call.receiver_role}
                    <small style={{ display: "block", marginTop: 5 }}>
                      {call.receiver_id.slice(0, 8)}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`badge ${call.status === "permitted" ? "badge-approved" : "badge-pending"}`}
                    >
                      {call.status.replaceAll("_", " ")}
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
