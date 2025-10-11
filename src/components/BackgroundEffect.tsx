const BackgroundEffect = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-accent-cyan/10" />
      
      {/* Animated mesh gradient overlay */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
      
      {/* Floating orbs */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] animate-float-slow" />
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-accent-cyan/15 rounded-full blur-[100px] animate-float-medium" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-accent-purple/15 rounded-full blur-[110px] animate-float-slow" style={{ animationDelay: '4s' }} />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[90px] animate-float-fast" style={{ animationDelay: '1s' }} />
      
      {/* Subtle noise texture */}
      <div className="absolute inset-0 bg-noise opacity-[0.015]" />
      
      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-radial-fade" />
    </div>
  );
};

export default BackgroundEffect;
