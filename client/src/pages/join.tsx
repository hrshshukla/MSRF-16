import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, HeartHandshake, Loader2, Mail, UserPlus, Users, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage, readApiResponse } from "@/lib/api-response";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

export function JoinPage() {
  const { user, accessToken } = useAuth();
  const { toast } = useToast();
  const [skills, setSkills] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [application, setApplication] = useState<{
    id: number;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    reviewedAt: string | null;
  } | null>(null);
  const [isLoadingApplication, setIsLoadingApplication] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setApplication(null);
      setIsLoadingApplication(false);
      return;
    }

    let cancelled = false;
    async function loadApplication() {
      setIsLoadingApplication(true);
      try {
        const response = await fetch(`${API}/volunteer-applications/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const body = await readApiResponse<{
          application?: {
            id: number;
            status: "pending" | "approved" | "rejected";
            createdAt: string;
            reviewedAt: string | null;
          } | null;
        }>(response);
        if (!cancelled && response.ok) setApplication(body?.application ?? null);
      } finally {
        if (!cancelled) setIsLoadingApplication(false);
      }
    }

    void loadApplication();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API}/volunteer-applications`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skills, message }),
      });
      const body = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, body, "Unable to submit your application"));
      }

      const created = body as {
        application?: {
          id: number;
          status: "pending" | "approved" | "rejected";
        };
      } | null;
      setApplication({
        id: created?.application?.id ?? Date.now(),
        status: created?.application?.status ?? "pending",
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      });
      setSkills("");
      setMessage("");
      toast({
        title: "Application submitted",
        description: "Our admin team will review your volunteer application.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Application not submitted",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const status = application?.status;
  const isFinalized = status === "approved" || status === "rejected";
  const statusTitle =
    status === "approved"
      ? "Your volunteer application has been approved."
      : status === "rejected"
        ? "Your volunteer application has been reviewed."
        : "Application Submitted";
  const statusDescription =
    status === "approved"
      ? "Thank you for offering your time and energy to our seva work."
      : status === "rejected"
        ? "You cannot submit another application at this time. Please contact us if you have questions."
        : "We will update you after an admin makes a decision.";

  return (
    <div className="w-full pb-24 relative">
      <div className="bg-primary text-primary-foreground pt-24 pb-32 relative overflow-hidden">
        <div className="mandala-bg opacity-10" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center max-w-3xl">
         
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">Become a Volunteer</h1>
          <p className="text-xl text-primary-foreground/80 leading-relaxed">
            Dedicate your time, skills, and energy to the service of Sanatan Dharma.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 -mt-16 relative z-20">
        <div className="bg-card border rounded-3xl shadow-xl p-8 md:p-16 max-w-5xl mx-auto text-center">
            <h2 className="font-serif text-3xl font-bold mb-4"> Applications Open</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left">
            <div className="p-6 rounded-2xl bg-muted/50 border">
              <Users className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Community Events</h3>
              <p className="text-sm text-muted-foreground">Help organize and manage large scale dharmic events and local gatherings.</p>
            </div>
            <div className="p-6 rounded-2xl bg-muted/50 border">
              <HeartHandshake className="w-10 h-10 text-secondary mb-4" />
              <h3 className="font-bold text-lg mb-2">Seva Operations</h3>
              <p className="text-sm text-muted-foreground">Participate in food distribution, medical camps, and disaster relief efforts.</p>
            </div>
          </div>

          <div className="mb-8 p-1 text-left md:p-2">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              {!user && (
                <Link href="/login" className="shrink-0">
                  <Button size="lg" className="w-full rounded-full bg-primary px-8 text-white hover:bg-primary/90 sm:w-auto">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Apply as Volunteer
                  </Button>
                </Link>
              )}
            </div>

            {user && (
              <div className="mt-2 border-t border-primary/15 pt-6">
                {isLoadingApplication ? (
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-5 text-center text-sm text-muted-foreground">
                    Checking your application status…
                  </div>
                ) : application ? (
                  <div
                    className={`rounded-2xl border p-5 ${
                      status === "rejected"
                        ? "border-red-200 bg-red-50/80 text-red-900"
                        : status === "approved"
                          ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                          : "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80">
                        {status === "rejected" ? <X className="h-4 w-4 text-red-600" /> : <Check className="h-4 w-4 text-emerald-600" />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{statusTitle}</h3>
                        <p className="mt-1 text-sm opacity-80">{statusDescription}</p>
                      </div>
                    </div>

                    <div
                      className="volunteer-progress mt-7"
                      aria-label={`Application status: ${status}`}
                    >
                      <div className="volunteer-progress__track">
                        <div
                          className={`volunteer-progress__energy ${
                            status === "pending"
                              ? "volunteer-progress__energy--pending"
                              : "volunteer-progress__energy--final"
                          } ${status === "rejected" ? "volunteer-progress__energy--rejected" : ""}`}
                        />
                      </div>
                      <div className="volunteer-progress__steps">
                        <div className="volunteer-progress__step volunteer-progress__step--complete">
                          <span className="volunteer-progress__dot"><Check className="h-3.5 w-3.5" /></span>
                          <span>Applied</span>
                        </div>
                        <div className={`volunteer-progress__step ${status === "pending" ? "volunteer-progress__step--active" : "volunteer-progress__step--complete"}`}>
                          <span className={`volunteer-progress__dot ${status === "pending" ? "volunteer-progress__dot--current" : ""}`}>
                            {status === "pending" ? <span className="h-2 w-2 rounded-full bg-current" /> : <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span>Pending</span>
                        </div>
                        <div className={`volunteer-progress__step ${isFinalized ? "volunteer-progress__step--active" : ""} ${status === "rejected" ? "volunteer-progress__step--rejected" : ""}`}>
                          <span className={`volunteer-progress__dot ${isFinalized ? "volunteer-progress__dot--current" : ""}`}>
                            {status === "approved" ? <Check className="h-3.5 w-3.5" /> : status === "rejected" ? <X className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current/50" />}
                          </span>
                          <span>{status === "rejected" ? "Rejected" : "Approved"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={submitApplication} className="space-y-5">
                    <div>
                      <label htmlFor="volunteer-skills" className="mb-2 block text-sm font-semibold">
                        Skills and experience
                      </label>
                      <Textarea
                        id="volunteer-skills"
                        value={skills}
                        onChange={(event) => setSkills(event.target.value)}
                        placeholder="Tell us about your skills, interests or experience"
                        maxLength={2000}
                        required
                        className="min-h-28 bg-background"
                      />
                    </div>
                    <div>
                      <label htmlFor="volunteer-message" className="mb-2 block text-sm font-semibold">
                        Why do you want to volunteer?
                      </label>
                      <Textarea
                        id="volunteer-message"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Share how you would like to contribute to the foundation"
                        maxLength={4000}
                        required
                        className="min-h-28 bg-background"
                      />
                    </div>
                    <div className="flex justify-center">
                      <Button type="submit" size="lg" disabled={isSubmitting} className="rounded-full px-8">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {!isSubmitting && <UserPlus className="mr-2 h-4 w-4" />}
                      Apply as Volunteer
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
            <div>
              <h3 className="font-bold text-xl mb-2 text-foreground">Want to help right now?</h3>
              <p className="text-muted-foreground">Email us directly with your location and skills, and our regional coordinator will reach out.</p>
            </div>
            <Link href="/contact" className="shrink-0 w-full sm:w-auto">
              <Button size="lg" className="w-full rounded-full h-14 px-8 bg-primary hover:bg-primary/90 text-white gap-2">
                <Mail size={18} />
                Contact Us Direct
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
