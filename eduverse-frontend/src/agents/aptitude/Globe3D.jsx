/* Pure CSS/SVG wireframe globe component */
export default function Globe3D() {
  return (
    <div className="globe-container" style={{ width: 160, height: 160, margin: '0 auto' }}>
      <svg viewBox="0 0 200 200" width="160" height="160" style={{ filter: 'drop-shadow(0 0 15px rgba(0, 229, 255, 0.3))' }}>
        {/* Outer glow circle */}
        <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(0, 229, 255, 0.08)" strokeWidth="30" />
        
        {/* Main sphere outline */}
        <circle cx="100" cy="100" r="60" fill="rgba(0, 229, 255, 0.03)" stroke="rgba(0, 229, 255, 0.5)" strokeWidth="1.2" />
        
        {/* Horizontal latitude lines */}
        <ellipse cx="100" cy="100" rx="60" ry="15" fill="none" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="0.7" />
        <ellipse cx="100" cy="80" rx="55" ry="12" fill="none" stroke="rgba(0, 229, 255, 0.2)" strokeWidth="0.6" />
        <ellipse cx="100" cy="120" rx="55" ry="12" fill="none" stroke="rgba(0, 229, 255, 0.2)" strokeWidth="0.6" />
        <ellipse cx="100" cy="65" rx="42" ry="8" fill="none" stroke="rgba(0, 229, 255, 0.15)" strokeWidth="0.5" />
        <ellipse cx="100" cy="135" rx="42" ry="8" fill="none" stroke="rgba(0, 229, 255, 0.15)" strokeWidth="0.5" />

        {/* Vertical longitude lines */}
        <ellipse cx="100" cy="100" rx="20" ry="60" fill="none" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="0.7" />
        <ellipse cx="100" cy="100" rx="42" ry="60" fill="none" stroke="rgba(0, 229, 255, 0.2)" strokeWidth="0.6" />
        
        {/* Tilted ring */}
        <ellipse cx="100" cy="100" rx="60" ry="30" fill="none" stroke="rgba(0, 229, 255, 0.15)" strokeWidth="0.5"
          transform="rotate(30, 100, 100)" />
        <ellipse cx="100" cy="100" rx="60" ry="30" fill="none" stroke="rgba(0, 229, 255, 0.15)" strokeWidth="0.5"
          transform="rotate(-30, 100, 100)" />

        {/* Center vertical axis */}
        <line x1="100" y1="40" x2="100" y2="160" stroke="rgba(0, 229, 255, 0.18)" strokeWidth="0.5" />
        
        {/* Center horizontal axis */}
        <line x1="40" y1="100" x2="160" y2="100" stroke="rgba(0, 229, 255, 0.18)" strokeWidth="0.5" />

        {/* Small highlight dots */}
        <circle cx="100" cy="40" r="2" fill="rgba(0, 229, 255, 0.5)" />
        <circle cx="100" cy="160" r="2" fill="rgba(0, 229, 255, 0.5)" />
        <circle cx="40" cy="100" r="1.5" fill="rgba(0, 229, 255, 0.4)" />
        <circle cx="160" cy="100" r="1.5" fill="rgba(0, 229, 255, 0.4)" />

        {/* Additional decorative dots on sphere surface */}
        <circle cx="130" cy="80" r="1.5" fill="rgba(0, 229, 255, 0.35)" />
        <circle cx="75" cy="115" r="1.5" fill="rgba(0, 229, 255, 0.35)" />
        <circle cx="115" cy="130" r="1" fill="rgba(0, 229, 255, 0.3)" />
        <circle cx="80" cy="75" r="1" fill="rgba(0, 229, 255, 0.3)" />
      </svg>
    </div>
  );
}
