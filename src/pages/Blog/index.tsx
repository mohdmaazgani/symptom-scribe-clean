import { useNavigate } from "react-router-dom";
import { Calendar, Clock, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { blogPosts } from "@/data/blogData";

const categoryColors: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  Wellness:      { border: "border-emerald-500/40", bg: "bg-emerald-900/20", text: "text-emerald-300", dot: "bg-emerald-400" },
  "Health Tips": { border: "border-cyan-500/40",    bg: "bg-cyan-900/20",    text: "text-cyan-300",   dot: "bg-cyan-400"    },
  "Brain Health":{ border: "border-violet-500/40",  bg: "bg-violet-900/20",  text: "text-violet-300", dot: "bg-violet-400"  },
  Guidance:      { border: "border-amber-500/40",   bg: "bg-amber-900/20",   text: "text-amber-300",  dot: "bg-amber-400"   },
};

const defaultColor = { border: "border-cyan-500/40", bg: "bg-cyan-900/20", text: "text-cyan-300", dot: "bg-cyan-400" };

const Blog = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-200">

      {/* Sticky top nav */}
      <div className="border-b border-white/[0.06] bg-[#0a0f1a]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </button>
          <span className="text-xs text-gray-600 font-medium tracking-widest uppercase">Symptom Scribe</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Hero header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">Health Resources</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Our Blog
          </h1>
          <p className="text-gray-500 text-lg max-w-xl leading-relaxed">
            Science-backed insights, practical tips, and expert guidance to help you understand and improve your health.
          </p>
        </div>

        {/* All posts — uniform cards */}
        <div className="space-y-5">
          {blogPosts.map((post) => {
            const color = categoryColors[post.category] || defaultColor;
            return (
              <div
                key={post.id}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 hover:bg-white/[0.06] hover:border-white/15 transition-all duration-200"
              >
                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className={`px-3 py-0.5 rounded-full border ${color.border} ${color.bg} ${color.text} text-xs font-medium flex items-center gap-1.5`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-2 leading-snug group-hover:text-cyan-50 transition-colors">
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="text-gray-500 text-sm leading-relaxed mb-5">
                  {post.excerpt}
                </p>

                {/* Read more */}
                <span className="flex items-center gap-1.5 text-cyan-400 group-hover:text-cyan-300 text-sm font-medium transition-colors w-fit">
                  Read more <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-16 text-center">
          <p className="text-gray-700 text-sm">More articles coming soon · Stay tuned</p>
        </div>
      </div>
    </div>
  );
};

export default Blog;