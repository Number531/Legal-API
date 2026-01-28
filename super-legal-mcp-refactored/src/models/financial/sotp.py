"""
Sum-of-the-Parts (SOTP) - Conglomerate segment valuation
"""
import json
import numpy as np
import matplotlib.pyplot as plt
import io
import base64

def calculate_sotp(data, params):
    company = data.get('company_name', 'Conglomerate')
    segments = data.get('segments', [])

    if not segments:
        raise ValueError("At least one segment required")

    conglomerate_discount = params.get('conglomerate_discount', 0.10)
    corporate_costs = params.get('corporate_costs', 0)

    segment_values = []
    total_revenue = 0
    total_ebitda = 0
    total_value = 0

    for seg in segments:
        name = seg.get('name', 'Segment')
        revenue = seg.get('revenue', 0)
        ebitda = seg.get('ebitda', 0)
        multiple = seg.get('multiple', 8.0)
        growth = seg.get('growth_rate', 0.05)

        seg_value = ebitda * multiple

        segment_values.append({
            'name': name,
            'revenue': float(revenue),
            'ebitda': float(ebitda),
            'multiple': float(multiple),
            'growth_rate': float(growth),
            'segment_value': float(seg_value),
            'value_contribution_pct': 0  # calculated after total
        })

        total_revenue += revenue
        total_ebitda += ebitda
        total_value += seg_value

    # Calculate contribution percentages
    for seg in segment_values:
        seg['value_contribution_pct'] = (seg['segment_value'] / total_value * 100) if total_value > 0 else 0

    # Net asset value
    gross_value = total_value
    corporate_adjustment = -abs(corporate_costs)
    nav_before_discount = gross_value + corporate_adjustment
    discount_amount = nav_before_discount * conglomerate_discount
    nav_after_discount = nav_before_discount - discount_amount

    # Implied multiples
    implied_multiple = nav_after_discount / total_ebitda if total_ebitda > 0 else 0
    blended_multiple = total_value / total_ebitda if total_ebitda > 0 else 0

    # Breakup analysis
    breakup_value = gross_value + corporate_adjustment
    breakup_premium = (breakup_value / nav_after_discount - 1) * 100 if nav_after_discount > 0 else 0

    return {
        'company': company,
        'segments': segment_values,
        'totals': {
            'revenue': float(total_revenue),
            'ebitda': float(total_ebitda),
            'gross_segment_value': float(gross_value)
        },
        'valuation': {
            'gross_value': float(gross_value),
            'corporate_costs': float(corporate_adjustment),
            'nav_before_discount': float(nav_before_discount),
            'conglomerate_discount_pct': float(conglomerate_discount * 100),
            'discount_amount': float(discount_amount),
            'nav_after_discount': float(nav_after_discount)
        },
        'multiples': {
            'blended_multiple': float(blended_multiple),
            'implied_multiple_after_discount': float(implied_multiple)
        },
        'breakup_analysis': {
            'breakup_value': float(breakup_value),
            'current_value': float(nav_after_discount),
            'breakup_premium_pct': float(breakup_premium)
        },
        'methodology': 'Sum-of-the-Parts with conglomerate discount adjustment'
    }

def generate_charts(data, result):
    charts = []
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    segments = result['segments']
    names = [s['name'] for s in segments]
    values = [s['segment_value'] for s in segments]
    ebitdas = [s['ebitda'] for s in segments]
    multiples = [s['multiple'] for s in segments]

    # Segment value pie chart
    colors = plt.cm.Set3(np.linspace(0, 1, len(segments)))
    axes[0, 0].pie(values, labels=names, autopct='%1.1f%%', colors=colors)
    axes[0, 0].set_title('Value by Segment')

    # Segment comparison bar chart
    x = np.arange(len(names))
    width = 0.35
    axes[0, 1].bar(x - width/2, ebitdas, width, label='EBITDA', color='steelblue', alpha=0.7)
    ax2 = axes[0, 1].twinx()
    ax2.bar(x + width/2, multiples, width, label='Multiple', color='orange', alpha=0.7)
    axes[0, 1].set_xticks(x)
    axes[0, 1].set_xticklabels(names, rotation=45, ha='right')
    axes[0, 1].set_ylabel('EBITDA ($M)')
    ax2.set_ylabel('Multiple (x)')
    axes[0, 1].set_title('Segment Metrics')
    axes[0, 1].legend(loc='upper left')
    ax2.legend(loc='upper right')

    # Valuation waterfall
    val = result['valuation']
    waterfall_labels = ['Gross Value', 'Corp Costs', 'Pre-Discount', 'Discount', 'NAV']
    waterfall_vals = [
        val['gross_value'],
        val['corporate_costs'],
        val['nav_before_discount'],
        -val['discount_amount'],
        val['nav_after_discount']
    ]
    colors_wf = ['green', 'red', 'blue', 'red', 'gold']
    axes[1, 0].bar(range(5), waterfall_vals, color=colors_wf, alpha=0.7)
    axes[1, 0].set_xticks(range(5))
    axes[1, 0].set_xticklabels(waterfall_labels, rotation=45, ha='right')
    axes[1, 0].set_title('Valuation Waterfall')
    axes[1, 0].set_ylabel('Value ($M)')
    axes[1, 0].axhline(y=0, color='black', linewidth=0.5)

    # Breakup vs current value
    ba = result['breakup_analysis']
    axes[1, 1].bar(['Current Value', 'Breakup Value'], [ba['current_value'], ba['breakup_value']],
                   color=['steelblue', 'green'], alpha=0.7)
    axes[1, 1].set_title(f"Breakup Premium: {ba['breakup_premium_pct']:.1f}%")
    axes[1, 1].set_ylabel('Value ($M)')

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    charts.append({'name': 'sotp_analysis', 'data': base64.b64encode(buf.read()).decode('utf-8')})
    plt.close()
    return charts

if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')
    result = calculate_sotp(data, params)
    result['charts'] = generate_charts(data, result)
    print(json.dumps(result))
