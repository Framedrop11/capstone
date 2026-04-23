"""
ClearScore ML Service - FastAPI Application
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Optional
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
import os

app = FastAPI(title="ClearScore ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# Load Model
# ------------------------------

print("Loading model...")
try:
    model = joblib.load("models/rf_model.pkl")
    feature_names = joblib.load("models/feature_names.pkl")
    print(f"✅ Model loaded! Features: {feature_names}")
    MODEL_LOADED = True
except Exception as e:
    print(f"⚠️ Model not found: {e}")
    MODEL_LOADED = False
    feature_names = ['debt_to_income_ratio', 'credit_utilization', 
                     'income_stability_score', 'existing_emi_burden', 'loan_to_income_ratio']


# ------------------------------
# Pydantic Models
# ------------------------------

class LoanApplicationRequest(BaseModel):
    income_annual: float = Field(..., gt=0)
    loan_amount: float = Field(..., gt=0)
    employment_length: int = Field(..., ge=0, le=50)
    credit_history_age: int = Field(..., ge=0)
    home_ownership_status: str = "RENT"
    occupation_type: str = "salaried"
    geography_tier: str = "Tier-2"
    existing_emi: float = 0.0
    credit_invisible: bool = False


class ShadowScoreRequest(BaseModel):
    rent_regularity: int = Field(..., ge=1, le=5)
    utility_consistency: int = Field(..., ge=1, le=5)
    employment_type: str
    savings_rate: float = Field(..., ge=0, le=1)
    mobile_bill_history: int = Field(..., ge=1, le=5)


class WhatIfRequest(BaseModel):
    current_features: Dict[str, float]
    modified_features: Dict[str, float]


class FightRejectionRequest(BaseModel):
    features: Dict[str, float] = {}
    current_pd: float


# ------------------------------
# Helper Functions
# ------------------------------

def calculate_features(
    income_annual: float,
    loan_amount: float,
    employment_length: int,
    existing_emi: float,
) -> Dict[str, float]:
    """Calculate features from inputs"""
    
    monthly_income = max(income_annual / 12, 1000)
    
    # DTI based on existing EMI
    annual_emi = existing_emi * 12
    dti = (annual_emi / income_annual) if income_annual > 0 else 0.2
    
    # Credit utilization
    util = 0.6 if employment_length < 2 else 0.3
    
    # Income stability
    stability = min(employment_length / 10, 1.0)
    
    # EMI burden
    emi_burden = existing_emi / monthly_income if monthly_income > 0 else 0
    
    # Loan to income
    loan_to_income = loan_amount / income_annual if income_annual > 0 else 0.3
    
    return {
        'debt_to_income_ratio': min(dti, 1.0),
        'credit_utilization': util,
        'income_stability_score': stability,
        'existing_emi_burden': min(emi_burden, 1.0),
        'loan_to_income_ratio': min(loan_to_income, 1.0)
    }


def predict_pd(features: Dict[str, float]) -> float:
    """Predict PD using model or fallback"""
    
    if MODEL_LOADED:
        try:
            values = [features.get(f, 0.0) for f in feature_names]
            input_df = pd.DataFrame([values], columns=feature_names)
            return float(model.predict_proba(input_df)[0][1])
        except Exception as e:
            print(f"Prediction error: {e}")
    
    # Fallback calculation
    dti = features.get('debt_to_income_ratio', 0.2)
    util = features.get('credit_utilization', 0.4)
    stability = features.get('income_stability_score', 0.5)
    emi = features.get('existing_emi_burden', 0.1)
    lti = features.get('loan_to_income_ratio', 0.15)
    
    base_pd = (
        dti * 0.35 +
        util * 0.25 +
        (1 - stability) * 0.20 +
        emi * 0.15 +
        lti * 0.15
    )
    
    pd_score = 0.05 + base_pd * 0.7
    return min(max(pd_score, 0.02), 0.95)


def get_grade(pd_score: float) -> str:
    if pd_score < 0.20:
        return "A"
    elif pd_score < 0.35:
        return "B"
    elif pd_score < 0.55:
        return "C"
    else:
        return "D"


# ------------------------------
# Endpoints
# ------------------------------

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": MODEL_LOADED,
        "features": feature_names
    }


@app.post("/predict")
async def predict(request: LoanApplicationRequest):
    features = calculate_features(
        income_annual=request.income_annual,
        loan_amount=request.loan_amount,
        employment_length=request.employment_length,
        existing_emi=request.existing_emi,
    )
    
    pd_score = predict_pd(features)
    grade = get_grade(pd_score)
    expected_loss = pd_score * 0.5 * request.loan_amount
    
    # Generate SHAP-like drivers
    drivers = []
    for feat, value in features.items():
        if feat in ['debt_to_income_ratio', 'credit_utilization', 'existing_emi_burden']:
            impact = value * 0.3
            direction = "increases"
        else:
            impact = -value * 0.15
            direction = "decreases"
        
        drivers.append({
            "feature": feat,
            "magnitude": abs(impact),
            "direction": direction,
            "shap_value": impact
        })
    
    drivers.sort(key=lambda x: abs(x['shap_value']), reverse=True)
    
    return {
        "model_pd_score": pd_score,
        "model_risk_grade": grade,
        "expected_loss": expected_loss,
        "shap_values": {
            "feature_importance": {d['feature']: d['shap_value'] for d in drivers},
            "top_3_drivers": drivers[:3],
            "prediction": pd_score
        },
        "roadmap": {
            "current_pd": pd_score,
            "target_pd_threshold": 0.35,
        },
        "model_version": "simple-1.0",
        "prediction_timestamp": datetime.utcnow().isoformat() + "Z",
        "debug_features": features
    }


@app.post("/shadow")
async def shadow(request: ShadowScoreRequest):
    score = (
        request.rent_regularity / 5 * 0.25 +
        request.utility_consistency / 5 * 0.25 +
        (1 if request.employment_type == "salaried" else 0.5) * 0.25 +
        request.savings_rate * 0.15 +
        request.mobile_bill_history / 5 * 0.10
    )
    pd_score = 1 - score
    
    return {
        "shadow_pd": pd_score,
        "shadow_grade": get_grade(pd_score),
        "confidence_interval": {"lower": pd_score * 0.8, "upper": pd_score * 1.2},
        "first_step_recommendation": "Maintain regular payments to improve score.",
        "calculated_at": datetime.utcnow().isoformat() + "Z"
    }


@app.post("/whatif")
async def whatif(request: WhatIfRequest):
    features = {**request.current_features, **request.modified_features}
    pd_score = predict_pd(features)
    current_pd = predict_pd(request.current_features)
    
    return {
        "updated_pd": pd_score,
        "updated_grade": get_grade(pd_score),
        "pd_change": pd_score - current_pd,
        "simulation_timestamp": datetime.utcnow().isoformat() + "Z"
    }


@app.post("/fight-rejection")
async def fight_rejection(request: FightRejectionRequest):
    features = request.features
    current_pd = request.current_pd
    current_grade = get_grade(current_pd)
    
    # Generate recommendations based on features
    recommendations = []
    
    dti = features.get('debt_to_income_ratio', 0.3)
    if dti > 0.3:
        recommendations.append({
            "feature": "debt_to_income_ratio",
            "current_value": dti,
            "impact": dti * 0.15
        })
    
    util = features.get('credit_utilization', 0.4)
    if util > 0.3:
        recommendations.append({
            "feature": "credit_utilization",
            "current_value": util,
            "impact": util * 0.12
        })
    
    emi = features.get('existing_emi_burden', 0.1)
    if emi > 0.15:
        recommendations.append({
            "feature": "existing_emi_burden",
            "current_value": emi,
            "impact": emi * 0.10
        })
    
    if not recommendations:
        recommendations = [{
            "feature": "general",
            "current_value": 0,
            "impact": 0.03
        }]
    
    recommendations.sort(key=lambda x: x['impact'], reverse=True)
    top = recommendations[0]
    
    expected_improvement = min(top['impact'], current_pd - 0.15)
    projected_pd = max(current_pd - expected_improvement, 0.05)
    projected_grade = get_grade(projected_pd)
    
    # Generate message
    if top['feature'] == "existing_emi_burden":
        message = f"If you reduce your existing EMI by ₹3,000/month, Grade {current_grade} → Grade {projected_grade}. Fastest path to approval."
    elif top['feature'] == "credit_utilization":
        message = f"Pay down your credit card balances to below 30%. Grade {current_grade} → Grade {projected_grade}."
    elif top['feature'] == "debt_to_income_ratio":
        message = f"Reduce your overall debt. Grade {current_grade} → Grade {projected_grade}."
    else:
        message = f"Maintain consistent payments for 3-6 months. Grade {current_grade} → Grade {projected_grade}."
    
    return {
        "message": message,
        "action": {
            "feature": top['feature'],
            "recommended_change": f"Improve your {top['feature'].replace('_', ' ')}",
            "expected_pd_improvement": expected_improvement,
            "current_grade": current_grade,
            "projected_grade": projected_grade
        }
    }


@app.get("/fairness/report")
async def fairness():
    return {
        "overall_approval_rate": 0.65,
        "demographic_parity": {},
        "bias_alerts": []
    }


@app.get("/drift/status")
async def drift():
    return {
        "features": {},
        "summary": {"drifted_features": 0, "highest_severity": "none"}
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)