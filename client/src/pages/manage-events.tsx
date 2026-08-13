import { ChangeEvent, FormEvent, useEffect, useId, useState } from "react";
import { CalendarDays, Edit3, Image, ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadMedia, type UploadedMedia } from "@/hooks/use-feed";
import { useAuth } from "@/lib/auth-context";
import { getApiErrorMessage, readApiResponse } from "@/lib/api-response";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

type ManagedEvent = {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string | null;
  isUpcoming: boolean;
  attendeesCount: number | null;
};

type EventFormValues = {
  title: string;
  description: string;
  date: string;
  location: string;
  attendeesCount: string;
  imageUrl: string;
  imageMetadata?: UploadedMedia;
  imageAction: "keep" | "set" | "remove";
};

const emptyForm = (): EventFormValues => ({
  title: "",
  description: "",
  date: "",
  location: "",
  attendeesCount: "",
  imageUrl: "",
  imageAction: "remove",
});

function toFormValues(event: ManagedEvent): EventFormValues {
  return {
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    attendeesCount: event.attendeesCount === null ? "" : String(event.attendeesCount),
    imageUrl: event.imageUrl ?? "",
    imageMetadata: undefined,
    imageAction: event.imageUrl ? "keep" : "remove",
  };
}

function EventForm({
  initialValues,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues: EventFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => void;
  onCancel?: () => void;
}) {
  const imageInputId = useId();
  const { user } = useAuth();
  const [form, setForm] = useState(initialValues);
  const [imagePreview, setImagePreview] = useState<string | null>(initialValues.imageUrl || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    setForm(initialValues);
    setImagePreview(initialValues.imageUrl || null);
    setImageError("");
  }, [initialValues]);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageError("");
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setImageError("Event images must be 4 MB or smaller.");
      return;
    }
    if (!user) {
      setImageError("You must be signed in to upload an event image.");
      return;
    }

    const previousImage = form.imageUrl;
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploadingImage(true);

    try {
      const uploaded = await uploadMedia(file, user.id, "project");
      setForm((current) => ({
        ...current,
        imageUrl: uploaded.mediaUrl,
        imageMetadata: uploaded,
        imageAction: "set",
      }));
    } catch (error) {
      setImagePreview(previousImage || null);
      setImageError(error instanceof Error ? error.message : "Image upload failed. Please try again.");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setIsUploadingImage(false);
    }
  }

  function removeImage() {
    setImagePreview(null);
    setImageError("");
    setForm((current) => ({
      ...current,
      imageUrl: "",
      imageMetadata: undefined,
      imageAction: "remove",
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isUploadingImage) onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold">Event title</span>
          <Input
            required
            maxLength={160}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. Ganga Aarti Evening"
          />
        </label>

        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold">Description</span>
          <Textarea
            required
            rows={4}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Describe the event and its schedule"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-semibold">Date and time</span>
          <Input
            required
            type="datetime-local"
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-semibold">Location</span>
          <Input
            required
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            placeholder="e.g. Mahakal Sanatan Bhawan, Varanasi"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-semibold">Attendees count</span>
          <Input
            min="0"
            type="number"
            value={form.attendeesCount}
            onChange={(event) => setForm({ ...form, attendeesCount: event.target.value })}
            placeholder="54"
          />
        </label>

        <div className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold">
            Event image <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed bg-muted/20 p-3">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Event preview"
                className="h-20 w-28 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Image className="h-7 w-7" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Upload an image for the event</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                JPG, PNG, GIF, or WebP · 4 MB max
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <label
                  htmlFor={imageInputId}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4 text-primary" />
                  )}
                  {isUploadingImage ? "Uploading…" : "Choose image"}
                  <input
                    id={imageInputId}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isUploadingImage}
                    className="sr-only"
                  />
                </label>
                {imagePreview && !isUploadingImage && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>
              {imageError && (
                <p className="mt-2 text-xs font-medium text-destructive">{imageError}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || isUploadingImage}>
          {isSubmitting || isUploadingImage ? <Loader2 className="animate-spin" /> : <Save />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function ManageEventsPage() {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<ManagedEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState<ManagedEvent | null>(null);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return <Redirect to="/settings" />;
  }

  async function loadEvents() {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/events/manage`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await readApiResponse<{ events?: ManagedEvent[]; error?: string }>(response);
      if (!response.ok) throw new Error(getApiErrorMessage(response, body, "Unable to load events"));
      setEvents(body?.events ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load events");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
  }, [accessToken]);

  async function saveEvent(values: EventFormValues) {
    if (!accessToken) return;
    setIsSubmitting(true);
    const isEditing = Boolean(editingEvent);
    try {
      const response = await fetch(`${API}/events${editingEvent ? `/${editingEvent.id}` : ""}`, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          date: values.date,
          location: values.location,
          attendeesCount: values.attendeesCount === "" ? null : Number(values.attendeesCount),
          ...(values.imageAction === "set" && values.imageMetadata
            ? { imageMetadata: values.imageMetadata }
            : editingEvent && values.imageAction === "remove"
              ? { imageUrl: null }
              : {}),
        }),
      });
      const body = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(getApiErrorMessage(response, body, "Unable to save event"));
      toast({ title: isEditing ? "Event updated" : "Event created", description: "Event details have been saved." });
      setEditingEvent(null);
      setIsCreating(false);
      await loadEvents();
    } catch (err) {
      toast({ variant: "destructive", title: "Save failed", description: err instanceof Error ? err.message : "Unable to save event" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteEvent(event: ManagedEvent) {
    if (!accessToken) return;
    setWorkingId(event.id);
    try {
      const response = await fetch(`${API}/events/${event.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(getApiErrorMessage(response, body, "Unable to delete event"));
      toast({ title: "Event permanently deleted", description: `${event.title} was removed.` });
      setPendingDeleteEvent(null);
      await loadEvents();
    } catch (err) {
      toast({ variant: "destructive", title: "Deletion failed", description: err instanceof Error ? err.message : "Unable to delete event" });
    } finally {
      setWorkingId(null);
    }
  }

  const formValues = editingEvent ? toFormValues(editingEvent) : emptyForm();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Administration</p>
          <h2 className="mt-2 font-serif text-3xl font-bold">Manage events</h2>
          <p className="mt-2 text-muted-foreground">Create, edit, or delete events shown in the public event feed.</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingEvent(null);
            setIsCreating(true);
          }}
        >
          <Plus /> New event
        </Button>
      </div>

      {(isCreating || editingEvent) && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="font-semibold">{editingEvent ? "Edit event" : "Create event"}</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingEvent(null);
                setIsCreating(false);
              }}
            >
              <X />
            </Button>
          </div>
          <EventForm
            key={editingEvent?.id ?? "new"}
            initialValues={formValues}
            isSubmitting={isSubmitting}
            submitLabel={editingEvent ? "Save changes" : "Create event"}
            onSubmit={saveEvent}
            onCancel={() => {
              setEditingEvent(null);
              setIsCreating(false);
            }}
          />
        </div>
      )}

      {pendingDeleteEvent && (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 shadow-sm sm:p-5" role="alertdialog" aria-modal="false" aria-labelledby="delete-event-title">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 id="delete-event-title" className="font-semibold text-foreground">Delete this event permanently?</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">“{pendingDeleteEvent.title}” will be permanently removed. This action cannot be undone.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={workingId !== null} onClick={() => setPendingDeleteEvent(null)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" disabled={workingId !== null} onClick={() => void deleteEvent(pendingDeleteEvent)}>
                  {workingId === pendingDeleteEvent.id && <Loader2 className="animate-spin" />}
                  {workingId === pendingDeleteEvent.id ? "Deleting..." : "Delete permanently"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading events…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">{error}</div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">
          <CalendarDays className="mx-auto h-10 w-10 opacity-50" />
          <p className="mt-3">No events have been created yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary overflow-hidden">
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <CalendarDays className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold truncate">{event.title}</h4>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{new Date(event.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {event.location}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => {
                    setIsCreating(false);
                    setEditingEvent(event);
                  }}>
                    <Edit3 /> Edit
                  </Button>
                  <Button type="button" size="sm" variant="destructive" disabled={workingId === event.id} onClick={() => setPendingDeleteEvent(event)}>
                    <Trash2 /> Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
