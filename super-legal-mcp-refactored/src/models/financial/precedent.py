"""
Precedent Transaction Analysis
Valuation based on historical M&A transaction multiples

Input Data (financialData):
- target: Object with target company financials
  - ltm_revenue: Last twelve months revenue
  - ltm_ebitda: Last twelve months EBITDA
  - ltm_ebit: Last twelve months EBIT (optional)
  - revenue_growth: Revenue growth rate (decimal)
  - ebitda_margin: EBITDA margin (decimal)
- transactions: Array of precedent M&A transactions, each with:
  - announce_date: Announcement date (YYYY-MM-DD)
  - acquirer: Acquirer name
  - target_name: Target company name
  - transaction_value: Total transaction value
  - enterprise_value: Enterprise value of target
  - ltm_revenue: Target LTM revenue at announcement
  - ltm_ebitda: Target LTM EBITDA at announcement
  - ltm_ebit: Target LTM EBIT (optional)
  - deal_type: Strategic, Financial Sponsor, or Other (optional)
  - premium_to_unaffected: Premium paid over unaffected price (decimal, optional)

Parameters:
- use_median: Use median instead of mean (default: true)
- exclude_outliers: Exclude statistical outliers (default: true)
- outlier_threshold: Standard deviations for outlier detection (default: 2.0)
- recency_weight: Apply recency weighting to transactions (default: false)
- years_lookback: How many years back to include (default: 3)
"""

import json
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import io
import base64

def calculate_precedent(data, params):
    target = data.get('target', {})
    transactions = data.get('transactions', [])

    if not target or not transactions:
        raise ValueError("Target and transaction data required")

    # Parameters with defaults
    use_median = params.get('use_median', True)
    exclude_outliers = params.get('exclude_outliers', True)
    outlier_threshold = params.get('outlier_threshold', 2.0)
    recency_weight = params.get('recency_weight', False)
    years_lookback = params.get('years_lookback', 3)

    # Calculate reference date for recency
    today = datetime.now()
    cutoff_date = today - timedelta(days=years_lookback * 365)

    # Process transactions
    txn_analysis = []
    for txn in transactions:
        # Parse date
        try:
            announce_date = datetime.strptime(txn.get('announce_date', '2020-01-01'), '%Y-%m-%d')
        except:
            announce_date = datetime(2020, 1, 1)

        # Skip transactions older than lookback period
        if announce_date < cutoff_date:
            continue

        ev = txn.get('enterprise_value') or txn.get('transaction_value', 0)

        # Calculate multiples
        ev_revenue = ev / txn['ltm_revenue'] if txn.get('ltm_revenue') else None
        ev_ebitda = ev / txn['ltm_ebitda'] if txn.get('ltm_ebitda') else None
        ev_ebit = ev / txn['ltm_ebit'] if txn.get('ltm_ebit') else None

        # Calculate recency weight (more recent = higher weight)
        days_ago = (today - announce_date).days
        weight = 1.0 if not recency_weight else max(0.1, 1.0 - (days_ago / (years_lookback * 365)) * 0.5)

        txn_analysis.append({
            'announce_date': txn.get('announce_date'),
            'acquirer': txn.get('acquirer', 'N/A'),
            'target_name': txn.get('target_name', 'N/A'),
            'enterprise_value': ev,
            'ev_revenue': ev_revenue,
            'ev_ebitda': ev_ebitda,
            'ev_ebit': ev_ebit,
            'deal_type': txn.get('deal_type', 'Strategic'),
            'premium_to_unaffected': txn.get('premium_to_unaffected'),
            'weight': weight
        })

    if not txn_analysis:
        raise ValueError("No valid transactions within lookback period")

    def get_weighted_values(key):
        return [(t[key], t['weight']) for t in txn_analysis if t[key] is not None and t[key] > 0]

    def remove_outliers(values_weights, threshold):
        if len(values_weights) < 3:
            return values_weights
        values = [v for v, w in values_weights]
        mean = np.mean(values)
        std = np.std(values)
        return [(v, w) for v, w in values_weights if abs(v - mean) <= threshold * std]

    def calc_weighted_stats(values_weights, label):
        if not values_weights:
            return {'mean': None, 'median': None, 'weighted_mean': None, 'min': None, 'max': None, 'count': 0}

        if exclude_outliers:
            values_weights = remove_outliers(values_weights, outlier_threshold)

        values = [v for v, w in values_weights]
        weights = [w for v, w in values_weights]

        weighted_mean = np.average(values, weights=weights) if recency_weight else np.mean(values)

        return {
            'mean': float(np.mean(values)),
            'median': float(np.median(values)),
            'weighted_mean': float(weighted_mean),
            'min': float(np.min(values)),
            'max': float(np.max(values)),
            '25th_percentile': float(np.percentile(values, 25)),
            '75th_percentile': float(np.percentile(values, 75)),
            'count': len(values)
        }

    # Calculate statistics for each multiple
    multiples_stats = {
        'ev_revenue': calc_weighted_stats(get_weighted_values('ev_revenue'), 'EV/Revenue'),
        'ev_ebitda': calc_weighted_stats(get_weighted_values('ev_ebitda'), 'EV/EBITDA'),
        'ev_ebit': calc_weighted_stats(get_weighted_values('ev_ebit'), 'EV/EBIT')
    }

    # Calculate premium statistics if available
    premium_values = [(t['premium_to_unaffected'], t['weight']) for t in txn_analysis
                      if t.get('premium_to_unaffected') is not None]
    if premium_values:
        multiples_stats['premium'] = calc_weighted_stats(premium_values, 'Premium')
    else:
        multiples_stats['premium'] = {'mean': None, 'median': None, 'count': 0}

    # Select appropriate statistic based on params
    if recency_weight:
        select_func = 'weighted_mean'
    elif use_median:
        select_func = 'median'
    else:
        select_func = 'mean'

    # Calculate implied valuations for target
    implied_valuations = {}

    if target.get('ltm_revenue') and multiples_stats['ev_revenue'].get(select_func):
        implied_valuations['ev_from_revenue'] = {
            'multiple': multiples_stats['ev_revenue'][select_func],
            'enterprise_value': target['ltm_revenue'] * multiples_stats['ev_revenue'][select_func]
        }

    if target.get('ltm_ebitda') and multiples_stats['ev_ebitda'].get(select_func):
        implied_valuations['ev_from_ebitda'] = {
            'multiple': multiples_stats['ev_ebitda'][select_func],
            'enterprise_value': target['ltm_ebitda'] * multiples_stats['ev_ebitda'][select_func]
        }

    if target.get('ltm_ebit') and multiples_stats['ev_ebit'].get(select_func):
        implied_valuations['ev_from_ebit'] = {
            'multiple': multiples_stats['ev_ebit'][select_func],
            'enterprise_value': target['ltm_ebit'] * multiples_stats['ev_ebit'][select_func]
        }

    # Calculate valuation range
    ev_values = [v['enterprise_value'] for v in implied_valuations.values() if v.get('enterprise_value')]

    if ev_values:
        ev_low = min(ev_values)
        ev_high = max(ev_values)
        ev_midpoint = np.mean(ev_values)

        # Use EBITDA-based 25th/75th percentile for range
        if target.get('ltm_ebitda') and multiples_stats['ev_ebitda']['count'] > 0:
            ev_25th = target['ltm_ebitda'] * multiples_stats['ev_ebitda']['25th_percentile']
            ev_75th = target['ltm_ebitda'] * multiples_stats['ev_ebitda']['75th_percentile']
        else:
            ev_25th = ev_low
            ev_75th = ev_high
    else:
        ev_low = ev_high = ev_midpoint = ev_25th = ev_75th = None

    # Analyze by deal type
    deal_type_analysis = {}
    for deal_type in ['Strategic', 'Financial Sponsor', 'Other']:
        type_txns = [t for t in txn_analysis if t.get('deal_type') == deal_type]
        if type_txns:
            ebitda_multiples = [t['ev_ebitda'] for t in type_txns if t.get('ev_ebitda')]
            deal_type_analysis[deal_type] = {
                'count': len(type_txns),
                'median_ev_ebitda': float(np.median(ebitda_multiples)) if ebitda_multiples else None
            }

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
        'deal_type_analysis': deal_type_analysis,
        'transaction_details': txn_analysis,
        'target_metrics': {
            'ltm_revenue': target.get('ltm_revenue'),
            'ltm_ebitda': target.get('ltm_ebitda'),
            'ltm_ebit': target.get('ltm_ebit'),
            'revenue_growth': target.get('revenue_growth'),
            'ebitda_margin': target.get('ebitda_margin')
        },
        'assumptions': {
            'methodology': select_func,
            'outliers_excluded': exclude_outliers,
            'outlier_threshold': outlier_threshold,
            'recency_weighted': recency_weight,
            'years_lookback': years_lookback,
            'transaction_count': len(txn_analysis)
        },
        'methodology': f'Precedent Transaction Analysis using {len(txn_analysis)} deals, {"recency-weighted " if recency_weight else ""}{"median" if use_median else "mean"} multiples'
    }

def generate_charts(data, result):
    charts = []

    # Chart 1: Transaction Multiples Over Time
    fig, ax = plt.subplots(figsize=(12, 6))

    dates = []
    multiples = []
    sizes = []

    for txn in result['transaction_details']:
        if txn.get('ev_ebitda') and txn.get('announce_date'):
            try:
                date = datetime.strptime(txn['announce_date'], '%Y-%m-%d')
                dates.append(date)
                multiples.append(txn['ev_ebitda'])
                sizes.append(txn.get('enterprise_value', 100) / 10)  # Scale for scatter
            except:
                pass

    if dates and multiples:
        scatter = ax.scatter(dates, multiples, s=100, c='steelblue', alpha=0.7, edgecolors='white')
        ax.axhline(y=result['multiples_statistics']['ev_ebitda']['median'],
                   color='red', linestyle='--', linewidth=2, label='Median')
        ax.set_xlabel('Announcement Date')
        ax.set_ylabel('EV/EBITDA Multiple')
        ax.set_title('Precedent Transaction Multiples Over Time')
        ax.legend()
        plt.xticks(rotation=45)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'multiples_over_time',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    # Chart 2: Valuation Football Field
    fig, ax = plt.subplots(figsize=(10, 6))

    methods = []
    values_low = []
    values_high = []
    values_mid = []

    for method, val in result['implied_valuations'].items():
        if val.get('enterprise_value'):
            methods.append(method.replace('ev_from_', '').upper())
            # Use percentile range for each method
            metric = method.replace('ev_from_', 'ev_')
            stats = result['multiples_statistics'].get(metric, {})
            target_metric_key = 'ltm_' + method.replace('ev_from_', '')
            target_val = result['target_metrics'].get(target_metric_key, 0)

            if stats.get('25th_percentile') and target_val:
                values_low.append(target_val * stats['25th_percentile'])
                values_high.append(target_val * stats['75th_percentile'])
            else:
                values_low.append(val['enterprise_value'] * 0.9)
                values_high.append(val['enterprise_value'] * 1.1)
            values_mid.append(val['enterprise_value'])

    if methods:
        y_pos = range(len(methods))
        ax.barh(y_pos, [h - l for h, l in zip(values_high, values_low)],
                left=values_low, color='steelblue', alpha=0.5)
        ax.scatter(values_mid, y_pos, color='red', s=100, zorder=5, label='Selected Multiple')
        ax.set_yticks(y_pos)
        ax.set_yticklabels(methods)
        ax.set_xlabel('Enterprise Value ($)')
        ax.set_title('Implied Valuation Range by Multiple')
        ax.legend()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'valuation_range',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    return charts

# Main execution
if __name__ == '__main__':
    # Placeholders replaced by handler
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')

    result = calculate_precedent(data, params)
    charts = generate_charts(data, result)
    result['charts'] = charts

    print(json.dumps(result))
