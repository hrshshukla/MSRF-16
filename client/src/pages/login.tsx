import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "../lib/auth-context";
import {
  getApiErrorMessage,
  getNetworkErrorMessage,
} from "@/lib/api-response";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login({ email, password, rememberMe });
      navigate("/");
    } catch (err) {
      setError(
        err instanceof TypeError
          ? getNetworkErrorMessage("Please try again.")
          : err instanceof Error
            ? err.message
            : "Login failed",
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
        {/* Logo / Brand */}
        <div className="text-center mb-8">
           <BrandLogo
             className="mx-auto mb-4 h-20 w-20 rounded-full bg-white shadow-lg"
             sizes="80px"
             loading="eager"
           />
          <h1 className="font-sans text-2xl font-bold text-gray-900">
            Mahakal Sanatan Raksha Foundation
          </h1>
          <p className="text-sm text-gray-500 mt-1">Member Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
          <div className="p-6">
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

            <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoading ? "Logging in…" : "Login in"}
                </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Don't have an account?{" "}
              <a href="/signup" className="text-orange-600 hover:text-orange-700 font-medium">
                Create
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Mahakal Sanatan Raksha Foundation.
          All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
