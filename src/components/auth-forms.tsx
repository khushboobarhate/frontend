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
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/context";
import {
  forgotPassword,
  registerAccount,
  resetPassword,
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
          <span className="eyebrow">ROOTED IN INDIA. GROWING TOGETHER.</span>
          <h2>
            Good things
            <br />
            begin with
            <br />
            <em>connection.</em>
          </h2>
          <p>
            For the hands that grow.
            <br />
            For the people who believe in their harvest.
          </p>
          <div className="auth-story-bottom">
            <Leaf size={19} />
            <span>Every root deserves its worth.</span>
          </div>
        </div>
      </aside>
      <section className="auth-content">
        <header className="auth-top">
          <Link href="/" className="back-link">
            <ArrowLeft size={15} />
            Back to home
          </Link>
          {!hideLanguage && <LanguageSwitch />}
        </header>
        <div className="auth-form-container">{children}</div>
        <footer className="auth-bottom">
          <ShieldCheck size={15} />
          Thoughtful connections. Human-reviewed accounts.<span>सेतुमूल्य</span>
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
  label = "Password",
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
  const [visible, setVisible] = useState(false);
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
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
              ? "Create a strong password"
              : "Enter your password"
          }
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}
export function PasswordRules({ value }: { value: string }) {
  const rules = [
    {
      label: "12–128 characters",
      valid: value.length >= 12 && value.length <= 128,
    },
    {
      label: "Upper & lowercase",
      valid: /[A-Z]/.test(value) && /[a-z]/.test(value),
    },
    {
      label: "Number & symbol",
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
        throw new Error("Enter a valid email address.");
      const user = await auth.login(role, { email: email.trim(), password });
      router.push(
        user.must_change_password ? "/dashboard?view=account" : "/dashboard",
      );
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell>
      <span className="eyebrow">A LITTLE CLOSER TO POSSIBILITY</span>
      <h1>{adminMode ? "Administrator sign in" : t("welcome")}</h1>
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
          Your password is updated. Sign in to keep growing.
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
            <Spinner label="Signing you in…" />
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
            ? "For approved platform administrators."
            : "Use the email and temporary password sent after approval. Your harvest, your network — all in one place."}
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
  const params = useSearchParams();
  const [role, setRole] = useState<MemberRole>(memberRole(params.get("role")));
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState(blankRegistration);
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
        {!options.required && <small>Optional</small>}
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
          <span className="eyebrow">A NEW BEGINNING</span>
          <h1>
            You’re one
            <br />
            <em>step closer.</em>
          </h1>
          <p>
            Thank you, {submitted.full_name}. Your {role} application is with
            our team for review.
          </p>
          <div className="success-details">
            <Mail size={21} />
            <div>
              <strong>Keep an eye on your inbox</strong>
              <p>
                After approval, your login ID and temporary password will arrive
                at <b>{submitted.email}</b>.
              </p>
            </div>
          </div>
          <div className="reference">
            <span>APPLICATION REFERENCE</span>
            <code>{submitted.request_id}</code>
          </div>
          <Link href={`/login?role=${role}`} className="button full-width">
            Back to sign in
            <ArrowRight size={18} />
          </Link>
          <p className="muted">
            You can close this page. We’ll email you when your application has
            been reviewed.
          </p>
        </div>
      ) : (
        <>
          <span className="eyebrow">YOUR NEXT SEASON STARTS HERE</span>
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
                {field("full_name", t("fullName"), "Your full name", {
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
                  {field("age", t("age"), "Your age", { type: "number" })}
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
                      <option value="mr">मराठी</option>
                      <option value="gu">ગુજરાતી</option>
                    </select>
                  </label>
                </div>
                <div className="form-note">
                  <Mail size={18} />
                  <p>
                    We’ll email your login details after approval. There’s no
                    password to create right now.
                  </p>
                </div>
                <button className="button full-width">
                  {t("continue")}
                  <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <>
                <div className="form-grid">
                  {field("state", t("state"), "e.g. Maharashtra", {
                    required: true,
                    autoComplete: "address-level1",
                  })}
                  {field("city", t("city"), "Your city or village", {
                    required: true,
                    autoComplete: "address-level2",
                  })}
                  {field("taluka", t("taluka"), "Taluka or tehsil")}
                  {field("nationality", t("nationality"), "e.g. Indian")}
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
                    placeholder="House, street, village, and PIN code"
                    minLength={10}
                    maxLength={500}
                  />
                </label>
                {role === "farmer" &&
                  field(
                    "land_location",
                    t("land"),
                    "Village, plot number, or farm location",
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
                        setError(
                          "Choose a JPEG, PNG, or WebP photo under 5 MB.",
                        );
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
                      {photo ? photo.name : "Add a profile photo"}
                      <small>Optional</small>
                    </strong>
                    <p>JPEG, PNG, or WebP · Up to 5 MB</p>
                  </div>
                  <ArrowUpRight size={18} />
                </label>
                <div className="form-note">
                  <ShieldCheck size={18} />
                  <p>
                    Your details go to our team for a personal review. Only
                    approved members can access the marketplace.
                  </p>
                </div>
                <div className="form-button-row">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setStep(1)}
                    disabled={busy}
                  >
                    <ArrowLeft size={17} />
                    Back
                  </button>
                  <button className="button" disabled={busy}>
                    {busy ? (
                      <Spinner label="Submitting…" />
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
      <span className="eyebrow">LET’S GET YOU BACK TO GROWING</span>
      <h1>{sent ? "Check your inbox." : "A fresh start."}</h1>
      <p className="form-subtitle">
        {sent
          ? "If an approved account matches your email, a password reset link will be on its way. Check your spam folder too."
          : "Forgot your password? Enter your registered email and we’ll send you a link to set a new one."}
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
              <span>Registered email</span>
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
                <Spinner label="Sending your link…" />
              ) : (
                <>
                  Send reset link
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </>
      )}
      <Link href={`/login?role=${role}`} className="back-link form-back">
        <ArrowLeft size={15} />
        Back to sign in
      </Link>
    </AuthShell>
  );
}
export function ResetForm() {
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
      setError(
        "Use 12–128 characters, with upper and lowercase letters, a number, and a symbol.",
      );
      return;
    }
    if (password !== confirmation) {
      setError("Your passwords don’t match yet. Please check both fields.");
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
      <span className="eyebrow">NEW PASSWORD. NEW POSSIBILITIES.</span>
      <h1>Make it yours.</h1>
      <p className="form-subtitle">
        Choose a strong password to get back to your SetuMoolya community.
      </p>
      {error && <Notice>{error}</Notice>}
      {!checked ? (
        <Spinner />
      ) : !token ? (
        <>
          <Notice kind="info">
            This reset link is missing or has already been opened. Request a
            fresh link to continue.
          </Notice>
          <Link href="/forgot-password" className="button full-width">
            Request a new link
            <ArrowRight size={17} />
          </Link>
        </>
      ) : (
        <form onSubmit={submit} className="form-stack">
          <PasswordInput
            id="new-password"
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <PasswordRules value={password} />
          <PasswordInput
            id="confirm-password"
            label="Confirm new password"
            value={confirmation}
            onChange={setConfirmation}
            autoComplete="new-password"
          />
          <button className="button full-width" disabled={busy}>
            {busy ? (
              <Spinner label="Updating password…" />
            ) : (
              <>
                Set new password
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
