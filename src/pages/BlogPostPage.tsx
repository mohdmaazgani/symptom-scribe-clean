import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, BookOpen, Home } from "lucide-react";
import { getPostBySlug } from "@/data/blogData";

const categoryColors: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  Wellness:      { border: "border-emerald-500/40", bg: "bg-emerald-900/20", text: "text-emerald-300", dot: "bg-emerald-400" },
  "Health Tips": { border: "border-cyan-500/40",    bg: "bg-cyan-900/20",    text: "text-cyan-300",   dot: "bg-cyan-400"    },
  "Brain Health":{ border: "border-violet-500/40",  bg: "bg-violet-900/20",  text: "text-violet-300", dot: "bg-violet-400"  },
  Guidance:      { border: "border-amber-500/40",   bg: "bg-amber-900/20",   text: "text-amber-300",  dot: "bg-amber-400"   },
};

const defaultColor = { border: "border-cyan-500/40", bg: "bg-cyan-900/20", text: "text-cyan-300", dot: "bg-cyan-400" };

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = getPostBySlug(slug || "");
  const color = post ? (categoryColors[post.category] || defaultColor) : defaultColor;

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-white font-bold text-xl mb-2">Post not found</p>
          <p className="text-gray-500 text-sm mb-6">This article doesn't exist or may have moved.</p>
          <button
            onClick={() => navigate("/blog")}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 mx-auto transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-200">

      {/* Sticky top nav */}
      <div className="border-b border-white/[0.06] bg-[#0a0f1a]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/blog")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Blog
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-sm group"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">

        {/* Article header */}
        <div className="mb-10">
          {/* Category + icon */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-cyan-900/30 border border-cyan-700/30 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-cyan-400 uppercase mb-0.5">
                Resources
              </p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${color.border} ${color.bg} ${color.text} text-xs font-medium`}>
                <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                {post.category}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {post.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600 text-xs">Last updated: {post.date.split(" ").slice(1).join(" ")}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

        {/* Article body */}
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="p-8 md:p-10 space-y-8">
            {post.content.map((section, i) => (
              <div key={i} className={i > 0 && section.heading ? "pt-2" : ""}>
                {section.heading && (
                  <h2 className="text-lg md:text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <span className={`w-1 h-5 rounded-full ${color.dot} opacity-80`} />
                    {section.heading}
                  </h2>
                )}
                <p className={`text-gray-400 leading-relaxed ${section.heading ? "pl-3" : ""}`}>
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Prev / Next navigation */}
        {(post.prevPost || post.nextPost) && (
          <div className="mt-10 grid grid-cols-2 gap-4">
            {/* Previous */}
            <div>
              {post.prevPost && (
                <button
                  onClick={() => navigate(`/blog/${post.prevPost!.slug}`)}
                  className="group w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 px-5 py-5 text-left transition-all duration-200"
                >
                  <p className="text-xs text-gray-600 flex items-center gap-1 mb-1.5 group-hover:text-gray-500 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Previous article
                  </p>
                  <p className="text-sm font-semibold text-white leading-snug group-hover:text-cyan-50 transition-colors line-clamp-2">
                    {post.prevPost.title}
                  </p>
                </button>
              )}
            </div>

            {/* Next */}
            <div>
              {post.nextPost && (
                <button
                  onClick={() => navigate(`/blog/${post.nextPost!.slug}`)}
                  className="group w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 px-5 py-5 text-right transition-all duration-200"
                >
                  <p className="text-xs text-gray-600 flex items-center justify-end gap-1 mb-1.5 group-hover:text-gray-500 transition-colors">
                    Next article <ArrowRight className="w-3.5 h-3.5" />
                  </p>
                  <p className="text-sm font-semibold text-white leading-snug group-hover:text-cyan-50 transition-colors line-clamp-2">
                    {post.nextPost.title}
                  </p>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <div className="mt-10 pt-8 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => navigate("/blog")}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to all posts
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-sm group"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;