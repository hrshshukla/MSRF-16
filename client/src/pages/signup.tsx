import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Phone, User } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import {
  getApiErrorMessage,
  getNetworkErrorMessage,
  readApiResponse,
} from "@/lib/api-response";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

export default function SignupPage() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Phone number must contain exactly 10 digits");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      });
      const data = await readApiResponse<{ error?: string; message?: string }>(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(response, data, "Unable to create your account"),
        );
      }

      navigate("/login");
    } catch (err) {
      setError(
        err instanceof TypeError
          ? getNetworkErrorMessage("Please try again.")
          : err instanceof Error
            ? err.message
            : "Unable to create your account",
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
        <div className="text-center mb-8">
           <BrandLogo
             className="mx-auto mb-4 h-20 w-20 rounded-full bg-white shadow-lg"
             sizes="80px"
             loading="eager"
           />
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
          <p className="font-sans text-sm text-gray-500 mt-1">Mahakal Sanatan Raksha Foundation</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  autoComplete="tel"
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                Login in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}