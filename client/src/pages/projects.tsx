import { FolderHeart, Users, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useFoundationProjects } from "@/lib/foundation-projects";

export function ProjectsSection() {
  const { projects, isLoading } = useFoundationProjects();

  return (
    <section id="foundation-projects" className="scroll-mt-28 border-t bg-card/40 py-20">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Projects</p>
          <h2 className="font-serif text-4xl font-bold md:text-5xl">Foundation Projects</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Long-term initiatives dedicated to structural rebuilding, education, and sustained community welfare.
          </p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl border bg-card p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-2/3 mb-4" />
                <div className="h-20 bg-muted rounded w-full mb-6" />
                <div className="flex gap-4">
                  <div className="h-8 bg-muted rounded w-24" />
                  <div className="h-8 bg-muted rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : !projects?.length ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
            <FolderHeart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground">There are currently no projects listed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {projects.map(project => (
               <Link
                key={project.id} 
                 href={`/projects/${project.id}`}
                 aria-label={`View ${project.title} project`}
                 className="group block rounded-2xl"
              >
                 <div className="flex h-full flex-col sm:flex-row p-6 rounded-2xl border bg-card hover:border-primary/30 hover:shadow-lg transition-all">
                <div className="sm:w-1/3 mb-6 sm:mb-0 sm:mr-6 shrink-0 aspect-square sm:aspect-auto rounded-xl overflow-hidden bg-muted">
                  {project.imageUrl ? (
                    <img 
                      src={project.imageUrl} 
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <FolderHeart size={48} />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col flex-1 justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center gap-1.5 rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-green-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Completed
                    </span>
                    <span className="border-l px-2 text-xs text-muted-foreground">{project.category}</span>
                  </div>
                  
                  <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {project.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 mt-auto pt-4 border-t border-border/50 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-primary/70" />
                      <span>Est. {project.startYear}</span>
                    </div>
                    {project.beneficiariesCount !== null && (
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-primary/70" />
                        <span>{project.beneficiariesCount.toLocaleString()}+ Impacted</span>
                      </div>
                    )}
                  </div>
                </div>
                 </div>
               </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function ProjectsPage() {
  return (
    <div className="w-full pb-24 relative">
      <div className="bg-card border-b pt-24 pb-16 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Foundation Projects</h1>
          <p className="text-lg text-muted-foreground">
            Long-term initiatives dedicated to structural rebuilding, education, and sustained community welfare.
          </p>
        </div>
      </div>
      <ProjectsSection />
    </div>
  );
}
