import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import StratifiedKFold


DATA_PATH = "data/crop_data.csv"

FEATURE_GROUPS = {
    "All Features": [
        "N",
        "P",
        "K",
        "temperature",
        "humidity",
        "ph",
        "rainfall",
    ],

    "NPK Only": [
        "N",
        "P",
        "K",
    ],

    "Environmental Only": [
        "temperature",
        "humidity",
        "ph",
        "rainfall",
    ],

    "NPK + pH": [
        "N",
        "P",
        "K",
        "ph",
    ],
}

TARGET = "label"


def evaluate_feature_group(df, feature_name, features):
    X = df[features]
    y = df[TARGET]

    skf = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42,
    )

    accuracy_scores = []
    f1_scores = []

    for train_index, test_index in skf.split(X, y):

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

        accuracy_scores.append(
            accuracy_score(y_test, y_pred)
        )

        f1_scores.append(
            f1_score(
                y_test,
                y_pred,
                average="macro",
                zero_division=0,
            )
        )

    return {
        "feature_set": feature_name,
        "features": features,
        "mean_accuracy": sum(accuracy_scores)
        / len(accuracy_scores),
        "std_accuracy": pd.Series(
            accuracy_scores
        ).std(),

        "mean_macro_f1": sum(f1_scores)
        / len(f1_scores),

        "std_macro_f1": pd.Series(
            f1_scores
        ).std(),
    }


def main():
    df = pd.read_csv(DATA_PATH)

    results = []

    print("===== FEATURE ABLATION EXPERIMENT =====")

    for feature_name, features in FEATURE_GROUPS.items():

        print(f"\nRunning: {feature_name}")
        print(f"Features: {features}")

        result = evaluate_feature_group(
            df,
            feature_name,
            features,
        )

        results.append(result)

        print(
            f"Mean Accuracy: "
            f"{result['mean_accuracy']:.4f}"
        )

        print(
            f"Std Accuracy: "
            f"{result['std_accuracy']:.4f}"
        )

        print(
            f"Mean Macro-F1: "
            f"{result['mean_macro_f1']:.4f}"
        )

        print(
            f"Std Macro-F1: "
            f"{result['std_macro_f1']:.4f}"
        )

    print("\n===== FINAL COMPARISON =====")

    comparison = pd.DataFrame(results)

    display_columns = [
        "feature_set",
        "mean_accuracy",
        "std_accuracy",
        "mean_macro_f1",
        "std_macro_f1",
    ]

    print(
        comparison[
            display_columns
        ].to_string(index=False)
    )


if __name__ == "__main__":
    main()