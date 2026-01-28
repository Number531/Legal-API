"""
Earnout Valuation - Performance-based contingent payments
"""
import json
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

def calculate_earnout(data, params):
    company = data.get('company_name', 'Target')

    # Earnout structure
    metric = data.get('metric', 'EBITDA')  # EBITDA, Revenue, etc.
    targets = data.get('targets', [])  # List of performance targets

    if not targets:
        # Default example structure
        targets = [
            {'threshold': 100, 'payout': 20},
            {'threshold': 120, 'payout': 30},
            {'threshold': 140, 'payout': 40}
        ]

    # Performance assumptions
    base_value = data.get('base_metric_value', 90)
    expected_growth = params.get('expected_growth', 0.10)
    volatility = params.get('volatility', 0.20)
    earnout_period = params.get('earnout_period', 3)  # years
    discount_rate = params.get('discount_rate', 0.12)
    simulations = params.get('simulations', 10000)

    np.random.seed(42)

    # Monte Carlo simulation of performance
    payouts_by_year = []
    all_performance = []

    for year in range(1, earnout_period + 1):
        # Simulate performance at end of each year
        drift = (expected_growth - 0.5 * volatility ** 2) * year
        diffusion = volatility * np.sqrt(year) * np.random.randn(simulations)
        simulated_performance = base_value * np.exp(drift + diffusion)

        # Calculate payouts for each simulation
        year_payouts = np.zeros(simulations)
        for t in targets:
            threshold = t.get('threshold', 0)
            payout = t.get('payout', 0)
            cap = t.get('cap', payout)  # Optional cap
            payout_type = t.get('type', 'binary')  # binary, linear, tiered

            if payout_type == 'binary':
                year_payouts += np.where(simulated_performance >= threshold, payout, 0)
            elif payout_type == 'linear':
                # Linear between threshold and cap_threshold
                cap_threshold = t.get('cap_threshold', threshold * 1.5)
                linear_payout = np.clip(
                    (simulated_performance - threshold) / (cap_threshold - threshold) * payout,
                    0, cap
                )
                year_payouts += np.where(simulated_performance >= threshold, linear_payout, 0)

        # Discount to present value
        pv_factor = 1 / ((1 + discount_rate) ** year)
        pv_payouts = year_payouts * pv_factor

        payouts_by_year.append({
            'year': year,
            'mean_performance': float(np.mean(simulated_performance)),
            'median_performance': float(np.median(simulated_performance)),
            'std_performance': float(np.std(simulated_performance)),
            'mean_payout': float(np.mean(year_payouts)),
            'mean_pv_payout': float(np.mean(pv_payouts)),
            'prob_any_payout': float(np.mean(year_payouts > 0)),
            'percentile_10': float(np.percentile(simulated_performance, 10)),
            'percentile_90': float(np.percentile(simulated_performance, 90))
        })

        all_performance.extend(simulated_performance.tolist())

    # Total earnout value
    total_pv = sum(p['mean_pv_payout'] for p in payouts_by_year)
    max_payout = sum(t.get('payout', 0) for t in targets) * earnout_period

    # Risk analysis
    total_prob = np.mean([p['prob_any_payout'] for p in payouts_by_year])

    # Target achievement probabilities
    target_probs = []
    for t in targets:
        threshold = t.get('threshold', 0)
        # Use final year simulation
        final_performance = base_value * np.exp(
            (expected_growth - 0.5 * volatility ** 2) * earnout_period +
            volatility * np.sqrt(earnout_period) * np.random.randn(simulations)
        )
        prob = float(np.mean(final_performance >= threshold))
        target_probs.append({
            'threshold': threshold,
            'payout': t.get('payout', 0),
            'probability': prob,
            'expected_value': prob * t.get('payout', 0)
        })

    return {
        'company': company,
        'metric': metric,
        'structure': {
            'targets': targets,
            'earnout_period_years': earnout_period,
            'base_metric_value': float(base_value)
        },
        'assumptions': {
            'expected_growth': float(expected_growth),
            'volatility': float(volatility),
            'discount_rate': float(discount_rate),
            'simulations': simulations
        },
        'results_by_year': payouts_by_year,
        'target_probabilities': target_probs,
        'valuation': {
            'fair_value': float(total_pv),
            'max_possible_payout': float(max_payout),
            'discount_to_max': float((1 - total_pv / max_payout) * 100) if max_payout > 0 else 0,
            'overall_payout_probability': float(total_prob)
        },
        'methodology': 'Monte Carlo simulation for earnout valuation with performance uncertainty'
    }

def generate_charts(data, result):
    charts = []
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    years_data = result['results_by_year']
    years = [y['year'] for y in years_data]
    mean_perf = [y['mean_performance'] for y in years_data]
    p10 = [y['percentile_10'] for y in years_data]
    p90 = [y['percentile_90'] for y in years_data]

    # Performance projection with confidence bands
    axes[0, 0].plot(years, mean_perf, 'b-o', linewidth=2, label='Expected')
    axes[0, 0].fill_between(years, p10, p90, alpha=0.3, color='blue', label='10th-90th %ile')
    # Add threshold lines
    for t in result['structure']['targets']:
        axes[0, 0].axhline(y=t['threshold'], linestyle='--', alpha=0.5,
                          label=f"Target: {t['threshold']}")
    axes[0, 0].set_title('Performance Projection')
    axes[0, 0].set_xlabel('Year')
    axes[0, 0].set_ylabel(result['metric'])
    axes[0, 0].legend(fontsize=8)

    # Payout by year
    mean_payouts = [y['mean_pv_payout'] for y in years_data]
    axes[0, 1].bar(years, mean_payouts, color='green', alpha=0.7)
    axes[0, 1].set_title('Expected PV Payout by Year')
    axes[0, 1].set_xlabel('Year')
    axes[0, 1].set_ylabel('PV Payout ($M)')

    # Payout probability by target
    targets = result['target_probabilities']
    thresholds = [f"${t['threshold']}" for t in targets]
    probs = [t['probability'] * 100 for t in targets]
    colors = ['green' if p >= 70 else 'orange' if p >= 40 else 'red' for p in probs]
    axes[1, 0].barh(thresholds, probs, color=colors, alpha=0.7)
    axes[1, 0].set_xlim(0, 100)
    axes[1, 0].set_title('Probability of Achieving Targets')
    axes[1, 0].set_xlabel('Probability (%)')
    axes[1, 0].set_ylabel('Target Threshold')

    # Fair value vs max
    val = result['valuation']
    axes[1, 1].bar(['Fair Value', 'Max Payout'], [val['fair_value'], val['max_possible_payout']],
                   color=['steelblue', 'lightblue'], alpha=0.7)
    axes[1, 1].set_title(f"Earnout Value (Discount: {val['discount_to_max']:.1f}%)")
    axes[1, 1].set_ylabel('Value ($M)')

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    charts.append({'name': 'earnout_analysis', 'data': base64.b64encode(buf.read()).decode('utf-8')})
    plt.close()
    return charts

if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')
    result = calculate_earnout(data, params)
    result['charts'] = generate_charts(data, result)
    print(json.dumps(result))
