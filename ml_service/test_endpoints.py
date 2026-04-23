"""Quick endpoint smoke test for the FastAPI ML service."""
import requests
import json
import time

BASE = "http://127.0.0.1:8000"

# 1) Health
print("=" * 60)
print("TEST 1: GET /health")
r = requests.get(f"{BASE}/health")
print(f"  Status: {r.status_code}  Body: {r.json()}")
assert r.status_code == 200

# 2) Model info
print("\nTEST 2: GET /model-info")
r = requests.get(f"{BASE}/model-info")
info = r.json()
print(f"  Status: {r.status_code}")
print(f"  Model version: {info.get('model_version')}")
print(f"  Best model: {info.get('best_model')}")
assert r.status_code == 200

# 3) Full predict
print("\nTEST 3: POST /predict")
payload = {
    "income_annual": 65000,
    "loan_amount": 15000,
    "employment_length": 5.0,
    "credit_history_age": 120,
    "home_ownership_status": "MORTGAGE",
    "lgd": 0.45,
    "ead": 14000,
}
t0 = time.time()
r = requests.post(f"{BASE}/predict", json=payload, timeout=120)
elapsed = time.time() - t0
d = r.json()
print(f"  Status: {r.status_code}  ({elapsed:.1f}s)")
print(f"  PD Score: {d.get('model_pd_score')}")
print(f"  Risk Grade: {d.get('model_risk_grade')} - {d.get('risk_grade_label')}")
print(f"  Expected Loss: ${d.get('expected_loss')}")
print(f"  SHAP values: {len(d.get('shap_values', []))} features")
print(f"  LIME values: {len(d.get('lime_values', []))} features")
print(f"  Counterfactuals: {len(d.get('counterfactuals', []))} generated")
xai = d.get("xai_comparison", {})
print(f"  XAI recommendation: {xai.get('recommendation')}")
print(f"  SHAP stability: {xai.get('shap_stability')}")
print(f"  LIME stability: {xai.get('lime_stability')}")
print(f"  Feature agreement: {xai.get('feature_agreement')}")
mc = d.get("model_comparison", {})
for m, v in mc.items():
    print(f"    {m}: PD={v['pd_score']}, Grade={v['risk_grade']}, Inf={v['inference_time_ms']}ms")
assert r.status_code == 200
assert d.get("model_pd_score") is not None
assert len(d.get("counterfactuals", [])) >= 3

# 4) What-If
print("\nTEST 4: POST /whatif")
r = requests.post(f"{BASE}/whatif", json=payload)
wi = r.json()
print(f"  Status: {r.status_code}")
print(f"  PD Score: {wi.get('model_pd_score')}")
print(f"  Risk Grade: {wi.get('model_risk_grade')}")
assert r.status_code == 200

# 5) Fairness
print("\nTEST 5: GET /fairness")
r = requests.get(f"{BASE}/fairness")
fm = r.json()
print(f"  Status: {r.status_code}")
print(f"  Data source: {fm.get('data_source')}")
dp = fm.get("demographic_parity", {})
print(f"  Demographic parity diff: {dp.get('demographic_parity_diff')}")
print(f"  Is fair: {dp.get('is_fair')}")
assert r.status_code == 200

# 6) Drift
print("\nTEST 6: GET /drift")
r = requests.get(f"{BASE}/drift")
dr = r.json()
print(f"  Status: {r.status_code}")
print(f"  Drift detected: {dr.get('overall_drift_detected')}")
print(f"  Recommendation: {dr.get('recommendation')}")
assert r.status_code == 200

print("\n" + "=" * 60)
print("ALL 6 TESTS PASSED!")
print("=" * 60)
