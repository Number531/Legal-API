"""
APV (Adjusted Present Value) - Separates operating from financing value
"""
import json
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

def calculate_apv(data, params):
    company = data.get('company_name', 'Company')

    # Cash flow projections
    fcfs = data.get('fcfs', [100, 110, 120, 130, 140])  # Unlevered FCFs
    terminal_year_fcf = fcfs[-1] if fcfs else 100

    # Rates
    ru = params.get('unlevered_cost_of_equity', 0.12)  # Cost of equity for unlevered firm
    terminal_growth = params.get('terminal_growth', 0.03)
    tax_rate = params.get('tax_rate', 0.25)
    debt_cost = params.get('debt_cost', 0.06)

    # Debt schedule
    debt_schedule = data.get('debt_schedule', [500, 450, 400, 350, 300])
    if not debt_schedule:
        debt_schedule = [0] * len(fcfs)

    # Unlevered value (as if all-equity financed)
    pv_fcfs = 0
    for i, fcf in enumerate(fcfs):
        pv_fcfs += fcf / ((1 + ru) ** (i + 1))

    # Terminal value (unlevered)
    terminal_value = terminal_year_fcf * (1 + terminal_growth) / (ru - terminal_growth)
    pv_terminal = terminal_value / ((1 + ru) ** len(fcfs))

    unlevered_value = pv_fcfs + pv_terminal

    # Tax shield from debt
    # Interest tax shield = Interest * Tax Rate
    tax_shields = []
    for i, debt in enumerate(debt_schedule):
        interest = debt * debt_cost
        shield = interest * tax_rate
        tax_shields.append(shield)

    # PV of tax shields (discounted at debt cost - assumes shield as risky as debt)
    pv_tax_shields = 0
    for i, shield in enumerate(tax_shields):
        pv_tax_shields += shield / ((1 + debt_cost) ** (i + 1))

    # Perpetual tax shield from terminal debt (simplified)
    terminal_debt = debt_schedule[-1] if debt_schedule else 0
    perpetual_shield = (terminal_debt * debt_cost * tax_rate) / debt_cost if debt_cost > 0 else 0
    pv_perpetual_shield = perpetual_shield / ((1 + debt_cost) ** len(debt_schedule))
    total_pv_tax_shields = pv_tax_shields + pv_perpetual_shield

    # Costs of financial distress (optional)
    distress_prob = params.get('distress_probability', 0.05)
    distress_cost_pct = params.get('distress_cost_pct', 0.20)  # % of firm value lost
    expected_distress_cost = unlevered_value * distress_prob * distress_cost_pct

    # APV = Unlevered Value + PV(Tax Shields) - Expected Distress Costs
    apv = unlevered_value + total_pv_tax_shields - expected_distress_cost

    # Net of debt for equity value
    current_debt = debt_schedule[0] if debt_schedule else 0
    equity_value = apv - current_debt

    # Component breakdown
    components = {
        'unlevered_value': float(unlevered_value),
        'pv_fcfs': float(pv_fcfs),
        'pv_terminal': float(pv_terminal),
        'pv_tax_shields': float(total_pv_tax_shields),
        'expected_distress_cost': float(expected_distress_cost),
        'apv': float(apv),
        'less_debt': float(current_debt),
        'equity_value': float(equity_value)
    }

    # Sensitivity on leverage
    leverage_sensitivity = []
    for debt_mult in [0, 0.5, 1.0, 1.5, 2.0]:
        adj_debt = [d * debt_mult for d in debt_schedule]
        adj_shields = sum((d * debt_cost * tax_rate) / ((1 + debt_cost) ** (i + 1))
                         for i, d in enumerate(adj_debt))
        adj_distress = unlevered_value * (distress_prob * debt_mult) * distress_cost_pct
        adj_apv = unlevered_value + adj_shields - adj_distress
        leverage_sensitivity.append({
            'debt_multiple': debt_mult,
            'apv': float(adj_apv),
            'tax_shield_benefit': float(adj_shields),
            'distress_cost': float(adj_distress)
        })

    return {
        'company': company,
        'inputs': {
            'unlevered_cost_of_equity': float(ru),
            'debt_cost': float(debt_cost),
            'tax_rate': float(tax_rate),
            'terminal_growth': float(terminal_growth)
        },
        'projections': {
            'fcfs': [float(f) for f in fcfs],
            'debt_schedule': [float(d) for d in debt_schedule],
            'tax_shields': [float(t) for t in tax_shields]
        },
        'components': components,
        'leverage_sensitivity': leverage_sensitivity,
        'conclusion': {
            'enterprise_value': float(apv),
            'equity_value': float(equity_value),
            'tax_shield_contribution_pct': float(total_pv_tax_shields / apv * 100) if apv > 0 else 0
        },
        'methodology': 'APV separating unlevered operating value from financing effects'
    }

def generate_charts(data, result):
    charts = []
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    proj = result['projections']
    years = list(range(1, len(proj['fcfs']) + 1))

    # FCF projection
    axes[0, 0].bar(years, proj['fcfs'], color='steelblue', alpha=0.7, label='FCF')
    axes[0, 0].plot(years, proj['debt_schedule'], 'r-o', linewidth=2, label='Debt')
    axes[0, 0].set_title('FCF and Debt Schedule')
    axes[0, 0].set_xlabel('Year')
    axes[0, 0].set_ylabel('$M')
    axes[0, 0].legend()

    # Value components waterfall
    comp = result['components']
    labels = ['Unlevered\nValue', 'Tax\nShields', 'Distress\nCost', 'APV', 'Less\nDebt', 'Equity\nValue']
    values = [comp['unlevered_value'], comp['pv_tax_shields'], -comp['expected_distress_cost'],
              comp['apv'], -comp['less_debt'], comp['equity_value']]
    colors = ['steelblue', 'green', 'red', 'purple', 'orange', 'gold']
    axes[0, 1].bar(range(6), values, color=colors, alpha=0.7)
    axes[0, 1].set_xticks(range(6))
    axes[0, 1].set_xticklabels(labels)
    axes[0, 1].set_title('APV Components')
    axes[0, 1].set_ylabel('Value ($M)')
    axes[0, 1].axhline(y=0, color='black', linewidth=0.5)

    # Leverage sensitivity
    sens = result['leverage_sensitivity']
    debt_mults = [s['debt_multiple'] for s in sens]
    apvs = [s['apv'] for s in sens]
    shields = [s['tax_shield_benefit'] for s in sens]
    distress = [s['distress_cost'] for s in sens]

    axes[1, 0].plot(debt_mults, apvs, 'b-o', linewidth=2, markersize=8, label='APV')
    axes[1, 0].set_title('APV vs Leverage')
    axes[1, 0].set_xlabel('Debt Multiple')
    axes[1, 0].set_ylabel('APV ($M)')

    # Tradeoff: tax shield vs distress
    axes[1, 1].bar(np.array(debt_mults) - 0.1, shields, 0.2, label='Tax Shield', color='green', alpha=0.7)
    axes[1, 1].bar(np.array(debt_mults) + 0.1, distress, 0.2, label='Distress Cost', color='red', alpha=0.7)
    axes[1, 1].set_title('Tax Shield vs Distress Cost Tradeoff')
    axes[1, 1].set_xlabel('Debt Multiple')
    axes[1, 1].set_ylabel('Value ($M)')
    axes[1, 1].legend()

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    charts.append({'name': 'apv_analysis', 'data': base64.b64encode(buf.read()).decode('utf-8')})
    plt.close()
    return charts

if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')
    result = calculate_apv(data, params)
    result['charts'] = generate_charts(data, result)
    print(json.dumps(result))
