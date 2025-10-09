// Main Dashboard Controller
class Dashboard {
    constructor() {
        this.data = {};
        this.filteredData = {};
        this.charts = {};
        this.currentYear = 2023; // Default year
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
            
            // Initialize filtered data with current year
            this.filterDataByYear(this.currentYear);
            
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

        try {
            const loadPromises = files.map(async file => {
                const key = file.replace('.json', '');
                console.log(`🔄 Loading ${file}...`);
                const data = await ChartUtils.loadData(file);
                console.log(`📦 Loaded ${file}:`, data ? 'Success' : 'Failed', data ? `(${Array.isArray(data) ? data.length : Object.keys(data).length} items)` : '');
                this.data[key] = data;
                return { key, data };
            });

            const results = await Promise.allSettled(loadPromises);
            
            // Log results
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const { key, data } = result.value;
                    console.log(`✅ ${key}:`, data ? 'OK' : 'Empty');
                } else {
                    console.error(`❌ Failed to load ${files[index]}:`, result.reason);
                }
            });
            
            console.log('📊 Final data structure:', this.data);
            
        } catch (error) {
            console.error('❌ Error in loadAllData:', error);
            throw error;
        }
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
            '#reviews-chart',
            '#geo-chart'
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
        console.log('🎨 Initializing charts with filtered data:', this.filteredData);
        
        // Revenue Chart
        try {
            if (this.filteredData.revenue && this.filteredData.revenue.length > 0) {
                console.log('📈 Creating revenue chart with', this.filteredData.revenue.length, 'data points');
                this.charts.revenue = new RevenueChart('#revenue-chart', this.filteredData.revenue);
                console.log('✅ Revenue chart created successfully');
            } else {
                console.warn('⚠️ No revenue data available');
                ChartUtils.showError('#revenue-chart', 'No hay datos de ingresos disponibles');
            }
        } catch (error) {
            console.error('❌ Error creating revenue chart:', error);
            ChartUtils.showError('#revenue-chart', 'Error al cargar el gráfico de ingresos');
        }

        // Categories Chart
        try {
            if (this.filteredData.categories && this.filteredData.categories.length > 0) {
                console.log('📊 Creating categories chart with', this.filteredData.categories.length, 'categories');
                this.charts.categories = new CategoriesChart('#categories-chart', this.filteredData.categories);
                console.log('✅ Categories chart created successfully');
            } else {
                console.warn('⚠️ No categories data available');
                ChartUtils.showError('#categories-chart', 'No hay datos de categorías disponibles');
            }
        } catch (error) {
            console.error('❌ Error creating categories chart:', error);
            ChartUtils.showError('#categories-chart', 'Error al cargar el gráfico de categorías');
        }

        // Reviews Chart
        try {
            if (this.filteredData.reviews && Object.keys(this.filteredData.reviews).length > 0) {
                console.log('⭐ Creating reviews chart');
                this.charts.reviews = new ReviewsChart('#reviews-chart', this.filteredData.reviews);
                console.log('✅ Reviews chart created successfully');
            } else {
                console.warn('⚠️ No reviews data available');
                ChartUtils.showError('#reviews-chart', 'No hay datos de calificaciones disponibles');
            }
        } catch (error) {
            console.error('❌ Error creating reviews chart:', error);
            ChartUtils.showError('#reviews-chart', 'Error al cargar el gráfico de calificaciones');
        }

        // Geographic Chart (temporarily disabled for debugging)
        try {
            if (typeof GeoChart !== 'undefined' && this.filteredData.geo && this.filteredData.geo.length > 0) {
                console.log('🗺️ Creating geographic chart');
                this.charts.geo = new GeoChart('#geo-chart', this.filteredData.geo);
                console.log('✅ Geographic chart created successfully');
            } else {
                console.warn('⚠️ Geographic chart disabled or no geo data available');
                ChartUtils.showError('#geo-chart', 'Mapa geográfico temporalmente deshabilitado');
            }
        } catch (error) {
            console.error('❌ Error creating geographic chart:', error);
            ChartUtils.showError('#geo-chart', 'Error al cargar el mapa geográfico');
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
        console.log('🔧 Setting up event listeners...');
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', ChartUtils.toggleTheme);
            console.log('✅ Theme toggle listener added');
        } else {
            console.warn('⚠️ Theme toggle element not found');
        }

        // Year selector - with delay to ensure DOM is ready
        setTimeout(() => {
            const yearSelect = document.getElementById('year-select');
            if (yearSelect) {
                console.log('📅 Year selector found, adding event listener');
                console.log('📅 Current year selector value:', yearSelect.value);
                
                yearSelect.addEventListener('change', (event) => {
                    console.log('📅 Year selector changed:', event.target.value);
                    this.handleYearChange(event.target.value);
                });
                console.log('✅ Year selector event listener added');
            } else {
                console.warn('⚠️ Year selector element not found!');
                console.log('📋 Available elements with ID:', 
                    Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            }
        }, 100);

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
        this.currentYear = parseInt(year);
        
        // Show loading state
        this.showLoadingState();
        
        // Filter data by year and update charts
        try {
            this.filterDataByYear(this.currentYear);
            this.updateChartsWithFilteredData();
            console.log(`✅ Dashboard updated for year ${year}`);
        } catch (error) {
            console.error(`❌ Error updating dashboard for year ${year}:`, error);
            this.showErrorState(error);
        }
    }

    filterDataByYear(year) {
        console.log(`🔍 Filtering data for year: ${year}`);
        
        // Filter revenue data by year
        if (this.data.revenue && Array.isArray(this.data.revenue)) {
            this.filteredData = {
                revenue: this.data.revenue.filter(item => item.year === year),
                categories: this.data.categories || [],
                reviews: this.data.reviews || {},
                geo: this.data.geo || [],
                kpi_metrics: this.data.kpi_metrics || {}
            };
            
            console.log(`📊 Filtered revenue data: ${this.filteredData.revenue.length} records for ${year}`);
            if (this.filteredData.revenue.length > 0) {
                const totalRevenue = this.filteredData.revenue.reduce((sum, item) => sum + item.revenue, 0);
                console.log(`💰 Total revenue for ${year}: $${totalRevenue.toLocaleString()}`);
            }
        } else {
            this.filteredData = { ...this.data };
            console.log('⚠️ No revenue data available for filtering');
        }
    }

    updateChartsWithFilteredData() {
        console.log('🔄 Updating charts with filtered data...');
        
        // Update revenue chart with filtered data
        if (this.charts.revenue && this.filteredData.revenue && this.filteredData.revenue.length > 0) {
            console.log('📈 Updating revenue chart with', this.filteredData.revenue.length, 'data points');
            this.charts.revenue.updateData(this.filteredData.revenue);
        } else {
            console.warn('⚠️ Cannot update revenue chart - no data or chart not initialized');
        }

        // Update KPI metrics based on filtered data
        this.updateKPIsForYear();

        // Note: Categories, reviews, and geo charts typically don't change by year in this dataset
        // but could be extended to filter by year if needed
        
        console.log('✅ Charts updated successfully');
    }

    updateKPIsForYear() {
        if (!this.filteredData.revenue || this.filteredData.revenue.length === 0) {
            console.warn('⚠️ No revenue data for KPI update');
            return;
        }

        // Calculate metrics for the filtered year
        const yearlyMetrics = {
            total_revenue: this.filteredData.revenue.reduce((sum, item) => sum + item.revenue, 0),
            total_orders: this.filteredData.revenue.reduce((sum, item) => sum + item.orders, 0),
            avg_order_value: 0,
            unique_customers: this.data.kpi_metrics?.unique_customers || 0,
            revenue_growth_pct: 0
        };

        // Calculate average order value
        if (yearlyMetrics.total_orders > 0) {
            yearlyMetrics.avg_order_value = yearlyMetrics.total_revenue / yearlyMetrics.total_orders;
        }

        console.log('📊 Updated KPIs for year', this.currentYear, ':', yearlyMetrics);
        
        // Update KPI display
        this.updateKPIValues(yearlyMetrics);
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