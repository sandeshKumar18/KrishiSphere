import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
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

    skf = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42,
    )

    accuracy_scores = []
    f1_scores = []

    print("===== 5-FOLD STRATIFIED CROSS-VALIDATION =====")

    for fold, (train_index, test_index) in enumerate(
        skf.split(X, y),
        start=1,
    ):
        X_train = X.iloc[train_index]
        X_test = X.iloc[test_index]

        y_train = y.iloc[train_index]
        y_test = y.iloc[test_index]

        model = RandomForestClassifier(
            n_estimators=200,
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

        accuracy_scores.append(accuracy)
        f1_scores.append(macro_f1)

        print(
            f"Fold {fold}: "
            f"Accuracy={accuracy:.4f}, "
            f"Macro-F1={macro_f1:.4f}"
        )

    print("\n final cross validation reports ")

    print(
        f"Mean Accuracy: "
        f"{sum(accuracy_scores) / len(accuracy_scores):.4f}"
    )

    print(
        f"Std Accuracy: "
        f"{pd.Series(accuracy_scores).std():.4f}"
    )

    print(
        f"Mean Macro-F1: "
        f"{sum(f1_scores) / len(f1_scores):.4f}"
    )

    print(
        f"Std Macro-F1: "
        f"{pd.Series(f1_scores).std():.4f}"
    )


if __name__ == "__main__":
    main()