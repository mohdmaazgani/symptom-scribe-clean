import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Shield, Zap, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { showInfo } from "@/lib/toast-helpers";

const featurePills = [
  {
    icon: Shield,
    title: "Private & Secure",
    description: "Your health data stays confidential",
    delay: 0.2,
  },
  {
    icon: Zap,
    title: "Instant Analysis",
    description: "Get insights in seconds",
    delay: 0.35,
  },
  {
    icon: Activity,
    title: "Evidence-Based",
    description: "Powered by medical knowledge",
    delay: 0.5,
  },
];

const Hero = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    setMousePosition({ x: clientX - left, y: clientY - top });
  };

  return (
    <section 
      className="relative overflow-hidden bg-background pt-16 pb-24 md:pt-24 md:pb-32 px-4 group"
      onMouseMove={handleMouseMove}
    >
      {/* Interactive Mouse Spotlight */}
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, hsl(var(--primary) / 0.08), transparent 40%)`,
        }}
      />
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.04] pointer-events-none" aria-hidden="true" />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl opacity-60 animate-float pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-3xl opacity-60 animate-float-delayed pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-8 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-bold tracking-wide">
            AI-Powered Health Analysis
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-foreground mb-6 leading-[1.15] tracking-tight"
        >
          Smart Health <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tracker
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Describe your symptoms and get instant AI-powered insights on possible causes,
          severity levels, and self-care recommendations.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
        >
          <Button
            size="lg"
            onClick={() => {
              showInfo("Welcome to Smart Health Tracker", "Sign in to start tracking your health");
              navigate("/auth");
            }}
            className="font-bold gap-2 px-8 h-14 text-base rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              showInfo("Welcome back!", "Please sign in to continue");
              navigate("/auth");
            }}
            className="font-bold px-8 h-14 text-base rounded-full border-2 hover:bg-muted transition-all duration-300 active:scale-95"
          >
            Sign In
          </Button>
        </motion.div>

        {/* Feature pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {featurePills.map((pill) => (
            <motion.div
              key={pill.title}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: pill.delay, ease: "easeOut" }}
              className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                <pill.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-foreground font-bold mb-2 text-lg">
                {pill.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {pill.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;