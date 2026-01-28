"""
Spin-off/Carve-out - Separation value creation analysis
"""
import json
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

def calculate_spinoff(data, params):
    parent = data.get('parent', {})
    parent_name = parent.get('name', 'Parent')
    parent_ebitda = parent.get('ebitda', 500)
    parent_multiple = parent.get('multiple', 8.0)

    spinco = data.get('spinco', {})
    spinco_name = spinco.get('name', 'SpinCo')
    spinco_ebitda = spinco.get('ebitda', 100)
    spinco_standalone_multiple = spinco.get('standalone_multiple', 10.0)

    # Separation costs
    one_time_costs = params.get('one_time_separation_costs', 50)
    stranded_costs_annual = params.get('stranded_costs_annual', 20)
    stranded_cost_years = params.get('stranded_cost_elimination_years', 3)
    tax_rate = params.get('tax_rate', 0.25)
    discount_rate = params.get('discount_rate', 0.10)

    # Dis-synergies / synergies
    dis_synergies_annual = params.get('dis_synergies_annual', 10)
    spinco_synergies = params.get('spinco_standalone_synergies', 15)

    # Pre-spin combined value
    combined_ebitda = parent_ebitda
    combined_value = combined_ebitda * parent_multiple

    # Post-spin RemainCo
    remainco_ebitda = parent_ebitda - spinco_ebitda
    remainco_multiple = params.get('remainco_multiple', parent_multiple)  # May re-rate
    remainco_value = remainco_ebitda * remainco_multiple

    # Post-spin SpinCo
    spinco_adj_ebitda = spinco_ebitda + spinco_synergies - dis_synergies_annual
    spinco_value = spinco_adj_ebitda * spinco_standalone_multiple

    # Separation costs NPV
    # One-time (at t=0)
    one_time_after_tax = one_time_costs * (1 - tax_rate)

    # Stranded costs phase-out
    stranded_npv = 0
    for year in range(1, stranded_cost_years + 1):
        remaining_pct = (stranded_cost_years - year + 1) / stranded_cost_years
        annual_stranded = stranded_costs_annual * remaining_pct * (1 - tax_rate)
        stranded_npv += annual_stranded / ((1 + discount_rate) ** year)

    total_separation_costs = one_time_after_tax + stranded_npv

    # Total post-spin value
    total_post_spin = remainco_value + spinco_value - total_separation_costs

    # Value creation
    value_created = total_post_spin - combined_value
    value_creation_pct = (value_created / combined_value * 100) if combined_value > 0 else 0

    # Multiple arbitrage
    blended_post_multiple = total_post_spin / (remainco_ebitda + spinco_adj_ebitda) if (remainco_ebitda + spinco_adj_ebitda) > 0 else 0
    multiple_expansion = blended_post_multiple - parent_multiple

    # Breakeven analysis - what SpinCo multiple needed for value neutral
    breakeven_spinco_multiple = (combined_value + total_separation_costs - remainco_value) / spinco_adj_ebitda if spinco_adj_ebitda > 0 else 0

    return {
        'parent': {
            'name': parent_name,
            'ebitda': float(parent_ebitda),
            'multiple': float(parent_multiple),
            'combined_value': float(combined_value)
        },
        'remainco': {
            'name': f"{parent_name} (RemainCo)",
            'ebitda': float(remainco_ebitda),
            'multiple': float(remainco_multiple),
            'value': float(remainco_value)
        },
        'spinco': {
            'name': spinco_name,
            'base_ebitda': float(spinco_ebitda),
            'synergies': float(spinco_synergies),
            'dis_synergies': float(dis_synergies_annual),
            'adjusted_ebitda': float(spinco_adj_ebitda),
            'standalone_multiple': float(spinco_standalone_multiple),
            'value': float(spinco_value)
        },
        'separation_costs': {
            'one_time': float(one_time_costs),
            'one_time_after_tax': float(one_time_after_tax),
            'stranded_costs_npv': float(stranded_npv),
            'total_separation_costs': float(total_separation_costs)
        },
        'value_creation': {
            'pre_spin_value': float(combined_value),
            'post_spin_value': float(total_post_spin),
            'value_created': float(value_created),
            'value_creation_pct': float(value_creation_pct),
            'multiple_expansion': float(multiple_expansion),
            'breakeven_spinco_multiple': float(breakeven_spinco_multiple)
        },
        'recommendation': 'PROCEED' if value_created > 0 else 'RECONSIDER',
        'methodology': 'Spin-off analysis with separation costs and multiple re-rating'
    }

def generate_charts(data, result):
    charts = []
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    # Value bridge waterfall
    vc = result['value_creation']
    sep = result['separation_costs']
    labels = ['Pre-Spin', 'RemainCo', 'SpinCo', 'Sep Costs', 'Post-Spin']
    values = [
        result['parent']['combined_value'],
        result['remainco']['value'],
        result['spinco']['value'],
        -sep['total_separation_costs'],
        vc['post_spin_value']
    ]
    colors = ['gray', 'steelblue', 'green', 'red', 'gold']
    axes[0, 0].bar(range(5), values, color=colors, alpha=0.7)
    axes[0, 0].set_xticks(range(5))
    axes[0, 0].set_xticklabels(labels, rotation=45, ha='right')
    axes[0, 0].axhline(y=0, color='black', linewidth=0.5)
    axes[0, 0].set_title(f"Value Bridge (Created: ${vc['value_created']:.0f}M)")
    axes[0, 0].set_ylabel('Value ($M)')

    # EBITDA split
    ebitdas = [result['remainco']['ebitda'], result['spinco']['adjusted_ebitda']]
    labels_pie = [result['remainco']['name'], result['spinco']['name']]
    colors_pie = ['steelblue', 'green']
    axes[0, 1].pie(ebitdas, labels=labels_pie, autopct='%1.1f%%', colors=colors_pie)
    axes[0, 1].set_title('Post-Spin EBITDA Split')

    # Multiple comparison
    entities = ['Parent\n(Pre)', 'RemainCo\n(Post)', 'SpinCo\n(Post)']
    mults = [result['parent']['multiple'], result['remainco']['multiple'], result['spinco']['standalone_multiple']]
    colors_mult = ['gray', 'steelblue', 'green']
    axes[1, 0].bar(entities, mults, color=colors_mult, alpha=0.7)
    axes[1, 0].set_title('Multiple Comparison')
    axes[1, 0].set_ylabel('EV/EBITDA Multiple')
    axes[1, 0].axhline(y=result['parent']['multiple'], color='gray', linestyle='--', alpha=0.5)

    # Separation cost breakdown
    cost_labels = ['One-time\n(After Tax)', 'Stranded\nCosts NPV']
    cost_vals = [sep['one_time_after_tax'], sep['stranded_costs_npv']]
    axes[1, 1].bar(cost_labels, cost_vals, color='red', alpha=0.7)
    axes[1, 1].set_title(f"Separation Costs: ${sep['total_separation_costs']:.0f}M")
    axes[1, 1].set_ylabel('Cost ($M)')

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    charts.append({'name': 'spinoff_analysis', 'data': base64.b64encode(buf.read()).decode('utf-8')})
    plt.close()
    return charts

if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')
    result = calculate_spinoff(data, params)
    result['charts'] = generate_charts(data, result)
    print(json.dumps(result))
