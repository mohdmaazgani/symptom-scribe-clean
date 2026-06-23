import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Hero from "@/components/hero/Hero";
import { ArrowRight, Brain, Clock, TrendingUp, Users, Star, CheckCircle2, Heart, Activity, Shield, Menu, X, UserRound, LineChart, ClipboardCheck } from "lucide-react";
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
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      title: "Sign Up & Set Profile",
      desc: "Create your account and set up your health profile with basic information and health goals.",
    },
    {
      num: "02",
      icon: LineChart,
      title: "Track & Analyze",
      desc: "Input your symptoms, track your metrics, and let our AI analyze your health data for insights.",
    },
    {
      num: "03",
      icon: ClipboardCheck,
      title: "Get Recommendations",
      desc: "Receive personalized health recommendations and know when to seek professional care.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">

      <header 
        className={`px-6 py-4 sticky top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm" 
            : "bg-background/0 border-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <h1 
            className="text-2xl font-bold text-primary cursor-pointer transition-opacity hover:opacity-80"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Symptom Scribe🩺
          </h1>

          <div className="hidden md:flex items-center gap-4">
            <AnimatedThemeToggler />
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started
            </Button>
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
                <Button variant="outline" className="w-full justify-center" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button className="w-full justify-center" onClick={() => navigate("/auth")}>
                  Get Started
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <Hero />
      
      {/* Features Section */}
      <section className="container mx-auto py-14 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Comprehensive Health Tracking</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to monitor, analyze, and improve your health in one powerful platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Brain, title: "AI Health Assistant", desc: "Get instant symptom analysis with severity assessment and personalized recommendations" },
              { icon: TrendingUp, title: "Health Analytics", desc: "Track your health metrics with visual analytics and trend analysis over time" },
              { icon: Clock, title: "Complete History", desc: "Maintain detailed records of all consultations and health events in one place" },
              { icon: Shield, title: "Emergency Resources", desc: "Quick access to emergency contacts and critical health information when needed" },
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
      <section className="bg-muted py-20 px-3 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-0.5 rounded-full bg-primary" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <div className="w-10 h-0.5 rounded-full bg-primary" />
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to better health management
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                  className="relative"
                >
                  {index !== howItWorksSteps.length - 1 && (
                    <div className="hidden md:block absolute top-[148px] left-[calc(100%-10px)] w-20 lg:w-24 h-12 z-20 pointer-events-none">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 48" fill="none" aria-hidden="true">
                        <path
                          d="M8 35 C28 6, 72 6, 92 35"
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray="5 7"
                        />
                        <circle cx="8" cy="35" r="5.5" fill="hsl(var(--primary))" />
                        <circle cx="92" cy="35" r="5.5" fill="hsl(var(--primary))" />
                      </svg>
                    </div>
                  )}

                  <div className="relative bg-card rounded-xl border border-border shadow-sm px-4 pt-16 pb-10 min-h-[360px] text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center shadow-lg">
                      {step.num}
                    </div>

                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-10 h-10 text-primary" strokeWidth={2.2} />
                    </div>

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
      <section className="container mx-auto py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Smart Health Tracker</h2>
            <p className="text-muted-foreground text-lg">Powerful features that make health management effortless</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">AI-Powered Insights</h3>
                <p className="text-muted-foreground">
                  Advanced AI algorithms analyze your symptoms and provide evidence-based recommendations instantly
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Comprehensive Tracking</h3>
                <p className="text-muted-foreground">
                  Monitor multiple health metrics including vitals, symptoms, medications, and lifestyle factors
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Privacy & Security</h3>
                <p className="text-muted-foreground">
                  Your health data is encrypted and stored securely with industry-leading security standards
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Brain Games</h3>
                <p className="text-muted-foreground">
                  Engage in cognitive exercises to keep your mind sharp while tracking mental wellness
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Emergency Access</h3>
                <p className="text-muted-foreground">
                  Quick access to emergency numbers and nearby hospitals when every second counts
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Health Education</h3>
                <p className="text-muted-foreground">
                  Access curated health facts and educational content to improve your health literacy
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

          {/* Testimonials Section */}
      <section className="bg-muted py-20 px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Our Users Say</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Join thousands of satisfied users taking control of their health
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Everything you need to know about Smart Health Tracker</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">Is this a replacement for visiting a doctor?</AccordionTrigger>
              <AccordionContent>
                No, Smart Health Tracker is designed to provide general health information and help you understand when to seek professional medical care. It should never replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">How accurate is the AI health analysis?</AccordionTrigger>
              <AccordionContent>
                Our AI is trained on medical knowledge bases and provides evidence-based insights. However, it's designed for educational purposes and preliminary assessment only. The accuracy depends on the quality and completeness of information you provide. For definitive diagnosis, always consult healthcare professionals.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">Is my health data secure and private?</AccordionTrigger>
              <AccordionContent>
                Yes, we take data security seriously. All health data is encrypted both in transit and at rest. We comply with healthcare data protection standards and never share your personal health information with third parties without your explicit consent. You have full control over your data.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">What features are included in the platform?</AccordionTrigger>
              <AccordionContent>
                The platform includes AI-powered symptom analysis, health metrics tracking, consultation history, brain games for cognitive health, emergency resources, health education facts, personalized dashboards, and comprehensive analytics. All features are designed to work together for holistic health management.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">Can I use this for tracking chronic conditions?</AccordionTrigger>
              <AccordionContent>
                Yes, the platform is excellent for tracking chronic conditions over time. You can monitor symptoms, track medications, record vitals, and observe trends. This information can be valuable to share with your healthcare provider. However, always follow your doctor's treatment plan for managing chronic conditions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left">Is there a mobile app available?</AccordionTrigger>
              <AccordionContent>
                Smart Health Tracker is a progressive web application (PWA) that works seamlessly on all devices - desktop, tablet, and mobile. You can access it through your web browser and even add it to your home screen for a native app-like experience. No separate app download required!
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Take Control of Your Health?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already using Smart Health Tracker to monitor their health, 
            understand their symptoms, and make informed decisions about their wellbeing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              Get Started Free
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
      <footer className="border-t border-border bg-gradient-to-b from-background to-muted/30">
  <div className="container mx-auto px-4 py-12">
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
          <li><Link to="/chat" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><Brain className="w-4 h-4" /> AI Symptom Checker</Link></li>
          <li><Link to="/metrics" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Health Metrics</Link></li>
          <li><Link to="/history" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><Clock className="w-4 h-4" /> Consultation History</Link></li>
          <li><Link to="/brain-games" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><Brain className="w-4 h-4" /> Brain Training</Link></li>
        </ul>
      </div>
      
      {/* Resources Column */}
      <div>
        <h4 className="font-semibold mb-4 text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Resources
        </h4>
        <ul className="space-y-3 text-sm">
          <li><Link to="/health-library" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><Heart className="w-4 h-4" /> Health Library</Link></li>
          <li><Link to="/emergency" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><Shield className="w-4 h-4" /> Emergency Guide</Link></li>
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
            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 w-full text-left text-sm"
          >
            <HelpCircle className="w-4 h-4" /> FAQ
          </button>
        </li>
          <li><Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><FileText className="w-4 h-4" /> Blog</Link></li>
        </ul>
      </div>
      
      {/* Legal Column */}
      <div>
        <h4 className="font-semibold mb-4 text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Legal
        </h4>
        <ul className="space-y-3 text-sm">
          <li><Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><Lock className="w-4 h-4" /> Privacy Policy</Link></li>
          <li><Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><FileText className="w-4 h-4" /> Terms of Service</Link></li>
          <li><Link to="/disclaimer" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Medical Disclaimer</Link></li>
          <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><Mail className="w-4 h-4" /> Contact Support</Link></li>
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
          <span>For informational purposes only. Always consult a qualified healthcare provider for medical advice.</span>
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
