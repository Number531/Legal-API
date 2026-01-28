"""
Comparable Company Analysis (Trading Comps)
Market-based valuation using publicly-traded peer multiples

Input Data (financialData):
- target: Object with target company financials
  - ltm_revenue: Last twelve months revenue
  - ltm_ebitda: Last twelve months EBITDA
  - ltm_ebit: Last twelve months EBIT (optional)
  - ntm_revenue: Next twelve months revenue (optional)
  - ntm_ebitda: Next twelve months EBITDA (optional)
  - revenue_growth: Revenue growth rate (decimal)
  - ebitda_margin: EBITDA margin (decimal)
- comparables: Array of comparable companies, each with:
  - ticker: Company ticker
  - name: Company name
  - market_cap: Market capitalization
  - net_debt: Net debt (debt minus cash)
  - ltm_revenue: LTM revenue
  - ltm_ebitda: LTM EBITDA
  - ltm_ebit: LTM EBIT (optional)
  - ntm_revenue: NTM revenue (optional)
  - ntm_ebitda: NTM EBITDA (optional)
  - revenue_growth: Revenue growth rate (decimal)
  - ebitda_margin: EBITDA margin (decimal)

Parameters:
- use_median: Use median instead of mean (default: true)
- exclude_outliers: Exclude statistical outliers (default: true)
- outlier_threshold: Standard deviations for outlier detection (default: 2.0)
"""

import json
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

def calculate_comps(data, params):
    target = data.get('target', {})
    comparables = data.get('comparables', [])

    if not target or not comparables:
        raise ValueError("Target and comparables data required")

    # Parameters with defaults
    use_median = params.get('use_median', True)
    exclude_outliers = params.get('exclude_outliers', True)
    outlier_threshold = params.get('outlier_threshold', 2.0)

    # Calculate multiples for each comparable
    comp_analysis = []
    for comp in comparables:
        enterprise_value = comp.get('market_cap', 0) + comp.get('net_debt', 0)

        # Calculate multiples
        ev_revenue_ltm = enterprise_value / comp['ltm_revenue'] if comp.get('ltm_revenue') else None
        ev_ebitda_ltm = enterprise_value / comp['ltm_ebitda'] if comp.get('ltm_ebitda') else None
        ev_ebit_ltm = enterprise_value / comp['ltm_ebit'] if comp.get('ltm_ebit') else None
        ev_revenue_ntm = enterprise_value / comp['ntm_revenue'] if comp.get('ntm_revenue') else None
        ev_ebitda_ntm = enterprise_value / comp['ntm_ebitda'] if comp.get('ntm_ebitda') else None

        comp_analysis.append({
            'ticker': comp.get('ticker', 'N/A'),
            'name': comp.get('name', 'N/A'),
            'enterprise_value': enterprise_value,
            'ev_revenue_ltm': ev_revenue_ltm,
            'ev_ebitda_ltm': ev_ebitda_ltm,
            'ev_ebit_ltm': ev_ebit_ltm,
            'ev_revenue_ntm': ev_revenue_ntm,
            'ev_ebitda_ntm': ev_ebitda_ntm,
            'revenue_growth': comp.get('revenue_growth'),
            'ebitda_margin': comp.get('ebitda_margin')
        })

    def get_valid_multiples(key):
        return [c[key] for c in comp_analysis if c[key] is not None and c[key] > 0]

    def remove_outliers(values, threshold):
        if len(values) < 3:
            return values
        mean = np.mean(values)
        std = np.std(values)
        return [v for v in values if abs(v - mean) <= threshold * std]

    def calc_stats(values, label):
        if not values:
            return {'mean': None, 'median': None, 'min': None, 'max': None, 'count': 0}
        if exclude_outliers:
            values = remove_outliers(values, outlier_threshold)
        return {
            'mean': float(np.mean(values)),
            'median': float(np.median(values)),
            'min': float(np.min(values)),
            'max': float(np.max(values)),
            'count': len(values)
        }

    # Calculate statistics for each multiple
    multiples_stats = {
        'ev_revenue_ltm': calc_stats(get_valid_multiples('ev_revenue_ltm'), 'EV/Revenue LTM'),
        'ev_ebitda_ltm': calc_stats(get_valid_multiples('ev_ebitda_ltm'), 'EV/EBITDA LTM'),
        'ev_ebit_ltm': calc_stats(get_valid_multiples('ev_ebit_ltm'), 'EV/EBIT LTM'),
        'ev_revenue_ntm': calc_stats(get_valid_multiples('ev_revenue_ntm'), 'EV/Revenue NTM'),
        'ev_ebitda_ntm': calc_stats(get_valid_multiples('ev_ebitda_ntm'), 'EV/EBITDA NTM')
    }

    # Calculate implied valuations for target
    select_func = 'median' if use_median else 'mean'

    implied_valuations = {}

    # LTM Revenue multiple
    if target.get('ltm_revenue') and multiples_stats['ev_revenue_ltm'][select_func]:
        implied_valuations['ev_from_ltm_revenue'] = {
            'multiple': multiples_stats['ev_revenue_ltm'][select_func],
            'enterprise_value': target['ltm_revenue'] * multiples_stats['ev_revenue_ltm'][select_func]
        }

    # LTM EBITDA multiple
    if target.get('ltm_ebitda') and multiples_stats['ev_ebitda_ltm'][select_func]:
        implied_valuations['ev_from_ltm_ebitda'] = {
            'multiple': multiples_stats['ev_ebitda_ltm'][select_func],
            'enterprise_value': target['ltm_ebitda'] * multiples_stats['ev_ebitda_ltm'][select_func]
        }

    # LTM EBIT multiple
    if target.get('ltm_ebit') and multiples_stats['ev_ebit_ltm'][select_func]:
        implied_valuations['ev_from_ltm_ebit'] = {
            'multiple': multiples_stats['ev_ebit_ltm'][select_func],
            'enterprise_value': target['ltm_ebit'] * multiples_stats['ev_ebit_ltm'][select_func]
        }

    # NTM Revenue multiple
    if target.get('ntm_revenue') and multiples_stats['ev_revenue_ntm'][select_func]:
        implied_valuations['ev_from_ntm_revenue'] = {
            'multiple': multiples_stats['ev_revenue_ntm'][select_func],
            'enterprise_value': target['ntm_revenue'] * multiples_stats['ev_revenue_ntm'][select_func]
        }

    # NTM EBITDA multiple
    if target.get('ntm_ebitda') and multiples_stats['ev_ebitda_ntm'][select_func]:
        implied_valuations['ev_from_ntm_ebitda'] = {
            'multiple': multiples_stats['ev_ebitda_ntm'][select_func],
            'enterprise_value': target['ntm_ebitda'] * multiples_stats['ev_ebitda_ntm'][select_func]
        }

    # Calculate valuation range
    ev_values = [v['enterprise_value'] for v in implied_valuations.values() if v.get('enterprise_value')]

    if ev_values:
        ev_low = min(ev_values)
        ev_high = max(ev_values)
        ev_midpoint = np.mean(ev_values)

        # If we have EBITDA as primary, use 25th/75th percentile range
        ebitda_multiples = get_valid_multiples('ev_ebitda_ltm')
        if ebitda_multiples and target.get('ltm_ebitda'):
            if exclude_outliers:
                ebitda_multiples = remove_outliers(ebitda_multiples, outlier_threshold)
            ev_25th = target['ltm_ebitda'] * np.percentile(ebitda_multiples, 25)
            ev_75th = target['ltm_ebitda'] * np.percentile(ebitda_multiples, 75)
        else:
            ev_25th = ev_low
            ev_75th = ev_high
    else:
        ev_low = ev_high = ev_midpoint = ev_25th = ev_75th = None

    return {
        'enterprise_value_range': {
            'low': float(ev_low) if ev_low else None,
            'midpoint': float(ev_midpoint) if ev_midpoint else None,
            'high': float(ev_high) if ev_high else None,
            '25th_percentile': float(ev_25th) if ev_25th else None,
            '75th_percentile': float(ev_75th) if ev_75th else None
        },
        'implied_valuations': implied_valuations,
        'multiples_statistics': multiples_stats,
        'comparable_details': comp_analysis,
        'target_metrics': {
            'ltm_revenue': target.get('ltm_revenue'),
            'ltm_ebitda': target.get('ltm_ebitda'),
            'ltm_ebit': target.get('ltm_ebit'),
            'ntm_revenue': target.get('ntm_revenue'),
            'ntm_ebitda': target.get('ntm_ebitda'),
            'revenue_growth': target.get('revenue_growth'),
            'ebitda_margin': target.get('ebitda_margin')
        },
        'assumptions': {
            'methodology': 'median' if use_median else 'mean',
            'outliers_excluded': exclude_outliers,
            'outlier_threshold': outlier_threshold,
            'comparable_count': len(comparables)
        },
        'methodology': f'Comparable Company Analysis using {len(comparables)} peers, {"median" if use_median else "mean"} multiples'
    }

def generate_charts(data, result):
    charts = []

    # Chart 1: Multiple Comparison (Football Field)
    fig, ax = plt.subplots(figsize=(12, 6))

    multiples_data = []
    labels = []

    for method, val in result['implied_valuations'].items():
        if val.get('enterprise_value'):
            labels.append(method.replace('ev_from_', '').upper())
            multiples_data.append(val['enterprise_value'])

    if multiples_data:
        y_pos = range(len(labels))
        ax.barh(y_pos, multiples_data, color='steelblue', alpha=0.8)
        ax.set_yticks(y_pos)
        ax.set_yticklabels(labels)
        ax.set_xlabel('Enterprise Value ($)')
        ax.set_title('Implied Enterprise Value by Valuation Method')
        ax.axvline(x=result['enterprise_value_range']['midpoint'], color='red',
                   linestyle='--', linewidth=2, label='Midpoint')
        ax.legend()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'valuation_football_field',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    # Chart 2: EV/EBITDA Distribution
    fig, ax = plt.subplots(figsize=(10, 6))

    ebitda_multiples = [c['ev_ebitda_ltm'] for c in result['comparable_details']
                        if c.get('ev_ebitda_ltm') and c['ev_ebitda_ltm'] > 0]

    if ebitda_multiples:
        ax.hist(ebitda_multiples, bins=min(10, len(ebitda_multiples)),
                color='steelblue', alpha=0.7, edgecolor='white')
        ax.axvline(x=np.median(ebitda_multiples), color='red', linestyle='--',
                   linewidth=2, label=f'Median: {np.median(ebitda_multiples):.1f}x')
        ax.axvline(x=np.mean(ebitda_multiples), color='green', linestyle='--',
                   linewidth=2, label=f'Mean: {np.mean(ebitda_multiples):.1f}x')
        ax.set_xlabel('EV/EBITDA Multiple')
        ax.set_ylabel('Count')
        ax.set_title('EV/EBITDA Multiple Distribution')
        ax.legend()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'ebitda_multiple_distribution',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    return charts

# Main execution
if __name__ == '__main__':
    # Placeholders replaced by handler
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')

    result = calculate_comps(data, params)
    charts = generate_charts(data, result)
    result['charts'] = charts

    print(json.dumps(result))
