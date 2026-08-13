import { ArrowRight, BookOpen, Quote, Shield, Flame } from "lucide-react";

export function AboutPage() {
  return (
    <div className="w-full pb-24">
      {/* Hero */}
      <div className="bg-card border-b pt-24 pb-20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-secondary/5 rounded-l-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">Protecting the Roots of Dharma</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Mahakal Sanatan Raksha Foundation was established with a singular vision: to safeguard, promote, and sustain the timeless values of Sanatan Dharma through direct community action, education, and unwavering seva.
            </p>
          </div>
        </div>
      </div>

      {/* Pillars */}
      <div className="container mx-auto px-4 md:px-8 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-3xl font-bold mb-4">Our Core Pillars</h2>
          <p className="text-muted-foreground">The foundation operates on four essential pillars that guide every initiative and campaign we undertake.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-primary group-hover:scale-110 transition-transform">
              <Shield size={100} />
            </div>
            <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl mb-6">
              <Shield size={24} />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3">Raksha (Protection)</h3>
            <p className="text-sm text-muted-foreground">Protecting ancient temples, preserving sacred texts, and defending the rights of Sanatani communities.</p>
          </div>

          <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-secondary group-hover:scale-110 transition-transform">
              <Flame size={100} />
            </div>
            <div className="w-12 h-12 bg-secondary/10 text-secondary flex items-center justify-center rounded-xl mb-6">
              <Flame size={24} />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3">Seva (Service)</h3>
            <p className="text-sm text-muted-foreground">Providing food, shelter, disaster relief, and medical aid to those in need, seeing the divine in all beings.</p>
          </div>

          <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-primary group-hover:scale-110 transition-transform">
              <BookOpen size={100} />
            </div>
            <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl mb-6">
              <BookOpen size={24} />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3">Gyan (Knowledge)</h3>
            <p className="text-sm text-muted-foreground">Educating the youth about Vedic sciences, history, and spiritual practices through gurukuls and modern mediums.</p>
          </div>

          <div className="p-8 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-secondary group-hover:scale-110 transition-transform">
              <Quote size={100} />
            </div>
            <div className="w-12 h-12 bg-secondary/10 text-secondary flex items-center justify-center rounded-xl mb-6">
              <Quote size={24} />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3">Sangathan (Unity)</h3>
            <p className="text-sm text-muted-foreground">Building a strong, connected network of members and believers across the globe to act as one cohesive force.</p>
          </div>
        </div>
      </div>

      {/* History / Story */}
      <div className="bg-background border-y py-24 relative">
        <div className="mandala-bg text-primary opacity-[0.02]" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <div className="aspect-square rounded-3xl overflow-hidden bg-muted relative">
                {/* Generated abstract heritage image representation */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-secondary/40 mix-blend-multiply z-10" />
                <img 
                  src="https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Ancient Temple Architecture" 
                  className="w-full h-full object-cover grayscale brightness-110 contrast-125"
                />
              </div>
            </div>
            <div className="lg:w-1/2 space-y-6">
              <h2 className="font-serif text-3xl md:text-4xl font-bold">Our Journey</h2>
              <p className="text-lg text-muted-foreground">
                What began as a small collective of devotees in Varanasi has grown into a nationwide movement. We recognized that preserving our heritage requires more than just reverence—it requires organized, sustained effort.
              </p>
              <p className="text-muted-foreground">
                Over the years, the Mahakal Sanatan Raksha Foundation has spearheaded the renovation of neglected village temples, provided ongoing support for traditional pathshalas, and mobilized thousands of members during national crises.
              </p>
              <p className="text-muted-foreground">
                Our approach merges the deep wisdom of our ancestors with the operational excellence of a modern institution. Every rupee donated and every hour contributed by a member is tracked, measured, and optimized for maximum impact.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
