import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Edit3,
  Image,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadMedia, type UploadedMedia } from "@/hooks/use-feed";
import { useAuth } from "@/lib/auth-context";
import { getApiErrorMessage, readApiResponse } from "@/lib/api-response";
import { getProjectImpactMetric } from "@/lib/project-impact";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

type ProjectStatus = "ongoing" | "completed" | "planned";
type ManagedProject = {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  imageFileId: string | null;
  imageFilePath: string | null;
  status: ProjectStatus;
  category: string;
  beneficiariesCount: number | null;
  startYear: number;
  endYear: number | null;
  cowsFedCount: number | null;
  budgetInr: number | null;
  location: string | null;
  membersInvolvedCount: number | null;
};

type ProjectFormValues = {
  title: string;
  description: string;
  beneficiariesCount: string;
  startYear: string;
  endYear: string;
  budgetInr: string;
  location: string;
  membersInvolvedCount: string;
  imageUrl: string;
  imageMetadata?: UploadedMedia;
  imageAction: "keep" | "set" | "remove";
};

const emptyForm = (): ProjectFormValues => ({
  title: "",
  description: "",
  beneficiariesCount: "",
  startYear: String(new Date().getFullYear()),
  endYear: "",
  budgetInr: "",
  location: "",
  membersInvolvedCount: "",
  imageUrl: "",
  imageAction: "remove",
});

function toFormValues(project: ManagedProject): ProjectFormValues {
  return {
    title: project.title,
    description: project.description,
    beneficiariesCount:
      project.beneficiariesCount === null
        ? ""
        : String(project.beneficiariesCount),
    startYear: String(project.startYear),
    endYear: project.endYear === null ? "" : String(project.endYear),
    budgetInr: project.budgetInr === null ? "" : String(project.budgetInr),
    location: project.location ?? "",
    membersInvolvedCount:
      project.membersInvolvedCount === null
        ? ""
        : String(project.membersInvolvedCount),
    imageUrl: project.imageUrl ?? "",
    imageAction: project.imageUrl ? "keep" : "remove",
  };
}

function ProjectForm({
  initialValues,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues: ProjectFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel?: () => void;
}) {
  const { user } = useAuth();
  const imageInputId = useId();
  const [form, setForm] = useState(initialValues);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialValues.imageUrl || null,
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const impactMetric = getProjectImpactMetric(form.title, "");

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
      setImageError("Project images must be 4 MB or smaller.");
      return;
    }
    if (!user) {
      setImageError("You must be signed in to upload a project image.");
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
      setImageError(
        error instanceof Error
          ? error.message
          : "Image upload failed. Please try again.",
      );
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
          <span className="text-sm font-semibold">Project title</span>
          <Input
            required
            maxLength={160}
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            placeholder="e.g. Gau Seva Shelter"
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold">Description</span>
          <Textarea
            required
            rows={4}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="Describe the project and its impact"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold">Start year</span>
          <Input
            required
            min="1900"
            max="2200"
            type="number"
            value={form.startYear}
            onChange={(event) =>
              setForm({ ...form, startYear: event.target.value })
            }
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold">
            Beneficiaries
             
          </span>
          <Input
            min="0"
            step="1"
            type="number"
            value={form.beneficiariesCount}
            onChange={(event) =>
              setForm({ ...form, beneficiariesCount: event.target.value })
            }
            placeholder={impactMetric.placeholder}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold">
            End year{" "}
             
          </span>
          <Input
            min="1900"
            max="2200"
            type="number"
            value={form.endYear}
            onChange={(event) =>
              setForm({ ...form, endYear: event.target.value })
            }
            placeholder="Ongoing"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold">
            Budget in INR{" "}
             
          </span>
          <Input
            min="0"
            step="1"
            type="number"
            value={form.budgetInr}
            onChange={(event) =>
              setForm({ ...form, budgetInr: event.target.value })
            }
            placeholder="250000"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold">
            Location{" "}
             
          </span>
          <Input
            maxLength={160}
            value={form.location}
            onChange={(event) =>
              setForm({ ...form, location: event.target.value })
            }
            placeholder="Ujjain, Madhya Pradesh"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold">
            Members involved{" "}
             
          </span>
          <Input
            min="0"
            step="1"
            type="number"
            value={form.membersInvolvedCount}
            onChange={(event) =>
              setForm({ ...form, membersInvolvedCount: event.target.value })
            }
            placeholder="25"
          />
        </label>
        <div className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold">
            Project image{" "}
             
          </span>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed bg-muted/20 p-3">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Project preview"
                className="h-20 w-28 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Image className="h-7 w-7" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                Store the project image in ImageKit
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                JPG, PNG, GIF, or WebP · 4 MB max
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <label
                  htmlFor={imageInputId}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
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
                <p className="mt-2 text-xs font-medium text-destructive">
                  {imageError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isUploadingImage}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || isUploadingImage}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function ManageProjectsPage() {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [editingProject, setEditingProject] = useState<ManagedProject | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pendingDeleteProject, setPendingDeleteProject] =
    useState<ManagedProject | null>(null);

  if (!user || (user.role !== "admin" && user.role !== "super_admin"))
    return <Redirect to="/settings" />;

  async function loadProjects() {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/projects/manage`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await readApiResponse<{
        projects?: ManagedProject[];
        error?: string;
      }>(response);
      if (!response.ok)
        throw new Error(
          getApiErrorMessage(response, body, "Unable to load projects"),
        );
      setProjects(body?.projects ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load projects");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, [accessToken]);

  async function saveProject(values: ProjectFormValues) {
    if (!accessToken) return;
    setIsSubmitting(true);
    const isEditing = Boolean(editingProject);
    try {
      const response = await fetch(
        `${API}/projects${editingProject ? `/${editingProject.id}` : ""}`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: values.title,
            description: values.description,
            startYear: Number(values.startYear),
            beneficiariesCount:
              values.beneficiariesCount === ""
                ? null
                : Number(values.beneficiariesCount),
            endYear: values.endYear === "" ? null : Number(values.endYear),
            budgetInr:
              values.budgetInr === "" ? null : Number(values.budgetInr),
            location: values.location.trim() || null,
            membersInvolvedCount:
              values.membersInvolvedCount === ""
                ? null
                : Number(values.membersInvolvedCount),
            ...(values.imageAction === "set" && values.imageMetadata
              ? { imageMetadata: values.imageMetadata }
              : isEditing && values.imageAction === "remove"
                ? { imageUrl: null }
                : {}),
          }),
        },
      );
      const body = await readApiResponse<{ error?: string }>(response);
      if (!response.ok)
        throw new Error(
          getApiErrorMessage(response, body, "Unable to save project"),
        );
      toast({
        title: isEditing ? "Project updated" : "Project created",
        description: "The project image and details have been saved.",
      });
      setEditingProject(null);
      setIsCreating(false);
      await loadProjects();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description:
          err instanceof Error ? err.message : "Unable to save project",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  async function deleteProject(project: ManagedProject) {
    if (!accessToken) return;

    setWorkingId(project.id);

    try {
      const response = await fetch(`${API}/projects/${project.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const body = await readApiResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(response, body, "Unable to delete project"),
        );
      }

      toast({
        title: "Project permanently deleted",
        description: `${project.title} was removed.`,
      });

      if (editingProject?.id === project.id) {
        setEditingProject(null);
      }

      setPendingDeleteProject(null);

      await loadProjects();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description:
          err instanceof Error ? err.message : "Unable to delete project",
      });
    } finally {
      setWorkingId(null);
    }
  }

  const formValues = editingProject
    ? toFormValues(editingProject)
    : emptyForm();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Administration
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold">
            Manage foundation projects
          </h2>
          <p className="mt-2 text-muted-foreground">
            Create and maintain the projects shown on Home and the Seva page.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingProject(null);
            setIsCreating(true);
          }}
        >
          <Plus /> New project
        </Button>
      </div>

      {(isCreating || editingProject) && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3 border-b">
            <div>
              <h3 className="font-semibold">
                {editingProject ? "Edit project" : "Create project"}
              </h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingProject(null);
                setIsCreating(false);
              }}
            >
              <X />
            </Button>
          </div>
          <ProjectForm
            key={editingProject?.id ?? "new"}
            initialValues={formValues}
            submitLabel={editingProject ? "Save changes" : "Create project"}
            isSubmitting={isSubmitting}
            onSubmit={saveProject}
            onCancel={() => {
              setEditingProject(null);
              setIsCreating(false);
            }}
          />
        </div>
      )}

      {pendingDeleteProject && (
        <div
          className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 shadow-sm sm:p-5"
          role="alertdialog"
          aria-modal="false"
          aria-labelledby="delete-project-title"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h3
                id="delete-project-title"
                className="font-semibold text-foreground"
              >
                Delete this project permanently?
              </h3>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                “{pendingDeleteProject.title}” will be permanently removed. This
                action cannot be undone.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={workingId !== null}
                  onClick={() => setPendingDeleteProject(null)}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  disabled={workingId !== null}
                  onClick={() => void deleteProject(pendingDeleteProject)}
                >
                  {workingId === pendingDeleteProject.id && (
                    <Loader2 className="animate-spin" />
                  )}

                  {workingId === pendingDeleteProject.id
                    ? "Deleting..."
                    : "Delete permanently"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading projects…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">
          <Image className="mx-auto h-10 w-10 opacity-50" />
          <p className="mt-3">No projects have been created yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold">{project.title}</h4>
                      <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600">
                        Completed
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {project.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {project.category} · Started {project.startYear}
                      {project.beneficiariesCount !== null
                        ? ` · ${project.beneficiariesCount.toLocaleString("en-IN")} beneficiaries`
                        : ""}
                      {project.location ? ` · ${project.location}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingProject(project);
                    }}
                  >
                    <Edit3 />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={workingId === project.id}
                    onClick={() => setPendingDeleteProject(project)}
                  >
                    <Trash2 />
                    Delete
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
