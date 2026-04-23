"""
ClearScore ML Service - Fairness Audit Module
Computes demographic parity, equal opportunity, and intersectional fairness metrics.
"""

import numpy as np
import pandas as pd
import joblib
from itertools import combinations
from datetime import datetime

# ------------------------------
# Fairness Metrics Calculator
# ------------------------------

class FairnessAuditor:
    """Calculate fairness metrics across demographic groups"""
    
    def __init__(self, model_path="models/rf_model.pkl"):
        self.model = joblib.load(model_path)
        self.feature_names = joblib.load("models/feature_names.pkl")
        
        # Demographic mappings (simulated for privacy-preserving audit)
        self.demographics = {
            "gender": ["Male", "Female", "Non-binary"],
            "age_bracket": ["18-25", "26-35", "36-50", "50+"],
            "occupation": ["salaried", "gig", "freelance", "self-employed"],
            "geography_tier": ["Tier-1", "Tier-2", "Tier-3"]
        }
    
    def audit(self, test_data=None, test_labels=None):
        """
        Perform full fairness audit.
        
        Args:
            test_data: DataFrame with features + demographics (simulated if None)
            test_labels: True labels (simulated if None)
            
        Returns:
            dict with fairness metrics and bias alerts
        """
        if test_data is None or test_labels is None:
            test_data, test_labels = self._generate_test_data()
        
        # Get model predictions
        predictions = self.model.predict(test_data[self.feature_names])
        prediction_proba = self.model.predict_proba(test_data[self.feature_names])[:, 1]
        
        # Calculate overall approval rate
        overall_approval_rate = np.mean(predictions)
        
        # Calculate per-group metrics
        fairness_report = {
            "overall_approval_rate": float(overall_approval_rate),
            "demographic_parity": self._calculate_demographic_parity(
                test_data, predictions, overall_approval_rate
            ),
            "equal_opportunity": self._calculate_equal_opportunity(
                test_data, predictions, test_labels
            ),
            "intersectional_analysis": self._calculate_intersectional(
                test_data, predictions, overall_approval_rate
            ),
            "bias_alerts": [],
            "public_report": None,
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }
        
        # Generate bias alerts
        fairness_report["bias_alerts"] = self._generate_bias_alerts(
            fairness_report["demographic_parity"], overall_approval_rate
        )
        
        # Generate public-facing report
        fairness_report["public_report"] = self._generate_public_report(fairness_report)
        
        return fairness_report
    
    def _generate_test_data(self, n_samples=5000):
        """Generate simulated test data with demographics"""
        np.random.seed(42)
        
        data = {
            'debt_to_income_ratio': np.random.uniform(0.1, 0.6, n_samples),
            'credit_utilization': np.random.uniform(0, 1, n_samples),
            'income_stability_score': np.random.uniform(0.2, 1.0, n_samples),
            'existing_emi_burden': np.random.uniform(0, 0.5, n_samples),
            
            # Demographics
            'gender': np.random.choice(self.demographics["gender"], n_samples, 
                                       p=[0.48, 0.48, 0.04]),
            'age_bracket': np.random.choice(self.demographics["age_bracket"], n_samples,
                                            p=[0.20, 0.35, 0.30, 0.15]),
            'occupation': np.random.choice(self.demographics["occupation"], n_samples,
                                          p=[0.50, 0.15, 0.20, 0.15]),
            'geography_tier': np.random.choice(self.demographics["geography_tier"], n_samples,
                                              p=[0.40, 0.35, 0.25])
        }
        
        df = pd.DataFrame(data)
        
        # Generate correlated labels
        base_prob = 0.3
        base_prob += 0.2 * (1 - df['credit_utilization'])
        base_prob += 0.15 * df['income_stability_score']
        base_prob -= 0.1 * df['existing_emi_burden']
        base_prob = np.clip(base_prob, 0.1, 0.9)
        
        labels = np.random.binomial(1, base_prob)
        
        return df, labels
    
    def _calculate_demographic_parity(self, data, predictions, overall_rate):
        """
        Calculate Demographic Parity Difference.
        DPD = P(ŷ=1|group) - P(ŷ=1)
        """
        dpd_results = {}
        
        for attr, groups in self.demographics.items():
            dpd_results[attr] = []
            
            for group in groups:
                mask = data[attr] == group
                if mask.sum() > 0:
                    group_rate = predictions[mask].mean()
                    dpd = group_rate - overall_rate
                    
                    dpd_results[attr].append({
                        "group": group,
                        "approval_rate": float(group_rate),
                        "demographic_parity_difference": float(dpd),
                        "sample_size": int(mask.sum())
                    })
        
        return dpd_results
    
    def _calculate_equal_opportunity(self, data, predictions, labels):
        """
        Calculate Equal Opportunity Difference.
        EOD = TPR(group) - TPR(overall)
        TPR = True Positive Rate = P(ŷ=1|y=1)
        """
        overall_tpr = self._calculate_tpr(predictions, labels)
        eod_results = {}
        
        for attr, groups in self.demographics.items():
            eod_results[attr] = []
            
            for group in groups:
                mask = (data[attr] == group)
                if mask.sum() > 0:
                    group_tpr = self._calculate_tpr(predictions[mask], labels[mask])
                    eod = group_tpr - overall_tpr
                    
                    eod_results[attr].append({
                        "group": group,
                        "true_positive_rate": float(group_tpr) if group_tpr is not None else None,
                        "equal_opportunity_difference": float(eod) if group_tpr is not None else None,
                        "sample_size": int(mask.sum())
                    })
        
        return eod_results
    
    def _calculate_tpr(self, predictions, labels):
        """Calculate True Positive Rate"""
        pos_mask = labels == 1
        if pos_mask.sum() == 0:
            return None
        return (predictions[pos_mask] == 1).mean()
    
    def _calculate_intersectional(self, data, predictions, overall_rate):
        """
        Calculate intersectional approval rates for group combinations.
        Auto-flags groups with approval rate >15pp below overall average.
        """
        intersectional = {
            "combinations": [],
            "approval_rates": {},
            "flagged_combinations": []
        }
        
        # Get all demographic columns
        demo_cols = list(self.demographics.keys())
        
        # Calculate for each 2-way combination
        for col1, col2 in combinations(demo_cols, 2):
            for group1 in self.demographics[col1]:
                for group2 in self.demographics[col2]:
                    mask = (data[col1] == group1) & (data[col2] == group2)
                    
                    if mask.sum() >= 10:  # Minimum sample threshold
                        approval_rate = predictions[mask].mean()
                        key = f"{col1}={group1} ∩ {col2}={group2}"
                        
                        intersectional["approval_rates"][key] = {
                            "approval_rate": float(approval_rate),
                            "difference_from_overall": float(approval_rate - overall_rate),
                            "sample_size": int(mask.sum())
                        }
                        
                        # Flag if >15pp below average
                        if approval_rate < overall_rate - 0.15:
                            intersectional["flagged_combinations"].append({
                                "combination": key,
                                "approval_rate": float(approval_rate),
                                "overall_rate": float(overall_rate),
                                "difference": float(overall_rate - approval_rate),
                                "severity": "HIGH" if approval_rate < overall_rate - 0.25 else "MEDIUM"
                            })
        
        return intersectional
    
    def _generate_bias_alerts(self, dpd_results, overall_rate):
        """Generate bias alerts for groups with >15pp disparity"""
        alerts = []
        
        for attr, groups in dpd_results.items():
            for group_data in groups:
                diff = abs(group_data["demographic_parity_difference"])
                if diff > 0.15:
                    severity = "HIGH" if diff > 0.25 else "MEDIUM"
                    alerts.append({
                        "type": "BIAS_ALERT",
                        "attribute": attr,
                        "group": group_data["group"],
                        "approval_rate": group_data["approval_rate"],
                        "overall_rate": overall_rate,
                        "difference": diff,
                        "severity": severity,
                        "message": f"Approval rate for {group_data['group']} ({attr}) is {diff:.1%} points {'below' if group_data['demographic_parity_difference'] < 0 else 'above'} overall average.",
                        "recommendation": "Review model for potential bias. Consider fairness constraints in retraining."
                    })
        
        return alerts
    
    def _generate_public_report(self, fairness_report):
        """Generate public-facing fairness report JSON"""
        public_report = {
            "summary": {
                "overall_approval_rate": f"{fairness_report['overall_approval_rate']:.1%}",
                "groups_audited": sum(len(groups) for groups in fairness_report["demographic_parity"].values()),
                "bias_alerts_count": len(fairness_report["bias_alerts"]),
                "highest_severity": max([a["severity"] for a in fairness_report["bias_alerts"]]) if fairness_report["bias_alerts"] else "NONE"
            },
            "demographic_parity": {},
            "intersectional_findings": {
                "total_combinations": len(fairness_report["intersectional_analysis"]["approval_rates"]),
                "flagged_combinations": len(fairness_report["intersectional_analysis"]["flagged_combinations"])
            },
            "fairness_statement": self._generate_fairness_statement(fairness_report),
            "next_steps": []
        }
        
        # Simplify demographic parity for public report
        for attr, groups in fairness_report["demographic_parity"].items():
            public_report["demographic_parity"][attr] = [
                {
                    "group": g["group"],
                    "approval_rate": f"{g['approval_rate']:.1%}"
                }
                for g in groups
            ]
        
        return public_report
    
    def _generate_fairness_statement(self, fairness_report):
        """Generate plain-English fairness statement"""
        alerts = fairness_report["bias_alerts"]
        
        if len(alerts) == 0:
            return "Our model shows consistent approval rates across all demographic groups. No significant disparities detected."
        elif len(alerts) < 3:
            return f"Our model shows generally fair outcomes, with {len(alerts)} area(s) flagged for additional monitoring. We continuously work to ensure equitable credit access."
        else:
            return "We have identified several areas requiring fairness review. Our team is actively investigating and will implement model improvements to ensure equitable outcomes."

# ------------------------------
# Main Export Function
# ------------------------------

def audit_fairness(test_data=None, test_labels=None):
    """
    Main entry point for fairness audit.
    
    Returns:
        JSON-serializable fairness report
    """
    auditor = FairnessAuditor()
    return auditor.audit(test_data, test_labels)