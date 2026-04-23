"""
ClearScore ML Service - Model Trainer (IMPROVED VERSION)
Better feature engineering for LendingClub dataset
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import roc_auc_score, f1_score, classification_report
from sklearn.preprocessing import StandardScaler, LabelEncoder
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import lightgbm as lgb
import joblib
import time
from scipy.stats import ks_2samp
import os
import warnings
warnings.filterwarnings('ignore')

# ------------------------------
# LendingClub Data Loader
# ------------------------------

def load_lendingclub_data(sample_size=100000):
    """Load and clean LendingClub dataset"""
    
    possible_paths = [
        "data/lendingclub/accepted_2007_to_2018Q4.csv",
        "data/lendingclub/loan_data.csv",
        "data/accepted_2007_to_2018Q4.csv",
    ]
    
    data_path = None
    for path in possible_paths:
        if os.path.exists(path):
            data_path = path
            break
    
    if data_path is None:
        print("\n⚠️  Dataset not found. Using simulated data...")
        return _simulate_lendingclub_data(sample_size)
    
    print(f"\n📂 Loading: {data_path}")
    
    # Expanded columns for better feature engineering
    columns_needed = [
        'loan_amnt', 'funded_amnt', 'term', 'int_rate', 'installment',
        'grade', 'sub_grade', 'emp_length', 'home_ownership', 'annual_inc',
        'verification_status', 'issue_d', 'loan_status', 'purpose',
        'dti', 'delinq_2yrs', 'inq_last_6mths', 'open_acc', 'pub_rec',
        'revol_bal', 'revol_util', 'total_acc', 'total_pymnt',
        'total_rec_prncp', 'total_rec_int', 'last_pymnt_amnt',
        'application_type', 'acc_now_delinq', 'tot_coll_amt',
        'tot_cur_bal', 'total_rev_hi_lim', 'addr_state', 'zip_code'
    ]
    
    # Read in chunks
    chunks = []
    chunk_size = 50000
    
    try:
        available_cols = pd.read_csv(data_path, nrows=1).columns.tolist()
        use_cols = [c for c in columns_needed if c in available_cols]
        
        for chunk in pd.read_csv(data_path, usecols=use_cols, chunksize=chunk_size, low_memory=False):
            chunks.append(chunk)
            if sample_size and len(pd.concat(chunks)) >= sample_size * 2:
                break
    except Exception as e:
        print(f"   Error: {e}")
        return _simulate_lendingclub_data(sample_size)
    
    df = pd.concat(chunks, ignore_index=True)
    print(f"   Loaded {len(df):,} records")
    
    # Clean and prepare
    df = clean_lendingclub_data(df)
    
    if sample_size and len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42)
    
    return df


def clean_lendingclub_data(df):
    """Advanced cleaning for LendingClub data"""
    
    df = df.copy()
    
    # Target: 1 = Default/Charged Off, 0 = Fully Paid
    good_status = ['Fully Paid', 'Current']
    bad_status = ['Charged Off', 'Default', 'Late (31-120 days)', 'Late (16-30 days)']
    
    df = df[df['loan_status'].isin(good_status + bad_status)]
    df['target'] = (~df['loan_status'].isin(good_status)).astype(int)
    
    # Clean numeric columns
    if 'emp_length' in df.columns:
        df['emp_length'] = df['emp_length'].astype(str).str.extract(r'(\d+)').astype(float).fillna(0)
    
    if 'revol_util' in df.columns:
        df['revol_util'] = pd.to_numeric(df['revol_util'], errors='coerce').fillna(50)
    
    if 'int_rate' in df.columns:
        df['int_rate'] = df['int_rate'].astype(str).str.replace('%', '').astype(float).fillna(12)
    
    if 'term' in df.columns:
        df['term'] = df['term'].astype(str).str.extract(r'(\d+)').astype(float).fillna(36)
    
    # Fill missing values
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    
    # Filter outliers
    df = df[df['annual_inc'] > 10000]
    df = df[df['annual_inc'] < 500000]
    df = df[df['loan_amnt'] > 1000]
    df = df[df['dti'] < 60]
    
    print(f"   Cleaned: {len(df):,} records")
    print(f"   Default rate: {df['target'].mean():.1%}")
    
    return df


def engineer_features(df):
    """
    IMPROVED Feature Engineering for LendingClub
    Creates 15+ meaningful features
    """
    
    df = df.copy()
    features = pd.DataFrame(index=df.index)
    
    # 1. Basic financial ratios
    features['loan_to_income'] = df['loan_amnt'] / df['annual_inc'].clip(lower=1000)
    features['loan_to_income'] = features['loan_to_income'].clip(0, 1)
    
    features['dti_normalized'] = df['dti'] / 100
    features['dti_normalized'] = features['dti_normalized'].clip(0, 1)
    
    features['credit_utilization'] = df['revol_util'] / 100
    features['credit_utilization'] = features['credit_utilization'].fillna(0.5).clip(0, 1)
    
    # 2. Employment & stability
    features['emp_length_years'] = df['emp_length'].fillna(5) / 30
    features['emp_length_years'] = features['emp_length_years'].clip(0, 1)
    
    features['has_long_employment'] = (df['emp_length'] >= 5).astype(int)
    
    # 3. Payment burden
    monthly_income = df['annual_inc'] / 12
    monthly_income = monthly_income.clip(lower=1000)
    
    if 'installment' in df.columns:
        features['payment_to_income'] = df['installment'] / monthly_income
    else:
        features['payment_to_income'] = (df['loan_amnt'] * 0.03) / monthly_income
    features['payment_to_income'] = features['payment_to_income'].clip(0, 0.5)
    
    # 4. Credit history indicators
    features['delinquency_flag'] = (df.get('delinq_2yrs', 0) > 0).astype(int)
    features['delinq_count'] = df.get('delinq_2yrs', 0).clip(0, 5) / 5
    
    features['inq_last_6mths'] = df.get('inq_last_6mths', 0).clip(0, 10) / 10
    
    features['pub_rec_flag'] = (df.get('pub_rec', 0) > 0).astype(int)
    
    # 5. Account metrics
    features['open_acc_count'] = df.get('open_acc', 10).clip(0, 30) / 30
    features['total_acc_count'] = df.get('total_acc', 20).clip(0, 50) / 50
    
    if 'open_acc' in df.columns and 'total_acc' in df.columns:
        features['acc_utilization'] = df['open_acc'] / df['total_acc'].clip(lower=1)
        features['acc_utilization'] = features['acc_utilization'].clip(0, 1).fillna(0.5)
    else:
        features['acc_utilization'] = 0.5
    
    # 6. Revolving balance indicators
    if 'revol_bal' in df.columns:
        features['revol_bal_to_income'] = df['revol_bal'] / df['annual_inc'].clip(lower=1000)
        features['revol_bal_to_income'] = features['revol_bal_to_income'].clip(0, 2) / 2
    else:
        features['revol_bal_to_income'] = 0.3
    
    # 7. Interest rate (higher = riskier)
    if 'int_rate' in df.columns:
        features['interest_rate'] = df['int_rate'] / 30
        features['interest_rate'] = features['interest_rate'].clip(0, 1)
    else:
        features['interest_rate'] = 0.4
    
    # 8. Home ownership
    home_map = {'OWN': 1.0, 'MORTGAGE': 0.7, 'RENT': 0.3, 'OTHER': 0.5, 'ANY': 0.5}
    features['home_ownership_score'] = df['home_ownership'].map(home_map).fillna(0.5)
    
    # 9. Verification status
    if 'verification_status' in df.columns:
        features['verified'] = (df['verification_status'] == 'Verified').astype(int)
    else:
        features['verified'] = 0
    
    # 10. Loan purpose risk (simplified)
    high_risk_purposes = ['debt_consolidation', 'credit_card', 'small_business']
    if 'purpose' in df.columns:
        features['high_risk_purpose'] = df['purpose'].isin(high_risk_purposes).astype(int)
    else:
        features['high_risk_purpose'] = 0
    
    # 11. Interaction features
    features['dti_x_utilization'] = features['dti_normalized'] * features['credit_utilization']
    features['payment_burden_score'] = features['payment_to_income'] * features['dti_normalized']
    features['risk_composite'] = (
        features['dti_normalized'] * 0.3 +
        features['credit_utilization'] * 0.3 +
        (1 - features['home_ownership_score']) * 0.2 +
        features['payment_to_income'] * 0.2
    )
    
    # Fill any NaN
    features = features.fillna(features.median())
    
    # Target
    y = df['target']
    
    print(f"\n📊 Engineered {len(features.columns)} features")
    
    # Feature list for reference
    feature_names = list(features.columns)
    
    return features, y, feature_names


def train_models(X, y):
    """Train models with improved pipeline"""
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\n📈 Training: {len(X_train):,} | Test: {len(X_test):,}")
    
    # Save distribution
    train_distribution = {col: X_train[col].describe().to_dict() for col in X.columns}
    
    # SMOTE
    print("\n⚖️  Applying SMOTE...")
    smote = SMOTE(random_state=42, sampling_strategy=0.5)  # Balance to 50% of majority
    X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)
    print(f"   After SMOTE: Good={sum(y_train_smote==0):,}, Bad={sum(y_train_smote==1):,}")
    
    results = {}
    models = {}
    
    # ===== Random Forest =====
    print("\n🌲 Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=50,
        min_samples_leaf=20,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train_smote, y_train_smote)
    
    rf_proba = rf_model.predict_proba(X_test)[:, 1]
    rf_pred = rf_model.predict(X_test)
    
    results['Random Forest'] = {
        'ROC-AUC': roc_auc_score(y_test, rf_proba),
        'F1': f1_score(y_test, rf_pred),
        'KS': calculate_ks(y_test, rf_proba)
    }
    models['rf'] = rf_model
    print(f"   ROC-AUC: {results['Random Forest']['ROC-AUC']:.4f}")
    
    # ===== LightGBM =====
    print("\n🍃 Training LightGBM...")
    lgbm_model = lgb.LGBMClassifier(
        n_estimators=300,
        max_depth=8,
        learning_rate=0.03,
        num_leaves=63,
        subsample=0.8,
        colsample_bytree=0.8,
        class_weight='balanced',
        random_state=42,
        verbose=-1
    )
    lgbm_model.fit(X_train_smote, y_train_smote)
    
    lgbm_proba = lgbm_model.predict_proba(X_test)[:, 1]
    lgbm_pred = lgbm_model.predict(X_test)
    
    results['LightGBM'] = {
        'ROC-AUC': roc_auc_score(y_test, lgbm_proba),
        'F1': f1_score(y_test, lgbm_pred),
        'KS': calculate_ks(y_test, lgbm_proba)
    }
    models['lgbm'] = lgbm_model
    print(f"   ROC-AUC: {results['LightGBM']['ROC-AUC']:.4f}")
    
    # ===== Logistic Regression =====
    print("\n📊 Training Logistic Regression...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_smote)
    X_test_scaled = scaler.transform(X_test)
    
    lr_model = LogisticRegression(C=0.1, max_iter=1000, class_weight='balanced', random_state=42)
    lr_model.fit(X_train_scaled, y_train_smote)
    
    lr_proba = lr_model.predict_proba(X_test_scaled)[:, 1]
    lr_pred = lr_model.predict(X_test_scaled)
    
    results['Logistic Regression'] = {
        'ROC-AUC': roc_auc_score(y_test, lr_proba),
        'F1': f1_score(y_test, lr_pred),
        'KS': calculate_ks(y_test, lr_proba)
    }
    models['lr'] = lr_model
    models['scaler'] = scaler
    print(f"   ROC-AUC: {results['Logistic Regression']['ROC-AUC']:.4f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n📊 Top 10 Features:")
    for _, row in feature_importance.head(10).iterrows():
        print(f"   {row['feature']}: {row['importance']:.4f}")
    
    return models, results, train_distribution, X_test, y_test, feature_importance


def calculate_ks(y_true, y_pred_proba):
    """Calculate KS statistic"""
    pos = y_pred_proba[y_true == 1]
    neg = y_pred_proba[y_true == 0]
    if len(pos) == 0 or len(neg) == 0:
        return 0.0
    return ks_2samp(pos, neg)[0]


def _simulate_lendingclub_data(n_samples=50000):
    """Fallback simulation"""
    np.random.seed(42)
    df = pd.DataFrame({
        'loan_amnt': np.random.lognormal(mean=9.2, sigma=0.7, size=n_samples),
        'annual_inc': np.random.lognormal(mean=10.8, sigma=0.5, size=n_samples),
        'emp_length': np.random.choice(range(11), size=n_samples),
        'dti': np.random.normal(loc=18, scale=8, size=n_samples).clip(0, 50),
        'revol_util': np.random.uniform(0, 100, size=n_samples),
        'home_ownership': np.random.choice(['OWN', 'MORTGAGE', 'RENT'], size=n_samples, p=[0.1, 0.5, 0.4]),
        'target': np.random.choice([0, 1], p=[0.80, 0.20], size=n_samples)
    })
    return df


def print_results(results):
    """Print comparison table"""
    print("\n" + "="*70)
    print("MODEL COMPARISON (Improved Features)")
    print("="*70)
    print(f"{'Model':<22} {'ROC-AUC':<12} {'F1 Score':<12} {'KS Stat':<12}")
    print("-"*70)
    
    best_auc = 0
    best_model = None
    
    for name, metrics in results.items():
        prefix = "→ " if name == "Random Forest" else "  "
        print(f"{prefix}{name:<20} {metrics['ROC-AUC']:<12.4f} {metrics['F1']:<12.4f} {metrics['KS']:<12.4f}")
        if metrics['ROC-AUC'] > best_auc:
            best_auc = metrics['ROC-AUC']
            best_model = name
    
    print("="*70)
    print(f"\n🏆 Best Model: {best_model} (ROC-AUC: {best_auc:.4f})")


def main():
    print("\n" + "="*60)
    print("🚀 CLEARSCORE ML MODEL TRAINER (IMPROVED)")
    print("="*60)
    
    # Load
    print("\n[1/3] Loading LendingClub dataset...")
    df = load_lendingclub_data(sample_size=100000)
    
    # Engineer
    print("\n[2/3] Engineering features...")
    X, y, feature_names = engineer_features(df)
    
    # Train
    print("\n[3/3] Training models...")
    models, results, train_distribution, X_test, y_test, feature_importance = train_models(X, y)
    
    # Save
    print("\n💾 Saving models...")
    os.makedirs("models", exist_ok=True)
    joblib.dump(models['rf'], "models/rf_model.pkl")
    joblib.dump(models['lgbm'], "models/lgbm_model.pkl")
    joblib.dump(models['lr'], "models/lr_model.pkl")
    joblib.dump(models.get('scaler', StandardScaler()), "models/scaler.pkl")
    joblib.dump(train_distribution, "models/train_distribution.pkl")
    joblib.dump(feature_names, "models/feature_names.pkl")
    joblib.dump(feature_importance, "models/feature_importance.pkl")
    print("   ✅ All models saved!")
    
    # Results
    print_results(results)
    print("\n✨ Training complete!")


if __name__ == "__main__":
    main()