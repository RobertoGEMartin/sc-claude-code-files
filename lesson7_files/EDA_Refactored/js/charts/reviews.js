// Reviews Chart Implementation
class ReviewsChart {
    constructor(container, data) {
        this.container = container;
        this.data = data || {};
        this.tooltip = new ChartUtils.Tooltip();
        this.init();
    }

    init() {
        // Clear container
        d3.select(this.container).selectAll('*').remove();
        
        if (!this.data || !this.data.score_counts) {
            ChartUtils.showError(this.container, 'No hay datos de calificaciones disponibles');
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

        // Convert score_counts object to array
        const data = Object.entries(this.data.score_counts || {})
            .map(([score, count]) => ({
                score: +score,
                count: +count
            }))
            .sort((a, b) => a.score - b.score);

        if (data.length === 0) {
            ChartUtils.showError(this.container, 'No hay datos de distribución de calificaciones');
            return;
        }

        // Scales
        this.xScale = d3.scaleBand()
            .domain(data.map(d => d.score))
            .range([0, width])
            .padding(0.2);

        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .nice()
            .range([height, 0]);

        // Color scale based on review score (red to green)
        this.colorScale = d3.scaleOrdinal()
            .domain([1, 2, 3, 4, 5])
            .range(ChartUtils.colorSchemes.reviews);

        // Axes
        const xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d => `${d} ⭐`);

        const yAxis = d3.axisLeft(this.yScale)
            .tickFormat(ChartUtils.formatters.number);

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
            .attr('x', width / 2)
            .attr('y', height + margins.bottom - 5)
            .style('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '12px')
            .text('Calificación');

        this.g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margins.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '12px')
            .text('Número de Calificaciones');

        // Create bars
        const bars = this.g.selectAll('.review-bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'review-bar')
            .attr('x', d => this.xScale(d.score))
            .attr('width', this.xScale.bandwidth())
            .attr('y', height)
            .attr('height', 0)
            .style('fill', d => this.colorScale(d.score))
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip());

        // Animate bars
        bars.transition()
            .duration(animation.duration)
            .ease(animation.ease)
            .delay((d, i) => i * 100)
            .attr('y', d => this.yScale(d.count))
            .attr('height', d => height - this.yScale(d.count));

        // Add percentage labels on top of bars
        const totalReviews = d3.sum(data, d => d.count);
        this.g.selectAll('.bar-percentage')
            .data(data)
            .enter().append('text')
            .attr('class', 'bar-percentage')
            .attr('x', d => this.xScale(d.score) + this.xScale.bandwidth() / 2)
            .attr('y', height)
            .style('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('opacity', 0)
            .text(d => `${(d.count / totalReviews * 100).toFixed(1)}%`)
            .transition()
            .duration(animation.duration)
            .ease(animation.ease)
            .delay((d, i) => i * 100 + 200)
            .attr('y', d => this.yScale(d.count) - 5)
            .style('opacity', 1);

        // Add summary statistics
        this.addSummaryStats(data, totalReviews);
    }

    addSummaryStats(data, totalReviews) {
        // Calculate average score
        const weightedSum = d3.sum(data, d => d.score * d.count);
        const avgScore = totalReviews > 0 ? (weightedSum / totalReviews).toFixed(1) : 0;
        
        // Add summary text
        const summary = this.g.append('g')
            .attr('class', 'summary-stats')
            .attr('transform', `translate(${this.width - 120}, 20)`);

        summary.append('rect')
            .attr('width', 110)
            .attr('height', 60)
            .attr('rx', 5)
            .style('fill', 'var(--card-bg)')
            .style('stroke', 'var(--border-color)')
            .style('opacity', 0.9);

        summary.append('text')
            .attr('x', 55)
            .attr('y', 15)
            .style('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .text('RESUMEN');

        summary.append('text')
            .attr('x', 55)
            .attr('y', 30)
            .style('text-anchor', 'middle')
            .style('fill', 'var(--text-color)')
            .style('font-size', '12px')
            .text(`Promedio: ${avgScore} ⭐`);

        summary.append('text')
            .attr('x', 55)
            .attr('y', 45)
            .style('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '10px')
            .text(`Total: ${ChartUtils.formatters.number(totalReviews)}`);
    }

    showTooltip(event, d) {
        const totalReviews = d3.sum(Object.values(this.data.score_counts || {}));
        const percentage = totalReviews > 0 ? (d.count / totalReviews * 100).toFixed(1) : 0;
        
        const content = `
            <div style="font-weight: bold; margin-bottom: 4px;">
                ${d.score} Estrella${d.score !== 1 ? 's' : ''}
            </div>
            <div>Cantidad: ${ChartUtils.formatters.number(d.count)}</div>
            <div>Porcentaje: ${percentage}%</div>
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
        this.g.selectAll('.review-bar')
            .style('fill', d => this.colorScale(d.score));
            
        this.g.selectAll('.bar-percentage')
            .style('fill', 'var(--text-secondary)');
            
        this.g.selectAll('.chart-axis')
            .selectAll('line, path')
            .style('stroke', 'var(--chart-axis)');
            
        this.g.selectAll('.chart-axis text')
            .style('fill', 'var(--chart-axis)');

        this.g.selectAll('.summary-stats rect')
            .style('fill', 'var(--card-bg)')
            .style('stroke', 'var(--border-color)');

        this.g.selectAll('.summary-stats text')
            .style('fill', 'var(--text-color)');
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
window.ReviewsChart = ReviewsChart;