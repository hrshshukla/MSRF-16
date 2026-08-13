import { Link } from "wouter";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80dvh] w-full flex items-center justify-center relative overflow-hidden">
      {/* Mandala bg */}
      <div className="absolute inset-0 pointer-events-none">
        <svg viewBox="0 0 800 800" className="w-full h-full opacity-[0.03]" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx="400" cy="400" r={60 + i * 50} fill="none" stroke="currentColor" strokeWidth="1" />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="400" y1="100" x2="400" y2="700"
              stroke="currentColor" strokeWidth="0.5"
              transform={`rotate(${i * 30} 400 400)`}
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {/* 404 */}
        <div className="font-serif font-bold leading-none mb-6" style={{ fontSize: "clamp(6rem, 20vw, 12rem)", color: "hsl(var(--primary))", opacity: 0.15 }}>
          404
        </div>
        <div className="-mt-16 md:-mt-24 mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L25 16H37L27 24L31 36L20 28L9 36L13 24L3 16H15L20 4Z" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            This path is not written in any scroll
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
            Even the most disciplined seeker sometimes takes a wrong turn. The page you're looking for has wandered into the cosmic unknown.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="rounded-full h-14 px-8 bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20">
              <Home size={18} />
              Return to Homepage
            </Button>
          </Link>
          <button onClick={() => window.history.back()}>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 gap-2">
              <ArrowLeft size={18} />
              Go Back
            </Button>
          </button>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/seva#campaigns" className="hover:text-primary transition-colors">Seva Campaigns</Link>
          <span>·</span>
          <Link href="/seva#events" className="hover:text-primary transition-colors">Events</Link>
          <span>·</span>
          <Link href="/volunteer" className="hover:text-primary transition-colors">Member</Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
        </div>
      </div>
    </div>
  );
}
