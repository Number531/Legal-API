"""
Beneish M-Score - Earnings manipulation detection
"""
import json
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

def safe_div(n, d, default=1.0):
    return n / d if d and d != 0 else default

def calculate_beneish(data, params):
    company = data.get('company_name', 'Company')
    threshold = params.get('threshold', -1.78)

    # Current year
    ar_t, sales_t, cogs_t = data.get('accounts_receivable_t', 0), data.get('sales_t', 0), data.get('cogs_t', 0)
    ca_t, ppe_t, ta_t = data.get('current_assets_t', 0), data.get('ppe_t', 0), data.get('total_assets_t', 0)
    dep_t, sga_t = data.get('depreciation_t', 0), data.get('sga_t', 0)
    ltd_t, cl_t, wc_t = data.get('long_term_debt_t', 0), data.get('current_liabilities_t', 0), data.get('working_capital_t', 0)

    # Prior year
    ar_t1, sales_t1, cogs_t1 = data.get('accounts_receivable_t1', 0), data.get('sales_t1', 0), data.get('cogs_t1', 0)
    ca_t1, ppe_t1, ta_t1 = data.get('current_assets_t1', 0), data.get('ppe_t1', 0), data.get('total_assets_t1', 0)
    dep_t1, sga_t1 = data.get('depreciation_t1', 0), data.get('sga_t1', 0)
    ltd_t1, cl_t1, wc_t1 = data.get('long_term_debt_t1', 0), data.get('current_liabilities_t1', 0), data.get('working_capital_t1', 0)

    if sales_t == 0 or sales_t1 == 0 or ta_t == 0:
        raise ValueError("Sales and total assets required")

    # 8 Ratios
    dsri = safe_div(safe_div(ar_t, sales_t), safe_div(ar_t1, sales_t1))
    gmi = safe_div(safe_div(sales_t1 - cogs_t1, sales_t1), safe_div(sales_t - cogs_t, sales_t))
    aq_t = 1 - safe_div(ca_t + ppe_t, ta_t) if ta_t > 0 else 0
    aq_t1 = 1 - safe_div(ca_t1 + ppe_t1, ta_t1) if ta_t1 > 0 else 0
    aqi = safe_div(aq_t, aq_t1) if aq_t1 != 0 else 1.0
    sgi = safe_div(sales_t, sales_t1)
    dr_t1 = safe_div(dep_t1, ppe_t1 + dep_t1) if (ppe_t1 + dep_t1) > 0 else 0
    dr_t = safe_div(dep_t, ppe_t + dep_t) if (ppe_t + dep_t) > 0 else 0
    depi = safe_div(dr_t1, dr_t) if dr_t != 0 else 1.0
    sgai = safe_div(safe_div(sga_t, sales_t), safe_div(sga_t1, sales_t1))
    tata = safe_div((wc_t - wc_t1) - dep_t, ta_t)
    lev_t = safe_div(ltd_t + cl_t, ta_t)
    lev_t1 = safe_div(ltd_t1 + cl_t1, ta_t1)
    lvgi = safe_div(lev_t, lev_t1) if lev_t1 != 0 else 1.0

    # M-Score
    m_score = -4.84 + 0.920*dsri + 0.528*gmi + 0.404*aqi + 0.892*sgi + 0.115*depi - 0.172*sgai + 4.679*tata - 0.327*lvgi

    is_manip = m_score > threshold
    flags = [dsri > 1.05, gmi > 1.10, aqi > 1.10, sgi > 1.20, depi > 1.05, sgai < 0.95, tata > 0.06, lvgi > 1.10]

    ratios = {
        'DSRI': {'value': float(dsri), 'flag': dsri > 1.05, 'threshold': 1.05},
        'GMI': {'value': float(gmi), 'flag': gmi > 1.10, 'threshold': 1.10},
        'AQI': {'value': float(aqi), 'flag': aqi > 1.10, 'threshold': 1.10},
        'SGI': {'value': float(sgi), 'flag': sgi > 1.20, 'threshold': 1.20},
        'DEPI': {'value': float(depi), 'flag': depi > 1.05, 'threshold': 1.05},
        'SGAI': {'value': float(sgai), 'flag': sgai < 0.95, 'threshold': 0.95},
        'TATA': {'value': float(tata), 'flag': tata > 0.06, 'threshold': 0.06},
        'LVGI': {'value': float(lvgi), 'flag': lvgi > 1.10, 'threshold': 1.10}
    }

    return {
        'company': company,
        'm_score': float(m_score),
        'threshold': threshold,
        'classification': 'MANIPULATOR' if is_manip else 'NON-MANIPULATOR',
        'risk_level': 'HIGH' if is_manip else 'LOW',
        'red_flags_count': sum(flags),
        'ratios': ratios,
        'methodology': 'Beneish M-Score using 8 financial ratios'
    }

def generate_charts(data, result):
    charts = []
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

    # M-Score bar
    m = result['m_score']
    t = result['threshold']
    ax1.barh([0], [m], color='red' if m > t else 'green', height=0.5, alpha=0.7)
    ax1.axvline(x=t, color='black', linestyle='--', linewidth=2)
    ax1.set_xlim(-5, 1)
    ax1.set_title(f"M-Score: {m:.4f} ({result['classification']})")
    ax1.set_yticks([])

    # Ratios
    names = list(result['ratios'].keys())
    vals = [result['ratios'][n]['value'] for n in names]
    cols = ['red' if result['ratios'][n]['flag'] else 'green' for n in names]
    ax2.barh(names, vals, color=cols, alpha=0.7)
    ax2.set_title('8 Ratios (Red=Flag)')

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    charts.append({'name': 'beneish', 'data': base64.b64encode(buf.read()).decode('utf-8')})
    plt.close()
    return charts

if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')
    result = calculate_beneish(data, params)
    result['charts'] = generate_charts(data, result)
    print(json.dumps(result))
