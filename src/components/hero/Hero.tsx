import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Shield, Zap, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { showInfo } from "@/lib/toast-helpers";
import {
  Heart,
  HeartPulse,
  Stethoscope,
  Pill,
  Cross,
  Brain,
} from "lucide-react";

const floatingIcons = [
  // Top Left ECG
  {
    Icon: Activity,
    top: "13%",
    left: "18%",
    delay: 0,
    duration: 8,
    size: 42,
  },

  // Top Right Brain
  {
    Icon: Brain,
    top: "18%",
    right: "12%",
    delay: 1,
    duration: 10,
    size: 36,
  },

  // Heart beside description (move left)
  {
    Icon: HeartPulse,
    top: "36%",
    left: "10%",
    delay: 2,
    duration: 9,
    size: 36,
  },

  // Shield
  {
    Icon: Shield,
    top: "40%",
    right: "9%",
    delay: 3,
    duration: 11,
    size: 34,
  },

  // Stethoscope (bring inside so it isn't hidden)
  {
    Icon: Stethoscope,
    bottom: "35%",
    left: "10%",
    delay: 4,
    duration: 10,
    size: 40,
  },

  // Lightning below cards
  {
    Icon: Zap,
    bottom: "5%",
    left: "48%",
    delay: 5,
    duration: 9,
    size: 32,
  },

  // Sparkles bottom-right (move slightly upward)
  {
    Icon: Sparkles,
    bottom: "35%",
    right: "6%",
    delay: 6,
    duration: 11,
    size: 26,
  },
];


const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.25,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 35,
    filter: "blur(12px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};
const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);

  const featurePills = [
    {
      icon: Shield,
      title: t("hero.pillSecureTitle"),
      description: t("hero.pillSecureDesc"),
      delay: 0.2,
    },
    {
      icon: Zap,
      title: t("hero.pillInstantTitle"),
      description: t("hero.pillInstantDesc"),
      delay: 0.35,
    },
    {
      icon: Activity,
      title: t("hero.pillEvidenceTitle"),
      description: t("hero.pillEvidenceDesc"),
      delay: 0.5,
    },
  ];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setReduceMotion(e.matches);
    };

    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    setMousePosition({ x: clientX - left, y: clientY - top });
  };

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              scale: 0.98,
            }
      }
      animate={
        reduceMotion
          ? {}
          : {
              opacity: 1,
              scale: 1,
            }
      }
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
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
      {/* Grid */}
<div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />

{/* Glow blobs */}
<div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-primary/20 blur-[140px] animate-float" />

<div className="absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full bg-secondary/20 blur-[150px] animate-float-delayed" />

{/* Floating Icons */}
{!reduceMotion &&
  floatingIcons.map(({ Icon, ...item }, index) => (
    <motion.div
      key={index}
      className="absolute text-primary/30 pointer-events-none"
      style={{
        top: item.top,
        bottom: item.bottom,
        left: item.left,
        right: item.right,
      }}
      animate={{
        y: [0, -25, 0],
        rotate: [0, 8, -8, 0],
      }}
      transition={{
        duration: item.duration,
        repeat: Infinity,
        delay: item.delay,
        ease: "easeInOut",
      }}
    >
      <Icon
        style={{
          width: item.size,
          height: item.size,
        }}
      />
    </motion.div>
))}

      <motion.div
        className="relative max-w-5xl mx-auto text-center z-10"
        initial={{
          opacity: 0,
          y: 40,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.2,
            type: "spring",
            stiffness: 120,
          }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-8 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-bold tracking-wide">
            {t("hero.badge")}
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.9,
            delay: 0.45,
            type: "spring",
            stiffness: 90,
          }}
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-foreground mb-6 leading-[1.15] tracking-tight"
        >
          {t("hero.headingLine1")} <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t("hero.headingLine2")}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.75,
          }}
        className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          {t("hero.subtitle")}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 1.0,
            type: "spring",
            stiffness: 100,
          }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
        >
          <Button
            size="lg"
            onClick={() => {
              showInfo(t("hero.toastWelcomeTitle"), t("hero.toastWelcomeDesc"));
              navigate("/auth");
            }}
            className="font-bold gap-2 px-8 h-14 text-base rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group"
          >
            {t("hero.getStarted")}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              showInfo(t("hero.toastBackTitle"), t("hero.toastBackDesc"));
              navigate("/auth");
            }}
            className="font-bold px-8 h-14 text-base rounded-full border-2 hover:bg-muted transition-all duration-300 active:scale-95"
          >
            {t("hero.signIn")}
          </Button>
        </motion.div>

        {/* Feature pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {featurePills.map((pill) => (
            <motion.div
              key={pill.title}
            initial={{
              opacity: 0,
              y: 35,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: [0, -4, 0, 4, 0],
              rotate: [0, 0.5, 0, -0.5, 0],
              scale: 1,
            }}

            transition={{
              delay: 1.3 + pill.delay,
              type: "spring",
              stiffness: 120,
              damping: 18,
              rotate: {
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: pill.delay,
              },
              y: {
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: pill.delay,
              },
            }}
            whileHover={{
              y: -8,
              scale: 1.03,
              rotateX: 2,
              rotateY: -2,
              transition: {
                type: "spring",
                stiffness: 380,
                damping: 22,
                mass: 0.7,
              },
            }}
              className="group relative bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 text-center shadow-sm hover:border-primary/40 hover:shadow-2xl"
            >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
  
              <motion.div
                  whileHover={{
                    scale: 1.15,
                    rotate: 10,
                    y: -4,
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    y: [0, -4, 0],
                    scale: 1,
                  }}
                  transition={{
                    y: {
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "easeInOut",
                    },
                    opacity: {
                      duration: 0.6,
                    },
                    scale: {
                      duration: 0.6,
                    },
                  }}
                  className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                    
                <pill.icon className="w-6 h-6 text-primary" />
              </motion.div>
              <h3 className="text-foreground font-bold mb-2 text-lg">
                {pill.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {pill.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
};

export default Hero;