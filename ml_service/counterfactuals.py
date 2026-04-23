"""
counterfactuals.py -- DiCE counterfactual explanations module
=============================================================
Wraps the DiCE (Diverse Counterfactual Explanations) library to generate
feasible counterfactual suggestions showing what a borrower could change
to improve their credit outcome.

Public API:
    generate_counterfactuals(model, instance_dict, feature_names, ...)
        -> list of counterfactual dicts with changes and new PD scores
"""

import numpy as np
import pandas as pd


def generate_counterfactuals(model, scaler, instance_dict, feature_names,
                              training_data_scaled, n_counterfactuals=3):
    """
    Generate diverse counterfactual explanations using DiCE.

    Parameters
    ----------
    model : fitted classifier with predict_proba
    scaler : fitted StandardScaler
    instance_dict : dict mapping feature_name -> raw value
    feature_names : list of str
    training_data_scaled : np.ndarray, scaled training data
    n_counterfactuals : int, number of CFs to generate (min 3)

    Returns
    -------
    list of dict, each containing:
        changes : list of {feature, original, counterfactual, change}
        new_pd_score : float
        new_risk_grade : str
        feasibility_score : float (0-1)
    """
    import dice_ml

    n_counterfactuals = max(n_counterfactuals, 3)

    # Build training DataFrame for DiCE
    bg_sample_size = min(500, len(training_data_scaled))
    rng = np.random.RandomState(42)
    bg_idx = rng.choice(len(training_data_scaled), size=bg_sample_size, replace=False)
    bg_data = training_data_scaled[bg_idx]

    # Inverse-transform to get raw-scale data for DiCE
    bg_raw = scaler.inverse_transform(bg_data)
    df_bg = pd.DataFrame(bg_raw, columns=feature_names)

    # Generate synthetic default labels for the background
    probs = model.predict_proba(bg_data)[:, 1]
    df_bg["default"] = (probs >= 0.5).astype(int)

    # Define continuous features (all features in our case)
    continuous_features = feature_names.copy()

    # Define permitted ranges with realistic constraints
    raw_arr = np.array([[instance_dict.get(fn, 0.0) for fn in feature_names]])
    current_income = instance_dict.get("income_annual", 50000)
    current_emp = instance_dict.get("employment_length", 3.0)

    permitted_range = {
        "income_annual": [
            max(current_income * 0.8, 15000),
            min(current_income * 2.0, 500000),
        ],
        "loan_amount": [1000, instance_dict.get("loan_amount", 50000) * 1.5],
        "employment_length": [current_emp, min(current_emp + 10, 40)],
        "credit_history_age": [
            instance_dict.get("credit_history_age", 24),
            instance_dict.get("credit_history_age", 24) + 120,
        ],
        "lgd": [0.1, 0.9],
        "ead": [1000, instance_dict.get("ead", 50000) * 1.5],
    }

    # Features that should not change (immutable)
    features_to_vary = [
        "income_annual",
        "loan_amount",
        "employment_length",
        "credit_history_age",
        "lgd",
        "ead",
        "debt_to_income",
        "loan_to_income_ratio",
        "risk_exposure_ratio",
    ]

    try:
        # Create DiCE data object
        d = dice_ml.Data(
            dataframe=df_bg,
            continuous_features=continuous_features,
            outcome_name="default",
        )

        # Create DiCE model object
        m = dice_ml.Model(model=model, backend="sklearn")

        # Create DiCE explainer
        exp = dice_ml.Dice(d, m, method="random")

        # Scale the query instance
        scaled_instance = scaler.transform(raw_arr)
        query_df = pd.DataFrame(scaled_instance, columns=feature_names)

        # Generate counterfactuals
        cf = exp.generate_counterfactuals(
            query_df,
            total_CFs=n_counterfactuals + 2,  # generate extra in case some are infeasible
            desired_class="opposite",
            permitted_range=None,  # let DiCE explore freely on scaled data
            features_to_vary=features_to_vary,
        )

        cf_df = cf.cf_examples_list[0].final_cfs_df
        if cf_df is None or len(cf_df) == 0:
            return _generate_heuristic_counterfactuals(
                model, scaler, instance_dict, feature_names
            )

        # Process counterfactuals
        results = []
        for _, row in cf_df.iterrows():
            if len(results) >= n_counterfactuals:
                break

            cf_scaled = row[feature_names].values.reshape(1, -1).astype(float)
            cf_raw = scaler.inverse_transform(cf_scaled)[0]
            original_raw = scaler.inverse_transform(scaled_instance)[0]

            new_pd = float(model.predict_proba(cf_scaled)[:, 1][0])
            new_grade = _pd_to_grade(new_pd)

            changes = []
            for i, fn in enumerate(feature_names):
                orig_val = float(original_raw[i])
                cf_val = float(cf_raw[i])
                diff = cf_val - orig_val
                if abs(diff) > 0.01 * max(abs(orig_val), 1):
                    changes.append({
                        "feature": fn,
                        "original": round(orig_val, 2),
                        "counterfactual": round(cf_val, 2),
                        "change": round(diff, 2),
                        "change_pct": round(diff / max(abs(orig_val), 0.01) * 100, 1),
                    })

            if changes:
                feasibility = _compute_feasibility(changes)
                results.append({
                    "changes": changes,
                    "new_pd_score": round(new_pd, 4),
                    "new_risk_grade": new_grade,
                    "feasibility_score": feasibility,
                })

        if len(results) < 3:
            heuristic = _generate_heuristic_counterfactuals(
                model, scaler, instance_dict, feature_names
            )
            results.extend(heuristic[: 3 - len(results)])

        return results[:n_counterfactuals]

    except Exception as e:
        print(f"DiCE failed ({e}), falling back to heuristic counterfactuals")
        return _generate_heuristic_counterfactuals(
            model, scaler, instance_dict, feature_names
        )


def _pd_to_grade(pd_score):
    """Convert PD score to risk grade."""
    if pd_score < 0.15:
        return "A"
    elif pd_score < 0.30:
        return "B"
    elif pd_score < 0.50:
        return "C"
    else:
        return "D"


def _compute_feasibility(changes):
    """
    Heuristic feasibility score (0-1) based on:
    - Number of features changed (fewer = more feasible)
    - Magnitude of changes (smaller = more feasible)
    - Whether changes are in actionable direction
    """
    n_changes = len(changes)
    if n_changes == 0:
        return 1.0

    # Penalty for number of changes
    change_penalty = max(0, 1.0 - n_changes * 0.1)

    # Penalty for large percentage changes
    avg_pct = np.mean([abs(c.get("change_pct", 0)) for c in changes])
    magnitude_score = max(0, 1.0 - avg_pct / 200)

    # Actionable features (income can increase, loan can decrease, etc.)
    actionable = {"income_annual", "loan_amount", "employment_length", "ead", "lgd"}
    actionable_ratio = sum(1 for c in changes if c["feature"] in actionable) / max(n_changes, 1)

    score = 0.4 * change_penalty + 0.3 * magnitude_score + 0.3 * actionable_ratio
    return round(min(max(score, 0.0), 1.0), 2)


def _generate_heuristic_counterfactuals(model, scaler, instance_dict, feature_names):
    """
    Fallback: generate counterfactuals using heuristic perturbations
    when DiCE fails or produces insufficient results.
    """
    raw_arr = np.array([[instance_dict.get(fn, 0.0) for fn in feature_names]])
    scaled = scaler.transform(raw_arr)

    scenarios = [
        # Scenario 1: Increase income by 30%, reduce loan by 20%
        {"income_annual": 1.3, "loan_amount": 0.8, "debt_to_income": 0.62,
         "loan_to_income_ratio": 0.62, "risk_exposure_ratio": 0.8},
        # Scenario 2: Increase employment length, increase credit history
        {"employment_length": 2.0, "employment_stability_score": 1.5,
         "credit_history_age": 1.5, "credit_maturity_score": 1.3},
        # Scenario 3: Reduce LGD, reduce EAD
        {"lgd": 0.6, "ead": 0.7, "risk_exposure_ratio": 0.42,
         "loan_amount": 0.85, "debt_to_income": 0.85},
    ]

    results = []
    for scenario in scenarios:
        cf_raw = raw_arr.copy()
        for fn, multiplier in scenario.items():
            idx = feature_names.index(fn) if fn in feature_names else -1
            if idx >= 0:
                cf_raw[0, idx] *= multiplier

        cf_scaled = scaler.transform(cf_raw)
        new_pd = float(model.predict_proba(cf_scaled)[:, 1][0])
        new_grade = _pd_to_grade(new_pd)

        original_raw = scaler.inverse_transform(scaled)[0]
        cf_raw_inv = scaler.inverse_transform(cf_scaled)[0]

        changes = []
        for i, fn in enumerate(feature_names):
            orig = float(original_raw[i])
            new = float(cf_raw_inv[i])
            diff = new - orig
            if abs(diff) > 0.01 * max(abs(orig), 1):
                changes.append({
                    "feature": fn,
                    "original": round(orig, 2),
                    "counterfactual": round(new, 2),
                    "change": round(diff, 2),
                    "change_pct": round(diff / max(abs(orig), 0.01) * 100, 1),
                })

        results.append({
            "changes": changes,
            "new_pd_score": round(new_pd, 4),
            "new_risk_grade": new_grade,
            "feasibility_score": _compute_feasibility(changes),
        })

    return results
