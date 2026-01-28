"""
Discounted Cash Flow (DCF) Valuation Model
For M&A fairness opinions, shareholder litigation, enterprise valuation

Input Data (financialData):
- revenue: Array of projected revenues by year
- ebitda (optional): Array of EBITDA values (if not provided, calculated from margin)
- existing_cash (optional): Cash on balance sheet
- existing_debt (optional): Total debt obligations

Parameters:
- wacc: Weighted average cost of capital (default: 0.10)
- terminal_growth: Perpetual growth rate (default: 0.02)
- operating_margin: EBITDA/Revenue if EBITDA not provided (default: 0.15)
- capex_percent: CapEx as % of revenue (default: 0.05)
- working_capital_percent: NWC as % of revenue (default: 0.10)
- tax_rate: Corporate tax rate (default: 0.21)
- depreciation_percent: D&A as % of revenue (default: 0.03)
"""

import json
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

def calculate_dcf(data, params):
    # Extract input data
    revenue = np.array(data.get('revenue', []))
    if len(revenue) == 0:
        raise ValueError("Revenue projections required")

    # Parameters with defaults
    wacc = params.get('wacc', 0.10)
    terminal_growth = params.get('terminal_growth', 0.02)
    operating_margin = params.get('operating_margin', 0.15)
    capex_pct = params.get('capex_percent', 0.05)
    nwc_pct = params.get('working_capital_percent', 0.10)
    tax_rate = params.get('tax_rate', 0.21)
    depr_pct = params.get('depreciation_percent', 0.03)
    existing_cash = data.get('existing_cash', 0)
    existing_debt = data.get('existing_debt', 0)

    # Use provided EBITDA or calculate from margin
    if 'ebitda' in data:
        ebitda = np.array(data['ebitda'])
    else:
        ebitda = revenue * operating_margin

    # Calculate components
    depreciation = revenue * depr_pct
    ebit = ebitda - depreciation
    nopat = ebit * (1 - tax_rate)  # Net Operating Profit After Tax

    # Free Cash Flow calculation
    capex = revenue * capex_pct
    nwc = revenue * nwc_pct
    nwc_change = np.diff(nwc, prepend=nwc[0] * 0.9)  # Assume 90% of first year NWC as base

    fcf = nopat + depreciation - capex - nwc_change

    # Discount factors
    years = np.arange(1, len(fcf) + 1)
    discount_factors = (1 + wacc) ** years
    pv_fcf = fcf / discount_factors

    # Terminal value (Gordon Growth Model)
    terminal_fcf = fcf[-1] * (1 + terminal_growth)
    terminal_value = terminal_fcf / (wacc - terminal_growth)
    pv_terminal = terminal_value / discount_factors[-1]

    # Enterprise and equity value
    enterprise_value = np.sum(pv_fcf) + pv_terminal
    equity_value = enterprise_value + existing_cash - existing_debt

    # Sensitivity analysis
    wacc_range = np.array([wacc - 0.02, wacc - 0.01, wacc, wacc + 0.01, wacc + 0.02])
    growth_range = np.array([terminal_growth - 0.01, terminal_growth - 0.005,
                            terminal_growth, terminal_growth + 0.005, terminal_growth + 0.01])

    sensitivity_matrix = []
    for w in wacc_range:
        row = []
        for g in growth_range:
            if w <= g:
                row.append(None)  # Invalid combination
            else:
                term_val = (fcf[-1] * (1 + g)) / (w - g)
                pv_term = term_val / ((1 + w) ** len(fcf))
                ev = np.sum(fcf / ((1 + w) ** years)) + pv_term
                row.append(float(ev))
        sensitivity_matrix.append(row)

    return {
        'enterprise_value': float(enterprise_value),
        'equity_value': float(equity_value),
        'pv_fcf': float(np.sum(pv_fcf)),
        'pv_terminal_value': float(pv_terminal),
        'terminal_value_undiscounted': float(terminal_value),
        'fcf_by_year': fcf.tolist(),
        'pv_fcf_by_year': pv_fcf.tolist(),
        'implied_terminal_multiple': float(terminal_value / ebitda[-1]) if ebitda[-1] != 0 else None,
        'sensitivity': {
            'wacc_range': wacc_range.tolist(),
            'growth_range': growth_range.tolist(),
            'matrix': sensitivity_matrix
        },
        'assumptions': {
            'wacc': wacc,
            'terminal_growth': terminal_growth,
            'tax_rate': tax_rate,
            'projection_years': len(revenue)
        },
        'methodology': f'DCF using WACC={wacc:.1%}, terminal growth={terminal_growth:.1%}, {len(revenue)}-year projection'
    }

def generate_charts(data, result):
    charts = []

    # Chart 1: FCF Waterfall
    fig, ax = plt.subplots(figsize=(10, 6))
    years = range(1, len(result['fcf_by_year']) + 1)
    ax.bar(years, result['fcf_by_year'], color='steelblue', alpha=0.8)
    ax.set_xlabel('Year')
    ax.set_ylabel('Free Cash Flow ($)')
    ax.set_title('Projected Free Cash Flow')
    ax.axhline(y=0, color='black', linestyle='-', linewidth=0.5)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'fcf_projection',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    # Chart 2: Value Bridge
    fig, ax = plt.subplots(figsize=(10, 6))
    components = ['PV of FCF', 'PV Terminal Value', 'Cash', 'Debt', 'Equity Value']
    values = [
        result['pv_fcf'],
        result['pv_terminal_value'],
        data.get('existing_cash', 0),
        -data.get('existing_debt', 0),
        result['equity_value']
    ]
    colors = ['steelblue', 'steelblue', 'green', 'red', 'gold']

    ax.bar(components, values, color=colors, alpha=0.8)
    ax.set_ylabel('Value ($)')
    ax.set_title('Enterprise to Equity Value Bridge')
    ax.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
    plt.xticks(rotation=45, ha='right')

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'value_bridge',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    return charts

# Main execution
if __name__ == '__main__':
    # Placeholders replaced by handler
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')

    result = calculate_dcf(data, params)
    charts = generate_charts(data, result)
    result['charts'] = charts

    print(json.dumps(result))
