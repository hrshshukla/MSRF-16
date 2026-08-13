import { useGetStats, useListTeam } from "@/lib/api-client";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Heart, Users, Map, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberCards } from "@/components/member-cards";
import { MantraMarquee } from "@/components/mantra-marquee";
import { useSevaCampaigns } from "@/lib/seva-campaigns";
import { useFoundationProjects } from "@/lib/foundation-projects";
import { useLanguage } from "@/lib/language-context";
import { CampaignDonationCard, formatCompactINR, formatINR } from "@/components/campaigns/campaign-donation-card";

export function Home() {
  const { language } = useLanguage();
  const { campaigns } = useSevaCampaigns();
  const { projects } = useFoundationProjects();
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: members, isLoading: membersLoading, isError: membersError } = useListTeam();

  const renderSevaCampaignCard = (campaign: (typeof campaigns)[number]) => (
    <CampaignDonationCard
      key={campaign.id}
      campaign={campaign}
    />
  );

  return (
    <div className="w-full relative overflow-hidden">
      <div className="mandala-bg text-primary" />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm shadow-secondary/5 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100 dark:shadow-amber-300/5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse dark:bg-amber-300" />
              Preserving Sanatan Heritage
            </div>
            
            <h1
              data-no-translate="true"
              className="font-serif text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100"
            >
              {language === "hi" ? (
                <>
                  <span className="text-primary italic">धर्म</span>{" "}
                  और{" "}
                  <span className="text-secondary italic">सेवा</span>{" "}
                  के माध्यम से समुदायों को सशक्त बनाना।
                </>
              ) : language === "mr" ? (
                <>
                  <span className="text-primary italic">धर्म</span>{" "}
                  आणि{" "}
                  <span className="text-secondary italic">सेवा</span>{" "}
                  द्वारे समुदायांचे सक्षमीकरण.
                </>
              ) : (
                <>
                  Empowering communities through <span className="text-primary italic">Dharma</span> and <span className="text-secondary italic">Seva</span>.
                </>
              )}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              Mahakal Sanatan Raksha Foundation runs active campaigns and community projects to strengthen cultural roots and serve those in need.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <Link href="/seva#campaigns">
                <Button size="lg" className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-white h-14 px-8 text-base shadow-xl shadow-primary/20 group">
                  Support Our Campaigns
                  <Heart className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                </Button>
              </Link>
              <Link href="/join">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-14 px-8 text-base bg-background/50 backdrop-blur-sm border-2 hover:bg-muted group">
                  Join as Volunteer
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Subtle decorative gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-card border-y relative z-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 rotate-3 hover:rotate-0 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-sans text-4xl font-extrabold tracking-tight mb-2">
                {statsLoading ? "..." : (stats?.totalMembers?.toLocaleString() || "0")}
              </h3>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Active Members</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-6 -rotate-3 hover:rotate-0 transition-transform">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="font-sans text-4xl font-extrabold tracking-tight mb-2">
                {statsLoading ? "..." : (stats?.volunteersServed?.toLocaleString() || "0")}
              </h3>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">People Served</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 rotate-3 hover:rotate-0 transition-transform">
                <Map className="w-7 h-7" />
              </div>
              <h3 className="font-sans text-4xl font-extrabold tracking-tight mb-2">
                {statsLoading ? "..." : (stats?.statesReached || "0")}
              </h3>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">States Reached</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-6 -rotate-3 hover:rotate-0 transition-transform">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="font-sans text-4xl font-extrabold tracking-tight mb-2">
                {statsLoading ? "..." : stats?.totalDonationsInr ? formatCompactINR(stats.totalDonationsInr) : "0"}
              </h3>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Funded for Seva</p>
            </div>
          </div>
        </div>
      </section>

      <MantraMarquee />

      {/* Members Section */}
      <section className="py-24 relative z-10 bg-card/40 border-y">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Our Members</p>
            <h2 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">The people behind the seva</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Meet the dedicated members serving Sanatan Dharma and strengthening communities through meaningful action.
            </p>
          </div>

          {membersLoading ? (
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex min-h-40 items-center gap-5 rounded-[2rem] border border-border/70 bg-background/55 p-5">
                  <div className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-muted sm:h-32 sm:w-32" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : membersError ? (
            <div className="mx-auto max-w-xl rounded-3xl border border-dashed bg-background/60 px-6 py-10 text-center">
              <Users className="mx-auto mb-4 h-8 w-8 text-primary" />
              <p className="font-serif text-2xl font-semibold">Member profiles are temporarily unavailable</p>
              <p className="mt-2 text-muted-foreground">Please check back soon to meet our team.</p>
            </div>
          ) : members && members.length > 0 ? (
            <>
              <MemberCards members={members} />
              <div className="mt-10 text-center">
                <Link href="/members">
                  <Button variant="outline" className="rounded-full border-2 px-7">
                    See all members
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-xl rounded-3xl border border-dashed bg-background/60 px-6 py-10 text-center">
              <Users className="mx-auto mb-4 h-8 w-8 text-primary" />
              <p className="font-serif text-2xl font-semibold">Our member profiles are coming soon</p>
              <p className="mt-2 text-muted-foreground">
                We are preparing the stories of the people who serve our community.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Seva Campaigns Section */}
      <section id="seva-campaigns" className="py-24 relative z-10 bg-card/40 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Seva Campaigns</p>
            <h2 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">Make every offering count</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Support a seva initiative and help turn compassion into direct, meaningful action.
            </p>
          </div>

           <div className="mx-auto max-w-6xl">
             <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
               {campaigns.slice(0, 3).map(renderSevaCampaignCard)}
             </div>
             {campaigns.length > 2 && (
               <div className="mt-10 text-center">
                 <Link href="/seva#campaigns">
                   <Button className="rounded-full bg-primary px-6 text-white shadow-lg shadow-primary/25 hover:bg-primary/90">
                     See all campaigns
                     <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                 </Link>
               </div>
             )}
           </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-24 relative z-10 bg-background/50 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Our Projects
            </p>
            <h2 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
              Seva that creates lasting change
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              From daily care to lifelong opportunity, every project turns compassion into meaningful action.
            </p>
          </div>

          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {projects.slice(0, 6).map((project) => (
               <Link
                key={project.id}
                 href={`/projects/${project.id}`}
                 aria-label={`View ${project.title} project`}
                 className="group block overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={project.imageUrl ?? undefined}
                    alt={project.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Completed
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl font-bold text-foreground">{project.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {project.description}
                  </p>
                   <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary transition-colors group-hover:text-primary/80">
                    Explore project
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                   </span>
                </div>
               </Link>
            ))}
          </div>
           <div className="mt-10 text-center">
             <Link href="/seva#foundation-projects">
               <Button variant="outline" className="rounded-full border-2 px-7">
                 See all projects
                 <ArrowRight className="ml-2 h-4 w-4" />
               </Button>
             </Link>
           </div>
        </div>
      </section>

    </div>
  );
}
