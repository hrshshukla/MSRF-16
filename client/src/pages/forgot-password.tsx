import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Link } from "wouter";
import {
  getApiErrorMessage,
  getNetworkErrorMessage,
  readApiResponse,
} from "@/lib/api-response";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

type Stage = "enter_email" | "enter_token" | "done";

export default function ForgotPasswordPage() {
  const [stage, setStage] = useState<Stage>("enter_email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const r = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readApiResponse<{ message?: string; error?: string }>(r);
      if (!r.ok) {
        throw new Error(getApiErrorMessage(r, data, "Request failed"));
      }
      setMessage(data?.message ?? "Check your email for reset instructions.");
      setStage("enter_token");
    } catch (err) {
      setError(
        err instanceof TypeError
          ? getNetworkErrorMessage("Please try again.")
          : err instanceof Error
            ? err.message
            : "Request failed",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    try {
      const r = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });
      const data = await readApiResponse<{ message?: string; error?: string }>(r);
      if (!r.ok) {
        throw new Error(getApiErrorMessage(r, data, "Reset failed"));
      }
      setStage("done");
    } catch (err) {
      setError(
        err instanceof TypeError
          ? getNetworkErrorMessage("Please try again.")
          : err instanceof Error
            ? err.message
            : "Reset failed",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-8">
           <BrandLogo
             className="mx-auto mb-4 h-20 w-20 rounded-full bg-white shadow-lg"
             sizes="80px"
             loading="eager"
           />
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="font-sans text-sm text-gray-500 mt-1">
            Mahakal Sanatan Raksha Foundation
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-6">
          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          {/* ── Stage 1: Enter email ── */}
          {stage === "enter_email" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter your registered email and we'll send you a password reset
                token.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Sending…" : "Send Reset Token"}
              </button>
            </form>
          )}

          {/* ── Stage 2: Enter token + new password ── */}
          {stage === "enter_token" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {message && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  {message}
                </div>
              )}
              <p className="text-sm text-gray-600">
                In development, the reset token is logged to the server console.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value.trim())}
                  placeholder="Paste your reset token"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-mono focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Resetting…" : "Reset Password"}
              </button>
            </form>
          )}

          {/* ── Stage 3: Done ── */}
          {stage === "done" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Password Reset Successfully
              </h2>
              <p className="text-sm text-gray-600">
                Your password has been updated. All active sessions have been
                signed out.
              </p>
              <Link
                href="/login"
                className="inline-block w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-sm font-semibold text-white shadow-sm text-center hover:from-orange-600 hover:to-amber-600 transition"
              >
                Login in with New Password
              </Link>
            </div>
          )}

          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
