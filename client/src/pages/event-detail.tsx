import { useGetEvent } from "@/lib/api-client";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, MapPin, Users, ArrowLeft, Clock } from "lucide-react";
import { format } from "date-fns";

export function EventDetail() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: event, isLoading, isError } = useGetEvent(id, { 
    query: { enabled: !!id, queryKey: ["/api/events", id] } 
  });

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading event...</div>;
  }

  if (isError || !event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
        <Link href="/seva#events">
          <Button variant="outline">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.date);

  return (
    <div className="w-full pb-24">
      {/* Header Banner */}
      <div className="relative h-64 md:h-96 bg-muted overflow-hidden">
        {event.imageUrl && (
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover brightness-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 container mx-auto">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-primary mb-4">
            <span className="px-3 py-1 bg-background rounded-md shadow-sm">{event.category}</span>
            {event.isUpcoming && <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md shadow-sm">Upcoming</span>}
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground md:text-white mb-2">{event.title}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-12 flex flex-col lg:flex-row gap-12">
        <div className="lg:w-2/3">
          <Link href="/seva#events" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft size={16} className="mr-2" /> Back to all events
          </Link>
          
          <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-p:text-muted-foreground">
            <h2>About this Event</h2>
            <p className="whitespace-pre-line">{event.description}</p>
          </div>
        </div>
        
        <div className="lg:w-1/3">
          <div className="sticky top-28 bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="font-serif text-xl font-bold mb-6">Event Details</h3>
            
            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-muted-foreground mb-1">Date</h4>
                  <p className="font-medium text-foreground">{format(eventDate, "EEEE, MMMM d, yyyy")}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-muted-foreground mb-1">Time</h4>
                  <p className="font-medium text-foreground">{format(eventDate, "h:mm a")}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-muted-foreground mb-1">Location</h4>
                  <p className="font-medium text-foreground">{event.location}</p>
                </div>
              </div>
              
              {event.attendeesCount !== null && (
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <Users size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-muted-foreground mb-1">Attendees</h4>
                    <p className="font-medium text-foreground">{event.attendeesCount} People expected</p>
                  </div>
                </div>
              )}
            </div>
            
            {event.isUpcoming && (
              <Button size="lg" className="w-full h-14 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-md">
                Register Interest
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
