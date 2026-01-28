"""
Monte Carlo Simulation for Damages/Valuation Uncertainty
For quantifying uncertainty in legal damages, settlement negotiations

Input Data (financialData):
- base_value: Central estimate of value/damages
- variables: Array of uncertain variables, each with:
  - name: Variable identifier
  - distribution: 'normal', 'uniform', 'triangular', 'lognormal'
  - params: Distribution parameters (varies by distribution type)
  - impact_type: 'multiplicative' or 'additive'

Parameters:
- iterations: Number of simulations (default: 10000)
- seed: Random seed for reproducibility (optional)
- confidence_levels: Array of percentiles to report (default: [0.05, 0.25, 0.50, 0.75, 0.95])
"""

import json
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
import io
import base64

def calculate_monte_carlo(data, params):
    base_value = data.get('base_value')
    variables = data.get('variables', [])

    if base_value is None:
        raise ValueError("Base value required")

    # Parameters
    n_iterations = params.get('iterations', 10000)
    seed = params.get('seed')
    conf_levels = params.get('confidence_levels', [0.05, 0.25, 0.50, 0.75, 0.95])

    if seed is not None:
        np.random.seed(seed)

    # Generate samples for each variable
    simulated_values = np.full(n_iterations, float(base_value))
    variable_samples = {}

    for var in variables:
        name = var.get('name', 'unnamed')
        dist_type = var.get('distribution', 'normal')
        dist_params = var.get('params', {})
        impact_type = var.get('impact_type', 'multiplicative')

        # Generate samples based on distribution
        if dist_type == 'normal':
            mean = dist_params.get('mean', 1.0)
            std = dist_params.get('std', 0.1)
            samples = np.random.normal(mean, std, n_iterations)

        elif dist_type == 'uniform':
            low = dist_params.get('low', 0.8)
            high = dist_params.get('high', 1.2)
            samples = np.random.uniform(low, high, n_iterations)

        elif dist_type == 'triangular':
            low = dist_params.get('low', 0.8)
            mode = dist_params.get('mode', 1.0)
            high = dist_params.get('high', 1.2)
            samples = np.random.triangular(low, mode, high, n_iterations)

        elif dist_type == 'lognormal':
            mean = dist_params.get('mean', 0)
            sigma = dist_params.get('sigma', 0.2)
            samples = np.random.lognormal(mean, sigma, n_iterations)

        else:
            raise ValueError(f"Unknown distribution: {dist_type}")

        variable_samples[name] = samples

        # Apply impact
        if impact_type == 'multiplicative':
            simulated_values = simulated_values * samples
        else:  # additive
            simulated_values = simulated_values + samples

    # Calculate statistics
    mean_value = np.mean(simulated_values)
    std_value = np.std(simulated_values)
    percentiles = {f'p{int(p*100)}': float(np.percentile(simulated_values, p*100))
                   for p in conf_levels}

    # Value at Risk style metrics
    var_5 = np.percentile(simulated_values, 5)  # 5th percentile (downside)
    var_95 = np.percentile(simulated_values, 95)  # 95th percentile (upside)

    # Probability of exceeding thresholds
    prob_positive = np.mean(simulated_values > 0) * 100
    prob_exceed_base = np.mean(simulated_values > base_value) * 100

    # Variable sensitivity (correlation with output)
    sensitivities = {}
    for name, samples in variable_samples.items():
        corr = np.corrcoef(samples, simulated_values)[0, 1]
        sensitivities[name] = {
            'correlation': float(corr),
            'impact_rank': None  # Filled below
        }

    # Rank by absolute correlation
    ranked = sorted(sensitivities.items(), key=lambda x: abs(x[1]['correlation']), reverse=True)
    for rank, (name, _) in enumerate(ranked, 1):
        sensitivities[name]['impact_rank'] = rank

    # Histogram bins for output
    hist, bin_edges = np.histogram(simulated_values, bins=50)
    histogram_data = {
        'counts': hist.tolist(),
        'bin_edges': bin_edges.tolist()
    }

    return {
        'mean': float(mean_value),
        'std': float(std_value),
        'cv': float(std_value / mean_value) if mean_value != 0 else None,
        'min': float(np.min(simulated_values)),
        'max': float(np.max(simulated_values)),
        'percentiles': percentiles,
        'confidence_interval_90': {
            'lower': float(var_5),
            'upper': float(var_95)
        },
        'probability': {
            'positive': float(prob_positive),
            'exceeds_base': float(prob_exceed_base)
        },
        'sensitivities': sensitivities,
        'histogram': histogram_data,
        'simulation_params': {
            'iterations': n_iterations,
            'seed': seed,
            'base_value': base_value,
            'num_variables': len(variables)
        },
        'methodology': f'Monte Carlo simulation with {n_iterations:,} iterations, '
                      f'{len(variables)} uncertain variables'
    }

def generate_charts(data, result):
    charts = []

    # Chart 1: Distribution Histogram
    fig, ax = plt.subplots(figsize=(12, 6))

    hist_data = result['histogram']
    bin_centers = [(hist_data['bin_edges'][i] + hist_data['bin_edges'][i+1])/2
                   for i in range(len(hist_data['counts']))]

    ax.bar(bin_centers, hist_data['counts'],
           width=(hist_data['bin_edges'][1] - hist_data['bin_edges'][0]) * 0.9,
           color='steelblue', alpha=0.7, edgecolor='white')

    # Add key statistics lines
    ax.axvline(x=result['mean'], color='red', linestyle='-', linewidth=2, label=f"Mean: ${result['mean']:,.0f}")
    ax.axvline(x=result['percentiles']['p5'], color='orange', linestyle='--',
               label=f"5th %ile: ${result['percentiles']['p5']:,.0f}")
    ax.axvline(x=result['percentiles']['p95'], color='green', linestyle='--',
               label=f"95th %ile: ${result['percentiles']['p95']:,.0f}")
    ax.axvline(x=data.get('base_value', 0), color='purple', linestyle=':', linewidth=2,
               label=f"Base: ${data.get('base_value', 0):,.0f}")

    ax.set_xlabel('Value ($)')
    ax.set_ylabel('Frequency')
    ax.set_title('Monte Carlo Simulation Results Distribution')
    ax.legend(loc='upper right')
    ax.grid(True, alpha=0.3)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'distribution',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    # Chart 2: Sensitivity Tornado
    if result['sensitivities']:
        fig, ax = plt.subplots(figsize=(10, max(4, len(result['sensitivities']) * 0.5)))

        sorted_sens = sorted(result['sensitivities'].items(),
                            key=lambda x: abs(x[1]['correlation']), reverse=True)
        names = [s[0] for s in sorted_sens]
        correlations = [s[1]['correlation'] for s in sorted_sens]
        colors = ['green' if c > 0 else 'red' for c in correlations]

        y_pos = np.arange(len(names))
        ax.barh(y_pos, correlations, color=colors, alpha=0.7)
        ax.set_yticks(y_pos)
        ax.set_yticklabels(names)
        ax.set_xlabel('Correlation with Output')
        ax.set_title('Variable Sensitivity (Tornado Chart)')
        ax.axvline(x=0, color='black', linestyle='-', linewidth=0.5)
        ax.set_xlim(-1, 1)

        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        charts.append({
            'name': 'tornado',
            'data': base64.b64encode(buf.read()).decode('utf-8')
        })
        plt.close()

    return charts

# Main execution
if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')

    result = calculate_monte_carlo(data, params)
    charts = generate_charts(data, result)
    result['charts'] = charts

    print(json.dumps(result))
