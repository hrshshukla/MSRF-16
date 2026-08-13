import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Edit3, Image, Loader2, Megaphone, Square, Trash2, TriangleAlert } from "lucide-react";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { CampaignForm, type CampaignFormValues, type CampaignStatus } from "@/components/campaigns/campaign-form";
import { useAuth } from "@/lib/auth-context";
import { getApiErrorMessage, readApiResponse } from "@/lib/api-response";
import { useToast } from "@/hooks/use-toast";
const gauSevaImage = "https://ik.imagekit.io/harshshukla/campaigns/legacy/gau-seva.jpg";
const foodSevaImage = "https://ik.imagekit.io/harshshukla/campaigns/legacy/food-seva.jpg";
const medicalCampImage = "https://ik.imagekit.io/harshshukla/campaigns/legacy/medical-camp.jpg";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

type ManagedCampaign = {
  id: number;
  title: string;
  description: string;
  goalAmountInr: number;
  raisedAmountInr: number;
  status: CampaignStatus;
  imageUrl: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  category: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusClasses(status: CampaignStatus) {
  if (status === "active") return "bg-green-500/10 text-green-700";
  if (status === "stopped") return "bg-red-500/10 text-red-700";
  return "bg-primary/10 text-primary";
}

function campaignImage(campaign: ManagedCampaign) {
  if (campaign.imageUrl) return campaign.imageUrl;
  if (campaign.title === "Gau Seva") return gauSevaImage;
  if (campaign.title === "Food Distribution") return foodSevaImage;
  if (campaign.title === "Medical Camp") return medicalCampImage;
  return null;
}

export function ManageExistingCampaignsPage() {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<ManagedCampaign[]>([]);
  const [editingCampaign, setEditingCampaign] = useState<ManagedCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    campaign: ManagedCampaign;
    type: "stop" | "resume" | "delete";
  } | null>(null);

  async function loadCampaigns() {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/campaigns/manage`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await readApiResponse<{ campaigns?: ManagedCampaign[]; error?: string }>(response);
      if (!response.ok) throw new Error(getApiErrorMessage(response, body, "Unable to load campaigns"));
      setCampaigns(body?.campaigns ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load campaigns");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCampaigns();
  }, [accessToken]);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return <Redirect to="/settings" />;
  }

  async function updateCampaign(id: number, values: CampaignFormValues) {
    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API}/campaigns/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          goalAmountInr: Number(values.goalAmountInr),
          status: values.status,
          ...(values.imageAction === "set" && values.imageMetadata
            ? { imageMetadata: values.imageMetadata }
            : values.imageAction === "remove"
              ? { imageUrl: null }
              : {}),
        }),
      });
      const body = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(getApiErrorMessage(response, body, "Unable to update campaign"));
      toast({ title: "Campaign updated", description: "The campaign changes have been saved." });
      setEditingCampaign(null);
      await loadCampaigns();
    } catch (err) {
      toast({ variant: "destructive", title: "Update failed", description: err instanceof Error ? err.message : "Unable to update campaign" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function stopCampaign(campaign: ManagedCampaign) {
    if (!accessToken || campaign.status === "stopped") return;
    setPendingAction({ campaign, type: "stop" });
  }

  async function resumeCampaign(campaign: ManagedCampaign) {
    if (!accessToken || campaign.status !== "stopped") return;
    setPendingAction({ campaign, type: "resume" });
  }

  async function changeCampaignStatus(campaign: ManagedCampaign, status: "active" | "stopped") {
    if (!accessToken) return;
    setWorkingId(campaign.id);
    try {
      const response = await fetch(`${API}/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(getApiErrorMessage(response, body, `Unable to ${status === "stopped" ? "stop" : "resume"} campaign`));
      toast({
        title: status === "stopped" ? "Campaign stopped" : "Campaign resumed",
        description: status === "stopped"
          ? "The campaign is no longer active."
          : "The campaign is active again and visible in public listings.",
      });
      await loadCampaigns();
    } catch (err) {
      toast({
        variant: "destructive",
        title: status === "stopped" ? "Stop failed" : "Resume failed",
        description: err instanceof Error ? err.message : `Unable to ${status === "stopped" ? "stop" : "resume"} campaign`,
      });
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteCampaign(campaign: ManagedCampaign) {
    if (!accessToken) return;
    setWorkingId(campaign.id);
    try {
      const response = await fetch(`${API}/campaigns/${campaign.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(getApiErrorMessage(response, body, "Unable to delete campaign"));
      toast({ title: "Campaign permanently deleted", description: `${campaign.title} was removed.` });
      if (editingCampaign?.id === campaign.id) setEditingCampaign(null);
      setPendingAction(null);
      await loadCampaigns();
    } catch (err) {
      toast({ variant: "destructive", title: "Deletion failed", description: err instanceof Error ? err.message : "Unable to delete campaign" });
    } finally {
      setWorkingId(null);
    }
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;
    if (pendingAction.type === "delete") {
      await deleteCampaign(pendingAction.campaign);
      return;
    }
    await changeCampaignStatus(
      pendingAction.campaign,
      pendingAction.type === "stop" ? "stopped" : "active",
    );
    setPendingAction(null);
  }

  const pendingActionCopy = pendingAction
    ? {
        stop: {
          title: "Stop this campaign?",
          description: `“${pendingAction.campaign.title}” will no longer appear in active public campaign listings.`,
          confirmLabel: "Stop campaign",
        },
        resume: {
          title: "Resume this campaign?",
          description: `“${pendingAction.campaign.title}” will appear in active public campaign listings again.`,
          confirmLabel: "Resume campaign",
        },
        delete: {
          title: "Delete this campaign permanently?",
          description: `“${pendingAction.campaign.title}” will be removed permanently. Donation history will remain, but this action cannot be undone.`,
          confirmLabel: "Delete permanently",
        },
      }[pendingAction.type]
    : null;

  function toFormValues(campaign: ManagedCampaign): CampaignFormValues {
    return {
      title: campaign.title,
      description: campaign.description,
      goalAmountInr: String(campaign.goalAmountInr),
      status: campaign.status,
      imageUrl: campaign.imageUrl ?? "",
      imageAction: campaign.imageUrl ? "keep" : "remove",
    };
  }

  const editingValues = useMemo(
    () => (editingCampaign ? toFormValues(editingCampaign) : undefined),
    [editingCampaign],
  );

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Administration</p>
        <h2 className="mt-2 font-serif text-3xl font-bold">Manage existing campaigns</h2>
        <p className="mt-2 text-muted-foreground">Edit campaign details, stop campaigns, or permanently delete them.</p>
      </div>

      {editingCampaign && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="font-semibold">Edit campaign</h3>
              <p className="text-sm text-muted-foreground">{editingCampaign.title}</p>
            </div>
          </div>
          <CampaignForm
            initialValues={editingValues}
            submitLabel="Save changes"
            isSubmitting={isSubmitting}
            previewMode
            previewImageUrl={campaignImage(editingCampaign)}
            onSubmit={(values) => void updateCampaign(editingCampaign.id, values)}
            onCancel={() => setEditingCampaign(null)}
          />
        </div>
      )}

      {pendingAction && pendingActionCopy && (
        <div
          className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 shadow-sm sm:p-5"
          role="alertdialog"
          aria-modal="false"
          aria-labelledby="campaign-action-title"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 id="campaign-action-title" className="font-semibold text-foreground">{pendingActionCopy.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{pendingActionCopy.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={workingId !== null}
                  onClick={() => setPendingAction(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="cursor-pointer"
                  disabled={workingId !== null}
                  onClick={() => void confirmPendingAction()}
                >
                  {workingId !== null && <Loader2 className="animate-spin" />}
                  {pendingActionCopy.confirmLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading campaigns…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">{error}</div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">
          <Megaphone className="mx-auto h-10 w-10 opacity-50" />
          <p className="mt-3">No campaigns have been created yet.</p>
          <Link href="/settings/campaigns/create" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Create your first campaign</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const isWorking = workingId === campaign.id;
            const imageUrl = campaignImage(campaign);
            return (
              <article key={campaign.id} className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                      {imageUrl ? (
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Image className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{campaign.title}</h4>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses(campaign.status)}`}>{campaign.status}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{campaign.description}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{formatAmount(campaign.raisedAmountInr)} raised of {formatAmount(campaign.goalAmountInr)}</span>
                        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(campaign.startDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button type="button" size="sm" variant="outline" className="cursor-pointer" disabled={isWorking} onClick={() => setEditingCampaign(campaign)}>
                      <Edit3 /> Edit
                    </Button>
                    {campaign.status !== "stopped" && (
                      <Button type="button" size="sm" variant="outline" className="cursor-pointer" disabled={isWorking} onClick={() => void stopCampaign(campaign)}>
                        {isWorking ? <Loader2 className="animate-spin" /> : <Square />} Stop
                      </Button>
                    )}
                    {campaign.status === "stopped" && (
                      <Button type="button" size="sm" variant="outline" className="cursor-pointer" disabled={isWorking} onClick={() => void resumeCampaign(campaign)}>
                        {isWorking ? <Loader2 className="animate-spin" /> : <Megaphone />} Resume
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="destructive" className="cursor-pointer" disabled={isWorking} onClick={() => setPendingAction({ campaign, type: "delete" })}>
                      {isWorking ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete permanently
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}