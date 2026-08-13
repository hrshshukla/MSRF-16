import { useListGallery } from "@/lib/api-client";
import { useState } from "react";
import { ImageIcon } from "lucide-react";

export function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { data: galleryItems, isLoading } = useListGallery();

  const categories = ["all", ...Array.from(new Set(galleryItems?.map(item => item.category) || []))];
  
  const filteredItems = galleryItems?.filter(
    item => activeCategory === "all" || item.category === activeCategory
  );

  return (
    <div className="w-full pb-24 relative">
      <div className="bg-card border-b pt-24 pb-16 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Gallery</h1>
          <p className="text-lg text-muted-foreground">
            Moments of devotion, service, and community gathered from across our initiatives.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-12">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${
                activeCategory === category 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`bg-muted rounded-2xl animate-pulse ${i % 2 === 0 ? 'h-64' : 'h-96'}`} />
            ))}
          </div>
        ) : !filteredItems?.length ? (
          <div className="text-center py-20">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No images found</h3>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredItems.map(item => (
              <div key={item.id} className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-muted">
                <img 
                  src={item.imageUrl} 
                  alt={item.caption || "Gallery image"} 
                  className="w-full h-auto block object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  {item.caption && (
                    <p className="text-white font-medium text-sm mb-2 drop-shadow-md">
                      {item.caption}
                    </p>
                  )}
                  <span className="text-primary text-[10px] font-bold uppercase tracking-widest bg-black/50 px-2 py-1 rounded w-fit backdrop-blur-sm">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
