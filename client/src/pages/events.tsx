import { useListEvents } from "@/lib/api-client";
import { Link } from "wouter";
import { Calendar as CalendarIcon, MapPin, Users, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const demoEvents = [
  {
    id: -1,
    title: "Maha Shivratri Rudra Abhishek",
    description: "Join our community for an evening of sacred chants, Rudra Abhishek, and shared prasad in devotion to Mahadev.",
    date: "2026-08-16T18:30:00+05:30",
    location: "Mahakal Sanatan Bhawan, Varanasi",
    imageUrl: null,
    isUpcoming: true,
    category: "Puja",
    attendeesCount: 108,
  },
  {
    id: -2,
    title: "Sanatan Sanskriti Learning Circle",
    description: "An open gathering for families and young learners to explore stories, traditions, and the timeless values of Sanatan Dharma.",
    date: "2026-08-23T10:00:00+05:30",
    location: "Community Hall, Varanasi",
    imageUrl: null,
    isUpcoming: true,
    category: "Community",
    attendeesCount: 54,
  },
  {
    id: -3,
    title: "Ganga Aarti Seva Evening",
    description: "Come together for a mindful evening of Ganga Aarti, bhajans, and seva along the sacred ghats of Kashi.",
    date: "2026-08-30T17:45:00+05:30",
    location: "Assi Ghat, Varanasi",
    imageUrl: null,
    isUpcoming: true,
    category: "Seva",
    attendeesCount: 72,
  },
] as const;

export function EventsSection() {
  const { data: events, isLoading } = useListEvents({ upcoming: true });
  const displayEvents = events?.length ? events : demoEvents;

  return (
    <section id="events" className="scroll-mt-28 border-t py-20">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Events</p>
          <h2 className="font-serif text-4xl font-bold md:text-5xl">Dharmic Events</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Gatherings, pujas, cultural festivals, and community learning sessions to celebrate and learn our shared heritage.
          </p>
        </div>
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col md:flex-row rounded-2xl border bg-card overflow-hidden animate-pulse">
                <div className="h-48 md:w-64 bg-muted" />
                <div className="p-6 flex-1 space-y-4">
                  <div className="h-6 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {displayEvents.map(event => {
              const eventDate = new Date(event.date);
              const isDemoEvent = event.id < 0;
              
              return (
                <div key={event.id} className="group flex flex-col md:flex-row rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="relative h-56 md:h-auto md:w-72 overflow-hidden shrink-0">
                    {event.imageUrl ? (
                      <img 
                        src={event.imageUrl} 
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/10 text-secondary">
                        <CalendarIcon className="w-12 h-12 opacity-20" />
                      </div>
                    )}
                    
                    {/* Date Badge */}
                    <div className="absolute top-4 left-4 bg-background rounded-xl shadow-lg flex flex-col items-center justify-center w-14 h-16 border border-border/50">
                      <span className="text-xs font-bold text-primary uppercase">{format(eventDate, "MMM")}</span>
                      <span className="text-xl font-black font-serif leading-none mt-0.5">{format(eventDate, "dd")}</span>
                    </div>
                  </div>
                  
                  <div className="p-6 md:p-8 flex flex-col flex-1 justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-secondary/20 text-secondary-foreground text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {event.category}
                      </span>
                    </div>
                    
                    <h3 className="font-serif text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {isDemoEvent ? event.title : <Link href={`/events/${event.id}`}>{event.title}</Link>}
                    </h3>
                    
                    <p className="text-muted-foreground line-clamp-2 mb-6">
                      {event.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground mb-6">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-primary/70" />
                        <span>{format(eventDate, "h:mm a")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary/70" />
                        <span>{event.location}</span>
                      </div>
                      {event.attendeesCount !== null && (
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-primary/70" />
                          <span>{event.attendeesCount} Attending</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-auto pt-4 border-t flex justify-end">
                      {isDemoEvent ? (
                        <Link href="/login">
                          <Button className="rounded-full gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
                            Participate <ArrowRight size={16} />
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/events/${event.id}`}>
                          <Button variant="ghost" className="rounded-full gap-2 hover:bg-primary/5 hover:text-primary">
                            Event Details <ArrowRight size={16} />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function EventsPage() {
  return (
    <div className="w-full pb-24 relative">
      <div className="bg-card border-b pt-24 pb-16 relative overflow-hidden">
        <div className="mandala-bg text-primary opacity-[0.02]" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Dharmic Events</h1>
          <p className="text-lg text-muted-foreground">
            Gatherings, pujas, cultural festivals, and community learning sessions to celebrate and learn our shared heritage.
          </p>
        </div>
      </div>
      <EventsSection />
    </div>
  );
}
