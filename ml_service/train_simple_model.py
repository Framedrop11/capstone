"""
Simple model trainer that creates a model that DEFINITELY varies with inputs
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

def create_and_train_model():
    """Create a simple model with clear relationships"""
    
    print("Creating training data with clear patterns...")
    
    # Generate synthetic data with clear relationships
    np.random.seed(42)
    n_samples = 10000
    
    # Features
    data = {
        'debt_to_income_ratio': np.random.uniform(0, 0.6, n_samples),
        'credit_utilization': np.random.uniform(0, 1, n_samples),
        'income_stability_score': np.random.uniform(0, 1, n_samples),
        'existing_emi_burden': np.random.uniform(0, 0.5, n_samples),
        'loan_to_income_ratio': np.random.uniform(0.05, 0.5, n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Create target with CLEAR relationships
    # Higher DTI = higher risk
    # Higher utilization = higher risk
    # Higher stability = lower risk
    # Higher EMI burden = higher risk
    # Higher loan/income = higher risk
    
    risk_score = (
        df['debt_to_income_ratio'] * 0.30 +
        df['credit_utilization'] * 0.25 +
        (1 - df['income_stability_score']) * 0.20 +
        df['existing_emi_burden'] * 0.15 +
        df['loan_to_income_ratio'] * 0.10
    )
    
    # Add some noise
    risk_score += np.random.normal(0, 0.05, n_samples)
    
    # Convert to binary target
    threshold = np.percentile(risk_score, 75)  # 25% default rate
    df['target'] = (risk_score > threshold).astype(int)
    
    print(f"Target distribution: Good={sum(df['target']==0)}, Bad={sum(df['target']==1)}")
    print(f"Default rate: {df['target'].mean():.1%}")
    
    # Features and target
    feature_cols = ['debt_to_income_ratio', 'credit_utilization', 
                    'income_stability_score', 'existing_emi_burden', 'loan_to_income_ratio']
    X = df[feature_cols]
    y = df['target']
    
    # Train Random Forest
    print("\nTraining Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=20,
        min_samples_leaf=10,
        random_state=42
    )
    rf_model.fit(X, y)
    
    # Test with sample inputs to verify variation
    print("\n" + "="*60)
    print("TESTING MODEL WITH DIFFERENT INPUTS")
    print("="*60)
    
    test_cases = [
        {"name": "Good Profile", "dti": 0.10, "util": 0.20, "stability": 0.9, "emi": 0.05, "lti": 0.10},
        {"name": "Medium Profile", "dti": 0.30, "util": 0.50, "stability": 0.5, "emi": 0.20, "lti": 0.25},
        {"name": "Risky Profile", "dti": 0.50, "util": 0.90, "stability": 0.2, "emi": 0.40, "lti": 0.40},
    ]
    
    for case in test_cases:
        input_data = pd.DataFrame([[
            case["dti"], case["util"], case["stability"], case["emi"], case["lti"]
        ]], columns=feature_cols)
        
        pd_score = rf_model.predict_proba(input_data)[0][1]
        
        if pd_score < 0.20:
            grade = "A"
        elif pd_score < 0.35:
            grade = "B"
        elif pd_score < 0.55:
            grade = "C"
        else:
            grade = "D"
        
        print(f"\n{case['name']}:")
        print(f"  DTI: {case['dti']:.0%}, Util: {case['util']:.0%}, Stability: {case['stability']:.0%}")
        print(f"  PD: {pd_score:.1%}, Grade: {grade}")
    
    # Save model
    os.makedirs("models", exist_ok=True)
    joblib.dump(rf_model, "models/rf_model.pkl")
    joblib.dump(feature_cols, "models/feature_names.pkl")
    
    print("\n" + "="*60)
    print("✅ Model saved successfully!")
    print(f"   Features: {feature_cols}")
    print("="*60)
    
    return rf_model, feature_cols


if __name__ == "__main__":
    create_and_train_model()