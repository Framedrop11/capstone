"""
ClearScore ML Service - Roadmap Generator
Generates 90-day credit improvement plan based on SHAP analysis.
"""

import numpy as np
import joblib
from datetime import datetime, timedelta

# ------------------------------
# Feasibility Weights
# ------------------------------

FEASIBILITY_WEIGHTS = {
    "credit_utilization": 0.9,      # reduce card balance
    "existing_emi_burden": 0.8,      # close small loan
    "debt_to_income_ratio": 0.7,     # pay down debt
    "income_stability_score": 0.2,   # increase income (hard)
}

ACTION_TEMPLATES = {
    "credit_utilization": {
        "action": "Reduce credit card balance to below 30% of limit",
        "time_weeks": 4,
        "why_template": "High credit utilization ({value:.0%}) signals reliance on credit. Lenders prefer utilization under 30%."
    },
    "existing_emi_burden": {
        "action": "Pay off or close one small existing loan/EMI",
        "time_weeks": 6,
        "why_template": "Your existing EMI burden ({value:.0%} of income) reduces capacity for new credit."
    },
    "debt_to_income_ratio": {
        "action": "Reduce overall debt-to-income ratio by paying down outstanding loans",
        "time_weeks": 8,
        "why_template": "DTI of {value:.0%} exceeds lender comfort zone. Target: below 36%."
    },
    "income_stability_score": {
        "action": "Maintain current employment and avoid job changes",
        "time_weeks": 12,
        "why_template": "Employment stability ({value:.0%} score) affects lender confidence. Longer tenure improves approval odds."
    }
}

# ------------------------------
# PD Improvement Calculator
# ------------------------------

class RoadmapGenerator:
    """Generate 90-day credit improvement roadmap"""
    
    def __init__(self, model_path="models/rf_model.pkl"):
        self.model = joblib.load(model_path)
        self.feature_names = joblib.load("models/feature_names.pkl")
        
    def generate(self, profile, shap_result, pd_threshold=0.35):
        """
        Generate 90-day roadmap based on rejected profile and SHAP analysis.
        
        Args:
            profile: dict with feature values
            shap_result: SHAP explanation result from explainability.py
            pd_threshold: PD threshold for approval (default 0.35)
            
        Returns:
            dict with week-by-week 90-day plan
        """
        current_pd = shap_result['prediction']
        top_drivers = shap_result['top_3_drivers']
        
        # Rank changes by (PD impact) × (feasibility weight)
        ranked_changes = []
        for driver in top_drivers:
            feature = driver['feature']
            shap_impact = abs(driver['shap_value'])
            feasibility = FEASIBILITY_WEIGHTS.get(feature, 0.5)
            combined_score = shap_impact * feasibility
            
            ranked_changes.append({
                "feature": feature,
                "current_value": profile[feature],
                "shap_impact": driver['shap_value'],
                "direction": driver['direction'],
                "feasibility_weight": feasibility,
                "combined_score": combined_score
            })
        
        # Sort by combined score descending
        ranked_changes.sort(key=lambda x: x['combined_score'], reverse=True)
        
        # Generate weekly milestones
        roadmap = self._generate_milestones(
            profile, ranked_changes, current_pd, pd_threshold
        )
        
        return {
            "current_pd": float(current_pd),
            "target_pd_threshold": pd_threshold,
            "approval_target": "Approved" if current_pd < pd_threshold else "Rejected",
            "ranked_improvements": ranked_changes,
            "roadmap": roadmap,
            "projected_timeline": self._project_timeline(roadmap, current_pd),
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }
    
    def _generate_milestones(self, profile, ranked_changes, current_pd, pd_threshold):
        """Generate week-by-week milestones"""
        milestones = {}
        cumulative_pd = current_pd
        
        # Calculate PD improvements
        improvements = []
        for change in ranked_changes:
            feature = change['feature']
            current_val = change['current_value']
            shap_impact = change['shap_impact']
            
            # Calculate target value based on direction
            if change['direction'] == "increases":
                # Bad feature - needs reduction
                target_val = current_val * 0.7  # 30% reduction
                pd_improvement = abs(shap_impact) * 0.7
            else:
                # Good feature - already helping
                target_val = current_val
                pd_improvement = 0
            
            improvements.append({
                "feature": feature,
                "current_value": float(current_val),
                "target_value": float(target_val),
                "expected_pd_reduction": float(pd_improvement),
                "action_template": ACTION_TEMPLATES.get(feature, ACTION_TEMPLATES["credit_utilization"])
            })
        
        # Week 1-2: Quick wins
        quick_wins = [i for i in improvements if i['feature'] in ['credit_utilization']]
        week_1_pd = cumulative_pd
        for win in quick_wins[:1]:
            week_1_pd -= win['expected_pd_reduction'] * 0.3
        
        milestones["week_1"] = {
            "week": 1,
            "focus": "Quick Wins",
            "actions": [
                {
                    "what": ACTION_TEMPLATES.get(improvements[0]['feature'], ACTION_TEMPLATES["credit_utilization"])['action'],
                    "why": self._format_why(improvements[0]),
                    "expected_pd_improvement": f"{(improvements[0]['expected_pd_reduction'] * 0.3):.3f}",
                    "time_estimate": "1-2 weeks"
                }
            ],
            "projected_pd": float(max(0.05, week_1_pd)),
            "milestone_achieved": "Initial credit utilization improvement"
        }
        
        # Week 4: First major milestone
        week_4_pd = week_1_pd
        for imp in improvements[:2]:
            week_4_pd -= imp['expected_pd_reduction'] * 0.5
        
        milestones["week_4"] = {
            "week": 4,
            "focus": "First Major Milestone",
            "actions": [
                {
                    "what": ACTION_TEMPLATES.get(imp['feature'], ACTION_TEMPLATES["credit_utilization"])['action'],
                    "why": self._format_why(imp),
                    "expected_pd_improvement": f"{imp['expected_pd_reduction'] * 0.5:.3f}",
                    "time_estimate": "4 weeks"
                }
                for imp in improvements[:2]
            ],
            "projected_pd": float(max(0.05, week_4_pd)),
            "milestone_achieved": "Significant credit score improvement"
        }
        
        # Week 8: Mid-point
        week_8_pd = week_4_pd
        for imp in improvements[:3]:
            week_8_pd -= imp['expected_pd_reduction'] * 0.7
        
        milestones["week_8"] = {
            "week": 8,
            "focus": "Mid-Point Check",
            "actions": [
                {
                    "what": f"Continue: {ACTION_TEMPLATES.get(imp['feature'], ACTION_TEMPLATES['credit_utilization'])['action']}",
                    "why": self._format_why(imp),
                    "expected_pd_improvement": f"{imp['expected_pd_reduction'] * 0.2:.3f}",
                    "time_estimate": "Ongoing"
                }
                for imp in improvements[:2]
            ],
            "projected_pd": float(max(0.05, week_8_pd)),
            "milestone_achieved": "On track for approval threshold"
        }
        
        # Week 12: Final target
        week_12_pd = current_pd
        for imp in improvements:
            week_12_pd -= imp['expected_pd_reduction'] * 0.85
        
        milestones["week_12"] = {
            "week": 12,
            "focus": "Target Achievement",
            "actions": [
                {
                    "what": "Re-apply with improved credit profile",
                    "why": f"Projected PD of {week_12_pd:.1%} is below approval threshold of {pd_threshold:.0%}",
                    "expected_pd_improvement": "Ready for approval",
                    "time_estimate": "12 weeks total"
                }
            ],
            "projected_pd": float(max(0.05, week_12_pd)),
            "milestone_achieved": "Approval threshold reached"
        }
        
        return milestones
    
    def _format_why(self, improvement):
        """Format the 'why' explanation with SHAP-backed reasoning"""
        template = improvement['action_template']['why_template']
        return template.format(value=improvement['current_value'])
    
    def _project_timeline(self, roadmap, current_pd):
        """Generate PD curve data for visualization"""
        timeline = []
        weeks = [1, 4, 8, 12]
        
        for week in weeks:
            key = f"week_{week}"
            if key in roadmap:
                timeline.append({
                    "week": week,
                    "pd": roadmap[key]['projected_pd'],
                    "milestone": roadmap[key]['milestone_achieved']
                })
        
        return timeline

# ------------------------------
# Main Export Function
# ------------------------------

def generate_roadmap(profile, shap_result):
    """
    Main entry point for roadmap generation.
    
    Args:
        profile: dict with feature values
        shap_result: SHAP explanation result
        
    Returns:
        JSON-serializable roadmap dict
    """
    generator = RoadmapGenerator()
    return generator.generate(profile, shap_result)