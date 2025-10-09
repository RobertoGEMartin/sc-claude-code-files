// Main Dashboard Controller
class Dashboard {
    constructor() {
        this.data = {};
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            // Initialize theme
            ChartUtils.initializeTheme();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Show loading state
            this.showLoadingState();
            
            // Load all data
            await this.loadAllData();
            
            // Initialize all components
            this.initializeKPIs();
            this.initializeCharts();
            this.updateMetrics();
            this.updateLastUpdated();
            
            // Setup resize handling
            ChartUtils.setupResizeHandler(Object.values(this.charts));
            
            console.log('✅ Dashboard initialized successfully');
            
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showErrorState(error);
        }
    }

    async loadAllData() {
        console.log('📊 Loading dashboard data...');
        
        const files = [
            'kpi_metrics.json',
            'revenue.json',
            'categories.json',
            'reviews.json',
            'geo.json',
            'delivery.json'
        ];

        const loadPromises = files.map(async file => {
            const key = file.replace('.json', '');
            const data = await ChartUtils.loadData(file);
            this.data[key] = data;
            return { key, data };
        });

        const results = await Promise.allSettled(loadPromises);
        
        // Log results
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const { key, data } = result.value;
                console.log(`✅ Loaded ${key}:`, data ? 'OK' : 'Empty');
            } else {
                console.warn(`⚠️ Failed to load ${files[index]}:`, result.reason);
            }
        });
    }

    showLoadingState() {
        const containers = [
            '#revenue-chart',
            '#categories-chart', 
            '#reviews-chart'
        ];

        containers.forEach(container => {
            ChartUtils.showLoading(container);
        });

        // Show loading for KPIs
        this.updateKPIValues({
            total_revenue: 0,
            total_orders: 0,
            avg_order_value: 0,
            unique_customers: 0
        }, true);
    }

    showErrorState(error) {
        const message = `Error al cargar el dashboard: ${error.message}`;
        
        const containers = [
            '#revenue-chart',
            '#categories-chart', 
            '#reviews-chart'
        ];

        containers.forEach(container => {
            ChartUtils.showError(container, message);
        });
    }

    initializeKPIs() {
        if (!this.data.kpi_metrics) {
            console.warn('⚠️ No KPI metrics data available');
            return;
        }

        // Animate KPI values
        this.updateKPIValues(this.data.kpi_metrics);
    }

    updateKPIValues(metrics, isLoading = false) {
        const kpis = [
            {
                id: 'kpi-revenue-value',
                value: metrics.total_revenue || 0,
                formatter: ChartUtils.formatters.currency,
                changeId: 'kpi-revenue-change'
            },
            {
                id: 'kpi-orders-value',
                value: metrics.total_orders || 0,
                formatter: ChartUtils.formatters.number,
                changeId: 'kpi-orders-change'
            },
            {
                id: 'kpi-aov-value',
                value: metrics.avg_order_value || 0,
                formatter: ChartUtils.formatters.currencyDecimal,
                changeId: 'kpi-aov-change'
            },
            {
                id: 'kpi-customers-value',
                value: metrics.unique_customers || 0,
                formatter: ChartUtils.formatters.number,
                changeId: 'kpi-customers-change'
            }
        ];

        kpis.forEach(kpi => {
            const element = document.getElementById(kpi.id);
            if (element) {
                if (isLoading) {
                    element.textContent = '...';
                } else {
                    ChartUtils.animateNumber(element, 0, kpi.value, 1500, kpi.formatter);
                }
            }

            // Update change indicators
            const changeElement = document.getElementById(kpi.changeId);
            if (changeElement && !isLoading) {
                const change = metrics.revenue_growth_pct || 0;
                changeElement.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
                changeElement.className = `kpi-change ${change >= 0 ? 'positive' : 'negative'}`;
            }
        });
    }

    initializeCharts() {
        // Revenue Chart
        if (this.data.revenue && this.data.revenue.length > 0) {
            this.charts.revenue = new RevenueChart('#revenue-chart', this.data.revenue);
        } else {
            ChartUtils.showError('#revenue-chart', 'No hay datos de ingresos disponibles');
        }

        // Categories Chart
        if (this.data.categories && this.data.categories.length > 0) {
            this.charts.categories = new CategoriesChart('#categories-chart', this.data.categories);
        } else {
            ChartUtils.showError('#categories-chart', 'No hay datos de categorías disponibles');
        }

        // Reviews Chart
        if (this.data.reviews && Object.keys(this.data.reviews).length > 0) {
            this.charts.reviews = new ReviewsChart('#reviews-chart', this.data.reviews);
        } else {
            ChartUtils.showError('#reviews-chart', 'No hay datos de calificaciones disponibles');
        }

        // Geo Chart (placeholder for now)
        const geoContainer = document.querySelector('#geo-chart');
        if (geoContainer && !this.data.geo) {
            // Keep the placeholder message from HTML
            console.log('ℹ️ Geographic chart not implemented yet');
        }
    }

    updateMetrics() {
        // Update bottom metrics
        const metrics = {
            'delivery-time': this.data.delivery?.avg_delivery_days ? 
                `${this.data.delivery.avg_delivery_days.toFixed(1)} días` : '-- días',
            'avg-rating': this.data.reviews?.average_score ? 
                `${this.data.reviews.average_score.toFixed(1)} / 5.0` : '-.- / 5.0',
            'fast-delivery': this.data.kpi_metrics?.fast_delivery_pct ? 
                `${this.data.kpi_metrics.fast_delivery_pct.toFixed(1)}%` : '--%',
            'premium-products': this.data.categories ? 
                this.data.categories.filter(c => c.revenue > 100000).length : '--'
        };

        Object.entries(metrics).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    updateLastUpdated() {
        const element = document.getElementById('last-updated');
        if (element) {
            element.textContent = ChartUtils.formatDate(new Date());
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', ChartUtils.toggleTheme);
        }

        // Year selector
        const yearSelect = document.getElementById('year-select');
        if (yearSelect) {
            yearSelect.addEventListener('change', (event) => {
                this.handleYearChange(event.target.value);
            });
        }

        // Listen for theme changes to update charts
        window.addEventListener('themeChanged', () => {
            console.log('🎨 Theme changed, updating charts...');
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.updateTheme === 'function') {
                    chart.updateTheme();
                }
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (event) => {
            this.handleKeyboard(event);
        });
    }

    handleYearChange(year) {
        console.log(`📅 Year changed to: ${year}`);
        // In a real implementation, this would reload data for the new year
        // For now, just log the change
        // this.loadDataForYear(year);
    }

    handleKeyboard(event) {
        // ESC key to close tooltips
        if (event.key === 'Escape') {
            // Hide any visible tooltips
            d3.selectAll('.d3-tooltip').style('opacity', 0);
        }
        
        // T key to toggle theme
        if (event.key === 't' || event.key === 'T') {
            if (!event.ctrlKey && !event.metaKey) {
                ChartUtils.toggleTheme();
            }
        }
    }

    // Public method to update data (for potential future use)
    async updateData() {
        await this.loadAllData();
        this.initializeKPIs();
        
        // Update existing charts
        Object.entries(this.charts).forEach(([key, chart]) => {
            if (chart && typeof chart.init === 'function') {
                const dataKey = key === 'kpi_metrics' ? 'kpi_metrics' : key;
                chart.data = this.data[dataKey];
                chart.init();
            }
        });
        
        this.updateMetrics();
        this.updateLastUpdated();
    }

    // Cleanup method
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.charts = {};
        this.data = {};
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing E-commerce Analytics Dashboard...');
    window.dashboard = new Dashboard();
});

// Export for potential external use
window.Dashboard = Dashboard;