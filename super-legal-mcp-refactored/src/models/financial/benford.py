"""
Benford's Law Analysis
Fraud detection using first-digit distribution analysis

Input Data (financialData):
- values: Array of numeric values to analyze (e.g., invoice amounts, payments, revenues)
- data_name: Description of the data being analyzed (optional)

Parameters:
- confidence_level: Confidence level for chi-square test (default: 0.95)
- flag_threshold_percentile: Percentile for flagging suspicious transactions (default: 95)

Output:
- Chi-square test results
- Kolmogorov-Smirnov test results
- Mean Absolute Deviation (MAD) analysis
- Overall fraud risk assessment
- Flagged suspicious values
"""

import json
import numpy as np
from scipy import stats
from scipy.stats import chi2
import matplotlib.pyplot as plt
from collections import Counter
import io
import base64

def extract_first_digit(value):
    """Extract the first significant digit from a number."""
    if value <= 0:
        return None
    # Convert to string and find first non-zero digit
    num_str = str(abs(value)).replace('.', '')
    for char in num_str:
        if char != '0':
            return char
    return None

def calculate_benford(data, params):
    """Perform Benford's Law analysis."""
    values = data.get('values', [])
    data_name = data.get('data_name', 'Financial Data')

    if not values or len(values) < 10:
        raise ValueError("At least 10 values required for Benford's Law analysis")

    # Parameters
    confidence_level = params.get('confidence_level', 0.95)
    flag_threshold = params.get('flag_threshold_percentile', 95)

    # Filter positive values and extract first digits
    positive_values = [v for v in values if v > 0]
    first_digits = [extract_first_digit(v) for v in positive_values]
    first_digits = [d for d in first_digits if d is not None]

    if len(first_digits) < 10:
        raise ValueError("Insufficient valid values after filtering")

    n = len(first_digits)

    # Benford's Law expected frequencies
    benford_expected = {
        '1': 0.301, '2': 0.176, '3': 0.125, '4': 0.097,
        '5': 0.079, '6': 0.067, '7': 0.058, '8': 0.051, '9': 0.046
    }

    # Calculate observed frequencies
    digit_counts = Counter(first_digits)
    observed_freq = {}
    for digit in '123456789':
        count = digit_counts.get(digit, 0)
        observed_freq[digit] = count / n

    # Chi-Square Test
    observed_counts = np.array([digit_counts.get(d, 0) for d in '123456789'])
    expected_counts = np.array([benford_expected[d] * n for d in '123456789'])

    chi2_stat = np.sum((observed_counts - expected_counts) ** 2 / expected_counts)
    df = 8  # 9 digits - 1
    p_value = 1 - chi2.cdf(chi2_stat, df)
    critical_value = chi2.ppf(confidence_level, df)

    chi_square_result = {
        'statistic': float(chi2_stat),
        'p_value': float(p_value),
        'critical_value': float(critical_value),
        'degrees_of_freedom': df,
        'rejects_null': chi2_stat > critical_value,
        'interpretation': 'Data does NOT conform to Benford\'s Law (suspicious)' if chi2_stat > critical_value
                         else 'Data conforms to Benford\'s Law'
    }

    # Kolmogorov-Smirnov Test
    cum_observed = np.cumsum([observed_freq[d] for d in '123456789'])
    cum_expected = np.cumsum([benford_expected[d] for d in '123456789'])
    ks_stat = float(np.max(np.abs(cum_observed - cum_expected)))
    ks_critical = 1.36 / np.sqrt(n)  # α = 0.05

    ks_result = {
        'statistic': ks_stat,
        'critical_value': float(ks_critical),
        'rejects_null': ks_stat > ks_critical,
        'interpretation': 'Data does NOT conform to Benford\'s Law' if ks_stat > ks_critical
                         else 'Data conforms to Benford\'s Law'
    }

    # Mean Absolute Deviation (MAD)
    deviations = [abs(observed_freq[d] - benford_expected[d]) for d in '123456789']
    mad = float(np.mean(deviations))

    # MAD interpretation (Nigrini thresholds)
    if mad < 0.006:
        mad_conformity = 'Close conformity'
        mad_risk = 'VERY LOW'
    elif mad < 0.012:
        mad_conformity = 'Acceptable conformity'
        mad_risk = 'LOW'
    elif mad < 0.015:
        mad_conformity = 'Marginally acceptable'
        mad_risk = 'MODERATE'
    else:
        mad_conformity = 'Nonconformity - INVESTIGATION REQUIRED'
        mad_risk = 'HIGH'

    mad_result = {
        'mad': mad,
        'conformity': mad_conformity,
        'fraud_risk': mad_risk,
        'thresholds': {
            'close': 0.006,
            'acceptable': 0.012,
            'marginal': 0.015
        }
    }

    # Overall fraud risk assessment
    risk_scores = {'VERY LOW': 0, 'LOW': 1, 'MODERATE': 2, 'HIGH': 3}
    chi_risk = 'HIGH' if chi_square_result['rejects_null'] else 'LOW'
    ks_risk = 'HIGH' if ks_result['rejects_null'] else 'LOW'

    risks = [chi_risk, ks_risk, mad_risk]
    max_risk_score = max(risk_scores[r] for r in risks)
    overall_risk = [k for k, v in risk_scores.items() if v == max_risk_score][0]

    # Flag suspicious values (those with over-represented first digits)
    digit_deviations = {}
    for digit in '123456789':
        deviation = observed_freq[digit] - benford_expected[digit]
        digit_deviations[digit] = deviation

    # Flag values whose first digit is significantly over-represented
    flagged_values = []
    threshold_deviation = np.percentile(list(digit_deviations.values()), flag_threshold / 100 * 100)

    for i, value in enumerate(positive_values[:1000]):  # Limit to first 1000 for performance
        fd = extract_first_digit(value)
        if fd and digit_deviations.get(fd, 0) >= threshold_deviation:
            flagged_values.append({
                'index': i,
                'value': float(value),
                'first_digit': fd,
                'digit_deviation': float(digit_deviations[fd])
            })

    # Sort by deviation (most suspicious first)
    flagged_values.sort(key=lambda x: x['digit_deviation'], reverse=True)
    flagged_values = flagged_values[:50]  # Top 50

    return {
        'dataset': data_name,
        'sample_size': n,
        'chi_square_test': chi_square_result,
        'kolmogorov_smirnov_test': ks_result,
        'mean_absolute_deviation': mad_result,
        'overall_fraud_risk': overall_risk,
        'observed_distribution': {d: float(observed_freq[d]) for d in '123456789'},
        'expected_distribution': benford_expected,
        'digit_deviations': {d: float(v) for d, v in digit_deviations.items()},
        'flagged_values': flagged_values,
        'flagged_count': len(flagged_values),
        'recommendation': f'{"RECOMMEND INVESTIGATION: " if overall_risk in ["HIGH", "MODERATE"] else ""}{data_name} shows {"deviation from" if overall_risk in ["HIGH", "MODERATE"] else "conformity to"} Benford\'s Law.',
        'methodology': f'Benford\'s Law analysis on {n:,} values using Chi-square, KS, and MAD tests'
    }

def generate_charts(data, result):
    """Generate visualization charts."""
    charts = []

    # Chart 1: Observed vs Expected Distribution
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    digits = list('123456789')
    observed = [result['observed_distribution'][d] * 100 for d in digits]
    expected = [result['expected_distribution'][d] * 100 for d in digits]

    x = np.arange(len(digits))
    width = 0.35

    ax1.bar(x - width/2, expected, width, label="Benford's Law (Expected)",
            color='steelblue', alpha=0.8)
    ax1.bar(x + width/2, observed, width, label='Observed Data',
            color='coral', alpha=0.8)

    ax1.set_xlabel('First Digit')
    ax1.set_ylabel('Frequency (%)')
    ax1.set_title(f"Benford's Law Analysis: {result['dataset']}")
    ax1.set_xticks(x)
    ax1.set_xticklabels(digits)
    ax1.legend()
    ax1.grid(axis='y', alpha=0.3)

    # Add statistics text
    stats_text = (
        f"Sample Size: {result['sample_size']:,}\n"
        f"Chi-Square: {result['chi_square_test']['statistic']:.2f} (p={result['chi_square_test']['p_value']:.4f})\n"
        f"MAD: {result['mean_absolute_deviation']['mad']:.4f}\n"
        f"Risk: {result['overall_fraud_risk']}"
    )
    ax1.text(0.02, 0.98, stats_text, transform=ax1.transAxes, fontsize=9,
             verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

    # Chart 2: Deviation from Expected
    deviations = [result['digit_deviations'][d] * 100 for d in digits]
    colors = ['red' if d > 0 else 'green' for d in deviations]

    ax2.bar(digits, deviations, color=colors, alpha=0.7)
    ax2.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
    ax2.set_xlabel('First Digit')
    ax2.set_ylabel('Deviation from Expected (%)')
    ax2.set_title('Deviation Analysis')
    ax2.grid(axis='y', alpha=0.3)

    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'benford_analysis',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    # Chart 2: Risk Gauge
    fig, ax = plt.subplots(figsize=(8, 4))

    risk_colors = {'VERY LOW': 'green', 'LOW': 'lightgreen', 'MODERATE': 'orange', 'HIGH': 'red'}
    risk_positions = {'VERY LOW': 0.125, 'LOW': 0.375, 'MODERATE': 0.625, 'HIGH': 0.875}

    # Draw risk zones
    for i, (risk, color) in enumerate(risk_colors.items()):
        ax.barh(0, 0.25, left=i*0.25, color=color, alpha=0.6, height=0.5)
        ax.text(i*0.25 + 0.125, 0, risk, ha='center', va='center', fontsize=9, fontweight='bold')

    # Add marker for current risk
    current_pos = risk_positions[result['overall_fraud_risk']]
    ax.plot(current_pos, 0, 'v', markersize=20, color='black')

    ax.set_xlim(0, 1)
    ax.set_ylim(-0.5, 0.5)
    ax.set_title(f"Fraud Risk Level: {result['overall_fraud_risk']}", fontsize=14, fontweight='bold')
    ax.axis('off')

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'risk_gauge',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    return charts

# Main execution
if __name__ == '__main__':
    # Placeholders replaced by handler
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')

    result = calculate_benford(data, params)
    charts = generate_charts(data, result)
    result['charts'] = charts

    print(json.dumps(result))
