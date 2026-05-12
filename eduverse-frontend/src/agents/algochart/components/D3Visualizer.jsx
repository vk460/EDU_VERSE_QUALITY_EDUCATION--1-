import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const D3Visualizer = ({ data }) => {
    const svgRef = useRef();
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (!data || !data.steps || data.steps.length === 0) return;

        const render = () => {
            const svg = d3.select(svgRef.current);
            svg.selectAll('*').remove();

            const width = svgRef.current.clientWidth || 600;
            const height = 150;
            const stepData = data.steps[currentStep];

            if (data.type === 'linear') {
                renderLinear(svg, stepData.elements, width, height);
            } else if (data.type === 'tree') {
                renderTree(svg, stepData.root, width, height);
            }
        };

        render();
        window.addEventListener('resize', render);
        return () => window.removeEventListener('resize', render);
    }, [data, currentStep]);

    const renderLinear = (svg, elements, width, height) => {
        const nodeWidth = 60;
        const nodeHeight = 40;
        const spacing = 20;
        const startX = (width - (elements.length * (nodeWidth + spacing) - spacing)) / 2;
        const y = height / 2 - nodeHeight / 2;

        const nodes = svg.selectAll('.node')
            .data(elements)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', (d, i) => `translate(${startX + i * (nodeWidth + spacing)}, ${y})`);

        nodes.append('rect')
            .attr('width', nodeWidth)
            .attr('height', nodeHeight)
            .attr('rx', 5)
            .attr('fill', '#3b82f6')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        nodes.append('text')
            .attr('x', nodeWidth / 2)
            .attr('y', nodeHeight / 2)
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .style('font-weight', 'bold')
            .text(d => d);

        // Arrows
        if (elements.length > 1) {
            svg.append('defs').append('marker')
                .attr('id', 'arrow')
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 8)
                .attr('refY', 0)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', '#94a3b8');

            for (let i = 0; i < elements.length - 1; i++) {
                svg.append('line')
                    .attr('x1', startX + i * (nodeWidth + spacing) + nodeWidth)
                    .attr('y1', height / 2)
                    .attr('x2', startX + (i + 1) * (nodeWidth + spacing))
                    .attr('y2', height / 2)
                    .attr('stroke', '#94a3b8')
                    .attr('stroke-width', 2)
                    .attr('marker-end', 'url(#arrow)');
            }
        }
    };

    const renderTree = (svg, root, width, height) => {
        if (!root) return;

        const treeLayout = d3.tree().size([width - 100, height - 60]);
        const hierarchy = d3.hierarchy(root);
        const treeData = treeLayout(hierarchy);

        const g = svg.append('g').attr('transform', 'translate(50, 20)');

        // Links
        g.selectAll('.link')
            .data(treeData.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y))
            .attr('fill', 'none')
            .attr('stroke', '#94a3b8')
            .attr('stroke-width', 2);

        // Nodes
        const nodes = g.selectAll('.node')
            .data(treeData.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`);

        nodes.append('circle')
            .attr('r', 15)
            .attr('fill', '#3b82f6')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        nodes.append('text')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text(d => d.data.name);
    };

    const nextStep = () => {
        if (currentStep < data.steps.length - 1) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    return (
        <div className="d3-visualizer-container" style={{ margin: '15px 0', border: '1px solid #334155', borderRadius: '8px', background: '#0f172a', padding: '10px' }}>
            <div className="viz-controls" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    Visualizing: {data.concept} (Step {currentStep + 1} of {data.steps.length})
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={prevStep} disabled={currentStep === 0} style={{ padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', opacity: currentStep === 0 ? 0.5 : 1 }}>Prev</button>
                    <button onClick={nextStep} disabled={currentStep === data.steps.length - 1} style={{ padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', opacity: currentStep === data.steps.length - 1 ? 0.5 : 1 }}>Next</button>
                </div>
            </div>
            <svg ref={svgRef} width="100%" height="150" />
            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', marginTop: '10px', fontStyle: 'italic' }}>
                {data.steps[currentStep].description}
            </div>
        </div>
    );
};

export default D3Visualizer;
