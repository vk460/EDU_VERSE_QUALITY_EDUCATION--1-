import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
});

const MermaidChart = ({ chart }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chart && chartRef.current) {
        // Clear previous content
        chartRef.current.innerHTML = '';
        const id = `mermaid-chart-${Math.floor(Math.random() * 10000)}`;
        
        try {
            mermaid.render(id, chart).then(({ svg }) => {
                if (chartRef.current) {
                    chartRef.current.innerHTML = svg;
                }
            });
        } catch (error) {
            console.error('Mermaid rendering failed:', error);
            if (chartRef.current) {
                chartRef.current.innerHTML = `<pre class="error">${error.message}</pre>`;
            }
        }
    }
  }, [chart]);

  return (
    <div className="mermaid-container" style={{ margin: '1rem 0', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '1rem', overflowX: 'auto' }}>
      <div ref={chartRef} className="mermaid" />
    </div>
  );
};

export default MermaidChart;
