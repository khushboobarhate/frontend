'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  CircleUserRound,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Sprout,
  UserPlus,
  Waves,
} from 'lucide-react';
import type { RegistrationRequest, UserRole } from '@/types';
import { useAuth } from '@/lib/auth/context';
import {
  approveRequest,
  buyerRegister,
  checkHealth,
  farmerRegister,
  getAdminDashboard,
  rejectRequest,
  sendOtp,
  verifyOtp,
  verifyWidgetOtp,
} from '@/lib/api/client';

type Screen = 'login' | 'register';

type RegistrationFields = {
  full_name: string;
  age: string;
  mobile_number: string;
  email: string;
  password: string;
  nationality: string;
  state: string;
  taluka: string;
  city: string;
  full_address: string;
  land_location: string;
  preferred_language: string;
};

type Msg91WidgetConfig = {
  widgetId: string;
  tokenAuth: string;
  identifier: string;
  exposeMethods: false;
  success: (data: Record<string, unknown>) => void;
  failure: (error: unknown) => void;
};

declare global {
  interface Window {
    initSendOTP?: (configuration: Msg91WidgetConfig) => void;
  }
}

const emptyRegistration: RegistrationFields = {
  full_name: '',
  age: '',
  mobile_number: '',
  email: '',
  password: '',
  nationality: '',
  state: '',
  taluka: '',
  city: '',
  full_address: '',
  land_location: '',
  preferred_language: 'en',
};

const roleLabel: Record<UserRole, string> = {
  farmer: 'Farmer',
  buyer: 'Buyer',
  admin: 'Admin',
};

function displayError(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

function loadMsg91Widget(): Promise<void> {
  if (window.initSendOTP) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-msg91-widget]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Could not load the MSG91 verification widget.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.dataset.msg91Widget = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the MSG91 verification widget.'));
    document.body.appendChild(script);
  });
}

export default function HomePage() {
  const { user, isLoading: authLoading, isAuthenticated, login, logout, refreshProfile } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');
  const [role, setRole] = useState<UserRole>('farmer');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [registration, setRegistration] = useState<RegistrationFields>(emptyRegistration);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [phoneVerifiedToken, setPhoneVerifiedToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const loadAdminRequests = useCallback(async (): Promise<boolean> => {
    setDashboardLoading(true);
    try {
      const result = await getAdminDashboard({ page: 1, limit: 25 });
      setRequests(result.data);
      return true;
    } catch (error) {
      setNotice(`Could not load registration requests: ${displayError(error)}`);
      return false;
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    checkHealth()
      .then((result) => {
        if (active) setBackendStatus(result.status === 'healthy' ? 'online' : 'offline');
      })
      .catch(() => {
        if (active) setBackendStatus('offline');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') void loadAdminRequests();
  }, [isAuthenticated, user?.role, loadAdminRequests]);

  const normalizedPhone = registration.mobile_number.replace(/\s/g, '');

  const updateRegistration = (key: keyof RegistrationFields, value: string) => {
    setRegistration((current) => ({ ...current, [key]: value }));
    if (key === 'mobile_number') {
      setPhoneVerifiedToken('');
      setOtpSent(false);
      setOtp('');
    }
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      await login(role, {
        ...(role === 'admin' ? { email: loginId.trim() } : { login_id: loginId.trim() }),
        password,
      });
      setNotice('Signed in successfully.');
    } catch (error) {
      setNotice(`Sign in failed: ${displayError(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async () => {
    if (!normalizedPhone) {
      setNotice('Enter your mobile number first.');
      return;
    }

    setBusy(true);
    setNotice('');
    try {
      const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
      const tokenAuth = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN;
      if (widgetId && tokenAuth) {
        await loadMsg91Widget();
        if (!window.initSendOTP) throw new Error('The MSG91 widget did not initialize.');
        window.initSendOTP({
          widgetId,
          tokenAuth,
          identifier: normalizedPhone.replace(/^\+/, ''),
          exposeMethods: false,
          success: async (data) => {
            const accessToken = data['access-token'];
            if (typeof accessToken !== 'string' || !accessToken) {
              setNotice('MSG91 did not return a verification token. Please try again.');
              return;
            }
            try {
              const result = await verifyWidgetOtp(normalizedPhone, accessToken);
              setPhoneVerifiedToken(result.phone_verified_token);
              setOtpSent(true);
              setNotice(result.message);
            } catch (error) {
              setNotice(`Phone verification failed: ${displayError(error)}`);
            }
          },
          failure: (error) => setNotice(`MSG91 verification failed: ${displayError(error)}`),
        });
        setNotice('Complete the phone verification in the MSG91 widget.');
      } else {
        const result = await sendOtp(normalizedPhone);
        setOtpSent(true);
        setNotice(result.message);
      }
    } catch (error) {
      setNotice(`Could not send OTP: ${displayError(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setBusy(true);
    setNotice('');
    try {
      const result = await verifyOtp(normalizedPhone, otp.trim());
      setPhoneVerifiedToken(result.phone_verified_token);
      setNotice(result.message);
    } catch (error) {
      setNotice(`OTP verification failed: ${displayError(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setPhoto(file);
    setPhotoPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!phoneVerifiedToken) {
      setNotice('Verify your mobile number before submitting the registration request.');
      return;
    }
    if (!photo) {
      setNotice('Upload a passport-size photo before submitting.');
      return;
    }

    const formData = new FormData();
    Object.entries(registration).forEach(([key, value]) => {
      if (key === 'mobile_number') {
        formData.append(key, normalizedPhone);
      } else if (key !== 'land_location' || role === 'farmer') {
        formData.append(key, value.trim());
      }
    });
    formData.append('phone_verified_token', phoneVerifiedToken);
    formData.append('photo', photo);

    setBusy(true);
    setNotice('');
    try {
      const result = role === 'farmer'
        ? await farmerRegister(formData)
        : await buyerRegister(formData);
      setNotice(`${result.message} Reference: ${result.request_id}`);
      setPhoneVerifiedToken('');
      setOtpSent(false);
      setRegistration((current) => ({ ...current, password: '' }));
    } catch (error) {
      setNotice(`Registration failed: ${displayError(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const refreshDashboard = async () => {
    setBusy(true);
    setNotice('');
    try {
      await refreshProfile();
      if (user?.role === 'admin' && !(await loadAdminRequests())) return;
      setNotice('Account information refreshed.');
    } catch (error) {
      setNotice(`Refresh failed: ${displayError(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDecision = async (requestId: string, decision: 'approve' | 'reject') => {
    setBusy(true);
    setNotice('');
    try {
      const result = decision === 'approve'
        ? await approveRequest(requestId)
        : await rejectRequest(requestId);
      setNotice(result.message);
      await loadAdminRequests();
    } catch (error) {
      setNotice(`${decision === 'approve' ? 'Approval' : 'Rejection'} failed: ${displayError(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const statusText = backendStatus === 'online'
    ? 'Backend reachable'
    : backendStatus === 'checking'
      ? 'Checking backend'
      : 'Backend unavailable';

  return (
    <main className="app-shell">
      <div className="farm-layer" aria-hidden="true">
        <div className="farm-glow" />
        <div className="farm-grid" />
      </div>

      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark"><Waves size={22} /></div>
          <div>
            <div className="brand-title">Setu Moolya <span className="brand-hindi">(सेतुमूल्य)</span></div>
            <div className="brand-tag">Every Root Deserves Its Worth</div>
          </div>
        </div>
        <div className="nav-actions">
          <div className="status-pill" aria-live="polite">
            <span className="status-dot" style={{ background: backendStatus === 'online' ? undefined : '#f59e0b' }} />
            {statusText}
          </div>
        </div>
      </header>

      {authLoading ? (
        <section className="auth-shell"><div className="glass-card auth-card">Checking your session…</div></section>
      ) : !isAuthenticated || !user ? (
        <section className="auth-shell">
          <div className="glass-card auth-card">
            <div className="auth-header">
              <div className="avatar-ring"><Waves size={30} /></div>
              <h1>Setu Moolya <span className="brand-hindi accent">(सेतुमूल्य)</span></h1>
              <p>AgriTech &amp; Rural Herb Direct B2B Value Chain</p>
              <div className="motto-badge"><Sprout size={14} /> FARMER • FAIR VALUE • ESCROW • GROWTH</div>
            </div>

            <div className="tab-switcher">
              <button type="button" className={`tab-button ${screen === 'login' ? 'active' : ''}`} onClick={() => { setScreen('login'); setNotice(''); }}>
                <ArrowRight size={16} /> Sign In
              </button>
              <button type="button" className={`tab-button ${screen === 'register' ? 'active' : ''}`} onClick={() => { setScreen('register'); setRole((current) => current === 'admin' ? 'farmer' : current); setNotice(''); }}>
                <UserPlus size={16} /> Register
              </button>
            </div>

            {notice ? <div className="notice-box" role="status">{notice}</div> : null}

            {screen === 'login' ? (
              <form className="auth-form" onSubmit={submitLogin}>
                <div className="field-group">
                  <label className="field-label" htmlFor="login-role">Sign in as</label>
                  <select id="login-role" className="field-input" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                    <option value="farmer">Farmer</option>
                    <option value="buyer">Buyer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="info-banner"><ShieldCheck size={16} /> Accounts can sign in after an admin approves them.</div>
                <div className="field-group">
                  <label className="field-label" htmlFor="login-id">Login email</label>
                  <div className="input-wrap">
                    <Mail size={16} />
                    <input id="login-id" type="email" autoComplete="username" required value={loginId} onChange={(event) => setLoginId(event.target.value)} placeholder="you@example.com" />
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="password">Password</label>
                  <div className="input-wrap">
                    <ShieldCheck size={16} />
                    <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
                  </div>
                </div>
                <button type="submit" className="primary-button" disabled={busy}>
                  <ArrowRight size={18} /> {busy ? 'Signing in…' : 'Sign In to Setu Moolya'}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={submitRegistration}>
                <div className="field-group">
                  <label className="field-label" htmlFor="register-role">Register as</label>
                  <select id="register-role" className="field-input" value={role === 'admin' ? 'farmer' : role} onChange={(event) => setRole(event.target.value as UserRole)}>
                    <option value="farmer">Farmer / Cultivator</option>
                    <option value="buyer">B2B Herb Buyer</option>
                  </select>
                </div>
                <div className="stepper">
                  <div className={`step ${otpSent ? 'done' : 'active'}`}><span>1</span><small>Mobile verification</small></div>
                  <div className={`step ${phoneVerifiedToken ? 'done' : ''}`}><span>2</span><small>Registration details</small></div>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="mobile-number">Mobile number (include country code)</label>
                  <div className="input-wrap action-wrap">
                    <Phone size={16} />
                    <input id="mobile-number" type="tel" required value={registration.mobile_number} onChange={(event) => updateRegistration('mobile_number', event.target.value)} placeholder="+919876543210" />
                    <button type="button" className="mini-button" onClick={handleSendOtp} disabled={busy || !normalizedPhone}>
                      {busy ? 'Please wait…' : 'Send OTP'}
                    </button>
                  </div>
                </div>

                {otpSent && !phoneVerifiedToken ? (
                  <div className="field-group">
                    <label className="field-label" htmlFor="otp">OTP code</label>
                    <div className="input-wrap">
                      <ShieldCheck size={16} />
                      <input id="otp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter the code you received" maxLength={6} />
                    </div>
                    <div className="otp-actions">
                      <span>Enter the OTP sent to your phone</span>
                      <button type="button" className="text-button" onClick={handleVerifyOtp} disabled={busy || otp.trim().length !== 6}>Verify OTP</button>
                    </div>
                  </div>
                ) : null}
                {phoneVerifiedToken ? <div className="info-banner"><CheckCircle2 size={16} /> Mobile number verified.</div> : null}

                <div className="form-grid">
                  <div className="field-group">
                    <label className="field-label" htmlFor="full-name">Full name</label>
                    <input id="full-name" className="field-input" required value={registration.full_name} onChange={(event) => updateRegistration('full_name', event.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="age">Age</label>
                    <input id="age" className="field-input" type="number" min="18" max="120" required value={registration.age} onChange={(event) => updateRegistration('age', event.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="contact-email">Email address (your login ID)</label>
                    <input id="contact-email" className="field-input" type="email" required value={registration.email} onChange={(event) => updateRegistration('email', event.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="registration-password">Choose password (at least 8 characters)</label>
                    <input id="registration-password" className="field-input" type="password" autoComplete="new-password" minLength={8} required value={registration.password} onChange={(event) => updateRegistration('password', event.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="nationality">Nationality</label>
                    <input id="nationality" className="field-input" required value={registration.nationality} onChange={(event) => updateRegistration('nationality', event.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="state">State</label>
                    <input id="state" className="field-input" required value={registration.state} onChange={(event) => updateRegistration('state', event.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="taluka">Taluka</label>
                    <input id="taluka" className="field-input" required value={registration.taluka} onChange={(event) => updateRegistration('taluka', event.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="city">City / Village</label>
                    <input id="city" className="field-input" required value={registration.city} onChange={(event) => updateRegistration('city', event.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="language">Preferred language</label>
                    <select id="language" className="field-input" value={registration.preferred_language} onChange={(event) => updateRegistration('preferred_language', event.target.value)}>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="mr">Marathi</option>
                      <option value="gu">Gujarati</option>
                    </select>
                  </div>
                </div>
                <div className="info-banner"><ShieldCheck size={16} /> Your account stays pending. You can log in with this email and password after admin approval.</div>
                <div className="field-group">
                  <label className="field-label" htmlFor="address">Full address</label>
                  <textarea id="address" className="field-input textarea" required value={registration.full_address} onChange={(event) => updateRegistration('full_address', event.target.value)} />
                </div>
                {role === 'farmer' ? (
                  <div className="field-group">
                    <label className="field-label" htmlFor="land-location">Farm / land location</label>
                    <input id="land-location" className="field-input" required value={registration.land_location} onChange={(event) => updateRegistration('land_location', event.target.value)} />
                  </div>
                ) : null}
                <div className="field-group">
                  <label className="field-label" htmlFor="photo">Passport photo (JPEG, PNG, or WEBP; max 5 MB)</label>
                  <label className="upload-box">
                    <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" required onChange={handlePhotoChange} />
                    <Camera size={18} />
                    {photoPreview ? <img src={photoPreview} alt="Selected passport photo preview" /> : <span>{photo ? photo.name : 'Choose photo'}</span>}
                  </label>
                </div>
                <button type="submit" className="primary-button" disabled={busy || !phoneVerifiedToken}>
                  <CheckCircle2 size={18} /> {busy ? 'Submitting…' : 'Submit Registration for Approval'}
                </button>
              </form>
            )}
          </div>
        </section>
      ) : (
        <section className="dashboard-shell">
          <div className="glass-card dashboard-card">
            <div className="dashboard-header">
              <div className="user-pill">
                <div className="avatar-mini"><CircleUserRound size={22} /></div>
                <div>
                  <h2>{user.full_name}</h2>
                  <p><MapPin size={14} /> {[user.city, user.state].filter(Boolean).join(', ') || 'Location not provided'} • {user.email}</p>
                </div>
              </div>
              <div className="dashboard-actions">
                <button type="button" className="ghost-button" onClick={refreshDashboard} disabled={busy}>
                  <RefreshCcw size={16} /> Refresh
                </button>
                <button type="button" className="ghost-button danger-button" onClick={logout}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>

            {notice ? <div className="notice-box" role="status">{notice}</div> : null}
            <div className="portal-panel">
              <div className="panel-title-row">
                <h3>{user.role === 'admin' ? 'Pending registration requests' : `${roleLabel[user.role]} account`}</h3>
                <span className="panel-badge">{user.is_approved ? 'Approved' : 'Pending approval'}</span>
              </div>
              {user.role === 'admin' ? (
                dashboardLoading ? <p>Loading registration requests…</p> : requests.length === 0 ? <p>There are no pending registration requests.</p> : (
                  <div className="panel-grid">
                    {requests.map((request) => (
                      <article className="panel-card" key={request.id}>
                        <div className="panel-card-header">
                          <span>{roleLabel[request.role]} registration</span>
                          <strong>{request.full_name}</strong>
                        </div>
                        <p>{[request.city, request.state].filter(Boolean).join(', ') || 'Location not provided'}</p>
                        <p>{request.mobile_number}{request.email ? ` • ${request.email}` : ''}</p>
                        <p>Submitted {new Date(request.created_at).toLocaleDateString()}</p>
                        <div className="dashboard-actions">
                          <button type="button" className="primary-button" disabled={busy} onClick={() => void handleDecision(request.id, 'approve')}>Approve</button>
                          <button type="button" className="ghost-button danger-button" disabled={busy} onClick={() => void handleDecision(request.id, 'reject')}>Reject</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )
              ) : (
                <div className="panel-grid">
                  <div className="panel-card highlight">
                    <div className="panel-card-header"><span>Account role</span><strong>{roleLabel[user.role]}</strong></div>
                    <p>Your account information is loaded from the Setu Moolya backend.</p>
                  </div>
                  <div className="panel-card">
                    <div className="panel-card-header"><span>Contact</span><strong>{user.mobile_number || 'Not provided'}</strong></div>
                    <p>{user.full_address || 'No address is recorded for this account.'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
