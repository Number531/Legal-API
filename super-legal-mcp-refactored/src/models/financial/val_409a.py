"""
409A Valuation Model
Fair market value of private company common stock for option pricing

Input Data (financialData):
- company_name: Name of the company
- valuation_date: Date of valuation (YYYY-MM-DD)
- enterprise_value: Pre-calculated enterprise value (from DCF, comps, or financing)
- OR recent_financing: Object with financing round details
  - price_per_share: Price paid for preferred
  - post_money_valuation: Post-money valuation
  - date: Date of financing (YYYY-MM-DD)
- preferred_series: Array of preferred stock series, each with:
  - series_name: Name (e.g., "Series A", "Series B")
  - shares_outstanding: Number of shares
  - liquidation_preference_per_share: Liquidation preference per share
  - participating: Whether participating preferred (default: false)
  - participation_cap: Cap on participation as multiple (e.g., 3 for 3x)
- common_shares: Number of common shares outstanding
- option_pool_shares: Shares reserved for option pool (optional)
- time_to_liquidity: Expected years to exit event (default: 3)

Parameters:
- volatility: Expected volatility for OPM (default: 0.50)
- risk_free_rate: Risk-free rate (default: 0.04)
- dlom: Discount for Lack of Marketability (default: 0.25)
- method: Valuation method - 'opm' or 'backsolve' (default: 'opm')
"""

import json
import numpy as np
from scipy.stats import norm
import matplotlib.pyplot as plt
import io
import base64

def black_scholes_call(S, K, T, r, sigma):
    """Black-Scholes call option value"""
    # Handle edge cases
    if K <= 0:
        # Strike at or below zero means full intrinsic value
        return S
    if T <= 0 or sigma <= 0:
        return max(0, S - K)
    if S <= 0:
        return 0
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

def calculate_409a(data, params):
    # Extract data
    company_name = data.get('company_name', 'Company')
    valuation_date = data.get('valuation_date', '2024-01-01')
    preferred_series = data.get('preferred_series', [])
    common_shares = data.get('common_shares', 0)
    option_pool_shares = data.get('option_pool_shares', 0)
    time_to_liquidity = data.get('time_to_liquidity', 3)

    # Parameters with defaults
    volatility = params.get('volatility', 0.50)
    risk_free_rate = params.get('risk_free_rate', 0.04)
    dlom = params.get('dlom', 0.25)
    method = params.get('method', 'opm')

    # Get enterprise value (either directly or from financing)
    if data.get('enterprise_value'):
        enterprise_value = data['enterprise_value']
    elif data.get('recent_financing'):
        financing = data['recent_financing']
        enterprise_value = financing.get('post_money_valuation', 0)
    else:
        raise ValueError("Either enterprise_value or recent_financing required")

    if enterprise_value <= 0:
        raise ValueError("Enterprise value must be positive")

    # Calculate fully diluted shares
    total_preferred_shares = sum(s.get('shares_outstanding', 0) for s in preferred_series)
    fully_diluted_shares = common_shares + total_preferred_shares + option_pool_shares

    # Calculate total liquidation preference
    total_liquidation_preference = sum(
        s.get('shares_outstanding', 0) * s.get('liquidation_preference_per_share', 0)
        for s in preferred_series
    )

    # Sort preferred by seniority (assume in order of data)
    # Build breakpoints for OPM
    breakpoints = [0]  # Start at 0

    # Add liquidation preference breakpoint
    breakpoints.append(total_liquidation_preference)

    # Add participation cap breakpoints if applicable
    cumulative_pref = 0
    for series in preferred_series:
        shares = series.get('shares_outstanding', 0)
        liq_pref = shares * series.get('liquidation_preference_per_share', 0)
        cumulative_pref += liq_pref

        if series.get('participating') and series.get('participation_cap'):
            cap_breakpoint = shares * series['participation_cap'] * series.get('liquidation_preference_per_share', 0)
            if cap_breakpoint not in breakpoints:
                breakpoints.append(cap_breakpoint)

    # Add high breakpoint
    breakpoints.append(enterprise_value * 5)  # Far OTM for upper bound
    breakpoints = sorted(set(breakpoints))

    # OPM Allocation
    # For each breakpoint, calculate call option spreads
    # Value to common = portion of each tranche allocated to common

    # Simplified OPM: Calculate value between breakpoints
    tranche_values = []
    call_values = []

    for i, bp in enumerate(breakpoints):
        cv = black_scholes_call(enterprise_value, bp, time_to_liquidity, risk_free_rate, volatility)
        call_values.append(cv)

    # Tranche values = difference between consecutive call values
    for i in range(len(breakpoints) - 1):
        tranche_value = call_values[i] - call_values[i + 1]
        tranche_values.append({
            'lower_bound': breakpoints[i],
            'upper_bound': breakpoints[i + 1],
            'tranche_value': float(tranche_value),
            'call_at_lower': float(call_values[i]),
            'call_at_upper': float(call_values[i + 1])
        })

    # Allocation logic:
    # - Below liquidation preference: all to preferred
    # - Above liquidation preference: pro-rata between preferred (if participating) and common

    common_value = 0
    preferred_value = 0

    for i, tranche in enumerate(tranche_values):
        if i == 0:
            # First tranche (0 to liquidation preference) - all to preferred
            preferred_value += tranche['tranche_value']
        else:
            # Above liquidation preference
            # Check if preferred is participating
            participating_preferred_shares = sum(
                s.get('shares_outstanding', 0)
                for s in preferred_series
                if s.get('participating', False)
            )

            # Pro-rata allocation
            common_ownership = common_shares / fully_diluted_shares
            preferred_ownership = (total_preferred_shares + participating_preferred_shares) / fully_diluted_shares

            # Normalize (if not participating, preferred converts to common)
            non_participating_shares = total_preferred_shares - participating_preferred_shares
            common_equivalent = common_shares + non_participating_shares

            common_allocation = common_equivalent / fully_diluted_shares
            preferred_allocation = participating_preferred_shares / fully_diluted_shares

            common_value += tranche['tranche_value'] * common_allocation
            preferred_value += tranche['tranche_value'] * preferred_allocation

    # Calculate per-share values
    common_value_per_share_pre_dlom = common_value / common_shares if common_shares > 0 else 0
    common_value_per_share_post_dlom = common_value_per_share_pre_dlom * (1 - dlom)

    # For comparison: simple as-converted value
    as_converted_value = enterprise_value / fully_diluted_shares
    as_converted_with_dlom = as_converted_value * (1 - dlom)

    # Implied preferred values
    preferred_value_per_share = preferred_value / total_preferred_shares if total_preferred_shares > 0 else 0

    # Calculate option pool value
    option_pool_value = common_value_per_share_post_dlom * option_pool_shares

    return {
        'fair_market_value': {
            'common_per_share_pre_dlom': float(common_value_per_share_pre_dlom),
            'common_per_share_post_dlom': float(common_value_per_share_post_dlom),
            'dlom_applied': dlom,
            'total_common_value': float(common_value),
            'total_preferred_value': float(preferred_value)
        },
        'as_converted_comparison': {
            'as_converted_per_share': float(as_converted_value),
            'as_converted_with_dlom': float(as_converted_with_dlom),
            'opm_discount_to_as_converted': float(1 - common_value_per_share_post_dlom / as_converted_with_dlom) if as_converted_with_dlom > 0 else None
        },
        'equity_allocation': {
            'enterprise_value': float(enterprise_value),
            'total_common_value': float(common_value),
            'total_preferred_value': float(preferred_value),
            'common_percentage': float(common_value / enterprise_value) if enterprise_value > 0 else 0,
            'preferred_percentage': float(preferred_value / enterprise_value) if enterprise_value > 0 else 0
        },
        'capitalization': {
            'common_shares': common_shares,
            'preferred_shares': total_preferred_shares,
            'option_pool_shares': option_pool_shares,
            'fully_diluted_shares': fully_diluted_shares,
            'total_liquidation_preference': float(total_liquidation_preference)
        },
        'opm_details': {
            'breakpoints': breakpoints,
            'call_values': [float(cv) for cv in call_values],
            'tranche_analysis': tranche_values
        },
        'assumptions': {
            'volatility': volatility,
            'risk_free_rate': risk_free_rate,
            'time_to_liquidity': time_to_liquidity,
            'dlom': dlom,
            'method': method
        },
        'methodology': f'409A OPM with {volatility:.0%} volatility, {time_to_liquidity}yr exit, {dlom:.0%} DLOM'
    }

def generate_charts(data, result):
    charts = []

    # Chart 1: Equity Waterfall
    fig, ax = plt.subplots(figsize=(10, 6))

    categories = ['Enterprise\nValue', 'Preferred\nValue', 'Common\nValue', 'Option\nPool Reserve']
    values = [
        result['equity_allocation']['enterprise_value'],
        result['equity_allocation']['total_preferred_value'],
        result['equity_allocation']['total_common_value'],
        result['fair_market_value']['common_per_share_post_dlom'] * data.get('option_pool_shares', 0)
    ]
    colors = ['gray', 'steelblue', 'green', 'orange']

    bars = ax.bar(categories, values, color=colors, alpha=0.8)
    ax.set_ylabel('Value ($)')
    ax.set_title('409A Equity Value Allocation')

    # Add value labels
    for bar, val in zip(bars, values):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'${val:,.0f}', ha='center', va='bottom', fontsize=9)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'equity_waterfall',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    # Chart 2: OPM Call Option Values
    fig, ax = plt.subplots(figsize=(10, 6))

    breakpoints = result['opm_details']['breakpoints'][:-1]  # Exclude far OTM
    call_values = result['opm_details']['call_values'][:-1]

    if breakpoints and call_values:
        ax.plot(breakpoints, call_values, 'o-', color='steelblue', linewidth=2, markersize=8)
        ax.set_xlabel('Strike Price (Breakpoint) ($)')
        ax.set_ylabel('Call Option Value ($)')
        ax.set_title('OPM Call Option Values at Breakpoints')
        ax.axhline(y=result['equity_allocation']['enterprise_value'], color='red',
                   linestyle='--', label='Enterprise Value')
        ax.axvline(x=result['capitalization']['total_liquidation_preference'], color='orange',
                   linestyle='--', label='Liquidation Preference')
        ax.legend()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'opm_call_values',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    # Chart 3: Per-Share Value Comparison
    fig, ax = plt.subplots(figsize=(8, 6))

    labels = ['As-Converted', 'OPM Pre-DLOM', 'OPM Post-DLOM\n(409A FMV)']
    values = [
        result['as_converted_comparison']['as_converted_per_share'],
        result['fair_market_value']['common_per_share_pre_dlom'],
        result['fair_market_value']['common_per_share_post_dlom']
    ]
    colors = ['gray', 'steelblue', 'green']

    bars = ax.bar(labels, values, color=colors, alpha=0.8)
    ax.set_ylabel('Price per Share ($)')
    ax.set_title('Common Stock Fair Market Value')

    # Add value labels
    for bar, val in zip(bars, values):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'${val:.2f}', ha='center', va='bottom', fontsize=10)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'per_share_comparison',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    return charts

# Main execution
if __name__ == '__main__':
    # Placeholders replaced by handler
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')

    result = calculate_409a(data, params)
    charts = generate_charts(data, result)
    result['charts'] = charts

    print(json.dumps(result))
