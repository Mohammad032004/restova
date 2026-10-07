"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  XCircle,
} from "lucide-react";

function SetupPasswordForm() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    setPageReady(true);
  }, []);

  const passwordLengthValid =
    password.length >= 8 && password.length <= 128;

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!token) {
      setError("This password setup link is invalid.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password.length > 128) {
      setError("Password cannot exceed 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to create your password. Please try again."
        );
        return;
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password setup request failed:", error);

      setError(
        "Something went wrong. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!pageReady) {
    return null;
  }

  // --------------------------------------------------
  // SUCCESS SCREEN
  // --------------------------------------------------

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle2
                size={34}
                className="text-emerald-400"
              />
            </div>

            <h1 className="text-2xl font-semibold">
              Password Created
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Your password has been created successfully.
              <br />
              You can now use your account to log in.
            </p>

            <Link
              href="/auth/login"
              className="mt-7 flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // INVALID TOKEN SCREEN
  // --------------------------------------------------

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-red-500/20 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
              <XCircle
                size={34}
                className="text-red-400"
              />
            </div>

            <h1 className="text-2xl font-semibold">
              Invalid Setup Link
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              This password setup link is missing or invalid.
              <br />
              Please use the setup link provided by your
              administrator.
            </p>

            <Link
              href="/auth/login"
              className="mt-7 flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // SETUP PASSWORD SCREEN
  // --------------------------------------------------

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-xl">
            <Lock size={25} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Create Your Password
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Set a secure password for your Restova account.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl">
          <div className="p-6 sm:p-8">
            {/* Security message */}
            <div className="mb-6 flex gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-cyan-400"
              />

              <div>
                <p className="text-sm font-medium text-cyan-300">
                  Secure account setup
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Create a password with at least 8 characters.
                  This setup link can only be used once.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-12 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {/* Password requirements */}
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {passwordLengthValid ? (
                      <>
                        <CheckCircle2
                          size={14}
                          className="text-emerald-400"
                        />

                        <span className="text-emerald-400">
                          Password length is valid
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle
                          size={14}
                          className="text-red-400"
                        />

                        <span className="text-red-400">
                          Password must be 8–128 characters
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-12 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {confirmPassword.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2
                          size={14}
                          className="text-emerald-400"
                        />

                        <span className="text-emerald-400">
                          Passwords match
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle
                          size={14}
                          className="text-red-400"
                        />

                        <span className="text-red-400">
                          Passwords do not match
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <XCircle
                    size={19}
                    className="mt-0.5 shrink-0 text-red-400"
                  />

                  <p className="text-sm leading-5 text-red-300">
                    {error}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  loading ||
                  !passwordLengthValid ||
                  !passwordsMatch
                }
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading
                  ? "Creating Password..."
                  : "Create Password"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-6 py-4 text-center sm:px-8">
            <p className="text-xs text-slate-500">
              Having trouble with your setup link?
            </p>

            <Link
              href="/auth/login"
              className="mt-1 inline-block text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              Return to login
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Restova. All rights reserved.
        </p>
      </div>
    </main>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

            <p className="mt-4 text-sm text-slate-400">
              Loading secure setup...
            </p>
          </div>
        </main>
      }
    >
      <SetupPasswordForm />
    </Suspense>
  );
}