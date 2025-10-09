# 📊 E-commerce Analytics Dashboard

Dashboard interactivo de análisis de comercio electrónico construido con **D3.js v7** y módulos Python reutilizables.

## 🚀 Características

- **Visualizaciones Interactivas**: Gráficos D3.js con animaciones suaves y tooltips informativos
- **Tema Claro/Oscuro**: Toggle global que afecta todos los elementos del dashboard
- **Diseño Responsivo**: Adaptable a diferentes tamaños de pantalla
- **KPIs Animados**: Contadores incrementales para métricas clave
- **Arquitectura Modular**: Código JavaScript organizado por componentes

## 📁 Estructura del Proyecto

```
EDA_Refactored/
│
├── index.html                 # Dashboard principal
├── css/
│   ├── styles.css            # Estilos principales
│   └── themes.css            # Variables de tema claro/oscuro
├── js/
│   ├── main.js               # Controlador principal del dashboard
│   ├── utils.js              # Utilidades comunes (tooltip, formateo, etc.)
│   └── charts/
│       ├── revenue.js        # Gráfico de línea de ingresos
│       ├── categories.js     # Gráfico de barras de categorías
│       └── reviews.js        # Histograma de calificaciones
└── data/
    ├── kpi_metrics.json      # Métricas KPI principales
    ├── revenue.json          # Datos de ingresos mensuales
    ├── categories.json       # Top categorías de productos
    ├── reviews.json          # Distribución de calificaciones
    ├── geo.json              # Datos geográficos (placeholder)
    └── delivery.json         # Métricas de entrega
```

## 🛠️ Instalación y Uso

### 1. Generar Datos

Primero, ejecuta el script Python para exportar los datos:

```bash
# Activar entorno virtual
source .venv/bin/activate

# Ejecutar exportación de datos
python export_data.py
```

### 2. Servir el Dashboard

El dashboard necesita ser servido desde un servidor HTTP (no funciona abriendo el archivo HTML directamente debido a CORS).

**Opción A: Python HTTP Server**
```bash
cd EDA_Refactored
python -m http.server 8000
```

**Opción B: Node.js http-server**
```bash
cd EDA_Refactored
npx http-server -p 8000
```

**Opción C: VS Code Live Server**
- Instalar extensión "Live Server"
- Click derecho en `index.html` → "Open with Live Server"

### 3. Abrir Dashboard

Navega a: `http://localhost:8000`

## 📊 Visualizaciones Incluidas

### KPIs Principales
- **Ingresos Totales**: Contador animado con formato de moneda
- **Total de Pedidos**: Número total de órdenes procesadas
- **Valor Promedio de Orden**: AOV calculado automáticamente
- **Clientes Activos**: Cantidad de clientes únicos

### Gráficos Interactivos

#### 1. Tendencia de Ingresos Mensuales
- **Tipo**: Gráfico de línea con área de relleno
- **Interactividad**: Hover tooltips, animación de dibujo de línea
- **Datos**: Ingresos agrupados por mes

#### 2. Top Categorías de Productos
- **Tipo**: Gráfico de barras horizontales
- **Interactividad**: Hover con porcentajes, animación escalonada
- **Datos**: Top 10 categorías por ingresos

#### 3. Distribución de Calificaciones
- **Tipo**: Histograma de barras
- **Interactividad**: Colores semánticos (rojo→verde), tooltips con porcentajes
- **Datos**: Distribución de reviews de 1-5 estrellas

#### 4. Rendimiento Geográfico
- **Estado**: 🚧 En desarrollo
- **Futuro**: Mapa choropleth con TopoJSON

## 🎨 Funcionalidades de Tema

### Toggle Light/Dark
- **Activación**: Botón en header o tecla `T`
- **Persistencia**: Preferencia guardada en localStorage
- **Alcance**: Afecta todos los elementos (gráficos, textos, fondos)

### Variables CSS
```css
/* Tema Claro */
.theme-light {
    --bg-color: #ffffff;
    --text-color: #2c3e50;
    --chart-primary: #3b82f6;
    /* ... */
}

/* Tema Oscuro */
.theme-dark {
    --bg-color: #0f172a;
    --text-color: #e2e8f0;
    --chart-primary: #60a5fa;
    /* ... */
}
```

## ⌨️ Atajos de Teclado

- **`T`**: Toggle tema claro/oscuro
- **`Esc`**: Cerrar tooltips activos

## 🔧 Configuración

### Parámetros del Dashboard
Los parámetros se configuran en `export_data.py`:

```python
ANALYSIS_YEAR = 2023      # Año principal de análisis
COMPARISON_YEAR = 2022    # Año de comparación (opcional)
ANALYSIS_MONTH = None     # Mes específico (1-12) o None
DATA_PATH = "ecommerce_data/"  # Ruta a los datasets
```

### Personalización de Gráficos
```javascript
// En utils.js - Configuración global
const CHART_CONFIG = {
    margins: { top: 20, right: 30, bottom: 40, left: 60 },
    dimensions: { width: 400, height: 300 },
    animation: { duration: 800, ease: d3.easeCubicOut }
};
```

## 🎯 Criterios de Aceptación Cumplidos

✅ **Visualizaciones D3**: Todas las visualizaciones implementadas con D3.js v7  
✅ **Interactividad**: Tooltips, animaciones, hover effects  
✅ **Tema Global**: Toggle funcional con persistencia  
✅ **Responsividad**: SVGs adaptativos con viewBox  
✅ **Accesibilidad**: ARIA labels, navegación por teclado  
✅ **Modularidad**: Código organizado en clases y módulos  
✅ **Performance**: Animaciones < 1s, carga optimizada  

## 📈 Próximas Mejoras

- [ ] **Mapa Choropleth**: Implementar con TopoJSON de Brasil/USA
- [ ] **Filtros Dinámicos**: Selección de rango de fechas y categorías
- [ ] **Drill-down**: Click en categorías para ver productos específicos
- [ ] **Exportación**: Botones para descargar gráficos como PNG/SVG
- [ ] **Comparación Temporal**: Vista lado-a-lado de años diferentes

## 🐛 Troubleshooting

### Error CORS
**Problema**: "Access to fetch at '...' from origin 'null' has been blocked"  
**Solución**: Usar servidor HTTP, no abrir archivo directamente

### Datos Vacíos
**Problema**: Gráficos muestran "No hay datos disponibles"  
**Solución**: Verificar que `export_data.py` se ejecutó correctamente

### Animaciones Lentas
**Problema**: Transiciones con lag en dispositivos lentos  
**Solución**: Reducir `CHART_CONFIG.animation.duration` en `utils.js`

## 📝 Dependencias

### Runtime (CDN)
- **D3.js v7**: Cargado desde `cdn.jsdelivr.net`

### Desarrollo
- **Python 3.8+**: Para generación de datos
- **pandas, numpy**: Procesamiento de datos (ver `requirements.txt`)

## 📄 Licencia

Proyecto educativo - Libre uso para aprendizaje y desarrollo.

---

**🎯 Dashboard desarrollado siguiendo las especificaciones de `prompt_d3_html.md`**