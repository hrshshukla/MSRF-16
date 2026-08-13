import { useGetPost } from "@/lib/api-client";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft, Tag } from "lucide-react";
import { format } from "date-fns";

export function PostDetail() {
  const params = useParams();
  const slug = params.slug || "";
  
  const { data: post, isLoading, isError } = useGetPost(slug, { 
    query: { enabled: !!slug, queryKey: ["/api/blog", slug] } 
  });

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading article...</div>;
  }

  if (isError || !post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
        <Link href="/blog">
          <Button variant="outline">Back to Updates</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 bg-card min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-12 md:pt-20">
        <Link href="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft size={16} className="mr-2" /> Back to all articles
        </Link>
        
        <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-primary mb-6">
          <span>{post.category}</span>
        </div>
        
        <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight mb-8">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-12 py-6 border-y">
          <div className="flex items-center gap-2 font-medium">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
              <User size={14} />
            </div>
            <span className="text-foreground">{post.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{format(new Date(post.publishedAt), "MMMM d, yyyy")}</span>
          </div>
        </div>
        
        {post.imageUrl && (
          <div className="rounded-3xl overflow-hidden mb-12 shadow-sm bg-muted aspect-video">
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
        
        {post.tags && post.tags.length > 0 && (
          <div className="mt-16 pt-8 border-t">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <Tag size={16} /> Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
