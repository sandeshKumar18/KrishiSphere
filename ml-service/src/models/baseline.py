import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

DATA_PATH = "data/crop_data.csv"

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

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    print("===== DATA SPLIT =====")
    print("Training samples:", len(X_train))
    print("Testing samples :", len(X_test))

    model = DecisionTreeClassifier(
        random_state=42
    )

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print("\n Accuracy ")
    print(f"{accuracy:.4f}")

    print("\n classification repot")
    print(
        classification_report(
            y_test,
            y_pred,
            zero_division=0,
        )
    )

    print("\n confusion matrix results")
    matrix = confusion_matrix(y_test, y_pred)

    print(matrix.shape)

    print("\n feature importance")

    importance = pd.Series(
        model.feature_importances_,
        index=FEATURES,
    ).sort_values(ascending=False)

    print(importance)


if __name__ == "__main__":
    main()