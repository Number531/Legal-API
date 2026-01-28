"""
CVR (Contingent Value Rights) - Milestone-based contingent payments
"""
import json
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

def calculate_cvr(data, params):
    company = data.get('company_name', 'Target')
    milestones = data.get('milestones', [])

    if not milestones:
        raise ValueError("At least one milestone required")

    discount_rate = params.get('discount_rate', 0.10)
    risk_premium = params.get('risk_premium', 0.05)  # additional risk for contingent
    valuation_date = params.get('valuation_date', 'Today')

    cvr_values = []
    total_max_value = 0
    total_probability_weighted = 0
    total_risk_adjusted = 0

    for m in milestones:
        name = m.get('name', 'Milestone')
        payment = m.get('payment', 0)
        probability = m.get('probability', 0.5)
        years_to_milestone = m.get('years_to_milestone', 1)
        milestone_type = m.get('type', 'binary')  # binary, tiered, performance

        # Expected value
        expected_value = payment * probability

        # Risk-adjusted discount rate
        adj_rate = discount_rate + risk_premium

        # Present value of expected payment
        pv_factor = 1 / ((1 + adj_rate) ** years_to_milestone)
        pv_expected = expected_value * pv_factor
        pv_max = payment * (1 / ((1 + discount_rate) ** years_to_milestone))

        cvr_values.append({
            'name': name,
            'type': milestone_type,
            'max_payment': float(payment),
            'probability': float(probability),
            'years_to_milestone': float(years_to_milestone),
            'expected_value': float(expected_value),
            'pv_expected': float(pv_expected),
            'pv_max': float(pv_max),
            'discount_rate_used': float(adj_rate)
        })

        total_max_value += payment
        total_probability_weighted += expected_value
        total_risk_adjusted += pv_expected

    # Scenario analysis
    scenarios = {
        'all_achieved': sum(m['pv_max'] for m in cvr_values),
        'expected': total_risk_adjusted,
        'none_achieved': 0,
        'partial_50pct': total_risk_adjusted * 0.5
    }

    # Risk metrics
    weighted_prob = sum(m['probability'] * m['max_payment'] for m in cvr_values) / total_max_value if total_max_value > 0 else 0
    weighted_years = sum(m['years_to_milestone'] * m['pv_expected'] for m in cvr_values) / total_risk_adjusted if total_risk_adjusted > 0 else 0

    return {
        'company': company,
        'valuation_date': valuation_date,
        'milestones': cvr_values,
        'totals': {
            'max_value': float(total_max_value),
            'probability_weighted_value': float(total_probability_weighted),
            'risk_adjusted_pv': float(total_risk_adjusted)
        },
        'scenarios': {k: float(v) for k, v in scenarios.items()},
        'risk_metrics': {
            'weighted_probability': float(weighted_prob),
            'weighted_years_to_payment': float(weighted_years),
            'discount_rate': float(discount_rate),
            'risk_premium': float(risk_premium)
        },
        'fair_value_conclusion': {
            'cvr_fair_value': float(total_risk_adjusted),
            'discount_to_max': float((1 - total_risk_adjusted / total_max_value) * 100) if total_max_value > 0 else 0
        },
        'methodology': 'CVR valuation using probability-weighted, risk-adjusted present values'
    }

def generate_charts(data, result):
    charts = []
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    milestones = result['milestones']
    names = [m['name'][:15] for m in milestones]
    max_vals = [m['max_payment'] for m in milestones]
    exp_vals = [m['pv_expected'] for m in milestones]
    probs = [m['probability'] * 100 for m in milestones]

    # Max vs Expected value comparison
    x = np.arange(len(names))
    width = 0.35
    axes[0, 0].bar(x - width/2, max_vals, width, label='Max Payment', color='lightblue', alpha=0.7)
    axes[0, 0].bar(x + width/2, exp_vals, width, label='Risk-Adj PV', color='steelblue', alpha=0.7)
    axes[0, 0].set_xticks(x)
    axes[0, 0].set_xticklabels(names, rotation=45, ha='right')
    axes[0, 0].set_title('CVR Values by Milestone')
    axes[0, 0].set_ylabel('Value ($M)')
    axes[0, 0].legend()

    # Probability by milestone
    colors = ['green' if p >= 70 else 'orange' if p >= 40 else 'red' for p in probs]
    axes[0, 1].barh(names, probs, color=colors, alpha=0.7)
    axes[0, 1].set_xlim(0, 100)
    axes[0, 1].set_title('Milestone Probabilities')
    axes[0, 1].set_xlabel('Probability (%)')

    # Scenario analysis
    scenarios = result['scenarios']
    sc_names = list(scenarios.keys())
    sc_vals = list(scenarios.values())
    sc_colors = ['green', 'steelblue', 'red', 'orange']
    axes[1, 0].bar(range(len(sc_names)), sc_vals, color=sc_colors, alpha=0.7)
    axes[1, 0].set_xticks(range(len(sc_names)))
    axes[1, 0].set_xticklabels([s.replace('_', ' ').title() for s in sc_names], rotation=45, ha='right')
    axes[1, 0].set_title('Scenario Analysis')
    axes[1, 0].set_ylabel('CVR Value ($M)')

    # Waterfall: Max to Fair Value
    totals = result['totals']
    fv = result['fair_value_conclusion']
    labels = ['Max Value', 'Prob Adj', 'Time/Risk Adj', 'Fair Value']
    prob_adj = totals['max_value'] - totals['probability_weighted_value']
    risk_adj = totals['probability_weighted_value'] - totals['risk_adjusted_pv']
    vals = [totals['max_value'], -prob_adj, -risk_adj, totals['risk_adjusted_pv']]
    colors_wf = ['lightblue', 'red', 'red', 'steelblue']
    axes[1, 1].bar(range(4), vals, color=colors_wf, alpha=0.7)
    axes[1, 1].set_xticks(range(4))
    axes[1, 1].set_xticklabels(labels, rotation=45, ha='right')
    axes[1, 1].set_title(f"CVR Fair Value: ${fv['cvr_fair_value']:.1f}M")
    axes[1, 1].set_ylabel('Value ($M)')

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    charts.append({'name': 'cvr_analysis', 'data': base64.b64encode(buf.read()).decode('utf-8')})
    plt.close()
    return charts

if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')
    result = calculate_cvr(data, params)
    result['charts'] = generate_charts(data, result)
    print(json.dumps(result))
