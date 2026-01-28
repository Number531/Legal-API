"""
Regression Analysis for Causation/Discrimination Cases
For but-for scenarios, employment discrimination, antitrust damages

Input Data (financialData):
- dependent: Array of dependent variable values (Y)
- independents: Object with named arrays of independent variables (X1, X2, ...)
- treatment: Array of treatment/event indicator (0/1) for diff-in-diff
- time_period: Array of time period indicator (0=pre, 1=post) for diff-in-diff
- group: Array of group indicator for fixed effects

Parameters:
- model_type: 'ols', 'difference_in_difference', 'fixed_effects' (default: 'ols')
- robust_se: Use heteroskedasticity-robust standard errors (default: true)
- confidence_level: For hypothesis testing (default: 0.95)
"""

import json
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
import io
import base64

def calculate_regression(data, params):
    # Extract data
    y = np.array(data.get('dependent', []))
    independents = data.get('independents', {})

    if len(y) == 0:
        raise ValueError("Dependent variable required")

    # Parameters
    model_type = params.get('model_type', 'ols')
    robust_se = params.get('robust_se', True)
    confidence = params.get('confidence_level', 0.95)

    n = len(y)

    # Build design matrix
    if model_type == 'difference_in_difference':
        treatment = np.array(data.get('treatment', np.zeros(n)))
        time_period = np.array(data.get('time_period', np.zeros(n)))
        interaction = treatment * time_period

        X = np.column_stack([
            np.ones(n),
            treatment,
            time_period,
            interaction
        ])
        var_names = ['Intercept', 'Treatment', 'Post', 'Treatment x Post (DiD)']

    elif model_type == 'fixed_effects':
        # Create group dummies
        group = np.array(data.get('group', np.zeros(n)))
        unique_groups = np.unique(group)
        group_dummies = np.column_stack([
            (group == g).astype(float) for g in unique_groups[1:]  # Skip first for reference
        ])

        # Add other independents
        X_indep = []
        var_names = ['Intercept']
        for name, values in independents.items():
            X_indep.append(np.array(values))
            var_names.append(name)

        if X_indep:
            X = np.column_stack([np.ones(n)] + X_indep + [group_dummies])
        else:
            X = np.column_stack([np.ones(n), group_dummies])

        for i, g in enumerate(unique_groups[1:]):
            var_names.append(f'Group_{g}')

    else:  # OLS
        X_list = [np.ones(n)]
        var_names = ['Intercept']
        for name, values in independents.items():
            X_list.append(np.array(values))
            var_names.append(name)
        X = np.column_stack(X_list)

    # OLS estimation
    XtX = X.T @ X
    XtX_inv = np.linalg.inv(XtX)
    beta = XtX_inv @ X.T @ y

    # Predictions and residuals
    y_pred = X @ beta
    residuals = y - y_pred

    # Sum of squares
    ss_res = np.sum(residuals ** 2)
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    r_squared = 1 - (ss_res / ss_tot)

    # Degrees of freedom
    k = X.shape[1]
    df = n - k

    # Adjusted R-squared
    r_squared_adj = 1 - (1 - r_squared) * (n - 1) / df

    # Standard errors
    if robust_se:
        # Heteroskedasticity-robust (HC1)
        u_sq = residuals ** 2
        meat = X.T @ np.diag(u_sq) @ X
        var_beta = XtX_inv @ meat @ XtX_inv * (n / df)
        se = np.sqrt(np.diag(var_beta))
        se_type = 'robust (HC1)'
    else:
        mse = ss_res / df
        var_beta = mse * XtX_inv
        se = np.sqrt(np.diag(var_beta))
        se_type = 'standard'

    # t-statistics and p-values
    t_stats = beta / se
    p_values = 2 * (1 - stats.t.cdf(np.abs(t_stats), df))

    # Confidence intervals
    t_crit = stats.t.ppf((1 + confidence) / 2, df)
    ci_lower = beta - t_crit * se
    ci_upper = beta + t_crit * se

    # F-statistic (all coefficients except intercept)
    r_matrix = np.eye(k)[1:]  # Exclude intercept
    r_beta = r_matrix @ beta
    r_var = r_matrix @ var_beta @ r_matrix.T
    f_stat = (r_beta.T @ np.linalg.inv(r_var) @ r_beta) / (k - 1)
    f_pvalue = 1 - stats.f.cdf(f_stat, k - 1, df)

    # Build coefficient results
    coefficients = []
    for i, name in enumerate(var_names):
        coefficients.append({
            'variable': name,
            'coefficient': float(beta[i]),
            'std_error': float(se[i]),
            't_statistic': float(t_stats[i]),
            'p_value': float(p_values[i]),
            'ci_lower': float(ci_lower[i]),
            'ci_upper': float(ci_upper[i]),
            'significant': p_values[i] < (1 - confidence)
        })

    # Special handling for DiD
    did_estimate = None
    if model_type == 'difference_in_difference':
        did_idx = var_names.index('Treatment x Post (DiD)')
        did_estimate = {
            'effect': float(beta[did_idx]),
            'std_error': float(se[did_idx]),
            'p_value': float(p_values[did_idx]),
            'significant': p_values[did_idx] < (1 - confidence),
            'interpretation': f"The treatment effect is {beta[did_idx]:.4f} "
                            f"({'statistically significant' if p_values[did_idx] < 0.05 else 'not significant'} at 5% level)"
        }

    return {
        'coefficients': coefficients,
        'r_squared': float(r_squared),
        'r_squared_adjusted': float(r_squared_adj),
        'f_statistic': float(f_stat),
        'f_pvalue': float(f_pvalue),
        'n_observations': n,
        'degrees_of_freedom': df,
        'residual_std_error': float(np.sqrt(ss_res / df)),
        'se_type': se_type,
        'did_estimate': did_estimate,
        'model_type': model_type,
        'predictions': y_pred.tolist(),
        'residuals': residuals.tolist(),
        'methodology': f'{model_type.upper()} regression with {n} observations, '
                      f'{k} variables, {se_type} standard errors'
    }

def generate_charts(data, result):
    charts = []

    # Chart 1: Coefficient Plot
    fig, ax = plt.subplots(figsize=(10, max(4, len(result['coefficients']) * 0.6)))

    coefs = result['coefficients'][1:]  # Skip intercept
    names = [c['variable'] for c in coefs]
    values = [c['coefficient'] for c in coefs]
    errors = [c['std_error'] * 1.96 for c in coefs]  # 95% CI
    colors = ['green' if c['significant'] else 'gray' for c in coefs]

    y_pos = np.arange(len(names))
    ax.barh(y_pos, values, xerr=errors, color=colors, alpha=0.7, capsize=3)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(names)
    ax.axvline(x=0, color='black', linestyle='-', linewidth=0.5)
    ax.set_xlabel('Coefficient Value')
    ax.set_title('Regression Coefficients with 95% Confidence Intervals')

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'coefficients',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    # Chart 2: Residual Diagnostics
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    residuals = result['residuals']
    predictions = result['predictions']

    # Residuals vs Fitted
    axes[0].scatter(predictions, residuals, alpha=0.5, color='steelblue')
    axes[0].axhline(y=0, color='red', linestyle='--')
    axes[0].set_xlabel('Fitted Values')
    axes[0].set_ylabel('Residuals')
    axes[0].set_title('Residuals vs Fitted')

    # Q-Q Plot
    stats.probplot(residuals, dist="norm", plot=axes[1])
    axes[1].set_title('Normal Q-Q Plot')

    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    charts.append({
        'name': 'diagnostics',
        'data': base64.b64encode(buf.read()).decode('utf-8')
    })
    plt.close()

    return charts

# Main execution
if __name__ == '__main__':
    data = json.loads('''DATA_PLACEHOLDER''')
    params = json.loads('''PARAMS_PLACEHOLDER''')

    result = calculate_regression(data, params)
    charts = generate_charts(data, result)
    result['charts'] = charts

    print(json.dumps(result))
