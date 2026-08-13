import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useChangePassword } from "@/lib/api-client";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function UpdatePasswordPage() {
  const [, navigate] = useLocation();
  const { logout } = useAuth();
  const mutation = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    try {
      await mutation.mutateAsync({ data: { currentPassword, newPassword } });
      setSaved(true);
      window.setTimeout(() => {
        void logout();
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update password.");
    }
  }

  const inputType = showPasswords ? "text" : "password";

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Security</p>
          <h2 className="mt-1 font-serif text-2xl font-bold">Update password</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use a strong password you do not use elsewhere.</p>
        </div>
        <KeyRound className="mt-1 h-5 w-5 text-primary" />
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Password updated. Signing you out securely…
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Current password</span>
          <input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">New password</span>
          <span className="relative block">
            <input required minLength={8} type={inputType} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-lg border bg-background px-4 py-2.5 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            <button type="button" aria-label={showPasswords ? "Hide password" : "Show password"} onClick={() => setShowPasswords((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Confirm new password</span>
          <input required minLength={8} type={inputType} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
        </label>
        <Button type="submit" disabled={mutation.isPending || saved} className="mt-2">
          {mutation.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {mutation.isPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </section>
  );
}