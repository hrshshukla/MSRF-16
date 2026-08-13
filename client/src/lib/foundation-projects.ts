import { useListProjects, type Project as ApiProject } from "@/lib/api-client";

export type FoundationProject = ApiProject;

export function useFoundationProjects() {
  const query = useListProjects();

  return {
    ...query,
    projects: query.data ?? [],
  };
}
