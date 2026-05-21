import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Hero from "@/components/Hero";
import { ArrowRight, Brain, Clock, TrendingUp, Users, Star, CheckCircle2, Heart, Activity, Shield, Menu, X } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/AnimatedThemeToggler";
import { BackToTop } from "@/components/BackToTop";

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
      <section className="bg-muted py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Three simple steps to better health management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Sign Up & Set Profile</h3>
              <p className="text-muted-foreground">
                Create your account and set up your health profile with basic information and health goals
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Track & Analyze</h3>
              <p className="text-muted-foreground">
                Input your symptoms, track vitals, and let our AI analyze your health data for insights
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Get Recommendations</h3>
              <p className="text-muted-foreground">
                Receive personalized health recommendations and know when to seek professional care
              </p>
            </div>
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
      <section className="bg-gradient-to-br from-primary via-primary-glow to-secondary py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Our Users Say</h2>
            <p className="text-white/90 text-lg">Join thousands of satisfied users taking control of their health</p>
          </div>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="pt-6">
              <div className="text-center min-h-[200px] flex flex-col justify-center">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white text-lg mb-6 italic">"{testimonials[activeTestimonial].content}"</p>
                <div>
                  <p className="text-white font-bold">{testimonials[activeTestimonial].name}</p>
                  <p className="text-white/80 text-sm">{testimonials[activeTestimonial].role}</p>
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === activeTestimonial ? "bg-white w-8" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto py-20 px-4">
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
      
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Smart Health Tracker
              </h3>
              <p className="text-sm text-muted-foreground">
                Your personal health companion powered by AI
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">AI Analysis</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Health Tracking</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Brain Games</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Emergency Help</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Health Facts</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Feedback</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Symptom Scribe. Empowering smarter health decisions through AI.</p>
          </div>
        </div>
      </footer>
      <BackToTop />
    </div>
  );
};

export default Index;
