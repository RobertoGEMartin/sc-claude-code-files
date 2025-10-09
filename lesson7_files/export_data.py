#!/usr/bin/env python3
"""
Export data script for EDA_Refactored HTML dashboard
Exports processed business metrics to JSON files for D3.js consumption
"""

import json
import pandas as pd
import numpy as np
from pathlib import Path
from data_loader import EcommerceDataLoader, load_and_process_data
from business_metrics import BusinessMetricsCalculator

# Configuration
ANALYSIS_YEAR = 2023
COMPARISON_YEAR = 2022
ANALYSIS_MONTH = None
DATA_PATH = "ecommerce_data/"
OUTPUT_DIR = "EDA_Refactored/data"

def to_python_types(data):
    """Convert pandas/numpy types to Python native types for JSON serialization"""
    if isinstance(data, pd.DataFrame):
        return data.to_dict(orient='records')
    elif isinstance(data, pd.Series):
        return data.to_dict()
    elif isinstance(data, np.integer):
        return int(data)
    elif isinstance(data, np.floating):
        return float(data)
    elif isinstance(data, np.ndarray):
        return data.tolist()
    elif isinstance(data, dict):
        return {k: to_python_types(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [to_python_types(item) for item in data]
    else:
        return data

def export_data():
    """Main function to export all required data to JSON files"""
    print("🔄 Loading and processing data...")
    
    # Load data using existing modules
    loader, processed_data = load_and_process_data(DATA_PATH)
    
    # Create sales datasets
    sales_data = loader.create_sales_dataset(
        year_filter=ANALYSIS_YEAR,
        month_filter=ANALYSIS_MONTH,
        status_filter='delivered'
    )
    
    comparison_data = None
    if COMPARISON_YEAR:
        comparison_data = loader.create_sales_dataset(
            year_filter=COMPARISON_YEAR,
            month_filter=ANALYSIS_MONTH,
            status_filter='delivered'
        )
    
    combined_data = sales_data if comparison_data is None else loader.create_sales_dataset(
        month_filter=ANALYSIS_MONTH, 
        status_filter='delivered'
    )
    if comparison_data is not None:
        combined_data = combined_data[combined_data['purchase_year'].isin([ANALYSIS_YEAR, COMPARISON_YEAR])]
    
    # Calculate business metrics
    calc = BusinessMetricsCalculator(combined_data)
    report = calc.generate_comprehensive_report(
        current_year=ANALYSIS_YEAR,
        previous_year=COMPARISON_YEAR
    )
    
    print("📊 Exporting data to JSON files...")
    
    # Ensure output directory exists
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    
    # 1. Export KPI Metrics
    kpi_metrics = {
        'total_orders': report.get('revenue_metrics', {}).get('total_orders', 0),
        'total_revenue': report.get('revenue_metrics', {}).get('total_revenue', 0),
        'avg_order_value': report.get('revenue_metrics', {}).get('average_order_value', 0),
        'revenue_growth_pct': report.get('revenue_metrics', {}).get('revenue_growth_pct', 0),
        'unique_customers': report.get('customer_metrics', {}).get('unique_customers', 0),
        'fast_delivery_pct': report.get('delivery_metrics', {}).get('fast_delivery_percentage', 0)
    }
    
    with open(f"{OUTPUT_DIR}/kpi_metrics.json", 'w', encoding='utf-8') as f:
        json.dump(to_python_types(kpi_metrics), f, ensure_ascii=False, indent=2)
    
    # 2. Export Revenue Monthly Data  
    monthly_trends = report.get('monthly_trends', [])
    if hasattr(monthly_trends, 'to_dict'):  # It's a DataFrame
        monthly_data = monthly_trends.to_dict('records')
        # Add year field for D3 charts
        monthly_mapped = []
        for item in monthly_data:
            monthly_mapped.append({
                'month': item.get('month', 0),
                'revenue': item.get('revenue', 0),
                'year': ANALYSIS_YEAR,
                'orders': item.get('orders', 0)
            })
        monthly_data = monthly_mapped
    else:
        monthly_data = monthly_trends
        
    with open(f"{OUTPUT_DIR}/revenue.json", 'w', encoding='utf-8') as f:
        json.dump(to_python_types(monthly_data), f, ensure_ascii=False, indent=2)
    
    # 3. Export Product Performance (Categories)
    product_perf = report.get('product_performance', {})
    categories_df = product_perf.get('top_categories', [])
    if hasattr(categories_df, 'to_dict'):  # It's a DataFrame
        categories_data = categories_df.head(15).to_dict('records')
        # Map field names for D3 charts
        categories_mapped = []
        for cat in categories_data:
            categories_mapped.append({
                'category': cat.get('product_category_name', ''),
                'revenue': cat.get('total_revenue', 0),
                'orders': cat.get('unique_orders', 0),
                'items_sold': cat.get('items_sold', 0)
            })
        categories_data = categories_mapped
    else:
        categories_data = categories_df[:15] if isinstance(categories_df, list) else []
    
    with open(f"{OUTPUT_DIR}/categories.json", 'w', encoding='utf-8') as f:
        json.dump(to_python_types(categories_data), f, ensure_ascii=False, indent=2)
    
    # 4. Export Review Statistics with score_counts
    customer_satisfaction = report.get('customer_satisfaction', {})
    
    # Generate score_counts from original review data
    reviews_data = combined_data[combined_data['review_score'].notna()]
    score_counts = reviews_data['review_score'].value_counts().to_dict()
    
    # Create reviews structure expected by D3 chart
    reviews_export = {
        'score_counts': score_counts,
        'average_score': customer_satisfaction.get('avg_review_score', 0),
        'total_reviews': customer_satisfaction.get('total_reviews', 0),
        'score_5_percentage': customer_satisfaction.get('score_5_percentage', 0),
        'score_4_plus_percentage': customer_satisfaction.get('score_4_plus_percentage', 0)
    }
    
    with open(f"{OUTPUT_DIR}/reviews.json", 'w', encoding='utf-8') as f:
        json.dump(to_python_types(reviews_export), f, ensure_ascii=False, indent=2)
    
    # 5. Export Geographic Performance
    geo_data = report.get('geographic_performance', [])
    with open(f"{OUTPUT_DIR}/geo.json", 'w', encoding='utf-8') as f:
        json.dump(to_python_types(geo_data), f, ensure_ascii=False, indent=2)
    
    # 6. Export Delivery Statistics
    delivery_stats = report.get('delivery_performance', {})
    with open(f"{OUTPUT_DIR}/delivery.json", 'w', encoding='utf-8') as f:
        json.dump(to_python_types(delivery_stats), f, ensure_ascii=False, indent=2)
    
    # 7. Export Payment Analysis
    payment_analysis = report.get('payment_analysis', {})
    with open(f"{OUTPUT_DIR}/payments.json", 'w', encoding='utf-8') as f:
        json.dump(to_python_types(payment_analysis), f, ensure_ascii=False, indent=2)
    
    # 8. Export Customer Segments
    customer_segments = report.get('customer_segments', {})
    with open(f"{OUTPUT_DIR}/customers.json", 'w', encoding='utf-8') as f:
        json.dump(to_python_types(customer_segments), f, ensure_ascii=False, indent=2)
    
    print("✅ Data export completed successfully!")
    print(f"📁 Files saved to: {OUTPUT_DIR}/")
    print("📋 Generated files:")
    for file in Path(OUTPUT_DIR).glob("*.json"):
        size_kb = file.stat().st_size / 1024
        print(f"  - {file.name} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    export_data()