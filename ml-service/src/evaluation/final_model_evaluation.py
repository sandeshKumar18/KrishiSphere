import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
)
from sklearn.model_selection import StratifiedKFold


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

    cv = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42,
    )

    accuracy_scores = []
    macro_f1_scores = []
    weighted_f1_scores = []

    all_true = []
    all_pred = []

    for fold, (train_index, test_index) in enumerate(
        cv.split(X, y),
        start=1,
    ):
        X_train = X.iloc[train_index]
        X_test = X.iloc[test_index]

        y_train = y.iloc[train_index]
        y_test = y.iloc[test_index]

        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=None,
            max_features="sqrt",
            min_samples_leaf=1,
            min_samples_split=2,
            random_state=42,
            n_jobs=-1,
        )

        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)

        accuracy = accuracy_score(y_test, y_pred)

        macro_f1 = f1_score(
            y_test,
            y_pred,
            average="macro",
            zero_division=0,
        )

        weighted_f1 = f1_score(
            y_test,
            y_pred,
            average="weighted",
            zero_division=0,
        )

        accuracy_scores.append(accuracy)
        macro_f1_scores.append(macro_f1)
        weighted_f1_scores.append(weighted_f1)

        all_true.extend(y_test)
        all_pred.extend(y_pred)

        print(
            f"Fold {fold}: "
            f"Accuracy={accuracy:.4f}, "
            f"Macro-F1={macro_f1:.4f}, "
            f"Weighted-F1={weighted_f1:.4f}"
        )

    print("\n===== FINAL CROSS-VALIDATION RESULTS =====")

    print(
        f"Accuracy: "
        f"{pd.Series(accuracy_scores).mean():.4f} "
        f"+/- {pd.Series(accuracy_scores).std():.4f}"
    )

    print(
        f"Macro-F1: "
        f"{pd.Series(macro_f1_scores).mean():.4f} "
        f"+/- {pd.Series(macro_f1_scores).std():.4f}"
    )

    print(
        f"Weighted-F1: "
        f"{pd.Series(weighted_f1_scores).mean():.4f} "
        f"+/- {pd.Series(weighted_f1_scores).std():.4f}"
    )

    print("\ AGGREGATED CLASSIFICATION REPORT ")

    print(
        classification_report(
            all_true,
            all_pred,
            zero_division=0,
        )
    )


if __name__ == "__main__":
    main()