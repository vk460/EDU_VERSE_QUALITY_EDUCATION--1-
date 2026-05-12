import LiquidEther from './ui/LiquidEther';

export const HeroBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-[-1]">
      <LiquidEther 
        colors={['#00E5FF', '#dd8bfb', '#060010']}
        mouseForce={25}
        cursorSize={120}
        autoDemo={true}
        autoSpeed={0.3}
      />
      {/* Overlay to ensure readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000]/30 via-transparent to-[#0e0e0e]/80" />
    </div>
  );
};
