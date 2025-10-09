// Geographic Map Chart Implementation  
class GeoChart {
    constructor(container, data) {
        this.container = container;
        this.data = data || [];
        this.tooltip = new ChartUtils.Tooltip();
        this.usTopology = null;
        this.init();
    }

    async init() {
        // Clear container
        d3.select(this.container).selectAll('*').remove();
        
        if (!this.data || this.data.length === 0) {
            this.showPlaceholder();
            return;
        }

        // Show loading while fetching topology
        ChartUtils.showLoading(this.container);
        
        try {
            // Load US states topology from a reliable source
            await this.loadTopology();
            this.render();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error loading geographic data:', error);
            this.showError('Error al cargar el mapa geográfico');
        }
    }

    async loadTopology() {
        // Use a simple US states topology from a CDN
        const topologyUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json';
        
        try {
            const response = await fetch(topologyUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.usTopology = await response.json();
        } catch (error) {
            console.warn('Failed to load external topology, using fallback');
            // Create a simple fallback representation
            this.createFallbackMap();
        }
    }

    createFallbackMap() {
        // Simple fallback: create a bar chart by state instead of map
        this.renderStateList();
    }

    render() {
        if (!this.usTopology) {
            this.createFallbackMap();
            return;
        }

        const { margins, dimensions, animation } = ChartUtils.CHART_CONFIG;
        const mapWidth = 600;
        const mapHeight = 400;
        
        // Clear loading message
        d3.select(this.container).selectAll('*').remove();

        const svg = d3.select(this.container)
            .append('svg')
            .attr('viewBox', `0 0 ${mapWidth} ${mapHeight}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '100%')
            .style('height', 'auto');

        // Create projection for US map
        const projection = d3.geoAlbersUsa()
            .scale(700)
            .translate([mapWidth / 2, mapHeight / 2]);

        const path = d3.geoPath().projection(projection);

        // Convert topology to GeoJSON
        const states = topojson.feature(this.usTopology, this.usTopology.objects.states);

        // Create data map for quick lookup
        const dataMap = new Map();
        this.data.forEach(d => {
            dataMap.set(d.state, d);
        });

        // Color scale
        const maxRevenue = d3.max(this.data, d => d.revenue);
        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, maxRevenue]);

        // Draw states
        const statesGroup = svg.append('g').attr('class', 'states');

        statesGroup.selectAll('path')
            .data(states.features)
            .enter().append('path')
            .attr('class', 'state')
            .attr('d', path)
            .style('fill', d => {
                const stateCode = this.getStateCode(d.properties.name);
                const stateData = dataMap.get(stateCode);
                return stateData ? colorScale(stateData.revenue) : '#f0f0f0';
            })
            .style('stroke', 'var(--border-color)')
            .style('stroke-width', 0.5)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                const stateCode = this.getStateCode(d.properties.name);
                const stateData = dataMap.get(stateCode);
                if (stateData) {
                    this.showTooltip(event, stateData, d.properties.name);
                }
            })
            .on('mouseout', () => this.hideTooltip())
            .transition()
            .duration(animation.duration)
            .ease(animation.ease)
            .style('opacity', 1);

        // Add legend
        this.addLegend(svg, colorScale, maxRevenue, mapWidth, mapHeight);
    }

    renderStateList() {
        // Fallback: render as a horizontal bar chart by state
        d3.select(this.container).selectAll('*').remove();
        
        d3.select(this.container)
            .append('div')
            .style('padding', '1rem')
            .html(`
                <h4 style="margin-bottom: 1rem; color: var(--text-color);">
                    📊 Rendimiento por Estado (Gráfico de Barras)
                </h4>
                <div id="state-bars"></div>
            `);

        // Sort data by revenue
        const sortedData = [...this.data].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
        
        const { margins, animation } = ChartUtils.CHART_CONFIG;
        const width = 500;
        const height = 300;

        const svg = d3.select('#state-bars')
            .append('svg')
            .attr('viewBox', `0 0 ${width + margins.left + margins.right} ${height + margins.top + margins.bottom}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '100%');

        const g = svg.append('g')
            .attr('transform', `translate(${margins.left},${margins.top})`);

        // Scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(sortedData, d => d.revenue)])
            .range([0, width]);

        const yScale = d3.scaleBand()
            .domain(sortedData.map(d => d.state))
            .range([0, height])
            .padding(0.1);

        // Bars
        g.selectAll('.state-bar')
            .data(sortedData)
            .enter().append('rect')
            .attr('class', 'state-bar')
            .attr('x', 0)
            .attr('y', d => yScale(d.state))
            .attr('width', 0)
            .attr('height', yScale.bandwidth())
            .style('fill', 'var(--chart-primary)')
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.showTooltip(event, d, d.state))
            .on('mouseout', () => this.hideTooltip())
            .transition()
            .duration(animation.duration)
            .ease(animation.ease)
            .attr('width', d => xScale(d.revenue));

        // Labels
        g.selectAll('.state-label')
            .data(sortedData)
            .enter().append('text')
            .attr('class', 'state-label')
            .attr('x', -5)
            .attr('y', d => yScale(d.state) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .style('text-anchor', 'end')
            .style('fill', 'var(--text-color)')
            .style('font-size', '12px')
            .text(d => d.state);

        // Axis
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(ChartUtils.formatters.currency));
    }

    getStateCode(stateName) {
        // Simple mapping - in a real app, you'd use a complete state name to code mapping
        const stateMapping = {
            'California': 'CA',
            'Texas': 'TX',
            'Florida': 'FL',
            'New York': 'NY',
            'Pennsylvania': 'PA',
            'Illinois': 'IL',
            'Ohio': 'OH',
            'Georgia': 'GA',
            'North Carolina': 'NC',
            'Michigan': 'MI'
        };
        return stateMapping[stateName] || stateName;
    }

    addLegend(svg, colorScale, maxValue, width, height) {
        const legendWidth = 200;
        const legendHeight = 10;
        const legendX = width - legendWidth - 20;
        const legendY = height - 40;

        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${legendX}, ${legendY})`);

        // Gradient definition
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'legend-gradient')
            .attr('x1', '0%')
            .attr('x2', '100%')
            .attr('y1', '0%')
            .attr('y2', '0%');

        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const value = (i / steps) * maxValue;
            gradient.append('stop')
                .attr('offset', `${(i / steps) * 100}%`)
                .attr('stop-color', colorScale(value));
        }

        // Legend rectangle
        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#legend-gradient)')
            .style('stroke', 'var(--border-color)');

        // Legend labels
        legend.append('text')
            .attr('x', 0)
            .attr('y', legendHeight + 15)
            .style('text-anchor', 'start')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '10px')
            .text('$0');

        legend.append('text')
            .attr('x', legendWidth)
            .attr('y', legendHeight + 15)
            .style('text-anchor', 'end')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '10px')
            .text(ChartUtils.formatters.currency(maxValue));

        legend.append('text')
            .attr('x', legendWidth / 2)
            .attr('y', -5)
            .style('text-anchor', 'middle')
            .style('fill', 'var(--text-color)')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .text('Ingresos por Estado');
    }

    showPlaceholder() {
        d3.select(this.container)
            .selectAll('*')
            .remove();
            
        d3.select(this.container)
            .append('div')
            .attr('class', 'placeholder-message')
            .style('text-align', 'center')
            .style('color', 'var(--text-secondary)')
            .style('padding', '3rem 2rem')
            .html(`
                <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
                <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">Mapa Geográfico</div>
                <div>No hay datos geográficos disponibles</div>
            `);
    }

    showError(message) {
        d3.select(this.container)
            .selectAll('*')
            .remove();
            
        d3.select(this.container)
            .append('div')
            .attr('class', 'error-message')
            .style('text-align', 'center')
            .style('color', 'var(--error-color)')
            .style('padding', '2rem')
            .html(`
                <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                <div>${message}</div>
                <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                    Mostrando datos como lista de estados
                </div>
            `);

        // Show fallback after error
        setTimeout(() => this.renderStateList(), 1000);
    }

    showTooltip(event, data, stateName) {
        const content = `
            <div style="font-weight: bold; margin-bottom: 4px;">
                ${stateName || data.state}
            </div>
            <div>Ingresos: ${ChartUtils.formatters.currency(data.revenue)}</div>
            <div>Pedidos: ${ChartUtils.formatters.number(data.orders)}</div>
            <div>AOV: ${ChartUtils.formatters.currencyDecimal(data.avg_order_value)}</div>
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
        d3.select(this.container).selectAll('.state')
            .style('stroke', 'var(--border-color)');
            
        d3.select(this.container).selectAll('.state-label')
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
window.GeoChart = GeoChart;