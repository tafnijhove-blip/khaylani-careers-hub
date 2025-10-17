const BackgroundEffect = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Clean gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      {/* Subtle mesh gradient */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-30" />
      
      {/* Minimal floating orbs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-float-slow" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[90px] animate-float-medium" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-0 left-1/3 w-[550px] h-[550px] bg-primary/8 rounded-full blur-[95px] animate-float-slow" style={{ animationDelay: '3s' }} />
      
      {/* Very subtle noise */}
      <div className="absolute inset-0 bg-noise opacity-[0.01]" />
    </div>
  );
};

export default BackgroundEffect;
