"""
Legal Damages Calculator with Prejudgment Interest
For contract disputes, securities fraud, employment cases

Input Data (financialData):
- damages_components: Array of damage items, each with:
  - name: Description of damage item
  - amount: Dollar amount
  - date: Date incurred (ISO format: YYYY-MM-DD)
  - category: 'compensatory', 'consequential', 'lost_profits', 'benefit_of_bargain'
- calculation_date: Date for final calculation (default: today)
- mitigation_amounts (optional): Array of mitigation credits

Parameters:
- interest_rate: Annual prejudgment interest rate (default: based on jurisdiction)
- interest_type: 'simple' or 'compound' (default: 'simple')
- compounding_frequency: If compound, periods per year (default: 1)
- jurisdiction: For default interest rate lookup (default: 'federal')
"""

import json
import numpy as np
from datetime import datetime, date
import matplotlib.pyplot as plt
import io
import base64

# Prejudgment interest rates by jurisdiction (as of 2024)
JURISDICTION_RATES = {
    'federal': 0.0525,  # Treasury rate
    'california': 0.10,
    'new_york': 0.09,
    'texas': 0.05,
    'delaware': 0.05 + 0.0525,  # Prime + 5%
    'illinois': 0.05,
    'florida': 0.0475,
    'default': 0.05
}

def calculate_damages(data, params):
    # Extract data
    components = data.get('damages_components', [])
    if not components:
        raise ValueError("Damages components required")

    calc_date_str = data.get('calculation_date', date.today().isoformat())
    calc_date = datetime.fromisoformat(calc_date_str).date()
    mitigation = data.get('mitigation_amounts', [])

    # Parameters
    jurisdiction = params.get('jurisdiction', 'federal').lower()
    interest_rate = params.get('interest_rate', JURISDICTION_RATES.get(jurisdiction, JURISDICTION_RATES['default']))
    interest_type = params.get('interest_type', 'simple')
    compound_freq = params.get('compounding_frequency', 1)

    # Process each damage component
    component_results = []
    total_principal = 0
    total_interest = 0
    by_category = {}

    for comp in components:
        name = comp.get('name', 'Unnamed')
        amount = float(comp.get('amount', 0))
        date_str = comp.get('date')
        category = comp.get('category', 'compensatory')

        if date_str:
            damage_date = datetime.fromisoformat(date_str).date()
            days = (calc_date - damage_date).days
            years = days / 365.25

            if interest_type == 'compound':
                # Compound interest: P * (1 + r/n)^(nt) - P
                interest = amount * ((1 + interest_rate / compound_freq) ** (compound_freq * years) - 1)
            else:
                # Simple interest: P * r * t
                interest = amount * interest_rate * years
        else:
            days = 0
            years = 0
            interest = 0

        total_with_interest = amount + interest

        component_results.append({
            'name': name,
            'principal': float(amount),
            'date': date_str,
            'days_to_calculation': days,
            'years': float(years),
            'interest': float(interest),
            'total': float(total_with_interest),
            'category': category
        })

        total_principal += amount
        total_interest += interest

        if category not in by_category:
            by_category[category] = {'principal': 0, 'interest': 0}
        by_category[category]['principal'] += amount
        by_category[category]['interest'] += interest

    # Process mitigation
    total_mitigation = 0
    mitigation_results = []
    for mit in mitigation:
        mit_amount = float(mit.get('amount', 0))
        mit_name = mit.get('name', 'Mitigation credit')
        total_mitigation += mit_amount
        mitigation_results.append({
            'name': mit_name,
            'amount': float(mit_amount)
        })

    # Final totals
    gross_damages = total_principal + total_interest
    net_damages = gross_damages - total_mitigation

    # Summary by category
    category_summary = []
    for cat, values in by_category.items():
        category_summary.append({
            'category': cat,
            'principal': float(values['principal']),
            'interest': float(values['interest']),
            'total': float(values['principal'] + values['interest'])
        })

    # Interest rate used
    rate_source = 'user-specified' if 'interest_rate' in params else f'{jurisdiction} statutory rate'

    return {
        'total_damages': float(net_damages),
        'gross_damages': float(gross_damages),
        'total_principal': float(total_principal),
        'total_interest': float(total_interest),
        'total_mitigation': float(total_mitigation),
        'components': component_results,
        'mitigation': mitigation_results,
        'by_category': category_summary,
        'interest_calculation': {
            'rate': float(interest_rate),
            'rate_percent': f'{interest_rate * 100:.2f}%',
            'type': interest_type,
            'source': rate_source,
            'calculation_date': calc_date_str,
            'compounding_frequency': compound_freq if interest_type == 'compound' else None
        },
        'methodology': f'Damages with {interest_type} prejudgment interest at {interest_rate:.2%} '
                      f'({rate_source}), calculated to {calc_date_str}'
    }

def generate_charts(data, result):
    charts = []

    # Chart 1: Damages Breakdown Bar
    fig, ax = plt.subplots(figsize=(10, 6))

    categories = ['Principal', 'Interest', 'Mitigation', 'Net Damages']
    values = [
        result['total_principal'],
        result['total_interest'],
        -result['total_mitigation'],
        result['total_damages']
    ]
    colors = ['steelblue', 'lightsteelblue', 'salmon', 'gold']

    ax.bar(categories, values, color=colors, alpha=0.8, edgecolor='black')
    ax.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
    ax.set_ylabel('Amount ($)')
    ax.set_title('Damages Calculation Summary')

    # Add value labels
    for i, (cat, val) in enumerate(zip(categories, values)):
        ax.text(i, val + (max(values) * 0.02), f'${val:,.0f}', ha='center', fontsize=10)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'damages_summary',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    # Chart 2: Component Timeline
    if result['components']:
        fig, ax = plt.subplots(figsize=(12, 6))

        # Sort by date
        dated_components = [c for c in result['components'] if c['date']]
        if dated_components:
            dated_components.sort(key=lambda x: x['date'])

            dates = [datetime.fromisoformat(c['date']) for c in dated_components]
            principals = [c['principal'] for c in dated_components]
            interests = [c['interest'] for c in dated_components]

            x = range(len(dates))
            width = 0.35

            ax.bar([i - width/2 for i in x], principals, width, label='Principal', color='steelblue', alpha=0.8)
            ax.bar([i + width/2 for i in x], interests, width, label='Interest', color='lightsteelblue', alpha=0.8)

            ax.set_xticks(x)
            ax.set_xticklabels([d.strftime('%Y-%m-%d') for d in dates], rotation=45, ha='right')
            ax.set_ylabel('Amount ($)')
            ax.set_title('Damages Components by Date')
            ax.legend()

            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
            buf.seek(0)
            charts.append({
                'name': 'timeline',
                'data': base64.b64encode(buf.read()).decode('utf-8')
            })
            plt.close()

    # Chart 3: Category Pie
    if result['by_category']:
        fig, ax = plt.subplots(figsize=(8, 8))

        labels = [c['category'].replace('_', ' ').title() for c in result['by_category']]
        sizes = [c['total'] for c in result['by_category']]

        if sum(sizes) > 0:
            ax.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=90,
                   colors=plt.cm.Pastel1(np.linspace(0, 1, len(sizes))))
            ax.set_title('Damages by Category')

            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
            buf.seek(0)
            charts.append({
                'name': 'category_breakdown',
                'data': base64.b64encode(buf.read()).decode('utf-8')
            })
            plt.close()

    return charts

# Main execution
if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')

    result = calculate_damages(data, params)
    charts = generate_charts(data, result)
    result['charts'] = charts

    print(json.dumps(result))
