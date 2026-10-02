from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = (
    BASE_DIR
    / "artifacts"
    / "models"
    / "crop_recommendation_model.joblib"
)


FEATURES = [
    "N",
    "P",
    "K",
    "temperature",
    "humidity",
    "ph",
    "rainfall",
]


class CropPredictor:
    def __init__(self):
        self.model = joblib.load(MODEL_PATH)

    def predict(self, input_data: dict) -> dict:
        missing_features = [
            feature
            for feature in FEATURES
            if feature not in input_data
        ]

        if missing_features:
            raise ValueError(
                f"Missing features: {missing_features}"
            )

        data = pd.DataFrame(
            [[input_data[feature] for feature in FEATURES]],
            columns=FEATURES,
        )

        prediction = self.model.predict(data)[0]

        probabilities = self.model.predict_proba(data)[0]

        class_names = self.model.classes_

        ranked_indices = probabilities.argsort()[::-1]

        recommendations = []

        for index in ranked_indices[:3]:
            recommendations.append(
                {
                    "crop": class_names[index],
                    "score": float(probabilities[index]),
                }
            )

        return {
            "prediction": prediction,
            "recommendations": recommendations,
        }