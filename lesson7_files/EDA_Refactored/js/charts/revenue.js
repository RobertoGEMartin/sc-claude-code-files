// Revenue Chart Implementation
class RevenueChart {
    constructor(container, data) {
        this.container = container;
        this.data = data || [];
        this.tooltip = new ChartUtils.Tooltip();
        this.init();
    }

    init() {
        // Clear container
        d3.select(this.container).selectAll('*').remove();
        
        if (!this.data || this.data.length === 0) {
            ChartUtils.showError(this.container, 'No hay datos de ingresos disponibles');
            return;
        }

        this.render();
        this.setupEventListeners();
    }

    render() {
        const { margins, dimensions, animation } = ChartUtils.CHART_CONFIG;
        const { svg, g, width, height } = ChartUtils.createResponsiveSvg(
            this.container, 
            dimensions.width, 
            dimensions.height, 
            margins
        );

        this.svg = svg;
        this.g = g;
        this.width = width;
        this.height = height;

        // Parse data
        const parseTime = d3.timeParse('%Y-%m');
        const data = this.data.map(d => ({
            ...d,
            date: parseTime(`${d.year || 2023}-${String(d.month).padStart(2, '0')}`),
            revenue: +d.revenue
        }));

        // Scales
        this.xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);

        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.revenue)])
            .nice()
            .range([height, 0]);

        // Line generator
        this.line = d3.line()
            .x(d => this.xScale(d.date))
            .y(d => this.yScale(d.revenue))
            .curve(d3.curveMonotoneX);

        // Area generator (for gradient fill)
        this.area = d3.area()
            .x(d => this.xScale(d.date))
            .y0(height)
            .y1(d => this.yScale(d.revenue))
            .curve(d3.curveMonotoneX);

        // Create gradient
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'revenue-gradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', 0).attr('y1', height)
            .attr('x2', 0).attr('y2', 0);

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', 'var(--chart-primary)')
            .attr('stop-opacity', 0);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', 'var(--chart-primary)')
            .attr('stop-opacity', 0.3);

        // Axes
        const xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d3.timeFormat('%b'));

        const yAxis = d3.axisLeft(this.yScale)
            .tickFormat(ChartUtils.formatters.currency);

        this.g.append('g')
            .attr('class', 'chart-axis x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis);

        this.g.append('g')
            .attr('class', 'chart-axis y-axis')
            .call(yAxis);

        // Add axis labels
        this.g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margins.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '12px')
            .text('Ingresos');

        // Add area
        this.g.append('path')
            .datum(data)
            .attr('class', 'revenue-area')
            .attr('d', this.area)
            .style('fill', 'url(#revenue-gradient)')
            .style('opacity', 0)
            .transition()
            .duration(animation.duration)
            .ease(animation.ease)
            .style('opacity', 1);

        // Add line
        const path = this.g.append('path')
            .datum(data)
            .attr('class', 'revenue-line')
            .attr('d', this.line)
            .style('stroke', 'var(--chart-primary)')
            .style('stroke-width', 3)
            .style('fill', 'none');

        // Animate line drawing
        const totalLength = path.node().getTotalLength();
        path
            .attr('stroke-dasharray', totalLength + ' ' + totalLength)
            .attr('stroke-dashoffset', totalLength)
            .transition()
            .duration(animation.duration)
            .ease(animation.ease)
            .attr('stroke-dashoffset', 0);

        // Add dots
        this.g.selectAll('.dot')
            .data(data)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => this.xScale(d.date))
            .attr('cy', d => this.yScale(d.revenue))
            .attr('r', 0)
            .style('fill', 'var(--chart-primary)')
            .style('stroke', 'var(--bg-color)')
            .style('stroke-width', 2)
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip())
            .transition()
            .delay((d, i) => i * 50)
            .duration(animation.duration)
            .ease(animation.ease)
            .attr('r', 5);
    }

    showTooltip(event, d) {
        const content = `
            <div style="font-weight: bold; margin-bottom: 4px;">
                ${d3.timeFormat('%B %Y')(d.date)}
            </div>
            <div>Ingresos: ${ChartUtils.formatters.currency(d.revenue)}</div>
        `;
        this.tooltip.show(content, event);
    }

    hideTooltip() {
        this.tooltip.hide();
    }

    setupEventListeners() {
        // Listen for theme changes
        window.addEventListener('themeChanged', () => {
            this.updateTheme();
        });
    }

    updateTheme() {
        // Update colors based on current theme
        this.g.selectAll('.revenue-line')
            .style('stroke', 'var(--chart-primary)');
            
        this.g.selectAll('.dot')
            .style('fill', 'var(--chart-primary)')
            .style('stroke', 'var(--bg-color)');
            
        this.g.selectAll('.chart-axis')
            .selectAll('line, path')
            .style('stroke', 'var(--chart-axis)');
            
        this.g.selectAll('.chart-axis text')
            .style('fill', 'var(--chart-axis)');
    }

    resize() {
        // Re-render chart on window resize
        this.init();
    }

    destroy() {
        this.tooltip.destroy();
    }
}

// Export for use in main.js
window.RevenueChart = RevenueChart;