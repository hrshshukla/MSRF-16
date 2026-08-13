import { useGetProject } from "@/lib/api-client";
import {
  ArrowLeft,
  CalendarDays,
  FolderHeart,
  MapPin,
  Users,
  WalletCards,
  Beef,
} from "lucide-react";
import { useLayoutEffect } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { getProjectDetailsFallback } from "@/lib/project-impact";

function formatProjectBudget(value: number | null) {
  if (value === null) return "Not added";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatProjectCount(value: number | null, suffix = "") {
  return value === null
    ? "Not added"
    : `${value.toLocaleString("en-IN")}${suffix}`;
}

export function ProjectDetail() {
  const params = useParams();
  const projectId = Number(params.id);
  const projectQuery = useGetProject(projectId, {
    query: {
      enabled: Number.isInteger(projectId) && projectId > 0,
      queryKey: ["/api/projects", projectId],
    },
  });

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [projectId]);

  const project = projectQuery.data;
  const isLoading = projectQuery.isLoading;
  const isNotFound = !isLoading && (!project || projectQuery.isError);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        Loading project...
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <FolderHeart className="mb-5 h-12 w-12 text-primary/70" />
        <h1 className="font-serif text-3xl font-bold">Project not found</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          This project may have been removed or is no longer available.
        </p>
        <Link href="/seva#foundation-projects" className="mt-6">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all projects
          </Button>
        </Link>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const detailsFallback = getProjectDetailsFallback(project);

  return (
    <div className="w-full pb-24">
      <header className="border-b bg-card py-8">
        <div className="container mx-auto px-4 md:px-8">
          <Link
            href="/seva#foundation-projects"
            className="mb-7 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all projects
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-green-500/10 px-2.5 py-1 text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Completed
            </span>
            <span className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground">
              {project.category}
            </span>
          </div>
          <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold md:text-6xl">
            {project.title}
          </h1>
        </div>
      </header>

      <main className="container mx-auto mt-12 flex flex-col gap-12 px-4 md:px-8 lg:flex-row">
        <div className="lg:w-2/3">
          {project.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={project.title}
              className="mb-8 aspect-video w-full rounded-3xl object-cover shadow-sm"
            />
          ) : (
            <div className="mb-8 flex aspect-video w-full items-center justify-center rounded-3xl bg-muted text-muted-foreground/30">
              <FolderHeart className="h-16 w-16" />
            </div>
          )}
          <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-serif prose-p:text-muted-foreground">
            <h2>About this project</h2>
            <p className="whitespace-pre-line">{project.description}</p>
          </div>
        </div>

        <aside className="lg:w-1/3">
          <div className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm md:p-8 lg:sticky lg:top-28">
            <h2 className="font-serif text-2xl font-bold">Project details</h2>
            <div className="grid grid-cols-2 gap-3 border-t pt-5">
              <div className="rounded-2xl border bg-background/70 p-4">
                <CalendarDays className="mb-3 h-5 w-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Timeline
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {project.endYear !== null
                    ? `${project.startYear} – ${project.endYear}`
                    : `${project.startYear} – Completed`}
                </p>
              </div>
              <div className="rounded-2xl border bg-background/70 p-4">
                <MapPin className="mb-3 h-5 w-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Location
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {project.location ?? detailsFallback.location}
                </p>
              </div>

              <div className="rounded-2xl border bg-background/70 p-4">
                <Users className="mb-3 h-5 w-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Members involved
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {formatProjectCount(
                    project.membersInvolvedCount ??
                      detailsFallback.membersInvolvedCount,
                  )}
                </p>
              </div>
              <div className="rounded-2xl border bg-background/70 p-4">
                <Users className="mb-3 h-5 w-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  People impacted
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {formatProjectCount(
                    project.beneficiariesCount ??
                      detailsFallback.beneficiariesCount,
                    "+",
                  )}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border bg-background/70 p-4">
              <p className="text-xs flex gap-2 align-center font-semibold uppercase tracking-wide text-muted-foreground">
                  <WalletCards className="mb-3 h-5 w-5 text-primary" /> <span className="mt-0.5">Project budget</span>
              </p>
              <p className=" text-lg font-bold text-foreground">
                {formatProjectBudget(
                  project.budgetInr ?? detailsFallback.budgetInr,
                )}
              </p>
            </div>
            <Link href="/seva#foundation-projects" className="block pt-2">
              <Button className="w-full rounded-full">
                Explore more projects
              </Button>
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
