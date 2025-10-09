# Prompt: Generar Notebook `EDA_Refactored_v2.ipynb` con Visualizaciones Interactivas en D3.js

## Objetivo General

Crear una nueva versión del cuaderno analítico (`EDA_Refactored_v2.ipynb`) basada en la lógica existente de `EDA_Refactored.ipynb`, pero reemplazando las visualizaciones principales (actualmente matplotlib / seaborn / Plotly) por gráficos interactivos desarrollados **con D3.js v7** directamente incrustados en celdas del notebook mediante HTML + JavaScript.

## Motivación

Mejorar la interactividad, estética y capacidad de exploración de los datos con:

- Animaciones suaves de entrada y actualización.
- Tooltips personalizados con métricas clave.
- Transiciones al cambiar filtros (año / mes).
- Toggle de tema (Light / Dark) que afecte a todos los gráficos.
- Mejor accesibilidad: descripciones ARIA y labels en SVG.

## Datos de Entrada

Usar exactamente el mismo pipeline modular existente:

- `data_loader.py` → carga y procesamiento de datasets (`orders`, `order_items`, `products`, `customers`, `reviews`, `payments`).
- `business_metrics.py` → cálculo de métricas: revenue, AOV, crecimiento, categorías, geografía, satisfacción, delivery.

Parámetros configurables (idénticos a la v1):

```python
ANALYSIS_YEAR = 2023
COMPARISON_YEAR = 2022  # Puede ser None
ANALYSIS_MONTH = None    # 1-12 o None
DATA_PATH = "ecommerce_data/"
```

## Estructura del Nuevo Notebook `EDA_Refactored_v2.ipynb`

1. Introducción y objetivos (markdown)
2. Configuración de parámetros (code)
3. Carga y procesamiento de datos (code)
4. Cálculo de métricas de negocio (code)
5. Panel interactivo de visualizaciones D3 (múltiples celdas híbridas)
6. Insights, recomendaciones y conclusiones (markdown)
7. Apéndice: helpers reutilizables para incrustar D3 (code)

## Visualizaciones a Implementar en D3

| Gráfico | Descripción | Interactividad requerida | Notas |
|---------|-------------|--------------------------|-------|
| Línea de ingresos mensuales | Revenue por mes + línea comparativa año previo | Hover tooltip, resaltado, transición al cambiar año/mes | Escala temporal en eje X |
| Barras top categorías | Top N categorías ordenadas descendente (revenue) | Hover con breakdown %, animación reordenamiento | Opcional toggle N (5/10/15) |
| Mapa choropleth por estado | Revenue por estado | Hover + leyenda dinámica + escala cuantitativa | Usar TopoJSON (USA o BR según dataset) |
| Distribución de reviews | Barras apiladas o histograma 1–5 | Tooltip + resaltado al pasar el puntero | Colores semánticos (verde alto, rojo bajo) |
| Scatter (opcional) delivery vs review | Relación días de entrega vs score promedio | Brushing para filtrar rango | Animación aparición puntos |
| KPI Cards (SVG/HTML) | Total Revenue, AOV, Growth %, Fast Delivery % | Animación contador incremental | Colores depende de signo crecimiento |

## Requisitos Técnicos D3

- D3.js v7 cargado desde CDN fiable (ej: `https://cdn.jsdelivr.net/npm/d3@7`)
- Cada visualización en su propia celda con un `<div id="viz_xxx"></div>` contenedor.
- Código JS en la misma celda (usar triple comillas en Python + `display(HTML(...))` o cell tipo markdown con bloque HTML). Aceptable:

```python
from IPython.display import HTML
HTML('''
<div id="viz_revenue"></div>
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<script>
// JS aquí
</script>
''')
```
- Datos pasados desde pandas → JSON embebido:

```python
import json
revenue_json = revenue_df.to_dict(orient='records')
HTML(f"""
<script>
const revenueData = {json.dumps(revenue_json)};
</script>
""")
```
- Uso de escalas: `d3.scaleLinear`, `d3.scaleTime`, `d3.scaleBand`, `d3.scaleSequential` / `d3.scaleQuantize` para choropleth.
- Responsividad: `viewBox` en SVG y resize listener (`window.onresize`).

## Toggle Light/Dark Theme (Global)
- Insertar un botón o switch en una celda HTML superior.
- Añadir clase CSS al `<body>` o a un `div.wrapper` (`.theme-light` / `.theme-dark`).
- Definir variables CSS para colores base y usarlas en los estilos de los gráficos (fondo, ejes, tooltips).
- Persistir preferencia en `localStorage` (`d3.select('body').classed(...)`).

## Animaciones y Transiciones
- Entrada: `selection.transition().duration(800)` con ease `d3.easeCubic`.
- Actualización (si se cambia año): aplicar data join estándar (`.data(newData, d => d.key)`) y manejar enter/update/exit.
- Para KPIs: contador incremental con interpolador `d3.interpolateNumber` cada vez que cambien los datos.

## Accesibilidad
- Cada SVG con `role="img"` y `aria-label` descriptivo.
- Elementos interactivos (barras, puntos) con `tabindex="0"` y eventos `onfocus` replicando hover.
- Tooltips accesibles (atributo `aria-live="polite"`).

## Mapa Choropleth
- Incluir TopoJSON (definir variable JS con contenido comprimido o cargar vía fetch si se permite red). Si no se permite red externa adicional, preparar instrucción: colocar `us-states.json` o `br-states.json` en carpeta `additional_files/` y cargar con:
```javascript
fetch('additional_files/us-states.json')
  .then(r => r.json())
  .then(topology => { /* render */ });
```
- Escala de color: `d3.interpolateBlues` con normalización por `d3.extent`.
- Leyenda horizontal con rectángulos secuenciales.

## Buenas Prácticas de Código JS
- Encapsular cada visualización en una función `renderRevenueLine(data, opts)`.
- No contaminar el scope global: usar IIFE o módulo simple.
- Validar datos (si array vacío → mensaje fallback dentro del contenedor).
- Evitar números mágicos: centralizar márgenes y dimensiones.

## Sección Helpers en el Notebook
Crear una celda con utilidades Python → JS:
```python
def d3_embed_json(var_name, df):
    import json
    return f"<script>const {var_name} = {json.dumps(df.to_dict(orient='records'))};</script>"
```
Y otra para un mini loader CSS y función estándar de tooltip.

## Gestión de Datos
Generar DataFrames intermedios (revenue mensual, top categorías, métricas reviews, métricas delivery, geo) **antes** de las celdas D3 y exponerlos como JSON.

## KPIs (Ejemplo de Objeto JS)
```javascript
const kpiData = {
  totalRevenue: 3360294.74,
  totalOrders: 4635,
  averageOrderValue: 724.98,
  revenueGrowthPct: -2.5,
  fastDeliveryPct: 28.5
};
```
Animar valores numéricos (formato: abreviar con K / M).

## Recomendaciones Finales
Incluir en markdown final:
- Limitaciones de D3 dentro de Jupyter (posibles conflictos de estilos).
- Posibles mejoras futuras: panel de filtros dinámicos con ipywidgets + D3 re-render.

## Entregable Esperado
Un archivo `EDA_Refactored_v2.ipynb` con:
- Misma narrativa analítica que la versión original.
- Visualizaciones re-implementadas en D3, interactivas y accesibles.
- Código organizado y comentado.
- Toggle de tema funcional.
- Animaciones de entrada y actualización.

## Criterios de Aceptación
- Todas las visualizaciones renderizan sin errores JS en la consola de Jupyter (abrir inspector).
- No se rompe la modularidad (se siguen usando los módulos Python existentes).
- Interactividad fluida (< 1s en redraw tras cambiar parámetros y re-ejecutar célula de datos).
- Accesibilidad mínima (tab focus + aria-labels presentes).

## Extra Opcional
Si se desea incluir un pequeño panel de filtros (año, top N) con `ipywidgets`, debe:
- Regenerar JSON y llamar a una función JS `window.updateCategoryChart(newData)`.

---
**Fin del prompt.**
