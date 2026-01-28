"""
Event Study Model for Securities Analysis
For securities fraud, insider trading, market manipulation cases

Input Data (financialData):
- stock_prices: Array of daily stock prices
- market_prices: Array of corresponding market index prices
- event_date_index: Index position of the event in the price arrays
- dates (optional): Array of date strings for labeling

Parameters:
- estimation_window: Days before event for beta estimation (default: 120)
- event_window_pre: Days before event to include (default: 5)
- event_window_post: Days after event to include (default: 5)
- confidence_level: For significance testing (default: 0.95)
"""

import json
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
import io
import base64

def calculate_event_study(data, params):
    # Extract data
    stock_prices = np.array(data.get('stock_prices', []))
    market_prices = np.array(data.get('market_prices', []))
    event_idx = data.get('event_date_index')

    if len(stock_prices) == 0 or len(market_prices) == 0:
        raise ValueError("Stock and market prices required")
    if event_idx is None:
        raise ValueError("Event date index required")

    # Parameters
    est_window = params.get('estimation_window', 120)
    pre_window = params.get('event_window_pre', 5)
    post_window = params.get('event_window_post', 5)
    confidence = params.get('confidence_level', 0.95)

    # Calculate returns
    stock_returns = np.diff(stock_prices) / stock_prices[:-1]
    market_returns = np.diff(market_prices) / market_prices[:-1]

    # Adjust event index for returns (shifted by 1)
    event_return_idx = event_idx - 1

    # Estimation window returns
    est_start = max(0, event_return_idx - pre_window - est_window)
    est_end = event_return_idx - pre_window

    if est_end - est_start < 30:
        raise ValueError("Insufficient data for estimation window")

    est_stock = stock_returns[est_start:est_end]
    est_market = market_returns[est_start:est_end]

    # Market model regression: R_stock = alpha + beta * R_market + epsilon
    slope, intercept, r_value, p_value, std_err = stats.linregress(est_market, est_stock)
    alpha = intercept
    beta = slope

    # Residual standard error
    predicted = alpha + beta * est_market
    residuals = est_stock - predicted
    sigma = np.std(residuals, ddof=2)

    # Event window
    evt_start = event_return_idx - pre_window
    evt_end = min(len(stock_returns), event_return_idx + post_window + 1)

    event_stock = stock_returns[evt_start:evt_end]
    event_market = market_returns[evt_start:evt_end]

    # Expected returns and abnormal returns
    expected_returns = alpha + beta * event_market
    abnormal_returns = event_stock - expected_returns

    # Cumulative abnormal returns
    car = np.cumsum(abnormal_returns)
    total_car = float(car[-1])

    # Statistical tests
    # t-statistic for CAR
    n_days = len(abnormal_returns)
    car_std = sigma * np.sqrt(n_days)
    t_stat = total_car / car_std
    p_value_car = 2 * (1 - stats.t.cdf(abs(t_stat), df=len(est_stock) - 2))

    # Confidence interval
    t_critical = stats.t.ppf((1 + confidence) / 2, df=len(est_stock) - 2)
    car_ci = (total_car - t_critical * car_std, total_car + t_critical * car_std)

    # Day-by-day abnormal returns with significance
    daily_results = []
    relative_days = list(range(-pre_window, post_window + 1))
    for i, (ar, day) in enumerate(zip(abnormal_returns, relative_days)):
        t_daily = ar / sigma
        p_daily = 2 * (1 - stats.t.cdf(abs(t_daily), df=len(est_stock) - 2))
        daily_results.append({
            'day': day,
            'abnormal_return': float(ar),
            'cumulative_ar': float(car[i]),
            't_statistic': float(t_daily),
            'p_value': float(p_daily),
            'significant': p_daily < (1 - confidence)
        })

    return {
        'car': total_car,
        'car_percent': total_car * 100,
        't_statistic': float(t_stat),
        'p_value': float(p_value_car),
        'significant': p_value_car < (1 - confidence),
        'confidence_interval': {
            'level': confidence,
            'lower': float(car_ci[0]),
            'upper': float(car_ci[1])
        },
        'market_model': {
            'alpha': float(alpha),
            'beta': float(beta),
            'r_squared': float(r_value ** 2),
            'residual_std': float(sigma)
        },
        'event_window': {
            'pre_days': pre_window,
            'post_days': post_window,
            'total_days': n_days
        },
        'daily_results': daily_results,
        'methodology': f'Market model event study with {est_window}-day estimation window, '
                      f'event window [{-pre_window}, +{post_window}]'
    }

def generate_charts(data, result):
    charts = []

    # Chart 1: Cumulative Abnormal Returns
    fig, ax = plt.subplots(figsize=(12, 6))

    days = [d['day'] for d in result['daily_results']]
    cars = [d['cumulative_ar'] * 100 for d in result['daily_results']]
    ars = [d['abnormal_return'] * 100 for d in result['daily_results']]

    ax.bar(days, ars, color='lightsteelblue', alpha=0.7, label='Daily AR')
    ax.plot(days, cars, color='darkblue', linewidth=2, marker='o', label='Cumulative AR')
    ax.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
    ax.axvline(x=0, color='red', linestyle='--', linewidth=1, label='Event Date')

    ax.set_xlabel('Days Relative to Event')
    ax.set_ylabel('Abnormal Return (%)')
    ax.set_title('Event Study: Abnormal Returns Around Event Date')
    ax.legend()
    ax.grid(True, alpha=0.3)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'car_chart',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    # Chart 2: Statistical Significance
    fig, ax = plt.subplots(figsize=(12, 4))

    t_stats = [d['t_statistic'] for d in result['daily_results']]
    colors = ['red' if d['significant'] else 'gray' for d in result['daily_results']]

    ax.bar(days, t_stats, color=colors, alpha=0.7)
    ax.axhline(y=1.96, color='green', linestyle='--', label='95% Critical Value')
    ax.axhline(y=-1.96, color='green', linestyle='--')
    ax.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
    ax.axvline(x=0, color='red', linestyle='--', linewidth=1)

    ax.set_xlabel('Days Relative to Event')
    ax.set_ylabel('t-Statistic')
    ax.set_title('Statistical Significance of Daily Abnormal Returns')
    ax.legend()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'significance_chart',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    return charts

# Main execution
if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')

    result = calculate_event_study(data, params)
    charts = generate_charts(data, result)
    result['charts'] = charts

    print(json.dumps(result))
