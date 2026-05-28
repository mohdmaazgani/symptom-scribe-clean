import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, BookOpen, ArrowRight } from "lucide-react";
import { blogPosts } from "./Blog";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

const BlogPost = () => {
  const { slug } = useParams();
  const currentIndex = blogPosts.findIndex((p) => p.slug === slug);
  const post = blogPosts[currentIndex];

  // correct order: next = currentIndex + 1, prev = currentIndex - 1
  const prevPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
        <BookOpen className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Post Not Found</h1>
        <p className="text-muted-foreground text-sm">This blog post doesn't exist or may have been removed.</p>
        <Link to="/blog" className="text-primary hover:underline text-sm flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>
    );
  }

  const renderContent = (content: string) => {
    const lines = content.trim().split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-base font-semibold text-foreground mt-6 mb-2">{line.replace("## ", "")}</h2>;
      }
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground list-none">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: line.replace("- ", "").replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>") }} />
          </li>
        );
      }
      if (line.match(/^\d+\./)) {
        return (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground list-none">
            <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs flex items-center justify-center shrink-0 font-medium mt-0.5">
              {line.match(/^\d+/)?.[0]}
            </span>
            <span>{line.replace(/^\d+\.\s/, "")}</span>
          </li>
        );
      }
      if (line === "") return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>") }}
        />
      );
    });
  };

  return (
      <LegalPageLayout 
        title={post.title} 
        icon={BookOpen} 
        label="Resources"
        backTo="/blog"
        backLabel="Back to Blog"
      >

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
          {post.category}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" aria-hidden="true" />
          {post.date}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" aria-hidden="true" />
          {post.readTime}
        </span>
      </div>

      {/* Content */}
      <div className="rounded-xl bg-card border border-border p-6 md:p-8">
        <div className="flex flex-col gap-2">
          {renderContent(post.content)}
        </div>
      </div>

      {/* Prev / Next Navigation */}
      <div className="grid grid-cols-2 gap-4">
        {/* Previous — only show if exists */}
        {prevPost ? (
          <Link
            to={`/blog/${prevPost.slug}`}
            aria-label={`Previous post: ${prevPost.title}`}
            className="rounded-xl bg-card border border-border p-5 hover:border-primary/40 transition-colors flex flex-col gap-1"
          >
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Previous
            </span>
            <span className="text-sm font-medium text-foreground line-clamp-2">{prevPost.title}</span>
          </Link>
        ) : (
          <div /> /* empty div to keep Next on the right */
        )}

        {/* Next — only show if exists */}
        {nextPost ? (
          <Link
            to={`/blog/${nextPost.slug}`}
            aria-label={`Next post: ${nextPost.title}`}
            className="rounded-xl bg-card border border-border p-5 hover:border-primary/40 transition-colors flex flex-col gap-1 items-end text-right"
          >
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Next <ArrowRight className="w-3 h-3" />
            </span>
            <span className="text-sm font-medium text-foreground line-clamp-2">{nextPost.title}</span>
          </Link>
        ) : (
          <div /> /* empty div to keep Previous on the left */
        )}
      </div>

      {/* Back to Blog */}
      <div className="text-center">
        <Link
          to="/blog"
          aria-label="Back to Blog"
          className="inline-flex items-center gap-2 text-primary text-sm hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all posts
        </Link>
      </div>

    </LegalPageLayout>
  );
};

export default BlogPost;