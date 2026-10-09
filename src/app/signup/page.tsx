"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Loader2, Lock, Mail, UserPlus } from "lucide-react";
import {
  requestAccessCode,
  setAccountPassword,
  verifyAccessCode,
  type CodePurpose,
} from "@/lib/api";
import { landingPath } from "@/lib/access";

const DOMAIN = "essentiallysports.com";
const RESEND_AFTER_SECONDS = 30;

type Step = "email" | "code" | "password";

type ApiError = { response?: { status?: number; data?: { message?: unknown } } };

function errorMessage(err: unknown, fallback: string): string {
  const res = (err as ApiError)?.response;
  const msg = res?.data?.message;
  if (Array.isArray(msg)) return msg.join(" ");
  // The rate limiter's own message is "ThrottlerException: Too Many Requests".
  if (typeof msg === "string" && !msg.startsWith("ThrottlerException")) return msg;
  if (res?.status === 429) return "Too many attempts. Wait a minute and try again.";
  return fallback;
}

const inputClass =
  "w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white";

function SignupFlow() {
  const router = useRouter();
  const purpose: CodePurpose = useSearchParams().get("mode") === "reset" ? "reset" : "signup";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [hasAccount, setHasAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendCode = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await requestAccessCode(email.trim(), purpose);
      setNotice(res.message);
      setCode("");
      setStep("code");
      setResendIn(RESEND_AFTER_SECONDS);
    } catch (err) {
      setError(errorMessage(err, "Could not send a code. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const checkCode = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await verifyAccessCode(email.trim(), code.trim());
      setSetupToken(res.setupToken);
      setHasAccount(res.hasAccount);
      setNotice("");
      setStep("password");
    } catch (err) {
      setError(errorMessage(err, "That code is invalid or has expired."));
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async () => {
    setError("");
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { role } = await setAccountPassword(email.trim(), setupToken, password);
      router.push(landingPath(role));
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Could not save your password. Start again."));
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email") sendCode();
    else if (step === "code") checkCode();
    else savePassword();
  };

  const title =
    step === "password"
      ? hasAccount ? "Choose a new password" : "Set your password"
      : purpose === "reset" ? "Reset your password" : "Create your account";
  const subtitle =
    step === "email"
      ? `We'll email a 6-digit code to your @${DOMAIN} address.`
      : step === "code"
        ? `Enter the code we sent to ${email.trim()}.`
        : hasAccount
          ? "This replaces your old password and signs you out everywhere else."
          : "You'll sign in with this email and password from now on.";
  const Icon = step === "password" ? KeyRound : purpose === "reset" ? Lock : UserPlus;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium text-center dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}
        {notice && !error && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm text-center dark:bg-blue-500/10 dark:text-blue-300">
            {notice}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          {step === "email" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Work email</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  className={inputClass}
                  placeholder={`you@${DOMAIN}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === "code" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verification code</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  autoFocus
                  maxLength={6}
                  pattern="\d{6}"
                  className={`${inputClass} tracking-[0.4em] font-mono`}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setNotice(""); setError(""); }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Use a different email
                </button>
                <button
                  type="button"
                  disabled={resendIn > 0 || loading}
                  onClick={sendCode}
                  className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 dark:text-blue-400"
                >
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                </button>
              </div>
            </div>
          )}

          {step === "password" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {hasAccount ? "New password" : "Password"}
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    autoFocus
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    className={inputClass}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    className={inputClass}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step === "email" ? (
              "Send code"
            ) : step === "code" ? (
              "Verify"
            ) : hasAccount ? (
              "Save and sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {purpose === "reset" ? "Remembered it?" : "Already have an account?"}{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupFlow />
    </Suspense>
  );
}
