import { Link } from "wouter";
import { ArrowRight, Mail, MapPin, Phone, Heart } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const footerLinks = {
  Organization: [
    { href: "/about", label: "About Us" },
  ],
  "Get Involved": [
    { href: "/seva#campaigns", label: "Seva Campaigns" },
    { href: "/seva#foundation-projects", label: "Our Projects" },
  ],
  Help: [
    { href: "/contact", label: "Contact Us" },
  ],
};

export function Footer() {
  const developerWhatsAppUrl =
    "https://wa.me/918889650896?text=Hey%20harsh%2C%20i%20want%20details%20about%20website%20development%20service";

  return (
    <footer className="bg-card border-t pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-8">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <BrandLogo className="h-10 w-10 rounded-full bg-white" sizes="40px" />
              <div className="flex flex-col">
                <span className="font-sans font-extrabold text-lg leading-tight">Mahakal Sanatan</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Raksha Foundation</span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              Dedicated to the preservation of Sanatan Dharma through active seva, education, and community empowerment across Bharat.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="text-primary shrink-0 mt-0.5" size={16} />
                <span>P No 116/A Narmada Ho Soc,<br />Borgaon Road, Nagpur, Maharashtra</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="text-primary shrink-0" size={16} />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="text-primary shrink-0" size={16} />
                <span>namaste@mahakal-sanatan.org</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-serif font-semibold text-base mb-5 relative inline-block">
                {title}
                <span className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-secondary rounded-full" />
              </h4>
              <ul className="space-y-2.5 text-sm mt-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      <ArrowRight size={12} className="text-primary/40 group-hover:text-primary transition-colors shrink-0" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="border-t pt-8 flex flex-col gap-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-4 sm:text-left">
            <span>© {new Date().getFullYear()} Mahakal Sanatan Raksha Foundation.</span>
            <span className="inline-flex items-center gap-1.5">
              <span>Made with</span>
              <Heart size={13} className="text-primary" fill="currentColor" aria-hidden="true" />
              <span>for Dharma.</span>
            </span>
          </div>
          <a
            href={developerWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="developer-credit w-full justify-center border-t pt-4 md:w-auto md:justify-start md:border-t-0 md:pt-0"
            aria-label="Contact Harsh Shukla about website development on WhatsApp"
          >
            <span className="developer-credit-label">Developed by</span>
            <span className="developer-credit-name">HARSH SHUKLA</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
