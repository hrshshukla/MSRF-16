import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Heart, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customFetch } from "@/lib/api-client/custom-fetch";
import type { AuthUser } from "@/lib/auth-context";
import { formatINR } from "./campaign-donation-card";

export type DonationSnapshot = {
  campaign: {
    id: number;
    title: string;
    goalAmountInr: number;
    raisedAmountInr: number;
  };
  donors: Array<{
    id: number;
    name: string;
    profileImageUrl: string | null;
    amount: number;
    donatedAt: string;
  }>;
  topDonors: Array<{
    name: string;
    profileImageUrl: string | null;
    amount: number;
  }>;
};

type RazorpayOrderResponse = {
  keyId: string;
  orderId: string;
  amountInr: number;
  amountInPaisa: number;
  currency: string;
};

type RazorpayVerificationResponse = {
  success: boolean;
  campaign?: DonationSnapshot["campaign"];
};

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
  handler: (response: RazorpayPaymentResponse) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void;
    };
  }
}

let razorpayScript: Promise<void> | null = null;

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScript) return razorpayScript;

  razorpayScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve() : reject(new Error("Razorpay checkout could not load.")));
    script.onerror = () => reject(new Error("Razorpay checkout could not load. Please check your connection."));
    document.body.appendChild(script);
  });

  return razorpayScript;
}

export async function getCampaignDonationSnapshot(campaignId: number) {
  return customFetch<DonationSnapshot>(`/api/payments/campaigns/${campaignId}/donors`, {
    method: "GET",
    responseType: "json",
  });
}

export function useCampaignDonationSnapshot(
  campaignId: number | null,
  fallback: DonationSnapshot,
) {
  const fallbackDonors = useRef(fallback.donors);
  const [snapshot, setSnapshot] = useState<DonationSnapshot>(fallback);
  const [isLoading, setIsLoading] = useState(Boolean(campaignId));

  const refresh = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    try {
      const latest = await getCampaignDonationSnapshot(campaignId);
      setSnapshot({
        ...latest,
        donors: [...fallbackDonors.current, ...latest.donors].sort((left, right) => right.amount - left.amount),
      });
    } catch (error) {
      console.error("Unable to refresh campaign donors", error);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { snapshot, refresh, isLoading };
}

export function RazorpayDonationButton({
  campaignId,
  campaignTitle,
  user,
  onDonationComplete,
  disabled = false,
  className,
}: {
  campaignId: number | null;
  campaignTitle: string;
  user: AuthUser | null;
  onDonationComplete?: (result: RazorpayVerificationResponse) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [amount, setAmount] = useState("500");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setError("");
    setSuccess(false);
  }, [isOpen, user?.email, user?.name, user?.phone]);

  const close = () => {
    if (!isSubmitting) setIsOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountInr = Number(amount);
    if (!campaignId) {
      setError("This campaign is not ready to accept online donations yet.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!Number.isInteger(amountInr) || amountInr <= 0) {
      setError("Please enter a whole amount greater than ₹0.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const order = await customFetch<RazorpayOrderResponse>("/api/payments/razorpay/order", {
        method: "POST",
        responseType: "json",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, amountInr }),
      });
      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error("Razorpay checkout could not load.");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amountInPaisa,
        currency: order.currency,
        name: "Mahakal Sanatan Raksha Foundation",
        description: `Donation to ${campaignTitle}`,
        order_id: order.orderId,
        prefill: { name: name.trim(), email: email.trim(), contact: phone.trim() },
        theme: { color: "#b45309" },
        modal: {
          ondismiss: () => setIsSubmitting(false),
        },
        handler: async (payment) => {
          try {
            const result = await customFetch<RazorpayVerificationResponse>("/api/payments/razorpay/verify", {
              method: "POST",
              responseType: "json",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                campaignId,
                donorName: name.trim(),
                donorEmail: email.trim() || undefined,
                razorpayOrderId: payment.razorpay_order_id,
                razorpayPaymentId: payment.razorpay_payment_id,
                razorpaySignature: payment.razorpay_signature,
              }),
            });
            setSuccess(true);
            setIsSubmitting(false);
            onDonationComplete?.(result);
          } catch (verificationError) {
            setIsSubmitting(false);
            setError(verificationError instanceof Error ? verificationError.message : "Payment verification failed.");
          }
        },
      });
      checkout.on("payment.failed", (response) => {
        setIsSubmitting(false);
        setError(response.error?.description ?? "The payment was not completed.");
      });
      checkout.open();
    } catch (submitError) {
      setIsSubmitting(false);
      setError(submitError instanceof Error ? submitError.message : "Unable to start the payment.");
    }
  };

  return (
    <>
      <Button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={className ?? "h-14 w-full rounded-xl bg-primary text-lg font-bold text-white hover:bg-primary/90"}
      >
        Donate Now
        <Heart className="ml-2 h-5 w-5" />
      </Button>

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 px-0 py-0 sm:items-center sm:px-4 sm:py-6"
            role="presentation"
            onMouseDown={(event) => event.target === event.currentTarget && close()}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="donation-dialog-title"
              className="max-h-[100dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-6 md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Secure donation</p>
                  <h2 id="donation-dialog-title" className="mt-2 font-serif text-2xl font-bold">Support {campaignTitle}</h2>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={close} disabled={isSubmitting} aria-label="Close donation dialog">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {success ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
                  <h3 className="mt-5 font-serif text-2xl font-bold">Thank you for your donation</h3>
                  <p className="mt-2 text-muted-foreground">Your contribution of {formatINR(Number(amount))} has been added to this campaign.</p>
                  <Button type="button" className="mt-7 rounded-full px-8" onClick={() => setIsOpen(false)}>Done</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="donor-name">Your name</Label>
                    <Input id="donor-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} autoComplete="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donor-email">Email <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input id="donor-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={240} autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donor-phone">Phone number <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input id="donor-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} autoComplete="tel" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donation-amount">Donation amount (INR)</Label>
                    <Input id="donation-amount" type="number" inputMode="numeric" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required autoFocus />
                    <p className="text-xs text-muted-foreground">You can donate any whole amount.</p>
                  </div>
                  {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                  <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl text-base font-bold">
                    {isSubmitting ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : null}
                    {isSubmitting ? "Opening secure checkout…" : `Continue with ${formatINR(Number(amount) || 0)}`}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">Payments are securely processed by Razorpay.</p>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}