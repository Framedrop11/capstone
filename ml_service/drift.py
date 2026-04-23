"""
ClearScore ML Service - Drift Detection Module
Monitors feature drift using KS test against training distribution.
"""

import numpy as np
import pandas as pd
import joblib
from scipy.stats import ks_2samp
from datetime import datetime

# ------------------------------
# Drift Detector
# ------------------------------

class DriftDetector:
    """Detect feature drift using Kolmogorov-Smirnov test"""
    
    def __init__(self, train_dist_path="models/train_distribution.pkl"):
        self.train_distribution = joblib.load(train_dist_path)
        self.feature_names = list(self.train_distribution.keys())
        
        # Drift thresholds
        self.thresholds = {
            "low": 0.10,
            "medium": 0.15,
            "high": 0.25
        }
        
        # Plain English interpretations
        self.interpretation_templates = {
            "debt_to_income_ratio": {
                "increase": "Debt-to-income ratios are rising. This may indicate increased borrower leverage in current economic conditions.",
                "decrease": "Debt-to-income ratios are falling. Borrowers are carrying less debt relative to income.",
                "stable": "Debt-to-income ratios remain stable and consistent with training data."
            },
            "credit_utilization": {
                "increase": "Credit utilization is trending upward. Borrowers are using more of their available credit limits.",
                "decrease": "Credit utilization is decreasing. Borrowers are maintaining lower revolving balances.",
                "stable": "Credit utilization patterns match historical norms."
            },
            "income_stability_score": {
                "increase": "Employment stability is improving. Longer average tenure observed.",
                "decrease": "Employment stability is declining. Shorter job tenures becoming more common.",
                "stable": "Employment stability metrics are within expected ranges."
            },
            "existing_emi_burden": {
                "increase": "EMI burden is increasing. Borrowers are carrying larger monthly obligations relative to income.",
                "decrease": "EMI burden is decreasing. Lower monthly obligations observed.",
                "stable": "EMI burden levels remain consistent with training distribution."
            }
        }
    
    def check_drift(self, incoming_batch):
        """
        Check drift for all features in incoming batch.
        
        Args:
            incoming_batch: DataFrame or dict with feature values
            
        Returns:
            dict with drift scores and interpretations per feature
        """
        if isinstance(incoming_batch, dict):
            incoming_batch = pd.DataFrame([incoming_batch])
        
        drift_report = {
            "features": {},
            "summary": {
                "total_features": len(self.feature_names),
                "drifted_features": 0,
                "highest_severity": "none",
                "retraining_recommended": False
            },
            "checked_at": datetime.utcnow().isoformat() + "Z"
        }
        
        for feature in self.feature_names:
            if feature not in incoming_batch.columns:
                continue
            
            # Get training distribution parameters
            train_stats = self.train_distribution[feature]
            
            # Generate training sample from distribution
            train_sample = self._sample_from_distribution(train_stats, n=1000)
            
            # Get incoming sample
            incoming_sample = incoming_batch[feature].dropna().values
            
            if len(incoming_sample) < 30:
                continue
            
            # Calculate KS statistic
            ks_stat, p_value = ks_2samp(train_sample, incoming_sample)
            
            # Determine severity
            severity = self._get_severity(ks_stat)
            
            # Calculate direction of drift
            direction = self._get_drift_direction(
                train_sample.mean(), incoming_sample.mean(), ks_stat
            )
            
            # Generate interpretation
            interpretation = self._generate_interpretation(
                feature, direction, ks_stat, train_sample.mean(), incoming_sample.mean()
            )
            
            drift_report["features"][feature] = {
                "ks_statistic": float(ks_stat),
                "p_value": float(p_value),
                "severity": severity,
                "direction": direction,
                "training_mean": float(train_sample.mean()),
                "incoming_mean": float(incoming_sample.mean()),
                "interpretation": interpretation,
                "retrain_flag": severity in ["medium", "high"]
            }
            
            if severity != "none":
                drift_report["summary"]["drifted_features"] += 1
        
        # Update summary
        severities = [f["severity"] for f in drift_report["features"].values()]
        if "high" in severities:
            drift_report["summary"]["highest_severity"] = "high"
            drift_report["summary"]["retraining_recommended"] = True
        elif "medium" in severities:
            drift_report["summary"]["highest_severity"] = "medium"
            if severities.count("medium") >= 2:
                drift_report["summary"]["retraining_recommended"] = True
        elif "low" in severities:
            drift_report["summary"]["highest_severity"] = "low"
        
        return drift_report
    
    def _sample_from_distribution(self, stats, n=1000):
        """Generate sample from stored distribution parameters"""
        np.random.seed(42)
        
        if stats.get('std', 0) == 0:
            return np.full(n, stats['mean'])
        
        sample = np.random.normal(stats['mean'], stats['std'], n)
        
        # Clip to observed min/max
        if 'min' in stats and 'max' in stats:
            sample = np.clip(sample, stats['min'], stats['max'])
        
        return sample
    
    def _get_severity(self, ks_stat):
        """Determine severity based on KS statistic"""
        if ks_stat > self.thresholds["high"]:
            return "high"
        elif ks_stat > self.thresholds["medium"]:
            return "medium"
        elif ks_stat > self.thresholds["low"]:
            return "low"
        else:
            return "none"
    
    def _get_drift_direction(self, train_mean, incoming_mean, ks_stat):
        """Determine direction of drift"""
        if ks_stat < self.thresholds["low"]:
            return "stable"
        elif incoming_mean > train_mean:
            return "increase"
        else:
            return "decrease"
    
    def _generate_interpretation(self, feature, direction, ks_stat, train_mean, incoming_mean):
        """Generate plain English interpretation"""
        template = self.interpretation_templates.get(
            feature, 
            {"stable": f"{feature} is stable.", 
             "increase": f"{feature} has increased.", 
             "decrease": f"{feature} has decreased."}
        )
        
        base = template.get(direction, template["stable"])
        
        # Add magnitude context
        if direction != "stable":
            pct_change = abs((incoming_mean - train_mean) / train_mean) * 100
            base += f" Change: {pct_change:.1f}% from training baseline."
        
        # Add severity context
        if ks_stat > self.thresholds["high"]:
            base += " This represents significant drift requiring immediate attention."
        elif ks_stat > self.thresholds["medium"]:
            base += " Moderate drift detected. Monitor closely."
        
        return base

# ------------------------------
# Main Export Function
# ------------------------------

def check_drift(incoming_batch):
    """
    Main entry point for drift detection.
    
    Args:
        incoming_batch: DataFrame or list of feature dicts
        
    Returns:
        JSON-serializable drift report
    """
    detector = DriftDetector()
    
    if isinstance(incoming_batch, list):
        incoming_batch = pd.DataFrame(incoming_batch)
    
    return detector.check_drift(incoming_batch)