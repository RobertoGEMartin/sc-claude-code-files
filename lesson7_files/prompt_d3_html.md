# Prompt: Generar HTML `EDA_Refactored.html` con Visualizaciones Interactivas en D3.js

## Objetivo General

Crear una versión final del análisis exploratorio (`EDA_Refactored.html`) basada en la lógica de `EDA_Refactored.ipynb`, pero empaquetada como un **dashboard web interactivo** en **HTML + JavaScript (D3.js v7)**.  
El objetivo es mantener la estructura analítica y las métricas existentes, pero con visualizaciones modernas, interactivas, y embebidas en un documento HTML totalmente autosuficiente.

## Motivación

Mejorar la **interactividad, estética y usabilidad** del análisis mediante:

- Animaciones suaves en la carga y actualización de gráficos.  
- Tooltips personalizados con métricas clave.  
- Filtros dinámicos (año / mes) con transiciones visuales.  
- Toggle de tema (Light / Dark) que afecte globalmente el dashboard.  
- Accesibilidad optimizada (atributos ARIA, etiquetas descriptivas, navegación por teclado).

## Datos de Entrada

Reutilizar los mismos módulos Python y datasets del pipeline existente:

- `data_loader.py` → carga y limpieza de datos (`orders`, `order_items`, `products`, `customers`, `reviews`, `payments`).  
- `business_metrics.py` → cálculo de métricas agregadas (revenue, AOV, crecimiento, categorías, geografía, satisfacción, delivery).  

Los datos deben exportarse a JSON (por ejemplo `data/metrics.json`, `data/revenue.json`, `data/reviews.json`) para ser consumidos por D3.

### Parámetros configurables

```python
ANALYSIS_YEAR = 2023
COMPARISON_YEAR = 2022  # Puede ser None
ANALYSIS_MONTH = None    # 1–12 o None
DATA_PATH = "ecommerce_data/"

Estructura del Dashboard EDA_Refactored.html

Header – título principal y selector de rango de fechas.

KPI Row – 4 tarjetas (Total Revenue, Monthly Growth, Average Order Value, Total Orders).

Charts Grid (2x2) – gráficos principales: tendencias, categorías, mapa, reviews.

Bottom Row – tarjetas de métricas complementarias (Delivery Time, Review Score).

Insights y conclusiones – texto analítico con observaciones clave.

Pie de página / Créditos.

Visualizaciones D3.js a Implementar
Gráfico	Descripción	Interactividad	Notas
Línea de ingresos mensuales	Revenue por mes + año comparativo	Hover tooltip, transición al cambiar año/mes	Escala temporal (d3.scaleTime)
Barras top categorías	Top N categorías (ordenadas por revenue)	Hover con porcentaje, animación de reordenamiento	Toggle N (5/10/15)
Mapa choropleth	Revenue por estado o región	Hover + leyenda dinámica + escala cuantitativa	TopoJSON precargado (us-states.json)
Distribución de reviews	Histograma o barras 1–5 estrellas	Tooltip + resaltado por score	Colores semánticos (verde alto, rojo bajo)
Scatter delivery vs review (opcional)	Relación tiempo entrega vs puntuación media	Brushing + filtrado dinámico	Animación de aparición
KPI Cards (SVG/HTML)	Total Revenue, AOV, Growth %, Fast Delivery %	Animación incremental	Colores condicionales según signo
Requisitos Técnicos

D3.js v7 cargado desde CDN:

<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>


Cada gráfico se renderiza dentro de un <div id="viz_xxx"></div> con SVG responsivo (viewBox + preserveAspectRatio).

Todos los datos se cargan dinámicamente desde archivos JSON ubicados en ./data/.

Scripts organizados modularmente: un archivo JS por visualización (charts/revenue.js, charts/categories.js, etc.).

Uso de escalas: d3.scaleLinear, d3.scaleTime, d3.scaleBand, d3.scaleSequential / d3.scaleQuantize.

Transiciones con selection.transition().duration(800).ease(d3.easeCubic).

Estructura de Carpetas Sugerida
EDA_Refactored/
│
├── index.html               # Dashboard principal
├── css/
│   ├── styles.css
│   └── themes.css           # Define .theme-light / .theme-dark
├── js/
│   ├── main.js              # Inicialización, carga de datos, control de tema
│   ├── charts/
│   │   ├── revenue.js
│   │   ├── categories.js
│   │   ├── map.js
│   │   └── reviews.js
│   └── utils.js             # Funciones comunes (tooltip, leyendas, resize)
└── data/
    ├── revenue.json
    ├── categories.json
    ├── reviews.json
    └── geo.json

Tema Claro/Oscuro

Incluir un toggle switch en el header.

Al cambiar de tema, alternar clases theme-light / theme-dark en <body>.

Definir variables CSS (--background, --text-color, --accent) y aplicarlas a todos los elementos D3.

Guardar la preferencia en localStorage.

Accesibilidad

Todos los SVG deben incluir role="img" y aria-label.

Elementos interactivos con tabindex="0" y eventos onfocus equivalentes a onmouseover.

Tooltips con aria-live="polite" para lectura por lectores de pantalla.

Buenas Prácticas de Código JS

Cada gráfico debe implementarse en una función:

function renderRevenueChart(container, data, options) { ... }


Usar const y let (no var).

Encapsular funciones en módulos o IIFEs para evitar contaminación global.

Manejar datasets vacíos o con errores con mensajes claros (No data available).

Centralizar márgenes y tamaños (const MARGINS = {top: 20, right: 30, ...}).

Animaciones

Entrada: transición con easeCubic.

Actualización: uso de data join (.data(newData, d => d.id)).

KPIs: animación numérica con interpolador d3.interpolateNumber.

Choropleth Map

Usar TopoJSON local (data/geo.json) o precargado.

Escala de color: d3.interpolateBlues con normalización por d3.extent.

Leyenda horizontal generada dinámicamente.

Generación de Datos

Los módulos Python (data_loader.py, business_metrics.py) deben exportar los DataFrames finales a JSON antes de generar el HTML:

import pandas as pd

revenue_df.to_json("data/revenue.json", orient="records")
categories_df.to_json("data/categories.json", orient="records")
reviews_df.to_json("data/reviews.json", orient="records")

Recomendaciones Finales

Documentar dependencias en requirements.txt.

Incluir un README.md con instrucciones de ejecución (python -m http.server).

Añadir notas sobre limitaciones (por ejemplo, tamaño de SVGs en pantallas pequeñas).

Validar interactividad y performance en navegadores modernos (Chrome, Firefox, Edge).

Criterios de Aceptación

El archivo EDA_Refactored.html se abre localmente y muestra todos los gráficos sin errores en consola.

Todos los gráficos D3 son interactivos y responsivos.

Toggle Light/Dark Theme funcional.

Accesibilidad básica garantizada.

No requiere conexión a Jupyter ni dependencias de Python en runtime.