"""
LBO (Leveraged Buyout) - Private equity acquisition analysis
"""
import json
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

def calculate_lbo(data, params):
    company = data.get('company_name', 'Target')

    # Purchase assumptions
    entry_ebitda = data.get('entry_ebitda', 100)
    entry_multiple = data.get('entry_multiple', 8.0)
    enterprise_value = entry_ebitda * entry_multiple

    # Capital structure
    equity_pct = params.get('equity_pct', 0.40)
    debt_pct = 1 - equity_pct
    equity_investment = enterprise_value * equity_pct
    initial_debt = enterprise_value * debt_pct

    # Debt terms
    interest_rate = params.get('interest_rate', 0.08)
    debt_paydown_pct = params.get('debt_paydown_pct', 0.50)  # % of FCF to debt

    # Operating assumptions
    revenue_growth = params.get('revenue_growth', 0.05)
    ebitda_margin = params.get('ebitda_margin', 0.20)
    capex_pct = params.get('capex_pct', 0.03)
    nwc_pct = params.get('nwc_pct', 0.10)
    tax_rate = params.get('tax_rate', 0.25)
    da_pct = params.get('da_pct', 0.03)

    # Exit assumptions
    hold_period = params.get('hold_period', 5)
    exit_multiple = params.get('exit_multiple', entry_multiple)

    # Initial revenue (back-solve from EBITDA margin)
    initial_revenue = entry_ebitda / ebitda_margin if ebitda_margin > 0 else entry_ebitda * 5

    # Build projection
    years = list(range(hold_period + 1))
    revenues, ebitdas, debts, fcfs = [initial_revenue], [entry_ebitda], [initial_debt], [0]

    for y in range(1, hold_period + 1):
        rev = revenues[-1] * (1 + revenue_growth)
        ebitda = rev * ebitda_margin
        da = rev * da_pct
        ebit = ebitda - da
        taxes = max(0, ebit * tax_rate)
        capex = rev * capex_pct
        nwc_change = (rev - revenues[-1]) * nwc_pct

        # FCF before debt service
        fcf = ebitda - taxes - capex - nwc_change

        # Debt paydown
        debt_payment = min(fcf * debt_paydown_pct, debts[-1])
        interest = debts[-1] * interest_rate

        new_debt = debts[-1] - debt_payment

        revenues.append(rev)
        ebitdas.append(ebitda)
        debts.append(new_debt)
        fcfs.append(fcf)

    # Exit analysis
    exit_ebitda = ebitdas[-1]
    exit_ev = exit_ebitda * exit_multiple
    exit_debt = debts[-1]
    exit_equity = exit_ev - exit_debt

    # Returns
    moic = exit_equity / equity_investment if equity_investment > 0 else 0
    irr = (moic ** (1 / hold_period) - 1) if moic > 0 and hold_period > 0 else 0

    # Sensitivity on exit multiple
    mult_range = [exit_multiple - 1, exit_multiple - 0.5, exit_multiple, exit_multiple + 0.5, exit_multiple + 1]
    irr_sensitivity = []
    for m in mult_range:
        ev = exit_ebitda * m
        eq = ev - exit_debt
        moic_s = eq / equity_investment if equity_investment > 0 else 0
        irr_s = (moic_s ** (1 / hold_period) - 1) if moic_s > 0 else -1
        irr_sensitivity.append({'exit_multiple': m, 'irr': float(irr_s), 'moic': float(moic_s)})

    return {
        'company': company,
        'entry': {
            'enterprise_value': float(enterprise_value),
            'ebitda': float(entry_ebitda),
            'multiple': float(entry_multiple),
            'equity_investment': float(equity_investment),
            'initial_debt': float(initial_debt)
        },
        'exit': {
            'ebitda': float(exit_ebitda),
            'enterprise_value': float(exit_ev),
            'remaining_debt': float(exit_debt),
            'equity_value': float(exit_equity),
            'multiple': float(exit_multiple)
        },
        'returns': {
            'moic': float(moic),
            'irr': float(irr),
            'irr_pct': f"{irr * 100:.1f}%"
        },
        'projection': {
            'years': years,
            'revenues': [float(r) for r in revenues],
            'ebitdas': [float(e) for e in ebitdas],
            'debt_balances': [float(d) for d in debts],
            'fcfs': [float(f) for f in fcfs]
        },
        'sensitivity': irr_sensitivity,
        'methodology': 'LBO analysis with debt paydown mechanics and IRR sensitivity'
    }

def generate_charts(data, result):
    charts = []
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    proj = result['projection']
    years = proj['years']

    # EBITDA growth
    axes[0, 0].bar(years, proj['ebitdas'], color='steelblue', alpha=0.7)
    axes[0, 0].set_title('EBITDA Projection')
    axes[0, 0].set_xlabel('Year')
    axes[0, 0].set_ylabel('EBITDA ($M)')

    # Debt paydown
    axes[0, 1].plot(years, proj['debt_balances'], 'r-o', linewidth=2)
    axes[0, 1].fill_between(years, proj['debt_balances'], alpha=0.3, color='red')
    axes[0, 1].set_title('Debt Paydown Schedule')
    axes[0, 1].set_xlabel('Year')
    axes[0, 1].set_ylabel('Debt ($M)')

    # IRR sensitivity
    sens = result['sensitivity']
    mults = [s['exit_multiple'] for s in sens]
    irrs = [s['irr'] * 100 for s in sens]
    colors = ['green' if i >= 20 else 'orange' if i >= 15 else 'red' for i in irrs]
    axes[1, 0].bar(range(len(mults)), irrs, color=colors, alpha=0.7)
    axes[1, 0].set_xticks(range(len(mults)))
    axes[1, 0].set_xticklabels([f'{m:.1f}x' for m in mults])
    axes[1, 0].set_title('IRR Sensitivity to Exit Multiple')
    axes[1, 0].set_ylabel('IRR (%)')
    axes[1, 0].axhline(y=20, color='green', linestyle='--', alpha=0.5, label='Target 20%')

    # Value bridge
    entry = result['entry']
    exit_r = result['exit']
    labels = ['Entry EV', 'EBITDA Growth', 'Multiple', 'Debt Paydown', 'Exit Equity']
    entry_ev = entry['enterprise_value']
    exit_ev = exit_r['enterprise_value']
    ebitda_contrib = (exit_r['ebitda'] - entry['ebitda']) * entry['multiple']
    mult_contrib = exit_r['ebitda'] * (exit_r['multiple'] - entry['multiple'])
    debt_paid = entry['initial_debt'] - exit_r['remaining_debt']

    values = [entry['equity_investment'], ebitda_contrib, mult_contrib, debt_paid, exit_r['equity_value']]
    axes[1, 1].bar(range(5), values, color=['gray', 'blue', 'purple', 'green', 'gold'], alpha=0.7)
    axes[1, 1].set_xticks(range(5))
    axes[1, 1].set_xticklabels(labels, rotation=45, ha='right')
    axes[1, 1].set_title('Value Creation Bridge')
    axes[1, 1].set_ylabel('Value ($M)')

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    charts.append({'name': 'lbo_analysis', 'data': base64.b64encode(buf.read()).decode('utf-8')})
    plt.close()
    return charts

if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')
    result = calculate_lbo(data, params)
    result['charts'] = generate_charts(data, result)
    print(json.dumps(result))
