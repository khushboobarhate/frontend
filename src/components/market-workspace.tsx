"use client";
// This file is part of the Setu Moolya project, which is licensed under the MIT License.
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Clock,
  Heart,
  Leaf,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sprout,
  Star,
  Trash2,
  Wheat,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import {
  assetUrl,
  changePassword,
  createCallRequest,
  createCrop,
  deleteCrop,
  expressInterest,
  getBuyerCallRequests,
  getCrop,
  getCrops,
  getInterests,
  initiateCall,
  setAvailability,
} from "@/lib/api/client";
import { validText, decimal } from "@/lib/validation";
import { useAuth } from "@/lib/auth/context";
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  CallRequest,
  CallResult,
  Crop,
  MemberRole,
  UserProfile,
  UserRole,
} from "@/types";
import { Avatar } from "./avatar";
import { PasswordInput, PasswordRules, strongPassword } from "./auth-forms";
import { EmptyState, Modal, Notice, Spinner } from "./ui";
import { useResource } from "./use-resource";

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Please try again.";

export function CropPhoto({
  crop,
  detail = false,
}: {
  crop: Crop;
  detail?: boolean;
}) {
  const tCommon = useTranslations("Common");
  const url = assetUrl(crop.photos?.[0]);
  return url ? (
    <Image
      src={url}
      alt={crop.crop_name}
      fill
      sizes={
        detail
          ? "(max-width: 760px) 90vw, 700px"
          : "(max-width: 760px) 45vw, 330px"
      }
      unoptimized
    />
  ) : (
    <div className="crop-photo-placeholder">
      <Wheat size={detail ? 60 : 36} strokeWidth={1} />
      <span>{tCommon("notProvided")}</span>
    </div>
  );
}

export function CropPanel({
  role,
  initialSearch = "",
  overview = false,
}: {
  role: UserRole;
  initialSearch?: string;
  overview?: boolean;
}) {
  const t = useTranslations("Market");
  const tCommon = useTranslations("Common");
  const [search, setSearch] = useState(initialSearch);
  const [query, setQuery] = useState(initialSearch);
  const [type, setType] = useState("");
  const [sort, setSort] = useState("recent");
  const [selected, setSelected] = useState<Crop | null>(null);
  const [upload, setUpload] = useState(false);
  const [message, setMessage] = useState("");
  const fetcher = useCallback(
    () =>
      getCrops(
        role,
        role === "buyer" ? { crop_type: type, search: query } : {},
      ),
    [role, type, query],
  );
  const result = useResource(fetcher);
  const all = result.data?.data || [];
  const crops = all
    .filter(
      (crop) =>
        role === "buyer" ||
        ((!type || crop.crop_type === type) &&
          crop.crop_name.toLowerCase().includes(query.toLowerCase())),
    )
    .sort((a, b) =>
      sort === "low"
        ? Number(a.price) - Number(b.price)
        : sort === "high"
          ? Number(b.price) - Number(a.price)
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  const shown = overview ? crops.slice(0, 3) : crops;

  return (
    <>
      {message && <Notice kind="success">{message}</Notice>}
      <section className={overview ? "" : "panel"}>
        <div className="panel-heading">
          <div>
            <h2>
              {role === "farmer"
                ? t("crops.farmerTitle")
                : role === "admin"
                  ? t("crops.allCrops")
                  : t("crops.buyerTitle")}
            </h2>
            <p>
              {role === "farmer"
                ? t("crops.farmerSubtitle")
                : t("crops.buyerSubtitle")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 9 }}>
            {role === "farmer" && (
              <button
                className="button button-small"
                onClick={() => setUpload(true)}
              >
                <Plus size={15} />
                {t("crops.listHarvest")}
              </button>
            )}
            <button
              className="icon-button"
              aria-label={t("crops.searchAria")}
              onClick={result.reload}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
        {!overview && (
          <div className="toolbar">
            <div className="filter-tabs">
              {[
                { value: "", label: t("crops.allCrops") },
                { value: "organic", label: t("crops.organic") },
                { value: "inorganic", label: t("crops.conventional") },
              ].map((option) => (
                <button
                  className={type === option.value ? "selected" : ""}
                  key={option.value}
                  onClick={() => setType(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <form
              className="search-input"
              onSubmit={(event) => {
                event.preventDefault();
                setQuery(search.trim());
              }}
            >
              <Search />
              <input
                aria-label={t("crops.searchAria")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("crops.searchPlaceholder")}
              />
              <button
                type="submit"
                className="table-action"
                aria-label={tCommon("search")}
              >
                <ArrowRight size={14} />
              </button>
            </form>
            <label className="field">
              <span className="sr-only">{tCommon("search")}</span>
              <select
                aria-label={tCommon("search")}
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                style={{ padding: "9px 10px", minHeight: 35, fontSize: 14 }}
              >
                <option value="recent">{tCommon("date")}</option>
                <option value="low">
                  {tCommon("per")} {tCommon("kg")}: ↓
                </option>
                <option value="high">
                  {tCommon("per")} {tCommon("kg")}: ↑
                </option>
              </select>
            </label>
          </div>
        )}
        {result.error ? (
          <Notice>
            {result.error}
            <button className="text-link" onClick={result.reload}>
              {tCommon("tryAgain")}
              <RefreshCw size={13} />
            </button>
          </Notice>
        ) : result.isLoading ? (
          <div className="workspace-loading">
            <Spinner label={tCommon("loading")} />
          </div>
        ) : !shown.length ? (
          <EmptyState
            title={
              query || type
                ? t("crops.noSearchTitle")
                : role === "farmer"
                  ? t("crops.farmerEmptyTitle")
                  : t("crops.buyerEmptyTitle")
            }
            description={
              query || type
                ? t("crops.noSearchDesc")
                : role === "farmer"
                  ? t("crops.farmerEmptyDesc")
                  : t("crops.buyerEmptyDesc")
            }
          >
            {role === "farmer" && (
              <button
                className="button button-small"
                onClick={() => setUpload(true)}
              >
                {t("crops.listHarvest")}
                <Plus size={16} />
              </button>
            )}
            {(query || type) && (
              <button
                className="button button-outline button-small"
                onClick={() => {
                  setSearch("");
                  setQuery("");
                  setType("");
                }}
              >
                {tCommon("cancel")}
              </button>
            )}
          </EmptyState>
        ) : (
          <div className="crop-grid">
            {shown.map((crop) => (
              <article className="crop-card" key={crop.id}>
                <div className="crop-card-image">
                  <CropPhoto crop={crop} />
                  <span className="badge">
                    {crop.crop_type === "organic"
                      ? t("crops.organic")
                      : t("crops.conventional")}
                  </span>
                </div>
                <div className="crop-card-body">
                  <h3>{crop.crop_name}</h3>
                  <div className="crop-card-meta">
                    <MapPin />
                    {crop.farmer
                      ? [crop.farmer.city, crop.farmer.state]
                          .filter(Boolean)
                          .join(", ") ||
                        t("crops.by", { name: crop.farmer.full_name || "" })
                      : role === "farmer"
                        ? t("crops.farmerTitle")
                        : t("crops.buyerTitle")}
                  </div>
                  <div className="crop-card-price">
                    <div>
                      <strong>{formatCurrency(Number(crop.price))}</strong>
                      <small>/ {crop.quantity_unit}</small>
                    </div>
                    <span>
                      {t("crops.quantityAvailable", {
                        quantity: Number(crop.quantity).toLocaleString(),
                        unit: crop.quantity_unit || "kg",
                      })}
                    </span>
                  </div>
                  <div className="crop-card-footer">
                    <span>
                      <Star />
                      {crop.total_ratings
                        ? t("crops.ratingsSummary", {
                            rating: crop.average_rating || 0,
                            count: crop.total_ratings,
                          })
                        : t("crops.noRatings")}
                    </span>
                    <button
                      className="button button-outline"
                      onClick={() => setSelected(crop)}
                    >
                      {t("crops.viewHarvest")}
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {overview && crops.length > 3 && (
          <Link
            className="text-link"
            href={`/dashboard?view=${role === "buyer" ? "marketplace" : "crops"}`}
            style={{ marginTop: 20 }}
          >
            {t("crops.viewHarvest")}
            <ArrowRight size={15} />
          </Link>
        )}
      </section>
      {selected && (
        <CropDialog
          crop={selected}
          role={role}
          onClose={() => setSelected(null)}
          onUpdated={(msg) => {
            setMessage(msg);
            result.reload();
          }}
        />
      )}
      {upload && (
        <CropUpload
          onClose={() => setUpload(false)}
          onSaved={() => {
            setMessage(t("upload.success"));
            setUpload(false);
            result.reload();
          }}
        />
      )}
    </>
  );
}

function CropDialog({
  crop: initial,
  role,
  onClose,
  onUpdated,
}: {
  crop: Crop;
  role: UserRole;
  onClose: () => void;
  onUpdated: (message: string) => void;
}) {
  const t = useTranslations("Market");
  const tCommon = useTranslations("Common");
  const fetcher = useCallback(
    async () =>
      role === "admin"
        ? { success: true, data: initial }
        : getCrop(role, initial.id),
    [initial, role],
  );
  const result = useResource(fetcher);
  const crop = result.data?.data || initial;
  const [image, setImage] = useState(0);
  const [rating, setRating] = useState(initial.my_interest?.rating || 0);
  const [notes, setNotes] = useState(initial.my_interest?.notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [phone, setPhone] = useState<CallResult | null>(null);
  const [callRequest, setCallRequest] = useState<CallRequest | null>(null);
  const [requestNotice, setRequestNotice] = useState("");

  useEffect(() => {
    if (role === "buyer") {
      getBuyerCallRequests()
        .then((res) => {
          if (res.success && res.data) {
            const found = res.data.find(
              (r) =>
                r.crop_id === crop.id ||
                r.farmer_id === (crop.farmer?.id || crop.farmer_id),
            );
            if (found) {
              setCallRequest(found);
              if (found.status === "approved" && found.farmer?.phone) {
                setPhone({
                  receiver_name:
                    found.farmer.full_name || crop.farmer?.full_name || "Farmer",
                  receiver_phone: found.farmer.phone,
                  receiver_role: "farmer",
                  call_status: "permitted",
                });
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [crop.id, crop.farmer?.id, crop.farmer_id, crop.farmer?.full_name, role]);

  const requestCall = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await createCallRequest({
        farmer_id: crop.farmer?.id || crop.farmer_id,
        crop_id: crop.id,
        buyer_note: notes || undefined,
      });
      setCallRequest(response.data);
      setRequestNotice(
        t("call.requestSent") ||
          "Call request sent to farmer! Contact details will be revealed once approved.",
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const saveInterest = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await expressInterest(crop.id, rating, notes);
      const msg = response.message || t("interest.success");
      setNotice(msg);
      onUpdated(msg);
      result.reload();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError("");
    try {
      await deleteCrop(crop.id);
      onUpdated(t("crops.deleteListing"));
      onClose();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const url = assetUrl(crop.photos?.[image]);

  return (
    <Modal
      title={crop.crop_name}
      onClose={() => {
        if (!busy) onClose();
      }}
      wide
    >
      {error && <Notice>{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}
      {result.error && <Notice>{result.error}</Notice>}
      <div className="crop-detail-photo">
        {url ? (
          <Image
            src={url}
            alt={`${crop.crop_name}, photo ${image + 1}`}
            fill
            unoptimized
          />
        ) : (
          <CropPhoto crop={crop} detail />
        )}
      </div>
      {crop.photos?.length > 1 && (
        <div className="gallery-thumbs">
          {crop.photos.map((photo, index) => (
            <button
              key={photo}
              aria-label={`Photo ${index + 1}`}
              className={image === index ? "selected" : ""}
              onClick={() => setImage(index)}
            >
              {assetUrl(photo) && (
                <Image
                  src={assetUrl(photo)!}
                  alt=""
                  width={58}
                  height={48}
                  unoptimized
                />
              )}
            </button>
          ))}
        </div>
      )}
      <dl className="detail-grid">
        <div>
          <dt>{t("upload.price")}</dt>
          <dd style={{ fontSize: 22, fontWeight: 600 }}>
            {formatCurrency(Number(crop.price))}
            <small style={{ fontSize: 14, marginLeft: 6 }}>
              / {crop.quantity_unit}
            </small>
          </dd>
        </div>
        <div>
          <dt>{t("upload.quantity")}</dt>
          <dd>
            {Number(crop.quantity).toLocaleString()}{" "}
            {crop.quantity_unit}
          </dd>
        </div>
        <div>
          <dt>{t("upload.cropType")}</dt>
          <dd>
            {crop.crop_type === "organic"
              ? t("crops.organic")
              : t("crops.conventional")}
          </dd>
        </div>
        <div>
          <dt>{tCommon("date")}</dt>
          <dd>{formatDate(crop.created_at)}</dd>
        </div>
        {crop.farmer && (
          <div className="full-span">
            <dt>{t("interestsPanel.farmerCol")}</dt>
            <dd>
              {crop.farmer.full_name} ·{" "}
              {[crop.farmer.city, crop.farmer.state].filter(Boolean).join(", ")}
            </dd>
          </div>
        )}
      </dl>
      {crop.description && (
        <p className="dialog-description">{crop.description}</p>
      )}
      {role === "buyer" && (
        <>
          <hr className="form-divider" />
          <form onSubmit={saveInterest} className="form-stack">
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 500 }}>
                {t("interest.title")}
              </h3>
              <p className="muted" style={{ marginTop: 7, fontSize: 14 }}>
                {t("interest.subtitle")}
              </p>
              <div
                className="star-picker"
                role="group"
                aria-label={t("interest.ratingLabel")}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    type="button"
                    aria-label={`${value} / 5`}
                    aria-pressed={rating === value}
                    className={rating >= value ? "selected" : ""}
                    key={value}
                    onClick={() => setRating(value)}
                  >
                    <Star size={25} strokeWidth={1.3} />
                  </button>
                ))}
              </div>
            </div>
            <label className="field" htmlFor="interest-notes">
              <span>
                {t("interest.notesLabel")}
              </span>
              <textarea
                id="interest-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={t("interest.notesPlaceholder")}
              />
            </label>
            <button className="button" disabled={!rating || busy}>
              {busy ? (
                <Spinner label={t("interest.submitting")} />
              ) : (
                <>
                  {t("interest.submitButton")}
                  <Heart size={16} />
                </>
              )}
            </button>
          </form>
          <div className="dialog-actions" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
            {callRequest?.status === "pending" ? (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef3c7",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#92400e",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Clock size={16} />
                <span>
                  {t("call.requestPendingNotice") ||
                    "Call request pending farmer approval. Contact details will be revealed once accepted."}
                </span>
              </div>
            ) : callRequest?.status === "rejected" ? (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fee2e2",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#991b1b",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <X size={16} />
                <span>
                  {t("call.requestDeclinedNotice") ||
                    "Farmer has declined this call request."}
                </span>
              </div>
            ) : !phone ? (
              <button
                className="button button-lime"
                disabled={busy || crop.farmer?.is_call_available === false}
                onClick={() => void requestCall()}
              >
                <Phone size={15} />
                {crop.farmer?.is_call_available === false
                  ? t("call.availabilityOff")
                  : t("crops.requestCall") || "Request Call with Farmer"}
              </button>
            ) : null}
            {requestNotice && (
              <p style={{ fontSize: 12, color: "#166534", margin: 0 }}>
                {requestNotice}
              </p>
            )}
          </div>
          {phone && <PhoneResult result={phone} />}
        </>
      )}
      {role === "farmer" && (
        <>
          <div className="dialog-actions">
            <Link
              className="button button-outline"
              href="/dashboard?view=interests"
            >
              {t("crops.interestedBuyersCount", {
                count: crop.interested_buyers_count || 0,
              })}
              <ArrowUpRight size={15} />
            </Link>
            <button
              className="button button-outline"
              onClick={() => setDeleting(true)}
              disabled={busy}
            >
              <Trash2 size={14} />
              {t("crops.deleteListing")}
            </button>
          </div>
          {deleting && (
            <div style={{ marginTop: 20 }}>
              <Notice kind="info">
                {t("crops.deleteListingWarning")}
              </Notice>
              <div className="form-button-row">
                <button
                  className="button button-danger"
                  disabled={busy}
                  onClick={() => void remove()}
                >
                  {busy ? (
                    <Spinner label={t("crops.deleting")} />
                  ) : (
                    t("crops.deleteListing")
                  )}
                </button>
                <button
                  className="button button-outline"
                  disabled={busy}
                  onClick={() => setDeleting(false)}
                >
                  {tCommon("cancel")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

export function CropUpload({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("Market");
  const tCommon = useTranslations("Common");
  const [fields, setFields] = useState({
    crop_name: "",
    crop_type: "organic",
    quantity: "",
    quantity_unit: "kg",
    price: "",
    description: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (key: keyof typeof fields, value: string) =>
    setFields((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validText(fields.crop_name, 2, 150)) {
      setError("Crop name must contain 2–150 characters.");
      return;
    }
    if (
      decimal(fields.quantity, 0.001, 3) === null ||
      decimal(fields.price, 0, 2) === null
    ) {
      setError(
        "Enter a valid quantity (up to 3 decimals) and price (up to 2 decimals), both at most 1,000,000,000.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const data = new FormData();
    Object.entries(fields).forEach(([key, value]) =>
      data.append(key, value.trim()),
    );
    photos.forEach((photo) => data.append("photos", photo));
    try {
      await createCrop(data);
      onSaved();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t("upload.title")}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {error && <Notice>{error}</Notice>}
      <form className="form-stack" onSubmit={submit}>
        <label className="field" htmlFor="crop-name">
          <span>{t("upload.cropName")}</span>
          <input
            id="crop-name"
            value={fields.crop_name}
            onChange={(event) => update("crop_name", event.target.value)}
            required
            placeholder={t("upload.cropNamePlaceholder")}
            minLength={2}
            maxLength={150}
          />
        </label>
        <div className="form-grid">
          <label className="field" htmlFor="crop-type">
            <span>{t("upload.cropType")}</span>
            <select
              id="crop-type"
              value={fields.crop_type}
              onChange={(event) => update("crop_type", event.target.value)}
            >
              <option value="organic">{t("upload.organicOption")}</option>
              <option value="inorganic">{t("upload.inorganicOption")}</option>
            </select>
          </label>
          <label className="field" htmlFor="crop-unit">
            <span>{t("upload.unit")}</span>
            <select
              id="crop-unit"
              value={fields.quantity_unit}
              onChange={(event) => update("quantity_unit", event.target.value)}
            >
              <option value="kg">{tCommon("kg")}</option>
              <option value="quintal">{tCommon("quintal")}</option>
              <option value="tonne">{tCommon("tonne")}</option>
              <option value="gram">{tCommon("gram")}</option>
            </select>
          </label>
          <label className="field" htmlFor="crop-quantity">
            <span>{t("upload.quantity")}</span>
            <input
              id="crop-quantity"
              type="number"
              min="0.001"
              max="1000000000"
              step="0.001"
              required
              value={fields.quantity}
              onChange={(event) => update("quantity", event.target.value)}
              placeholder={t("upload.quantityPlaceholder")}
            />
          </label>
          <label className="field" htmlFor="crop-price">
            <span>{t("upload.price")}</span>
            <input
              id="crop-price"
              type="number"
              min="0"
              max="1000000000"
              step="0.01"
              required
              value={fields.price}
              onChange={(event) => update("price", event.target.value)}
              placeholder={t("upload.pricePlaceholder")}
            />
          </label>
        </div>
        <label className="field" htmlFor="crop-description">
          <span>{t("upload.description")}</span>
          <textarea
            id="crop-description"
            rows={3}
            maxLength={3000}
            placeholder={t("upload.descriptionPlaceholder")}
            value={fields.description}
            onChange={(event) => update("description", event.target.value)}
          />
        </label>
        <div className="photo-drop">
          <label htmlFor="crop-photos">
            <Camera size={26} strokeWidth={1.3} />
            <strong>{t("upload.photos")}</strong>
            <small>{t("upload.photosHint")}</small>
            <input
              id="crop-photos"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const selected = Array.from(event.target.files || []);
                if (
                  selected.length > 10 ||
                  selected.some(
                    (file) =>
                      file.size > 10 * 1024 * 1024 ||
                      !["image/jpeg", "image/png", "image/webp"].includes(
                        file.type,
                      ),
                  )
                ) {
                  setError(
                    "Choose up to 10 JPEG, PNG, or WebP photos, each under 10 MB.",
                  );
                  event.target.value = "";
                  setPhotos([]);
                  return;
                }
                setError("");
                setPhotos(selected);
              }}
            />
          </label>
          {photos.length > 0 && (
            <div className="selected-photos">
              {photos.map((photo) => (
                <span key={photo.name}>{photo.name}</span>
              ))}
            </div>
          )}
        </div>
        <div className="form-note">
          <Leaf size={18} />
          <p>{t("upload.subtitle")}</p>
        </div>
        <button className="button full-width" disabled={busy}>
          {busy ? (
            <Spinner label={t("upload.uploading")} />
          ) : (
            <>
              {t("upload.uploadButton")}
              <ArrowUpRight size={17} />
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}

export function PhoneResult({ result }: { result: CallResult }) {
  const t = useTranslations("Market");
  const number = result.receiver_phone?.replace(/[^+0-9]/g, "");
  return (
    <div className="phone-result" style={{ marginTop: 20 }}>
      <p>{t("call.phoneRevealed")} <strong>{result.receiver_name}</strong></p>
      {number ? (
        <a href={`tel:${number}`} style={{ fontSize: 20, fontWeight: 700, display: "inline-block", margin: "10px 0" }}>
          {result.receiver_phone}
        </a>
      ) : (
        <p>{t("call.availabilityOff")}</p>
      )}
    </div>
  );
}

export function InterestsPanel({ role }: { role: MemberRole }) {
  const t = useTranslations("Market");
  const tCommon = useTranslations("Common");
  const fetcher = useCallback(() => getInterests(role), [role]);
  const result = useResource(fetcher);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState<CallResult | null>(null);

  const call = async (id: string, crop_id: string) => {
    setBusy(id);
    setError("");
    try {
      const response = await initiateCall(role, id, crop_id);
      setPhone(response.data);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>
              {role === "farmer"
                ? t("interestsPanel.farmerTitle")
                : t("interestsPanel.buyerTitle")}
            </h2>
            <p>
              {role === "farmer"
                ? t("interestsPanel.farmerSubtitle")
                : t("interestsPanel.buyerSubtitle")}
            </p>
          </div>
          <button
            className="icon-button"
            aria-label={tCommon("search")}
            onClick={result.reload}
          >
            <RefreshCw size={15} />
          </button>
        </div>
        {(error || result.error) && <Notice>{error || result.error}</Notice>}
        {result.isLoading ? (
          <div className="workspace-loading">
            <Spinner label={tCommon("loading")} />
          </div>
        ) : !result.data?.data.length ? (
          <EmptyState
            title={
              role === "farmer"
                ? t("interestsPanel.farmerEmptyTitle")
                : t("interestsPanel.buyerEmptyTitle")
            }
            description={
              role === "farmer"
                ? t("interestsPanel.farmerEmptyDesc")
                : t("interestsPanel.buyerEmptyDesc")
            }
          >
            {role === "buyer" && (
              <Link
                className="button button-small"
                href="/dashboard?view=marketplace"
              >
                {t("crops.buyerTitle")}
                <ArrowUpRight size={15} />
              </Link>
            )}
          </EmptyState>
        ) : (
          <div className="interest-list">
            {result.data.data.map((item) => {
              const person = role === "farmer" ? item.buyer : item.farmer;
              const name =
                person?.full_name ||
                (role === "farmer"
                  ? t("interestsPanel.buyerCol")
                  : t("interestsPanel.farmerCol"));
              return (
                <article
                  className="interest-row"
                  key={item.id || item.interest_id}
                >
                  <Avatar name={name} photo={person?.photo_url} />
                  <div>
                    <h3>
                      {name}
                      <span className="muted" style={{ fontSize: 14 }}>
                        {" "}
                        ·{" "}
                        {item.crop_name ||
                          item.crop?.crop_name ||
                          t("interestsPanel.cropCol")}
                      </span>
                    </h3>
                    <div
                      className="interest-stars"
                      aria-label={`${item.rating} / 5`}
                    >
                      {Array.from({ length: item.rating }, (_, index) => (
                        <Star key={index} />
                      ))}
                    </div>
                    {item.notes && <p>{item.notes}</p>}
                    <small>
                      {[person?.city, person?.state].filter(Boolean).join(", ")}{" "}
                      · {formatDate(item.created_at)}
                    </small>
                  </div>
                  <button
                    className="button button-outline"
                    disabled={
                      !person?.id ||
                      busy === person.id ||
                      person.is_call_available === false
                    }
                    onClick={() =>
                      person?.id && void call(person.id, item.crop_id)
                    }
                  >
                    <Phone size={13} />
                    {busy === person?.id
                      ? tCommon("loading")
                      : person?.is_call_available === false
                        ? tCommon("off")
                        : role === "farmer"
                          ? t("crops.callBuyer")
                          : t("crops.callFarmer")}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
      {phone && (
        <Modal
          title={t("call.permitted")}
          onClose={() => setPhone(null)}
        >
          <PhoneResult result={phone} />
        </Modal>
      )}
    </>
  );
}

export function AccountPanel({ user }: { user: UserProfile }) {
  const t = useTranslations("Market");
  const tCommon = useTranslations("Common");
  const auth = useAuth();
  const router = useRouter();
  const available = user.is_call_available !== false;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    if (user.role === "admin") return;
    setBusy(true);
    setError("");
    try {
      await setAvailability(user.role, !available);
      await auth.refreshProfile();
    } catch (error) {
      setError(errorText(error));
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

  return (
    <div className="account-columns">
      <section className="panel">
        <div className="account-head">
          <Avatar name={user.full_name} photo={user.photo_url} />
          <div>
            <h2>{user.full_name}</h2>
            <p>
              {user.role === "admin"
                ? tCommon("role") + ": " + tCommon("approved")
                : user.role === "farmer"
                  ? t("account.profileSectionTitle")
                  : t("account.profileSectionTitle")}{" "}
              · <span style={{ color: "#456b31" }}>{tCommon("approved")}</span>
            </p>
          </div>
        </div>
        <dl className="detail-grid">
          {[
            [t("account.email"), user.email],
            ...(user.role !== "admin"
              ? [
                  [t("account.phone"), user.mobile_number],
                  [tCommon("location"), [user.city, user.state].filter(Boolean).join(", ")],
                  [
                    t("account.languagePreference"),
                    langNames[user.preferred_language || "en"] || user.preferred_language || "en",
                  ],
                  [tCommon("role"), user.role],
                  [t("account.address"), user.full_address],
                ]
              : []),
            ...(user.role === "farmer"
              ? [[t("account.farmLocation"), user.land_location]]
              : []),
          ].map(([key, value]) => (
            <div
              key={key}
              className={
                key === t("account.address") || key === t("account.farmLocation") ? "full-span" : ""
              }
            >
              <dt>{key}</dt>
              <dd>{value || tCommon("notProvided")}</dd>
            </div>
          ))}
        </dl>
        {error && <Notice>{error}</Notice>}
        {user.role !== "admin" && !user.must_change_password && (
          <div className="availability-panel">
            <div>
              <strong>
                {available
                  ? t("account.callStatusOn")
                  : t("account.callStatusOff")}
              </strong>
              <p>
                {t("account.callSectionDesc")}
              </p>
            </div>
            <button
              className={`toggle ${available ? "on" : ""}`}
              role="switch"
              aria-checked={available}
              aria-label={t("account.callSectionTitle")}
              onClick={() => void toggle()}
              disabled={busy}
            >
              <span />
            </button>
          </div>
        )}
      </section>
      <ChangePasswordPanel
        role={user.role}
        required={!!user.must_change_password}
        onChanged={async () => {
          await auth.logout();
          router.replace(
            user.role === "admin"
              ? "/admin/login?password=updated"
              : `/login?role=${user.role}&password=updated`,
          );
        }}
      />
    </div>
  );
}

function ChangePasswordPanel({
  role,
  onChanged,
}: {
  role: UserRole;
  required?: boolean;
  onChanged: () => Promise<void>;
}) {
  const t = useTranslations("Market");
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!strongPassword(password)) {
      setError(
        "Use 12–128 characters with upper and lowercase letters, a number, and a symbol.",
      );
      return;
    }
    if (password !== confirm) {
      setError(
        "The new passwords don’t match. Please check them and try again.",
      );
      return;
    }
    setBusy(true);
    try {
      await changePassword(role, current, password);
      await onChanged();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>
            {t("account.passwordSectionTitle")}
          </h2>
          <p>
            {t("account.passwordSectionDesc")}
          </p>
        </div>
        <ShieldCheck size={23} strokeWidth={1.3} />
      </div>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="form-stack">
        <PasswordInput
          id="change-current"
          label={t("account.currentPassword")}
          value={current}
          onChange={setCurrent}
        />
        <PasswordInput
          id="change-new"
          label={t("account.newPassword")}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordRules value={password} />
        <PasswordInput
          id="change-confirm"
          label={t("account.confirmPassword")}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        <button className="button full-width" disabled={busy}>
          {busy ? (
            <Spinner label={t("account.updating")} />
          ) : (
            <>
              {t("account.updatePassword")}
              <ArrowRight size={16} />
            </>
          )}
        </button>
        {role !== "admin" && (
          <Link className="text-link" href={`/forgot-password?role=${role}`}>
            {t("account.passwordSectionTitle")}
            <ArrowUpRight size={13} />
          </Link>
        )}
      </form>
    </section>
  );
}

export function MemberMetrics({ role }: { role: MemberRole }) {
  const t = useTranslations("Market");
  const tCommon = useTranslations("Common");
  const fetcher = useCallback(async () => {
    const [crops, interests] = await Promise.all([
      getCrops(role),
      getInterests(role),
    ]);
    return { crops: crops.data, interests: interests.data };
  }, [role]);
  const result = useResource(fetcher);

  return (
    <>
      {result.error && <Notice>{result.error}</Notice>}
      <div className="metric-grid">
        {[
          {
            label:
              role === "farmer"
                ? t("metrics.farmerHarvests")
                : t("metrics.buyerHarvests"),
            value: result.data?.crops.length,
            note:
              role === "farmer"
                ? t("metrics.farmerHarvestsNote")
                : t("metrics.buyerHarvestsNote"),
            Icon: Sprout,
          },
          {
            label:
              role === "farmer"
                ? t("metrics.farmerBuyers")
                : t("metrics.buyerInterests"),
            value: result.data?.interests.length,
            note:
              role === "farmer"
                ? t("metrics.farmerBuyersNote")
                : t("metrics.buyerInterestsNote"),
            Icon: Heart,
          },
          {
            label:
              role === "farmer"
                ? t("metrics.farmerLine")
                : t("metrics.buyerLine"),
            value: result.data?.crops.filter((crop) =>
              role === "farmer"
                ? crop.status === "available"
                : crop.crop_type === "organic",
            ).length,
            note:
              role === "farmer"
                ? t("metrics.farmerLineNote", { status: tCommon("on") })
                : t("metrics.buyerLineNote", { status: tCommon("on") }),
            Icon: Leaf,
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
