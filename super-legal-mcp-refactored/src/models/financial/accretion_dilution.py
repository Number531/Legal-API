"""
Accretion/Dilution - Merger EPS impact analysis
"""
import json
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

def calculate_accretion_dilution(data, params):
    # Acquirer data
    acq = data.get('acquirer', {})
    acq_name = acq.get('name', 'Acquirer')
    acq_shares = acq.get('shares_outstanding', 100)
    acq_price = acq.get('share_price', 50)
    acq_ni = acq.get('net_income', 500)
    acq_eps = acq_ni / acq_shares if acq_shares > 0 else 0

    # Target data
    tgt = data.get('target', {})
    tgt_name = tgt.get('name', 'Target')
    tgt_shares = tgt.get('shares_outstanding', 50)
    tgt_ni = tgt.get('net_income', 100)

    # Deal terms
    offer_price = params.get('offer_price', 30)
    cash_pct = params.get('cash_pct', 0.50)
    stock_pct = 1 - cash_pct

    # Synergies
    synergies = params.get('synergies', 50)
    synergy_phase_in = params.get('synergy_phase_in', [0.25, 0.50, 0.75, 1.0])
    tax_rate = params.get('tax_rate', 0.25)

    # Financing
    debt_rate = params.get('debt_rate', 0.05)
    foregone_interest = params.get('foregone_interest_rate', 0.02)  # on cash used

    # Calculate deal value
    deal_value = offer_price * tgt_shares
    cash_portion = deal_value * cash_pct
    stock_portion = deal_value * stock_pct

    # New shares issued
    new_shares = stock_portion / acq_price if acq_price > 0 else 0
    total_shares = acq_shares + new_shares

    # Pro forma analysis by year
    years = list(range(len(synergy_phase_in) + 1))
    results_by_year = []

    for i, year in enumerate(years):
        if i == 0:
            # Year 0: Pre-deal
            pf_ni = acq_ni
            pf_shares = acq_shares
            pf_eps = acq_eps
            synergy_realized = 0
            accretion = 0
        else:
            phase = synergy_phase_in[i - 1] if i - 1 < len(synergy_phase_in) else 1.0
            synergy_realized = synergies * phase

            # Pro forma net income
            combined_ni = acq_ni + tgt_ni
            synergy_after_tax = synergy_realized * (1 - tax_rate)

            # Financing costs
            debt_interest = cash_portion * debt_rate * (1 - tax_rate)  # tax-deductible
            foregone = cash_portion * foregone_interest * (1 - tax_rate)

            pf_ni = combined_ni + synergy_after_tax - debt_interest - foregone
            pf_shares = total_shares
            pf_eps = pf_ni / pf_shares if pf_shares > 0 else 0

            accretion = (pf_eps - acq_eps) / acq_eps * 100 if acq_eps > 0 else 0

        results_by_year.append({
            'year': year,
            'pro_forma_net_income': float(pf_ni),
            'pro_forma_shares': float(pf_shares),
            'pro_forma_eps': float(pf_eps),
            'synergies_realized': float(synergy_realized) if i > 0 else 0,
            'accretion_dilution_pct': float(accretion),
            'is_accretive': accretion > 0
        })

    # Breakeven synergies (what synergies needed for Year 1 to be neutral)
    year1 = results_by_year[1] if len(results_by_year) > 1 else None
    if year1:
        phase1 = synergy_phase_in[0]
        # Solve for synergies where accretion = 0
        combined_ni = acq_ni + tgt_ni
        debt_interest = cash_portion * debt_rate * (1 - tax_rate)
        foregone = cash_portion * foregone_interest * (1 - tax_rate)

        target_ni = acq_eps * total_shares  # to match original EPS
        required_synergy_at = target_ni - combined_ni + debt_interest + foregone
        breakeven_synergies = required_synergy_at / (1 - tax_rate) / phase1 if phase1 > 0 else 0
    else:
        breakeven_synergies = 0

    return {
        'acquirer': {
            'name': acq_name,
            'shares': float(acq_shares),
            'share_price': float(acq_price),
            'net_income': float(acq_ni),
            'eps': float(acq_eps)
        },
        'target': {
            'name': tgt_name,
            'shares': float(tgt_shares),
            'net_income': float(tgt_ni)
        },
        'deal': {
            'offer_price': float(offer_price),
            'deal_value': float(deal_value),
            'cash_portion': float(cash_portion),
            'stock_portion': float(stock_portion),
            'cash_pct': float(cash_pct * 100),
            'new_shares_issued': float(new_shares),
            'total_shares_pf': float(total_shares)
        },
        'synergies': {
            'total': float(synergies),
            'phase_in': synergy_phase_in,
            'breakeven_synergies': float(breakeven_synergies)
        },
        'pro_forma_by_year': results_by_year,
        'summary': {
            'year1_accretion_pct': results_by_year[1]['accretion_dilution_pct'] if len(results_by_year) > 1 else 0,
            'fully_phased_accretion_pct': results_by_year[-1]['accretion_dilution_pct'],
            'is_accretive_year1': results_by_year[1]['is_accretive'] if len(results_by_year) > 1 else False
        },
        'methodology': 'Accretion/Dilution analysis with synergy phase-in and financing costs'
    }

def generate_charts(data, result):
    charts = []
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    pf = result['pro_forma_by_year']
    years = [p['year'] for p in pf]
    eps_vals = [p['pro_forma_eps'] for p in pf]
    accretion = [p['accretion_dilution_pct'] for p in pf[1:]]  # skip year 0

    # EPS trajectory
    axes[0, 0].plot(years, eps_vals, 'b-o', linewidth=2, markersize=8)
    axes[0, 0].axhline(y=result['acquirer']['eps'], color='gray', linestyle='--', label='Pre-deal EPS')
    axes[0, 0].fill_between(years, result['acquirer']['eps'], eps_vals, alpha=0.3,
                            color='green' if eps_vals[-1] > result['acquirer']['eps'] else 'red')
    axes[0, 0].set_title('Pro Forma EPS Trajectory')
    axes[0, 0].set_xlabel('Year')
    axes[0, 0].set_ylabel('EPS ($)')
    axes[0, 0].legend()

    # Accretion/Dilution bars
    colors = ['green' if a > 0 else 'red' for a in accretion]
    axes[0, 1].bar(range(1, len(accretion) + 1), accretion, color=colors, alpha=0.7)
    axes[0, 1].axhline(y=0, color='black', linewidth=1)
    axes[0, 1].set_title('Accretion/(Dilution) by Year')
    axes[0, 1].set_xlabel('Year')
    axes[0, 1].set_ylabel('Accretion %')

    # Deal structure pie
    deal = result['deal']
    axes[1, 0].pie([deal['cash_portion'], deal['stock_portion']],
                   labels=['Cash', 'Stock'],
                   autopct='%1.1f%%',
                   colors=['gold', 'steelblue'])
    axes[1, 0].set_title(f"Deal Structure (${deal['deal_value']:.0f}M)")

    # Synergy phase-in
    syn = result['synergies']
    syn_realized = [p['synergies_realized'] for p in pf[1:]]
    axes[1, 1].bar(range(1, len(syn_realized) + 1), syn_realized, color='green', alpha=0.7)
    axes[1, 1].axhline(y=syn['total'], color='green', linestyle='--', label='Total Synergies')
    axes[1, 1].set_title('Synergy Realization')
    axes[1, 1].set_xlabel('Year')
    axes[1, 1].set_ylabel('Synergies ($M)')
    axes[1, 1].legend()

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    charts.append({'name': 'accretion_dilution', 'data': base64.b64encode(buf.read()).decode('utf-8')})
    plt.close()
    return charts

if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')
    result = calculate_accretion_dilution(data, params)
    result['charts'] = generate_charts(data, result)
    print(json.dumps(result))
