import { Activity, Shield, Zap } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-secondary py-16 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 animate-fade-in">
          <Activity className="w-4 h-4 text-white" />
          <span className="text-sm text-white font-medium">AI-Powered Health Analysis</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
          Smart Health Tracker
        </h1>
        
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto animate-fade-in">
          Describe your symptoms and get instant AI-powered insights on possible causes, 
          severity levels, and self-care recommendations.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 animate-fade-in hover-scale">
            <Shield className="w-8 h-8 text-white mb-2 mx-auto" />
            <h3 className="text-white font-semibold mb-1">Private & Secure</h3>
            <p className="text-white/80 text-sm">Your health data stays confidential</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 animate-fade-in hover-scale" style={{ animationDelay: "100ms" }}>
            <Zap className="w-8 h-8 text-white mb-2 mx-auto" />
            <h3 className="text-white font-semibold mb-1">Instant Analysis</h3>
            <p className="text-white/80 text-sm">Get insights in seconds</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 animate-fade-in hover-scale" style={{ animationDelay: "200ms" }}>
            <Activity className="w-8 h-8 text-white mb-2 mx-auto" />
            <h3 className="text-white font-semibold mb-1">Evidence-Based</h3>
            <p className="text-white/80 text-sm">Powered by medical knowledge</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
