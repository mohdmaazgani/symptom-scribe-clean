import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Hero from "@/components/hero/Hero";
import { ArrowRight, Brain, Clock, TrendingUp, Users, Star, CheckCircle2, Heart, Activity, Shield, Menu, X, UserRound, LineChart, ClipboardCheck } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { AnimatedThemeToggler } from "@/components/theme/components/AnimatedThemeToggler";
import { BackToTop } from "@/components/navigation/BackToTop";
import { 
  Github,
  ExternalLink,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
  Lock,
  AlertCircle,
  Mail
} from "lucide-react";


const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("");
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user;
  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() || user?.email || "";
  const userInitial = displayName.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Health Enthusiast",
      content: "This app helped me track my symptoms and understand when to seek medical help. The AI analysis is surprisingly accurate!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Fitness Coach",
      content: "I use this daily to monitor my clients' health metrics. The comprehensive tracking and analytics are game-changing.",
      rating: 5
    },
    {
      name: "Dr. Emily Roberts",
      role: "Medical Professional",
      content: "An excellent tool for preliminary health awareness. It empowers patients to make informed decisions about their health.",
      rating: 5
    }
  ];

  const howItWorksSteps = [
    {
      num: "01",
      icon: UserRound,
      title: t("home.howItWorksStep1Title"),
      desc: t("home.howItWorksStep1Desc"),
    },
    {
      num: "02",
      icon: LineChart,
      title: t("home.howItWorksStep2Title"),
      desc: t("home.howItWorksStep2Desc"),
    },
    {
      num: "03",
      icon: ClipboardCheck,
      title: t("home.howItWorksStep3Title"),
      desc: t("home.howItWorksStep3Desc"),
    },
  ];
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);

    if (!element) return;

    const headerOffset = 90;

    const y =
      element.getBoundingClientRect().top +
      window.pageYOffset -
      headerOffset;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  };
  useEffect(() => {
  const sections = [
    "features",
    "how-it-works",
    "why-choose",
    "reviews",
    "faq",
    "contact",
  ];
  const handleScroll = () => {
    const scrollPosition = window.scrollY + 120;
    const bottomReached =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 10;

    if (bottomReached) {
      setActiveSection("contact");
      return;
    }

    for (const section of sections) {
      const element = document.getElementById(section);

      if (
        element &&
        scrollPosition >= element.offsetTop &&
        scrollPosition < element.offsetTop + element.offsetHeight
      ) {
        setActiveSection(section);
        break;
      }
    }
  };

  window.addEventListener("scroll", handleScroll);
  handleScroll();

  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    mass: 0.3,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">

      <header 
        className={`sticky top-0 left-0 w-full px-6 py-0 z-50 bg-background border-b border-border ${
          isScrolled
            ? "bg-background border-b border-border "
            : "bg-background"
        }`}
      >
            
        <div className="container mx-auto -mb-[84px]">
          <div className="flex relative overflow-hidden items-center justify-between rounded-2xl border border-border/100 bg-background px-4 py-3 shadow-md">
          <div
            className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src="/3.png"
              alt="Symptom Scribe Logo"
              className="h-7 w-7 object-contain shrink-0"
            />

            <span className="text-xl font-bold text-primary">
              Symptom Scribe

            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 ml-4">
            <nav className="flex items-center gap-7 mx-6">
            <button onClick={()=>scrollToSection("features")} className={`group relative text-sm font-medium text-muted-foreground transition-colors duration-300
            ${
            activeSection === "features"
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"}`}>
              {t("home.navFeatures")}
              <span className={`absolute left-0 -bottom-1 h-0.5 w-0 bg-primary transition-all duration-300 
              ${
                activeSection === "features"
                  ? "w-full"
                  : "w-0 group-hover:w-full"
              }`} />
            </button>

            <button onClick={()=>scrollToSection("how-it-works")} className={`group relative text-sm font-medium text-muted-foreground transition-colors duration-300 
             ${
            activeSection === "how-it-works"
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"}`}>
              {t("home.navHowItWorks")}
              <span className={`absolute left-0 -bottom-1 h-0.5 w-0 bg-primary transition-all duration-300 
               ${
                activeSection === "how-it-works"
                  ? "w-full"
                  : "w-0 group-hover:w-full"
              }`}
              />
            </button>

            <button onClick={()=>scrollToSection("why-choose")} className={`group relative text-sm font-medium text-muted-foreground transition-colors duration-300
             ${
            activeSection === "why-choose"
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"}`}
            >
              {t("home.navWhyChoose")}
              <span className={`absolute left-0 -bottom-1 h-0.5 w-0 bg-primary transition-all duration-300
               ${
                activeSection === "why-choose"
                  ? "w-full"
                  : "w-0 group-hover:w-full"
              }`}
              />
            </button>

            <button onClick={()=>scrollToSection("reviews")} className={`group relative text-sm font-medium text-muted-foreground transition-colors duration-300 
             ${
            activeSection === "reviews"
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"}`}
            >
              Reviews
              <span className={`absolute left-0 -bottom-1 h-0.5 w-0 bg-primary transition-all duration-300 
                 ${
                activeSection === "reviews"
                  ? "w-full"
                  : "w-0 group-hover:w-full"
              }`}
                />
            </button>

            <button onClick={()=>scrollToSection("faq")} className={`group relative text-sm font-medium text-muted-foreground transition-colors duration-300 
               ${
            activeSection === "faq"
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"}`}
              >
              FAQ
              <span className={`absolute left-0 -bottom-1 h-0.5 w-0 bg-primary transition-all duration-300 
               ${
                activeSection === "faq"
                  ? "w-full"
                  : "w-0 group-hover:w-full"
              }`}
              />
            </button>

            <button onClick={()=>scrollToSection("contact")} className={`group relative text-sm font-medium text-muted-foreground transition-colors duration-300
             ${
            activeSection === "contact"
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"}`}
            >
              Contact
              <span className={`absolute left-0 -bottom-1 h-0.5 w-0 bg-primary transition-all duration-300
                 ${
                activeSection === "contact"
                  ? "w-full"
                  : "w-0 group-hover:w-full"
              }`}
                />
            </button>
          </nav>
          <div className="flex items-center gap-3 ml-6">
         <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 hover:bg-primary/10 transition-colors">
            <AnimatedThemeToggler />
            </div>
            </div>
            {session ? (
              <Button
                onClick={() => navigate("/dashboard")}
                title={displayName}
                className="h-10 px-5 gap-2"
              >
                <span className="w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center font-semibold text-xs">
                  {userInitial}
                </span>
                {t("home.goToDashboard")}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="h-10 px-5 border-primary/30 text-primary hover:bg-primary/5"
                  onClick={() => navigate("/auth")}
                >
                  {t("home.signIn")}
                </Button>
                <Button
                  className="h-10 px-5"
                  onClick={() => navigate("/auth")}
                >
                  {t("home.getStarted")}
                </Button>
              </>
            )}
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-border overflow-hidden">
            <motion.div
              style={{ scaleX }}
              className="h-full w-full origin-left bg-primary"
            />
          </div>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6 text-primary" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-full left-0 w-full bg-background border-b border-border shadow-lg overflow-hidden md:hidden"
            >
              <div className="p-4 flex flex-col gap-3">
                {session ? (
                  <Button
                    className="w-full justify-center gap-2 pl-2"
                    onClick={() => navigate("/dashboard")}
                    title={displayName}
                  >
                    <span className="w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center font-semibold text-xs shrink-0">
                      {userInitial}
                    </span>
                    {t("home.goToDashboard")}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="w-full justify-center" onClick={() => navigate("/auth")}>
                      {t("home.signIn")}
                    </Button>
                    <Button className="w-full justify-center" onClick={() => navigate("/auth")}>
                      {t("home.getStarted")}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <Hero />
      
      {/* Features Section */}
      <section id="features" className="container mx-auto py-14 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("home.featuresTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("home.featuresDesc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Brain, title: t("home.featureAiTitle"), desc: t("home.featureAiDesc") },
              { icon: TrendingUp, title: t("home.featureAnalyticsTitle"), desc: t("home.featureAnalyticsDesc") },
              { icon: Clock, title: t("home.featureHistoryTitle"), desc: t("home.featureHistoryDesc") },
              { icon: Shield, title: t("home.featureEmergencyTitle"), desc: t("home.featureEmergencyDesc") },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
              >
                <Card className="feature-card h-full">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative bg-muted py-28 px-3 overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.howItWorksTitle")}</h2>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-0.5 rounded-full bg-primary" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <div className="w-10 h-0.5 rounded-full bg-primary" />
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("home.howItWorksDesc")}
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 overflow-visible">
            {howItWorksSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                   <motion.div
                    key={step.num}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      opacity: { duration: 0.6, delay: index * 0.2 },
                      y: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.3,
                      },
                    }}
                    className="relative"
                  >
                  {index !== howItWorksSteps.length - 1 && (
                    <div className="hidden md:block absolute top-[150px] left-[calc(100%-9px)] w-24 h-16 z-20 overflow-visible pointer-events-none">
                     <svg className="w-full h-full overflow-visible"
                        viewBox="0 0 130 90"
                        fill="none">

                     <path
                        id={`flowPath-${index}`}
                        d="M8 30 C22 8 58 8 74 30"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="8 8"
                        fill="none"
                     />
                    <motion.circle
                        r="4"
                        fill="white">
                     <animateMotion
                          dur="2s"
                          repeatCount="indefinite"
                          path="M8 30 C22 8 58 8 74 30"/>
                    </motion.circle>

                  <circle cx="8" cy="30" r="5" fill="hsl(var(--primary))" />
                  <circle cx="74" cy="30" r="5" fill="hsl(var(--primary))" />
                </svg>
              </div>
            )}

              <div className="group relative bg-card/90 backdrop-blur-xl rounded-3xl border border-border/60 shadow-lg px-4 pt-16 pb-10 min-h-[360px] text-center transition-all duration-500 hover:-translate-y-2 hover:scale-[1.015] hover:border-primary/40 hover:shadow-xl hover:shadow-primary/20 hover:ring-1 hover:ring-primary/20 hover:shadow-[0_25px_70px_rgba(34,211,238,.25)]">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                    
            <div className="absolute left-1/2 -translate-x-1/2 -top-9 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-xl border-4 border-background shadow-2xl ring-2 ring-primary/30">
              {step.num}
            </div>

           <motion.div
             animate={{
              rotate: [0, 4, -4, 0],
              scale: [1, 1.05, 1],
             }}
             transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
             }}
             className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Icon className="w-10 h-10 text-primary" strokeWidth={2.2} />
           </motion.div>

                    <h3 className="text-xl font-bold leading-tight mb-4 min-h-[56px] flex items-center justify-center">
                      {step.title}
                    </h3>

                    <div className="w-12 h-0.5 rounded-full bg-primary mx-auto mb-5" />

                    <p className="text-muted-foreground leading-7 max-w-[280px] mx-auto">
                      {step.desc}
                    </p>

                    <div className="absolute bottom-0 left-0 w-full h-1.5 rounded-b-xl bg-primary" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section id="why-choose" className="container mx-auto py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.whyChooseTitle")}</h2>
            <p className="text-muted-foreground text-lg">{t("home.whyChooseDesc")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">{t("home.benefitAiTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("home.benefitAiDesc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">{t("home.benefitTrackingTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("home.benefitTrackingDesc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">{t("home.benefitPrivacyTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("home.benefitPrivacyDesc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">{t("home.benefitBrainGamesTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("home.benefitBrainGamesDesc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">{t("home.benefitEmergencyTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("home.benefitEmergencyDesc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">{t("home.benefitEducationTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("home.benefitEducationDesc")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

          {/* Testimonials Section */}
      <section id="reviews" className="bg-muted py-20 px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("home.reviewsTitle")}</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  {t("home.reviewsDesc")}
                </p>
              </div>

              <Card className="bg-card border-border rounded-xl shadow-sm overflow-hidden">
                <CardContent className="p-8 md:p-10">
                  <div className="text-center min-h-[220px] flex flex-col justify-center">
                    <div className="flex justify-center gap-1.5 mb-5">
                      {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    <p className="text-foreground text-lg md:text-xl italic leading-8 max-w-3xl mx-auto mb-7">
                      "{testimonials[activeTestimonial].content}"
                    </p>

                    <div className="mb-6">
                      <p className="text-foreground text-lg font-bold mb-1">{testimonials[activeTestimonial].name}</p>
                      <p className="text-muted-foreground text-sm">{testimonials[activeTestimonial].role}</p>
                    </div>

                    <div className="flex justify-center items-center gap-2 mt-4">
                      {testimonials.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveTestimonial(i)}
                          aria-label={`Show testimonial ${i + 1}`}
                          className={`rounded-full transition-all duration-300 ${
                            i === activeTestimonial
                              ? "w-8 h-2 bg-primary"
                              : "w-2 h-2 bg-muted-foreground/40"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </section>

      {/* FAQ Section */}
       <section id="faq" className="container mx-auto py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.faqTitle")}</h2>
            <p className="text-muted-foreground text-lg">{t("home.faqDesc")}</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">t("home.faqQ1")</AccordionTrigger>
              <AccordionContent>
                t("home.faqA1") and help you understand when to seek professional medical care. It should never replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">t("home.faqQ2")</AccordionTrigger>
              <AccordionContent>
                t("home.faqA2") and provides evidence-based insights. However, it's designed for educational purposes and preliminary assessment only. The accuracy depends on the quality and completeness of information you provide. For definitive diagnosis, always consult healthcare professionals.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">t("home.faqQ3")</AccordionTrigger>
              <AccordionContent>
                t("home.faqA3") both in transit and at rest. We comply with healthcare data protection standards and never share your personal health information with third parties without your explicit consent. You have full control over your data.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">t("home.faqQ4")</AccordionTrigger>
              <AccordionContent>
                t("home.faqA4"), health metrics tracking, consultation history, brain games for cognitive health, emergency resources, health education facts, personalized dashboards, and comprehensive analytics. All features are designed to work together for holistic health management.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">t("home.faqQ5")</AccordionTrigger>
              <AccordionContent>
                t("home.faqA5") over time. You can monitor symptoms, track medications, record vitals, and observe trends. This information can be valuable to share with your healthcare provider. However, always follow your doctor's treatment plan for managing chronic conditions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left">t("home.faqQ6")</AccordionTrigger>
              <AccordionContent>
                t("home.faqA6") (PWA) that works seamlessly on all devices - desktop, tablet, and mobile. You can access it through your web browser and even add it to your home screen for a native app-like experience. No separate app download required!
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-muted py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <Heart className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.ctaTitle")}</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            {t("home.ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              {t("home.getStarted")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="transition-all duration-300 active:scale-95 hover:bg-muted">
              Sign In
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Free to use • Secure & Private
          </p>
        </motion.div>
      </section>
      <footer id="contact" className="border-t border-border bg-gradient-to-b from-background to-muted/30">
  <div className="container mx-auto px-4 py-12 ">
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10">
      {/* Brand Column */}
<div className="lg:col-span-2">
  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
    <Activity className="w-6 h-6 text-primary" />
    <span className="text-foreground font-bold">
      Symptom Scribe
    </span>
  </h3>
  <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-sm">
    Your intelligent health companion for symptom analysis, health tracking, and wellness insights powered by AI.
  </p>
  {/* GitHub Link */}
  <a 
    href="https://github.com/mohdmaazgani/symptom-scribe-clean.git" 
    target="_blank" 
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-accent transition-all duration-300 text-sm w-fit"
  >
    <Github className="w-4 h-4" />
    <span>View on GitHub</span>
    <ExternalLink className="w-3 h-3" />
  </a>
</div>
      
      {/* Platform Column */}
      <div>
        <h4 className="font-semibold mb-4 text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Platform
        </h4>
        <ul className="space-y-3 text-sm">
          <li><Link to="/chat" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out w-full"><Brain className="w-4 h-4 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-6" /><span className="transition-transform duration-300 group-hover:translate-x-1"> AI Symptom Checker</span></Link></li>
          <li><Link to="/metrics" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out w-full"><TrendingUp className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-6" /><span className="transition-transform duration-300 group-hover:translate-x-1"> Health Metrics</span></Link></li>
          <li><Link to="/history" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out w-full"><Clock className="w-4 h-4 transition-transform duration-300  group-hover:scale-110 group-hover:rotate-6" /><span className="transition-transform duration-300 group-hover:translate-x-1"> Consultation History</span></Link></li>
          <li><Link to="/brain-games" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out w-full"><Brain className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-6" /><span className="transition-transform duration-300 group-hover:translate-x-1"> Brain Training</span></Link></li>
        </ul>
      </div>
      
      {/* Resources Column */}
      <div>
        <h4 className="font-semibold mb-4 text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Resources
        </h4>
        <ul className="space-y-3 text-sm">
          <li><Link to="/health-library" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out w-full"><Heart className="w-4 h-4 transition-transform duration-300  group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-6" /><span className="transition-transform duration-300 group-hover:translate-x-1"> Health Library</span></Link></li>
          <li><Link to="/emergency" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out w-full "><Shield className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-6" /><span className="transition-transform duration-300 group-hover:translate-x-1"> Emergency Guide</span></Link></li>
          <li>
          <button
            onClick={() => {
              const faq = document.getElementById("faq");
              if (faq) {
                faq.scrollIntoView({ behavior: "smooth" });
              } else {
                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
              }
            }}
            className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out w-full"
          >
            <HelpCircle className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-6" />
            <span className="transition-transform duration-300 group-hover:translate-x-1"> FAQ</span>
          </button>
        </li>
          <li><Link to="/blog" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out w-full"><FileText className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-6" /><span className="transition-transform duration-300 group-hover:translate-x-1"> Blog</span></Link></li>
        </ul>
      </div>
      
      {/* Legal Column */}
      <div>
        <h4 className="font-semibold mb-4 text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Legal
        </h4>
        <ul className="space-y-3 text-sm">
          <li><Link to="/privacy" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out w-full"><Lock className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-6" /><span className="transition-transform duration-300 group-hover:translate-x-1"> Privacy Policy</span></Link></li>
          <li><Link to="/terms" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out w-full"><FileText className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-6" /><span className="transition-transform duration-300 group-hover:translate-x-1"> Terms of Service</span></Link></li>
          <li><Link to="/disclaimer" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out w-full"><AlertCircle className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-6" /><span className="transition-transform duration-300 group-hover:translate-x-1"> Medical Disclaimer</span></Link></li>
          <li><Link to="/contact" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-out w-full"><Mail className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-6" /><span className="transition-transform duration-300 group-hover:translate-x-1"> Contact Support</span></Link></li>
        </ul>
      </div>
    </div>
    
    {/* Bottom Bar - Centered */}
    <div className="border-t border-border pt-6 mt-4">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">
          © 2026 Symptom Scribe. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-xs">
            Privacy
          </Link>
          <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors text-xs">
            Terms
          </Link>
          <Link to="/disclaimer" className="text-muted-foreground hover:text-primary transition-colors text-xs">
            Disclaimer
          </Link>
          <Link to="/accessibility" className="text-muted-foreground hover:text-primary transition-colors text-xs">
            Accessibility
          </Link>
        </div>
      </div>
      
      {/* Medical Disclaimer - Subtle */}
      <div className="text-center mt-6 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-2 flex-wrap">
          <AlertCircle className="w-3 h-3" />
          <span>{t("home.footerDisclaimer")}</span>
          <Heart className="w-3 h-3" />
        </p>
      </div>
    </div>
  </div>
</footer>
      <BackToTop />
    </div>
  );
};

export default Index;
