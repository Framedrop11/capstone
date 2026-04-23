"""
ClearScore ML Service - Real Data Loader
Loads actual LendingClub and German Credit datasets
"""

import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split

# ------------------------------
# German Credit Data Loader
# ------------------------------

def load_german_credit_data():
    """
    Load German Credit dataset from UCI repository.
    Features are space-separated, 20 columns + target.
    
    Column descriptions (from german.doc):
    1. Status of existing checking account (DM)
    2. Duration in months
    3. Credit history
    4. Purpose
    5. Credit amount
    6. Savings account/bonds
    7. Present employment since
    8. Installment rate (% of disposable income)
    9. Personal status and sex
    10. Other debtors / guarantors
    11. Present residence since
    12. Property
    13. Age in years
    14. Other installment plans
    15. Housing
    16. Number of existing credits at this bank
    17. Job
    18. Number of people being liable to provide maintenance for
    19. Telephone
    20. Foreign worker
    21. Target: 1 = Good, 2 = Bad
    """
    
    data_path = "data/german/german.data"
    
    # If file doesn't exist, use fallback simulation
    if not os.path.exists(data_path):
        print(f"⚠️ German Credit data not found at {data_path}")
        print("   Using simulated data instead. Download from:")
        print("   https://archive.ics.uci.edu/ml/machine-learning-databases/statlog/german/german.data")
        return _simulate_german_data()
    
    # German data has no header, space-separated
    columns = [
        'checking_status', 'duration', 'credit_history', 'purpose', 'credit_amount',
        'savings_status', 'employment', 'installment_rate', 'personal_status',
        'other_debtors', 'residence_since', 'property', 'age', 'other_installment',
        'housing', 'existing_credits', 'job', 'num_liable', 'telephone', 'foreign_worker'
    ]
    
    df = pd.read_csv(data_path, sep=' ', header=None, names=columns + ['target'])
    
    # Convert target: 1=Good (0), 2=Bad (1)
    df['credit_risk'] = df['target'] - 1
    
    print(f"✅ Loaded German Credit data: {len(df)} records")
    print(f"   Target distribution: Good={sum(df['credit_risk']==0)}, Bad={sum(df['credit_risk']==1)}")
    
    return df


# ------------------------------
# LendingClub Data Loader
# ------------------------------

def load_lendingclub_data(sample_size=50000):
    """
    Load LendingClub dataset from accepted loans.
    
    Key columns for feature engineering:
    - annual_inc: Annual income
    - loan_amnt: Loan amount
    - emp_length: Employment length (years)
    - dti: Debt-to-income ratio (%)
    - revol_util: Revolving line utilization rate (%)
    - loan_status: Target (Fully Paid=0, Charged Off/Default=1)
    """
    
    # Try multiple possible paths
    possible_paths = [
        "data/lendingclub/accepted_2007_to_2018Q4.csv",
        "data/lendingclub/loan_data.csv",
        "data/lendingclub/LoanStats3a.csv"
    ]
    
    data_path = None
    for path in possible_paths:
        if os.path.exists(path):
            data_path = path
            break
    
    if data_path is None:
        print("⚠️ LendingClub data not found.")
        print("   Download from Kaggle: https://www.kaggle.com/datasets/wordsforthewise/lending-club")
        print("   Or Figshare: https://figshare.com/ndownloader/files/39283194")
        print("   Using simulated data instead.")
        return _simulate_lendingclub_data(sample_size)
    
    print(f"📂 Loading LendingClub data from {data_path}...")
    
    # Load with sampling for memory efficiency
    if sample_size:
        # Read only necessary columns to save memory
        cols = ['annual_inc', 'loan_amnt', 'emp_length', 'dti', 'revol_util', 'loan_status']
        df = pd.read_csv(data_path, usecols=cols, nrows=sample_size * 3)  # Read extra for filtering
    else:
        cols = ['annual_inc', 'loan_amnt', 'emp_length', 'dti', 'revol_util', 'loan_status']
        df = pd.read_csv(data_path, usecols=cols)
    
    # Clean and filter data
    df = df.dropna(subset=['annual_inc', 'loan_amnt', 'dti', 'loan_status'])
    
    # Filter loan_status: Fully Paid = 0, Charged Off/Default = 1
    df = df[df['loan_status'].isin(['Fully Paid', 'Charged Off', 'Default'])]
    df['target'] = (df['loan_status'] != 'Fully Paid').astype(int)
    
    # Clean emp_length: convert string like "10+ years" to numeric
    df['emp_length'] = df['emp_length'].astype(str).str.extract(r'(\d+)').astype(float).fillna(0)
    
    # Sample if needed
    if sample_size and len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42)
    
    print(f"✅ Loaded LendingClub data: {len(df)} records")
    print(f"   Target distribution: Good={sum(df['target']==0)}, Bad={sum(df['target']==1)}")
    
    return df


# ------------------------------
# Simulation Fallbacks
# ------------------------------

def _simulate_german_data():
    """Fallback: Simulate German Credit data"""
    np.random.seed(42)
    n_samples = 1000
    
    data = {
        'duration': np.random.randint(4, 72, size=n_samples),
        'credit_amount': np.random.lognormal(mean=8.5, sigma=0.8, size=n_samples),
        'installment_rate': np.random.randint(1, 5, size=n_samples),
        'residence_since': np.random.randint(1, 5, size=n_samples),
        'age': np.random.randint(19, 75, size=n_samples),
        'existing_credits': np.random.randint(1, 5, size=n_samples),
        'job': np.random.choice([0, 1, 2, 3], size=n_samples),
        'num_liable': np.random.choice([0, 1, 2], p=[0.7, 0.25, 0.05], size=n_samples),
        'foreign_worker': np.random.choice([0, 1], p=[0.05, 0.95], size=n_samples),
        'credit_risk': np.random.choice([0, 1], p=[0.70, 0.30], size=n_samples)
    }
    
    return pd.DataFrame(data)


def _simulate_lendingclub_data(n_samples=50000):
    """Fallback: Simulate LendingClub data"""
    np.random.seed(42)
    
    data = {
        'annual_inc': np.random.lognormal(mean=10.8, sigma=0.5, size=n_samples),
        'loan_amnt': np.random.lognormal(mean=9.2, sigma=0.7, size=n_samples),
        'emp_length': np.random.choice(range(11), p=[0.05, 0.05, 0.08, 0.10, 0.12, 0.12, 0.12, 0.12, 0.10, 0.08, 0.06], size=n_samples),
        'dti': np.random.normal(loc=18, scale=8, size=n_samples).clip(0, 50),
        'revol_util': np.random.uniform(0, 100, size=n_samples),
        'target': np.random.choice([0, 1], p=[0.78, 0.22], size=n_samples)
    }
    
    df = pd.DataFrame(data)
    df['loan_status'] = df['target'].map({0: 'Fully Paid', 1: 'Charged Off'})
    
    return df


# ------------------------------
# Combined Data Loader
# ------------------------------

def load_and_merge_datasets(lc_sample_size=50000):
    """
    Load both datasets and return combined features and target.
    """
    print("\n" + "="*60)
    print("📊 LOADING REAL DATASETS")
    print("="*60)
    
    # Load datasets
    df_lc = load_lendingclub_data(sample_size=lc_sample_size)
    df_german = load_german_credit_data()
    
    return df_lc, df_german


if __name__ == "__main__":
    # Test loading
    df_lc, df_german = load_and_merge_datasets()
    print("\n✅ Data loading test complete!")