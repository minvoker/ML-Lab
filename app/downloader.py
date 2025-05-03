from sklearn.datasets import fetch_california_housing
import pandas as pd

# # Load dataset
# data = fetch_california_housing(as_frame=True)

# # Convert to DataFrame
# df = data.frame

# # Save to CSV
# df.to_csv("california_housing.csv", index=False)

# print("Saved california_housing.csv successfully!")

import kagglehub
import os

# Step 1: Download dataset
path = kagglehub.dataset_download("harishkumardatalab/medical-insurance-price-prediction")
print("Downloaded to:", path)

# Step 2: Find the first CSV inside the downloaded folder
files = os.listdir(path)
csv_files = [f for f in files if f.endswith(".csv")]

if not csv_files:
    raise FileNotFoundError("No CSV file found in the downloaded folder.")

csv_path = os.path.join(path, csv_files[0])

# Step 3: Load CSV
df = pd.read_csv(csv_path)
print("First 5 rows:")
print(df.head())

