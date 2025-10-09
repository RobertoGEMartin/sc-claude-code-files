// Utility functions for D3 charts and common functionality

// Format numbers for display
const formatters = {
    currency: d3.format('$,.0f'),
    currencyDecimal: d3.format('$,.2f'),
    number: d3.format(','),
    percentage: d3.format('.1%'),
    decimal: d3.format('.1f')
};

// Chart dimensions and margins
const CHART_CONFIG = {
    margins: {
        top: 20,
        right: 30,
        bottom: 40,
        left: 60
    },
    dimensions: {
        width: 400,
        height: 300
    },
    animation: {
        duration: 800,
        ease: d3.easeCubicOut
    }
};

// Color scales
const colorSchemes = {
    primary: ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'],
    reviews: ['#ef4444', '#fb923c', '#f59e0b', '#a3e635', '#10b981'],
    sequential: d3.interpolateBlues,
    diverging: d3.interpolateRdYlBu
};

// Tooltip utility
class Tooltip {
    constructor() {
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'd3-tooltip')
            .style('opacity', 0);
    }

    show(content, event) {
        this.tooltip
            .html(content)
            .style('opacity', 1)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }

    hide() {
        this.tooltip.style('opacity', 0);
    }

    destroy() {
        this.tooltip.remove();
    }
}

// Create responsive SVG
function createResponsiveSvg(container, width, height, margins) {
    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width + margins.left + margins.right} ${height + margins.top + margins.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('height', 'auto');

    const g = svg.append('g')
        .attr('transform', `translate(${margins.left},${margins.top})`);

    return { svg, g, width, height };
}

// Animate number counter
function animateNumber(element, start, end, duration = 1000, formatter = d3.format(',')) {
    const interpolator = d3.interpolateNumber(start, end);
    
    d3.select(element)
        .transition()
        .duration(duration)
        .ease(d3.easeCubicOut)
        .tween('text', function() {
            return function(t) {
                this.textContent = formatter(interpolator(t));
            };
        });
}

// Get theme-aware colors
function getThemeColors() {
    const isDark = document.body.classList.contains('theme-dark');
    const computedStyle = getComputedStyle(document.body);
    
    return {
        primary: computedStyle.getPropertyValue('--chart-primary').trim(),
        secondary: computedStyle.getPropertyValue('--chart-secondary').trim(),
        tertiary: computedStyle.getPropertyValue('--chart-tertiary').trim(),
        accent: computedStyle.getPropertyValue('--chart-accent').trim(),
        success: computedStyle.getPropertyValue('--chart-success').trim(),
        error: computedStyle.getPropertyValue('--chart-error').trim(),
        text: computedStyle.getPropertyValue('--text-color').trim(),
        textSecondary: computedStyle.getPropertyValue('--text-secondary').trim(),
        background: computedStyle.getPropertyValue('--bg-color').trim(),
        grid: computedStyle.getPropertyValue('--chart-grid').trim()
    };
}

// Data loading utility
async function loadData(filename) {
    try {
        const response = await fetch(`data/${filename}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        return null;
    }
}

// Error message display
function showError(container, message) {
    d3.select(container)
        .selectAll('*')
        .remove();
        
    d3.select(container)
        .append('div')
        .attr('class', 'error-message')
        .style('text-align', 'center')
        .style('color', 'var(--error-color)')
        .style('padding', '2rem')
        .html(`
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⚠️</div>
            <div>${message}</div>
        `);
}

// Loading spinner
function showLoading(container) {
    d3.select(container)
        .selectAll('*')
        .remove();
        
    d3.select(container)
        .append('div')
        .attr('class', 'loading-message')
        .style('text-align', 'center')
        .style('color', 'var(--text-secondary)')
        .style('padding', '2rem')
        .html(`
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⏳</div>
            <div>Cargando datos...</div>
        `);
}

// Debounce utility for resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Window resize handler for charts
function setupResizeHandler(charts) {
    const debouncedResize = debounce(() => {
        charts.forEach(chart => {
            if (typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }, 250);
    
    window.addEventListener('resize', debouncedResize);
}

// Theme toggle utility
function toggleTheme() {
    const body = document.body;
    const isLight = body.classList.contains('theme-light');
    
    if (isLight) {
        body.classList.remove('theme-light');
        body.classList.add('theme-dark');
        localStorage.setItem('theme', 'dark');
        document.getElementById('theme-toggle').textContent = '☀️ Modo Claro';
    } else {
        body.classList.remove('theme-dark');
        body.classList.add('theme-light');
        localStorage.setItem('theme', 'light');
        document.getElementById('theme-toggle').textContent = '🌙 Modo Oscuro';
    }
    
    // Trigger custom event for charts to update
    window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: isLight ? 'dark' : 'light' }
    }));
}

// Initialize theme from localStorage
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
    }
}

// Date utilities
function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

// Export utilities
window.ChartUtils = {
    formatters,
    CHART_CONFIG,
    colorSchemes,
    Tooltip,
    createResponsiveSvg,
    animateNumber,
    getThemeColors,
    loadData,
    showError,
    showLoading,
    debounce,
    setupResizeHandler,
    toggleTheme,
    initializeTheme,
    formatDate
};