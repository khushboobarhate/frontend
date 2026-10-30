"use client";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter, type Locale } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/lib/auth/context";
import {
  forgotPassword,
  registerAccount,
  resetPassword,
  updateProfile,
} from "@/lib/api/client";
import type { MemberRole, UserRole } from "@/types";
import { fieldRules, registrationError, validEmail } from "@/lib/validation";
import { Brand, Notice, Spinner } from "./ui";
import { LanguageSwitch } from "./site-header";
const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
const memberRole = (value: string | null): MemberRole =>
  value === "buyer" ? "buyer" : "farmer";
export const strongPassword = (value: string) =>
  value.length >= 12 &&
  value.length <= 128 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value) &&
  /[^A-Za-z0-9]/.test(value);
export function AuthShell({
  children,
  registration = false,
  hideLanguage = false,
}: {
  children: ReactNode;
  registration?: boolean;
  hideLanguage?: boolean;
}) {
  const t = useTranslations("Auth");
  return (
    <main className={`auth-page ${registration ? "auth-registration" : ""}`}>
      <aside className="auth-story">
        <div className="auth-story-image">
          <Image
            src={
              registration ? "/images/rice-fields.jpg" : "/images/harvest.jpg"
            }
            alt={
              registration
                ? "Rice seedlings in the hands of an Indian farmer"
                : "An Indian farmer gathering a wheat harvest in Rajasthan"
            }
            fill
            priority
            sizes="(max-width: 760px) 100vw, 44vw"
          />
        </div>
        <div className="auth-story-shade" />
        <Brand light />
        <div className="auth-story-copy">
          <span className="eyebrow">{t("story.eyebrow")}</span>
          <h2>
            {t("story.title1")}
            <br />
            {t("story.title2")}
            <br />
            <em>{t("story.title3")}</em>
          </h2>
          <p>
            {t("story.p1")}
            <br />
            {t("story.p2")}
          </p>
          <div className="auth-story-bottom">
            <Leaf size={19} />
            <span>{t("story.badge")}</span>
          </div>
        </div>
      </aside>
      <section className="auth-content">
        <header className="auth-top">
          <Link href="/" className="back-link">
            <ArrowLeft size={15} />
            {t("backHome")}
          </Link>
          {!hideLanguage && <LanguageSwitch />}
        </header>
        <div className="auth-form-container">{children}</div>
        <footer className="auth-bottom">
          <ShieldCheck size={15} />
          {t("story.footer")}<span>सेतुमूल्य</span>
        </footer>
      </section>
    </main>
  );
}
export function RolePicker({
  value,
  onChange,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
}) {
  const t = useTranslations("Auth");
  const roles: { role: UserRole; Icon: typeof Sprout }[] = [
    { role: "farmer", Icon: Sprout },
    { role: "buyer", Icon: ShoppingBasket },
  ];
  return (
    <div className="role-picker" role="group" aria-label="Account role">
      {roles.map(({ role, Icon }) => (
        <button
          type="button"
          key={role}
          aria-pressed={value === role}
          className={value === role ? "selected" : ""}
          onClick={() => onChange(role)}
        >
          <Icon size={19} strokeWidth={1.6} />
          {t(role)}
          {value === role && <Check size={14} />}
        </button>
      ))}
    </div>
  );
}
export function PasswordInput({
  id,
  value,
  onChange,
  label,
  autoComplete = "current-password",
  required = true,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const t = useTranslations("Auth");
  const [visible, setVisible] = useState(false);
  return (
    <label className="field" htmlFor={id}>
      <span>{label || t("password")}</span>
      <div className="input-icon">
        <LockKeyhole size={17} />
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          autoComplete={autoComplete}
          maxLength={128}
          placeholder={
            autoComplete === "new-password"
              ? t("createPasswordPlaceholder")
              : t("enterPasswordPlaceholder")
          }
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}
export function PasswordRules({ value }: { value: string }) {
  const t = useTranslations("Auth");
  const rules = [
    {
      label: t("ruleLength"),
      valid: value.length >= 12 && value.length <= 128,
    },
    {
      label: t("ruleCase"),
      valid: /[A-Z]/.test(value) && /[a-z]/.test(value),
    },
    {
      label: t("ruleNumberSymbol"),
      valid: /\d/.test(value) && /[^A-Za-z0-9]/.test(value),
    },
  ];
  return (
    <div className="password-rules">
      {rules.map((rule) => (
        <span key={rule.label} className={rule.valid ? "valid" : ""}>
          <Check size={13} />
          {rule.label}
        </span>
      ))}
    </div>
  );
}
export function LoginForm({ adminMode = false }: { adminMode?: boolean }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const initial = params.get("role");
  const [member, setRole] = useState<MemberRole>(memberRole(initial));
  const role: UserRole = adminMode ? "admin" : member;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (auth.user) router.replace("/dashboard");
  }, [auth.user, router]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!validEmail(email.trim()))
        throw new Error(t("validEmailError"));
      const user = await auth.login(role, { email: email.trim(), password });
      let targetLocale = locale as Locale;
      let explicit: string | null = null;
      try {
        explicit = sessionStorage.getItem("sm_locale_explicit");
      } catch {}
      if (explicit && (explicit === "en" || explicit === "hi" || explicit === "gu")) {
        targetLocale = explicit as Locale;
        updateProfile(role, { preferred_language: targetLocale }).catch(() => {});
        try {
          sessionStorage.removeItem("sm_locale_explicit");
        } catch {}
      } else if (
        user.preferred_language &&
        (user.preferred_language === "en" ||
          user.preferred_language === "hi" ||
          user.preferred_language === "gu")
      ) {
        targetLocale = user.preferred_language as Locale;
      } else if (targetLocale) {
        updateProfile(role, { preferred_language: targetLocale }).catch(() => {});
      }
      document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000; SameSite=lax`;
      try {
        localStorage.setItem("sm_locale", targetLocale);
      } catch {}
      router.push(
        user.must_change_password ? "/dashboard?view=account" : "/dashboard",
        { locale: targetLocale },
      );
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell>
      <span className="eyebrow">{t("loginEyebrow")}</span>
      <h1>{adminMode ? t("adminSignInTitle") : t("welcome")}</h1>
      <p className="form-subtitle">{t("loginDescription")}</p>
      {!adminMode && (
        <RolePicker
          value={role}
          onChange={(value) => {
            setRole(value as MemberRole);
            setError("");
          }}
        />
      )}
      {error && <Notice>{error}</Notice>}
      {params.get("password") === "updated" && (
        <Notice kind="success">
          {t("passwordUpdated")}
        </Notice>
      )}
      <form onSubmit={submit} className="form-stack">
        <label className="field" htmlFor="login-email">
          <span>{t("email")}</span>
          <div className="input-icon">
            <Mail size={17} />
            <input
              id="login-email"
              type="email"
              maxLength={254}
              autoComplete="username"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </label>
        <PasswordInput
          id="login-password"
          value={password}
          onChange={setPassword}
          label={t("password")}
        />
        {role !== "admin" && (
          <div className="forgot-link">
            <Link href={`/forgot-password?role=${role}`}>{t("forgot")}</Link>
          </div>
        )}
        <button className="button full-width" disabled={busy || auth.isLoading}>
          {busy ? (
            <Spinner label={t("signingIn")} />
          ) : (
            <>
              {t("signIn")}
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
      <div className="form-note">
        <ShieldCheck size={17} />
        <p>
          {role === "admin"
            ? t("adminNote")
            : t("memberNote")}
        </p>
      </div>
      {!adminMode && (
        <p className="form-switch">
          {t("noAccount")}{" "}
          <Link href={`/register?role=${role === "admin" ? "farmer" : role}`}>
            {t("join")}
            <ArrowUpRight size={14} />
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
const blankRegistration = {
  full_name: "",
  email: "",
  mobile_number: "",
  state: "",
  city: "",
  full_address: "",
  land_location: "",
  nationality: "",
  age: "",
  taluka: "",
  preferred_language: "en",
};
export function RegisterForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const params = useSearchParams();
  const [role, setRole] = useState<MemberRole>(memberRole(params.get("role")));
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState({
    ...blankRegistration,
    preferred_language: locale || "en",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<{
    request_id: string;
    email: string;
    full_name: string;
  } | null>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const selectPhoto = (file: File | null) => {
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  };
  const update = (key: keyof typeof fields, value: string) =>
    setFields((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const invalid = registrationError(fields, role, step);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    setBusy(true);
    const data = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value.trim() && (key !== "land_location" || role === "farmer"))
        data.append(key, value.trim());
    });
    if (photo) data.append("photo", photo);
    try {
      const response = await registerAccount(role, data);
      setSubmitted(response.data);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  const field = (
    key: keyof typeof fields,
    label: string,
    placeholder: string,
    options: { required?: boolean; type?: string; autoComplete?: string } = {},
  ) => (
    <label className="field" htmlFor={`register-${key}`}>
      <span>
        {label}
        {!options.required && <small>{t("optional")}</small>}
      </span>
      <input
        id={`register-${key}`}
        name={key}
        type={options.type || "text"}
        autoComplete={options.autoComplete}
        value={fields[key]}
        onChange={(event) => update(key, event.target.value)}
        required={options.required}
        placeholder={placeholder}
        minLength={fieldRules[key]?.[0]}
        maxLength={
          key === "mobile_number"
            ? 10
            : key === "email"
              ? 254
              : fieldRules[key]?.[1] || 3
        }
        {...(key === "age" ? { min: 18, max: 120, step: 1 } : {})}
        {...(key === "mobile_number"
          ? {
              pattern: "[0-9]{10}",
              inputMode: "numeric" as const,
              title: "Exactly 10 digits, without a country code",
            }
          : {})}
      />
    </label>
  );
  return (
    <AuthShell registration>
      {submitted ? (
        <div className="registration-success">
          <span className="success-mark">
            <CheckCircle2 size={43} strokeWidth={1.4} />
          </span>
          <span className="eyebrow">{t("successEyebrow")}</span>
          <h1>
            {t("successTitle1")}
            <br />
            <em>{t("successTitle2")}</em>
          </h1>
          <p>
            {t("successGreeting", { name: submitted.full_name, role: t(role) })}
          </p>
          <div className="success-details">
            <Mail size={21} />
            <div>
              <strong>{t("successInboxTitle")}</strong>
              <p>
                {t("successInboxDesc", { email: submitted.email })}
              </p>
            </div>
          </div>
          <div className="reference">
            <span>{t("referenceLabel")}</span>
            <code>{submitted.request_id}</code>
          </div>
          <Link href={`/login?role=${role}`} className="button full-width">
            {t("backToSignIn")}
            <ArrowRight size={18} />
          </Link>
          <p className="muted">
            {t("successCloseNote")}
          </p>
        </div>
      ) : (
        <>
          <span className="eyebrow">{t("registerEyebrow")}</span>
          <h1>{t("registerTitle")}</h1>
          <p className="form-subtitle">{t("registerDescription")}</p>
          <RolePicker
            value={role}
            onChange={(value) => {
              setRole(value as MemberRole);
              setError("");
            }}
          />
          <div className="form-progress">
            <span className={step === 1 ? "current" : "done"}>
              <i>{step > 1 ? <Check size={12} /> : "1"}</i>
              {t("aboutYou")}
            </span>
            <span />
            <span className={step === 2 ? "current" : ""}>
              <i>2</i>
              {t("yourRoots")}
            </span>
          </div>
          {error && <Notice>{error}</Notice>}
          <form className="form-stack" onSubmit={submit}>
            {step === 1 ? (
              <>
                {field("full_name", t("fullName"), t("fullNamePlaceholder"), {
                  required: true,
                  autoComplete: "name",
                })}
                {field("email", t("email"), "you@example.com", {
                  required: true,
                  type: "email",
                  autoComplete: "email",
                })}
                {field("mobile_number", t("phone"), "9876543210", {
                  required: true,
                  type: "tel",
                  autoComplete: "tel",
                })}
                <div className="form-grid">
                  {field("age", t("age"), t("agePlaceholder"), { type: "number" })}
                  <label className="field" htmlFor="register-language">
                    <span>{t("language")}</span>
                    <select
                      id="register-language"
                      value={fields.preferred_language}
                      onChange={(event) =>
                        update("preferred_language", event.target.value)
                      }
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी</option>
                      <option value="gu">ગુજરાતી</option>
                    </select>
                  </label>
                </div>
                <div className="form-note">
                  <Mail size={18} />
                  <p>{t("emailNote")}</p>
                </div>
                <button className="button full-width">
                  {t("continue")}
                  <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <>
                <div className="form-grid">
                  {field("state", t("state"), t("statePlaceholder"), {
                    required: true,
                    autoComplete: "address-level1",
                  })}
                  {field("city", t("city"), t("cityPlaceholder"), {
                    required: true,
                    autoComplete: "address-level2",
                  })}
                  {field("taluka", t("taluka"), t("talukaPlaceholder"))}
                  {field("nationality", t("nationality"), t("nationalityPlaceholder"))}
                </div>
                <label className="field" htmlFor="register-address">
                  <span>{t("address")}</span>
                  <textarea
                    id="register-address"
                    rows={2}
                    autoComplete="street-address"
                    value={fields.full_address}
                    onChange={(event) =>
                      update("full_address", event.target.value)
                    }
                    required
                    placeholder={t("addressPlaceholder")}
                    minLength={10}
                    maxLength={500}
                  />
                </label>
                {role === "farmer" &&
                  field(
                    "land_location",
                    t("land"),
                    t("landPlaceholder"),
                    { required: true },
                  )}
                <label className="photo-upload" htmlFor="register-photo">
                  <input
                    id="register-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (
                        file.size > 5 * 1024 * 1024 ||
                        !["image/jpeg", "image/png", "image/webp"].includes(
                          file.type,
                        )
                      ) {
                        setError(t("photoUploadNote"));
                        event.target.value = "";
                        selectPhoto(null);
                        return;
                      }
                      selectPhoto(file);
                      setError("");
                    }}
                  />
                  {preview ? (
                    <Image
                      src={preview}
                      alt="Your selected profile photo"
                      width={50}
                      height={50}
                      unoptimized
                    />
                  ) : (
                    <span>
                      <Camera size={22} />
                    </span>
                  )}
                  <div>
                    <strong>
                      {photo ? photo.name : t("photoUploadLabel")}
                      <small>{t("optional")}</small>
                    </strong>
                    <p>{t("photoUploadHelp")}</p>
                  </div>
                  <ArrowUpRight size={18} />
                </label>
                <div className="form-note">
                  <ShieldCheck size={18} />
                  <p>{t("reviewNote")}</p>
                </div>
                <div className="form-button-row">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setStep(1)}
                    disabled={busy}
                  >
                    <ArrowLeft size={17} />
                    {t("back")}
                  </button>
                  <button className="button" disabled={busy}>
                    {busy ? (
                      <Spinner label={t("submitting")} />
                    ) : (
                      <>
                        {t("submit")}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
          <p className="form-switch">
            {t("already")}{" "}
            <Link href={`/login?role=${role}`}>
              {t("signIn")}
              <ArrowUpRight size={14} />
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
export function ForgotForm() {
  const t = useTranslations("Auth");
  const params = useSearchParams();
  const [role, setRole] = useState<MemberRole>(memberRole(params.get("role")));
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await forgotPassword(role, email.trim());
      setSent(true);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell>
      <span className="eyebrow">{t("forgotEyebrow")}</span>
      <h1>{sent ? t("checkInbox") : t("freshStart")}</h1>
      <p className="form-subtitle">
        {sent
          ? t("checkInboxDesc")
          : t("forgotPasswordDesc")}
      </p>
      {error && <Notice>{error}</Notice>}
      {!sent && (
        <>
          <RolePicker
            value={role}
            onChange={(value) => setRole(value as MemberRole)}
          />
          <form onSubmit={submit} className="form-stack">
            <label className="field" htmlFor="recovery-email">
              <span>{t("registeredEmail")}</span>
              <div className="input-icon">
                <Mail size={18} />
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </label>
            <button className="button full-width" disabled={busy}>
              {busy ? (
                <Spinner label={t("sendingLink")} />
              ) : (
                <>
                  {t("sendResetLink")}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </>
      )}
      <Link href={`/login?role=${role}`} className="back-link form-back">
        <ArrowLeft size={15} />
        {t("backToSignIn")}
      </Link>
    </AuthShell>
  );
}
export function ResetForm() {
  const t = useTranslations("Auth");
  const [role, setRole] = useState<MemberRole>("farmer");
  const [token, setToken] = useState("");
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  /* eslint-disable react-hooks/set-state-in-effect -- Consume browser-only recovery state after hydration, then remove the secret from history. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const hash = params.get("token_hash");
    const kind = params.get("role");
    if (hash && (kind === "farmer" || kind === "buyer")) {
      setToken(hash);
      setRole(kind);
    }
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    setChecked(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!strongPassword(password)) {
      setError(t("rulesError"));
      return;
    }
    if (password !== confirmation) {
      setError(t("mismatchError"));
      return;
    }
    setBusy(true);
    try {
      await resetPassword(role, token, password);
      router.replace(`/login?role=${role}&password=updated`);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell hideLanguage>
      <span className="eyebrow">{t("resetEyebrow")}</span>
      <h1>{t("resetTitle")}</h1>
      <p className="form-subtitle">
        {t("resetSubtitle")}
      </p>
      {error && <Notice>{error}</Notice>}
      {!checked ? (
        <Spinner />
      ) : !token ? (
        <>
          <Notice kind="info">
            {t("linkMissing")}
          </Notice>
          <Link href="/forgot-password" className="button full-width">
            {t("requestNewLink")}
            <ArrowRight size={17} />
          </Link>
        </>
      ) : (
        <form onSubmit={submit} className="form-stack">
          <PasswordInput
            id="new-password"
            label={t("newPassword")}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <PasswordRules value={password} />
          <PasswordInput
            id="confirm-password"
            label={t("confirmPassword")}
            value={confirmation}
            onChange={setConfirmation}
            autoComplete="new-password"
          />
          <button className="button full-width" disabled={busy}>
            {busy ? (
              <Spinner label={t("updating")} />
            ) : (
              <>
                {t("updatePassword")}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
