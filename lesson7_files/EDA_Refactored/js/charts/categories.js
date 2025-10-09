// Categories Chart Implementation
class CategoriesChart {
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
            ChartUtils.showError(this.container, 'No hay datos de categorías disponibles');
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
            dimensions.height + 60, // Extra space for rotated labels
            { ...margins, bottom: 100 }
        );

        this.svg = svg;
        this.g = g;
        this.width = width;
        this.height = height;

        // Sort and limit data to top 10
        const data = this.data
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Scales
        this.xScale = d3.scaleBand()
            .domain(data.map(d => d.category))
            .range([0, width])
            .padding(0.1);

        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.revenue)])
            .nice()
            .range([height, 0]);

        // Color scale
        this.colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.category))
            .range(ChartUtils.colorSchemes.primary);

        // Axes
        const xAxis = d3.axisBottom(this.xScale);
        const yAxis = d3.axisLeft(this.yScale)
            .tickFormat(ChartUtils.formatters.currency);

        this.g.append('g')
            .attr('class', 'chart-axis x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis)
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)')
            .style('font-size', '11px');

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

        // Create bars
        const bars = this.g.selectAll('.category-bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'category-bar')
            .attr('x', d => this.xScale(d.category))
            .attr('width', this.xScale.bandwidth())
            .attr('y', height)
            .attr('height', 0)
            .style('fill', (d, i) => this.colorScale(d.category))
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip())
            .on('click', (event, d) => this.handleBarClick(d));

        // Animate bars
        bars.transition()
            .duration(animation.duration)
            .ease(animation.ease)
            .delay((d, i) => i * 50)
            .attr('y', d => this.yScale(d.revenue))
            .attr('height', d => height - this.yScale(d.revenue));

        // Add value labels on top of bars
        this.g.selectAll('.bar-label')
            .data(data)
            .enter().append('text')
            .attr('class', 'bar-label')
            .attr('x', d => this.xScale(d.category) + this.xScale.bandwidth() / 2)
            .attr('y', height)
            .style('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '10px')
            .style('opacity', 0)
            .text(d => ChartUtils.formatters.currency(d.revenue / 1000) + 'K')
            .transition()
            .duration(animation.duration)
            .ease(animation.ease)
            .delay((d, i) => i * 50 + 200)
            .attr('y', d => this.yScale(d.revenue) - 5)
            .style('opacity', 1);
    }

    showTooltip(event, d) {
        const totalRevenue = d3.sum(this.data, item => item.revenue);
        const percentage = (d.revenue / totalRevenue * 100).toFixed(1);
        
        const content = `
            <div style="font-weight: bold; margin-bottom: 4px;">
                ${d.category}
            </div>
            <div>Ingresos: ${ChartUtils.formatters.currency(d.revenue)}</div>
            <div>Porcentaje: ${percentage}%</div>
            ${d.orders ? `<div>Pedidos: ${ChartUtils.formatters.number(d.orders)}</div>` : ''}
        `;
        this.tooltip.show(content, event);
    }

    hideTooltip() {
        this.tooltip.hide();
    }

    handleBarClick(d) {
        console.log('Category clicked:', d.category);
        // Could implement filtering or drill-down here
    }

    setupEventListeners() {
        // Listen for theme changes
        window.addEventListener('themeChanged', () => {
            this.updateTheme();
        });
    }

    updateTheme() {
        // Update colors based on current theme
        this.g.selectAll('.category-bar')
            .style('fill', (d, i) => this.colorScale(d.category));
            
        this.g.selectAll('.bar-label')
            .style('fill', 'var(--text-secondary)');
            
        this.g.selectAll('.chart-axis')
            .selectAll('line, path')
            .style('stroke', 'var(--chart-axis)');
            
        this.g.selectAll('.chart-axis text')
            .style('fill', 'var(--chart-axis)');
    }

    updateData(newData, topN = 10) {
        this.data = newData;
        this.render();
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
window.CategoriesChart = CategoriesChart;