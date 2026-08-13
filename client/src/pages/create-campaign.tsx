import { Link, Redirect, useLocation } from "wouter";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CampaignForm, emptyCampaignForm, type CampaignFormValues } from "@/components/campaigns/campaign-form";
import { useAuth } from "@/lib/auth-context";
import { getApiErrorMessage, readApiResponse } from "@/lib/api-response";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;
const INITIAL_CAMPAIGN_FORM = emptyCampaignForm();

export function CreateCampaignPage() {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return <Redirect to="/settings" />;
  }

  async function createCampaign(values: CampaignFormValues) {
    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API}/campaigns`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          goalAmountInr: Number(values.goalAmountInr),
          ...(values.imageAction === "set" && values.imageMetadata
            ? { imageMetadata: values.imageMetadata }
            : {}),
        }),
      });
      const body = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(getApiErrorMessage(response, body, "Unable to create campaign"));
      toast({ title: "Campaign created", description: "The new campaign is now available on the public campaign page." });
      navigate("/settings/campaigns/manage");
    } catch (error) {
      toast({ variant: "destructive", title: "Creation failed", description: error instanceof Error ? error.message : "Unable to create campaign" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Administration</p>
        <h2 className="mt-2 font-serif text-3xl font-bold">Create new campaign</h2>
        <p className="mt-2 text-muted-foreground">Set up a new seva campaign for members and donors.</p>
      </div>
      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2 border-b pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Plus className="h-5 w-5" /></div>
          <div>
            <h3 className="font-semibold">Campaign details</h3>
            <p className="text-sm text-muted-foreground">Add the information that will appear on the campaign page.</p>
          </div>
        </div>
        <CampaignForm
          initialValues={INITIAL_CAMPAIGN_FORM}
          submitLabel="Create campaign"
          isSubmitting={isSubmitting}
          onSubmit={createCampaign}
          showStatus={false}
        />
      </div>
    </section>
  );
}