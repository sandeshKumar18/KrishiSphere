import os

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier


DATA_PATH = "data/crop_data.csv"
MODEL_DIR = "artifacts/models"

FEATURES = [
    "N",
    "P",
    "K",
    "temperature",
    "humidity",
    "ph",
    "rainfall",
]

TARGET = "label"


def main():
    df = pd.read_csv(DATA_PATH)

    X = df[FEATURES]
    y = df[TARGET]

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=None,
        max_features="sqrt",
        min_samples_leaf=1,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1,
    )

    print("Training final model on full dataset...")

    model.fit(X, y)

    os.makedirs(MODEL_DIR, exist_ok=True)

    model_path = os.path.join(
        MODEL_DIR,
        "crop_recommendation_model.joblib",
    )

    metadata = {
        "model_type": "RandomForestClassifier",
        "model_version": "1.0.0",
        "features": FEATURES,
        "target": TARGET,
        "n_classes": len(model.classes_),
        "classes": model.classes_.tolist(),
        "training_rows": len(df),
    }

    metadata_path = os.path.join(
        MODEL_DIR,
        "model_metadata.joblib",
    )

    joblib.dump(model, model_path)
    joblib.dump(metadata, metadata_path)

    print(f"\nModel saved to: {model_path}")
    print(f"Metadata saved to: {metadata_path}")

    print("\nClasses:")
    print(model.classes_)


if __name__ == "__main__":
    main()