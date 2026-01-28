"""
Venture Capital Method - Early-stage valuation working backward from exit
"""
import json
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

def calculate_vc_method(data, params):
    company = data.get('company_name', 'Startup')

    # Current round
    investment_amount = data.get('investment_amount', 10)
    pre_money = data.get('pre_money_valuation', 40)
    post_money = pre_money + investment_amount

    # Exit assumptions
    exit_revenue = data.get('exit_revenue', 100)
    exit_ebitda = data.get('exit_ebitda', 20)
    exit_multiple = params.get('exit_multiple', 10.0)  # EV/Revenue or EV/EBITDA
    multiple_basis = params.get('multiple_basis', 'revenue')  # 'revenue' or 'ebitda'

    years_to_exit = params.get('years_to_exit', 5)
    target_irr = params.get('target_irr', 0.30)  # 30% typical VC

    # Dilution assumptions
    future_dilution = params.get('future_dilution', 0.30)  # Additional rounds dilution
    option_pool_expansion = params.get('option_pool_expansion', 0.10)

    # Calculate exit value
    if multiple_basis == 'revenue':
        exit_enterprise_value = exit_revenue * exit_multiple
    else:
        exit_enterprise_value = exit_ebitda * exit_multiple

    # Terminal value (net of debt, assume minimal)
    exit_debt = params.get('exit_debt', 0)
    exit_equity_value = exit_enterprise_value - exit_debt

    # Ownership calculations
    ownership_at_investment = investment_amount / post_money
    ownership_at_exit = ownership_at_investment * (1 - future_dilution) * (1 - option_pool_expansion)

    # Exit proceeds
    exit_proceeds = exit_equity_value * ownership_at_exit

    # Realized returns
    moic = exit_proceeds / investment_amount if investment_amount > 0 else 0
    irr = (moic ** (1 / years_to_exit) - 1) if moic > 0 and years_to_exit > 0 else 0

    # Required exit value for target IRR (working backward)
    required_moic = (1 + target_irr) ** years_to_exit
    required_proceeds = investment_amount * required_moic
    required_exit_equity = required_proceeds / ownership_at_exit if ownership_at_exit > 0 else 0
    required_exit_ev = required_exit_equity + exit_debt

    if multiple_basis == 'revenue':
        required_exit_revenue = required_exit_ev / exit_multiple if exit_multiple > 0 else 0
        implied_revenue_cagr = (required_exit_revenue / data.get('current_revenue', exit_revenue / 5)) ** (1 / years_to_exit) - 1 if years_to_exit > 0 else 0
    else:
        required_exit_ebitda = required_exit_ev / exit_multiple if exit_multiple > 0 else 0
        implied_revenue_cagr = None

    # Sensitivity on exit multiple
    mult_range = [exit_multiple * 0.5, exit_multiple * 0.75, exit_multiple, exit_multiple * 1.25, exit_multiple * 1.5]
    irr_sensitivity = []
    for m in mult_range:
        if multiple_basis == 'revenue':
            ev = exit_revenue * m
        else:
            ev = exit_ebitda * m
        eq = ev - exit_debt
        proceeds = eq * ownership_at_exit
        moic_s = proceeds / investment_amount if investment_amount > 0 else 0
        irr_s = (moic_s ** (1 / years_to_exit) - 1) if moic_s > 0 else -1
        irr_sensitivity.append({
            'exit_multiple': float(m),
            'exit_equity_value': float(eq),
            'proceeds': float(proceeds),
            'moic': float(moic_s),
            'irr': float(irr_s)
        })

    return {
        'company': company,
        'current_round': {
            'investment': float(investment_amount),
            'pre_money': float(pre_money),
            'post_money': float(post_money),
            'ownership_pct': float(ownership_at_investment * 100)
        },
        'dilution': {
            'future_rounds_dilution': float(future_dilution * 100),
            'option_pool_expansion': float(option_pool_expansion * 100),
            'ownership_at_exit_pct': float(ownership_at_exit * 100)
        },
        'exit_assumptions': {
            'years_to_exit': years_to_exit,
            'exit_revenue': float(exit_revenue) if multiple_basis == 'revenue' else None,
            'exit_ebitda': float(exit_ebitda) if multiple_basis == 'ebitda' else None,
            'exit_multiple': float(exit_multiple),
            'multiple_basis': multiple_basis,
            'exit_enterprise_value': float(exit_enterprise_value),
            'exit_equity_value': float(exit_equity_value)
        },
        'returns': {
            'exit_proceeds': float(exit_proceeds),
            'moic': float(moic),
            'irr': float(irr),
            'irr_pct': f"{irr * 100:.1f}%"
        },
        'backward_solve': {
            'target_irr': float(target_irr),
            'required_moic': float(required_moic),
            'required_exit_equity': float(required_exit_equity),
            'required_exit_ev': float(required_exit_ev),
            'implied_revenue_cagr': float(implied_revenue_cagr) if implied_revenue_cagr else None
        },
        'sensitivity': irr_sensitivity,
        'investment_decision': 'INVEST' if irr >= target_irr else 'PASS',
        'methodology': 'VC Method working backward from target exit to derive required metrics'
    }

def generate_charts(data, result):
    charts = []
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    # Ownership waterfall
    curr = result['current_round']
    dil = result['dilution']
    labels = ['Initial\nOwnership', 'After Future\nRounds', 'After Option\nPool', 'At Exit']
    initial = curr['ownership_pct']
    after_rounds = initial * (1 - dil['future_rounds_dilution'] / 100)
    after_pool = after_rounds * (1 - dil['option_pool_expansion'] / 100)
    values = [initial, after_rounds, after_pool, dil['ownership_at_exit_pct']]
    colors = ['steelblue', 'orange', 'orange', 'green']
    axes[0, 0].bar(range(4), values, color=colors, alpha=0.7)
    axes[0, 0].set_xticks(range(4))
    axes[0, 0].set_xticklabels(labels)
    axes[0, 0].set_title('Ownership Dilution Path')
    axes[0, 0].set_ylabel('Ownership %')

    # IRR sensitivity
    sens = result['sensitivity']
    mults = [s['exit_multiple'] for s in sens]
    irrs = [s['irr'] * 100 for s in sens]
    target = result['backward_solve']['target_irr'] * 100
    colors_irr = ['green' if i >= target else 'red' for i in irrs]
    axes[0, 1].bar(range(len(mults)), irrs, color=colors_irr, alpha=0.7)
    axes[0, 1].axhline(y=target, color='green', linestyle='--', label=f'Target IRR: {target:.0f}%')
    axes[0, 1].set_xticks(range(len(mults)))
    axes[0, 1].set_xticklabels([f'{m:.1f}x' for m in mults])
    axes[0, 1].set_title('IRR Sensitivity to Exit Multiple')
    axes[0, 1].set_ylabel('IRR (%)')
    axes[0, 1].legend()

    # Investment to proceeds
    ret = result['returns']
    axes[1, 0].bar(['Investment', 'Exit Proceeds'],
                   [curr['investment'], ret['exit_proceeds']],
                   color=['red', 'green'], alpha=0.7)
    axes[1, 0].set_title(f"MOIC: {ret['moic']:.1f}x | IRR: {ret['irr_pct']}")
    axes[1, 0].set_ylabel('Value ($M)')

    # Value bridge at exit
    exit_a = result['exit_assumptions']
    labels_vb = ['Exit EV', 'Less Debt', 'Equity', 'Your Share', 'Proceeds']
    values_vb = [
        exit_a['exit_enterprise_value'],
        -data.get('exit_debt', 0),
        exit_a['exit_equity_value'],
        exit_a['exit_equity_value'] * dil['ownership_at_exit_pct'] / 100,
        ret['exit_proceeds']
    ]
    colors_vb = ['steelblue', 'red', 'blue', 'orange', 'green']
    axes[1, 1].bar(range(5), values_vb, color=colors_vb, alpha=0.7)
    axes[1, 1].set_xticks(range(5))
    axes[1, 1].set_xticklabels(labels_vb, rotation=45, ha='right')
    axes[1, 1].set_title('Exit Value Bridge')
    axes[1, 1].set_ylabel('Value ($M)')

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    charts.append({'name': 'vc_method_analysis', 'data': base64.b64encode(buf.read()).decode('utf-8')})
    plt.close()
    return charts

if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')
    result = calculate_vc_method(data, params)
    result['charts'] = generate_charts(data, result)
    print(json.dumps(result))
