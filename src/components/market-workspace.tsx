"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
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
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import {
  assetUrl,
  changePassword,
  createCrop,
  deleteCrop,
  expressInterest,
  getCrop,
  getCrops,
  getInterests,
  initiateCall,
  setAvailability,
} from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  CallResult,
  Crop,
  MemberRole,
  UserProfile,
  UserRole,
} from "@/types";
import { Avatar } from "./admin-workspace";
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
      <span>PHOTO NOT PROVIDED</span>
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
                ? "Your harvest, ready for its next chapter"
                : role === "admin"
                  ? "Available crops across the platform"
                  : "Find something worth connecting over"}
            </h2>
            <p>
              {role === "farmer"
                ? "Every listing is a new opportunity to meet a buyer."
                : "Real listings. Farmer-set prices. Direct conversations."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 9 }}>
            {role === "farmer" && (
              <button
                className="button button-small"
                onClick={() => setUpload(true)}
              >
                <Plus size={15} />
                List a harvest
              </button>
            )}
            <button
              className="icon-button"
              aria-label="Refresh crops"
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
                { value: "", label: "All harvests" },
                { value: "organic", label: "Organic" },
                { value: "inorganic", label: "Conventional" },
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
                aria-label="Search crops"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search crops…"
              />
              <button
                type="submit"
                className="table-action"
                aria-label="Search"
              >
                <ArrowRight size={14} />
              </button>
            </form>
            <label className="field">
              <span className="sr-only">Sort crops</span>
              <select
                aria-label="Sort crops"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                style={{ padding: "9px 10px", minHeight: 35, fontSize: 10 }}
              >
                <option value="recent">Recently listed</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </label>
          </div>
        )}
        {result.error ? (
          <Notice>
            {result.error}
            <button className="text-link" onClick={result.reload}>
              Try again
              <RefreshCw size={13} />
            </button>
          </Notice>
        ) : result.isLoading ? (
          <div className="workspace-loading">
            <Spinner label="Gathering the latest harvests…" />
          </div>
        ) : !shown.length ? (
          <EmptyState
            title={
              query || type
                ? "A different season, perhaps?"
                : role === "farmer"
                  ? "Every harvest starts somewhere."
                  : "The next harvest is on its way."
            }
            description={
              query || type
                ? "Try a different crop name or clear your filters."
                : role === "farmer"
                  ? "Add your first crop listing, share what you’ve grown, and let new connections find you."
                  : "There are no available crop listings yet. Check back as farmers add their produce."
            }
          >
            {role === "farmer" && (
              <button
                className="button button-small"
                onClick={() => setUpload(true)}
              >
                List your first harvest
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
                Clear filters
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
                    {crop.crop_type === "organic" ? "Organic" : "Conventional"}
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
                        crop.farmer.full_name ||
                        "Farmer listing"
                      : role === "farmer"
                        ? "Your crop listing"
                        : "Farmer listing"}
                  </div>
                  <div className="crop-card-price">
                    <div>
                      <strong>{formatCurrency(Number(crop.price))}</strong>
                      <small>/ {crop.quantity_unit}</small>
                    </div>
                    <span>
                      {Number(crop.quantity).toLocaleString("en-IN")}{" "}
                      {crop.quantity_unit} available
                    </span>
                  </div>
                  <div className="crop-card-footer">
                    <span>
                      <Star />
                      {crop.total_ratings
                        ? `${crop.average_rating || 0} · ${crop.total_ratings} ${crop.total_ratings === 1 ? "rating" : "ratings"}`
                        : "A fresh connection"}
                    </span>
                    <button
                      className="button button-outline"
                      onClick={() => setSelected(crop)}
                    >
                      View harvest
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
            See all harvests
            <ArrowRight size={15} />
          </Link>
        )}
      </section>
      {selected && (
        <CropDialog
          crop={selected}
          role={role}
          onClose={() => setSelected(null)}
          onUpdated={(message) => {
            setMessage(message);
            result.reload();
          }}
        />
      )}
      {upload && (
        <CropUpload
          onClose={() => setUpload(false)}
          onSaved={() => {
            setMessage(
              "Your harvest is listed. Here’s to its next connection.",
            );
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
  const saveInterest = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await expressInterest(crop.id, rating, notes);
      setNotice(
        response.message || "Your interest has been shared with the farmer.",
      );
      onUpdated("Your interest has been shared with the farmer.");
      result.reload();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  const call = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await initiateCall(
        "buyer",
        crop.farmer?.id || crop.farmer_id || "",
        crop.id,
      );
      setPhone(response.data);
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
      onUpdated("The crop listing was removed.");
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
              aria-label={`View crop photo ${index + 1}`}
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
          <dt>Listed price</dt>
          <dd style={{ fontSize: 22, fontWeight: 600 }}>
            {formatCurrency(Number(crop.price))}
            <small style={{ fontSize: 10, marginLeft: 6 }}>
              / {crop.quantity_unit}
            </small>
          </dd>
        </div>
        <div>
          <dt>Available quantity</dt>
          <dd>
            {Number(crop.quantity).toLocaleString("en-IN")} {crop.quantity_unit}
          </dd>
        </div>
        <div>
          <dt>Growing method</dt>
          <dd>{crop.crop_type === "organic" ? "Organic" : "Conventional"}</dd>
        </div>
        <div>
          <dt>Listed</dt>
          <dd>{formatDate(crop.created_at)}</dd>
        </div>
        {crop.farmer && (
          <div className="full-span">
            <dt>From the farmer</dt>
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
                Let this farmer know you’re interested.
              </h3>
              <p className="muted" style={{ marginTop: 7, fontSize: 10 }}>
                Choose your interest level and leave a note to start the
                connection.
              </p>
              <div
                className="star-picker"
                role="group"
                aria-label="Interest rating"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    type="button"
                    aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
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
                A note for the farmer<small>Optional</small>
              </span>
              <textarea
                id="interest-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Tell them a little about what you’re looking for."
              />
            </label>
            <button className="button" disabled={!rating || busy}>
              {busy ? (
                <Spinner label="Saving…" />
              ) : (
                <>
                  Share my interest
                  <Heart size={16} />
                </>
              )}
            </button>
          </form>
          <div className="dialog-actions">
            <button
              className="button button-outline"
              disabled={busy || crop.farmer?.is_call_available === false}
              onClick={() => void call()}
            >
              <Phone size={15} />
              {crop.farmer?.is_call_available === false
                ? "Farmer is currently unavailable"
                : "Connect with this farmer"}
            </button>
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
              See buyer interests
              <ArrowUpRight size={15} />
            </Link>
            <button
              className="button button-outline"
              onClick={() => setDeleting(true)}
              disabled={busy}
            >
              <Trash2 size={14} />
              Remove listing
            </button>
          </div>
          {deleting && (
            <div style={{ marginTop: 20 }}>
              <Notice kind="info">
                Remove this listing? Buyers will no longer see it in the
                marketplace.
              </Notice>
              <div className="form-button-row">
                <button
                  className="button button-danger"
                  disabled={busy}
                  onClick={() => void remove()}
                >
                  {busy ? <Spinner label="Removing…" /> : "Remove this listing"}
                </button>
                <button
                  className="button button-outline"
                  disabled={busy}
                  onClick={() => setDeleting(false)}
                >
                  Keep it
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
      title="Give your harvest a home."
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {error && <Notice>{error}</Notice>}
      <form className="form-stack" onSubmit={submit}>
        <label className="field" htmlFor="crop-name">
          <span>What have you grown?</span>
          <input
            id="crop-name"
            value={fields.crop_name}
            onChange={(event) => update("crop_name", event.target.value)}
            required
            placeholder="e.g. Fresh turmeric roots"
            maxLength={150}
          />
        </label>
        <div className="form-grid">
          <label className="field" htmlFor="crop-type">
            <span>Growing method</span>
            <select
              id="crop-type"
              value={fields.crop_type}
              onChange={(event) => update("crop_type", event.target.value)}
            >
              <option value="organic">Organic</option>
              <option value="inorganic">Conventional</option>
            </select>
          </label>
          <label className="field" htmlFor="crop-unit">
            <span>Unit</span>
            <select
              id="crop-unit"
              value={fields.quantity_unit}
              onChange={(event) => update("quantity_unit", event.target.value)}
            >
              <option value="kg">Kilogram (kg)</option>
              <option value="quintal">Quintal</option>
              <option value="tonne">Tonne</option>
              <option value="gram">Gram</option>
            </select>
          </label>
          <label className="field" htmlFor="crop-quantity">
            <span>Quantity available</span>
            <input
              id="crop-quantity"
              type="number"
              min="0.001"
              step="any"
              required
              value={fields.quantity}
              onChange={(event) => update("quantity", event.target.value)}
              placeholder="e.g. 250"
            />
          </label>
          <label className="field" htmlFor="crop-price">
            <span>Price per {fields.quantity_unit} (₹)</span>
            <input
              id="crop-price"
              type="number"
              min="0"
              step="0.01"
              required
              value={fields.price}
              onChange={(event) => update("price", event.target.value)}
              placeholder="e.g. 120"
            />
          </label>
        </div>
        <label className="field" htmlFor="crop-description">
          <span>
            The story of your harvest<small>Optional</small>
          </span>
          <textarea
            id="crop-description"
            rows={3}
            maxLength={3000}
            placeholder="Tell buyers about your crop, harvest, or growing practices."
            value={fields.description}
            onChange={(event) => update("description", event.target.value)}
          />
        </label>
        <div className="photo-drop">
          <label htmlFor="crop-photos">
            <Camera size={26} strokeWidth={1.3} />
            <strong>Let your harvest speak for itself</strong>
            <small>Add up to 10 photos · JPEG, PNG, or WebP · 10 MB each</small>
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
          <p>
            Your listed price and details will be visible to approved buyers.
            Photos help the right people find your harvest.
          </p>
        </div>
        <button className="button full-width" disabled={busy}>
          {busy ? (
            <Spinner label="Listing your harvest…" />
          ) : (
            <>
              List my harvest
              <ArrowUpRight size={17} />
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
export function PhoneResult({ result }: { result: CallResult }) {
  const number = result.receiver_phone?.replace(/[^+0-9]/g, "");
  return (
    <div className="phone-result" style={{ marginTop: 20 }}>
      <p>{result.receiver_name} is available to connect.</p>
      {number ? (
        <a href={`tel:${number}`}>{result.receiver_phone}</a>
      ) : (
        <p>A contact number isn’t recorded for this member.</p>
      )}
      <small>Tap the number to call from your device.</small>
    </div>
  );
}
export function InterestsPanel({ role }: { role: MemberRole }) {
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
                ? "People who see the value in your harvest"
                : "Harvests you’d like to know better"}
            </h2>
            <p>
              {role === "farmer"
                ? "A little interest can be the start of something good."
                : "Your connections start with the crops you care about."}
            </p>
          </div>
          <button
            className="icon-button"
            aria-label="Refresh interests"
            onClick={result.reload}
          >
            <RefreshCw size={15} />
          </button>
        </div>
        {(error || result.error) && <Notice>{error || result.error}</Notice>}
        {result.isLoading ? (
          <div className="workspace-loading">
            <Spinner label="Finding your connections…" />
          </div>
        ) : !result.data?.data.length ? (
          <EmptyState
            title="Good connections take a little time."
            description={
              role === "farmer"
                ? "When a buyer expresses interest in one of your crops, you’ll find their details here."
                : "Browse the marketplace and share your interest in a harvest. You’ll find it here afterward."
            }
          >
            {role === "buyer" && (
              <Link
                className="button button-small"
                href="/dashboard?view=marketplace"
              >
                Explore harvests
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
                (role === "farmer" ? "Interested buyer" : "Farmer");
              return (
                <article
                  className="interest-row"
                  key={item.id || item.interest_id}
                >
                  <Avatar name={name} photo={person?.photo_url} />
                  <div>
                    <h3>
                      {name}
                      <span className="muted" style={{ fontSize: 9 }}>
                        {" "}
                        ·{" "}
                        {item.crop_name ||
                          item.crop?.crop_name ||
                          "Crop listing"}
                      </span>
                    </h3>
                    <div
                      className="interest-stars"
                      aria-label={`${item.rating} out of 5 stars`}
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
                      ? "Checking…"
                      : person?.is_call_available === false
                        ? "Unavailable"
                        : "Connect"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
      {phone && (
        <Modal
          title="A good conversation starts here."
          onClose={() => setPhone(null)}
        >
          <PhoneResult result={phone} />
        </Modal>
      )}
    </>
  );
}
export function AccountPanel({ user }: { user: UserProfile }) {
  const auth = useAuth();
  const router = useRouter();
  const [available, setAvailable] = useState(user.is_call_available !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setAvailable(user.is_call_available !== false);
  }, [user.is_call_available]);
  const toggle = async () => {
    if (user.role === "admin") return;
    setBusy(true);
    setError("");
    try {
      const result = await setAvailability(user.role, !available);
      setAvailable(result.data.is_call_available);
      await auth.refreshProfile();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
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
                ? "Platform administrator"
                : user.role === "farmer"
                  ? "Farmer community"
                  : "Buyer community"}{" "}
              · <span style={{ color: "#8ea773" }}>Approved member</span>
            </p>
          </div>
        </div>
        <dl className="detail-grid">
          {[
            ["Email", user.email],
            ["Phone", user.mobile_number],
            ["State", user.state],
            ["City / village", user.city],
            ["Language", user.preferred_language],
            ["Nationality", user.nationality],
            ["Address", user.full_address],
            ...(user.role === "farmer"
              ? [["Farm location", user.land_location]]
              : []),
          ].map(([key, value]) => (
            <div
              key={key}
              className={
                key === "Address" || key === "Farm location" ? "full-span" : ""
              }
            >
              <dt>{key}</dt>
              <dd>{value || "Not provided"}</dd>
            </div>
          ))}
        </dl>
        {error && <Notice>{error}</Notice>}
        {user.role !== "admin" && !user.must_change_password && (
          <div className="availability-panel">
            <div>
              <strong>
                {available
                  ? "Open to a conversation"
                  : "Taking a little quiet time"}
              </strong>
              <p>
                {available
                  ? "Members can request your number when the connection is permitted."
                  : "Your contact requests are paused. Switch this on when you’re ready to connect."}
              </p>
            </div>
            <button
              className={`toggle ${available ? "on" : ""}`}
              role="switch"
              aria-checked={available}
              aria-label="Available for calls"
              onClick={() => void toggle()}
              disabled={busy}
            >
              <span />
            </button>
          </div>
        )}
      </section>
      {user.role === "admin" ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>A little care for your account.</h2>
              <p>
                Administrator credentials are managed by your platform operator.
              </p>
            </div>
            <ShieldCheck size={22} />
          </div>
          <p className="muted">
            Keep your sign-in details private, and sign out when you’ve finished
            reviewing applications on a shared device.
          </p>
        </section>
      ) : (
        <ChangePasswordPanel
          role={user.role}
          required={!!user.must_change_password}
          onChanged={async () => {
            await auth.logout();
            router.replace(`/login?role=${user.role}&password=updated`);
          }}
        />
      )}
    </div>
  );
}
function ChangePasswordPanel({
  role,
  required,
  onChanged,
}: {
  role: MemberRole;
  required: boolean;
  onChanged: () => Promise<void>;
}) {
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
            {required
              ? "First, make this account yours."
              : "Keep your account growing safely."}
          </h2>
          <p>
            {required
              ? "Replace the temporary password before opening your workspace."
              : "Choose a new password whenever you need a fresh start."}
          </p>
        </div>
        <ShieldCheck size={23} strokeWidth={1.3} />
      </div>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="form-stack">
        <PasswordInput
          id="change-current"
          label={
            required ? "Temporary password from your email" : "Current password"
          }
          value={current}
          onChange={setCurrent}
        />
        <PasswordInput
          id="change-new"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordRules value={password} />
        <PasswordInput
          id="change-confirm"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        <button className="button full-width" disabled={busy}>
          {busy ? (
            <Spinner label="Updating password…" />
          ) : (
            <>
              Set my new password
              <ArrowRight size={16} />
            </>
          )}
        </button>
        <Link className="text-link" href={`/forgot-password?role=${role}`}>
          Forgot your current password?
          <ArrowUpRight size={13} />
        </Link>
      </form>
    </section>
  );
}
export function MemberMetrics({ role }: { role: MemberRole }) {
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
              role === "farmer" ? "Your crop listings" : "Available harvests",
            value: result.data?.crops.length,
            note:
              role === "farmer"
                ? "Your work, ready to be discovered"
                : "Discover your next connection",
            Icon: Sprout,
          },
          {
            label: role === "farmer" ? "Buyer interests" : "Your interests",
            value: result.data?.interests.length,
            note: "Small beginnings. Real possibilities.",
            Icon: Heart,
          },
          {
            label: role === "farmer" ? "Available crops" : "Organic harvests",
            value: result.data?.crops.filter((crop) =>
              role === "farmer"
                ? crop.status === "available"
                : crop.crop_type === "organic",
            ).length,
            note:
              role === "farmer"
                ? "Ready for their next chapter"
                : "Growing with nature",
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
