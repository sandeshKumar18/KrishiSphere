import pandas as pd

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


def main():
    df = pd.read_csv(DATA_PATH)

    print("\n GLOBAL FEATURE UNIQUENESS ")

    for feature in FEATURES:
        print(
            f"{feature}: "
            f"{df[feature].nunique()} unique values "
            f"out of {len(df)} rows"
        )

    print("\n UNIQUE VALUES BY CROP ")

    for feature in FEATURES:
        avg_unique = (
            df.groupby("label")[feature]
            .nunique()
            .mean()
        )

        print(
            f"{feature}: "
            f"average unique values per crop = {avg_unique:.2f}"
        )

    print("\n  LABEL COUNT PER FEATURE VALUE")

    for feature in FEATURES:
        grouped = df.groupby(feature)["label"].nunique()

        print(f"\n{feature}")
        print(
            f"Min labels sharing a value: {grouped.min()}"
        )
        print(
            f"Max labels sharing a value: {grouped.max()}"
        )
        print(
            f"Mean labels sharing a value: {grouped.mean():.2f}"
        )


if __name__ == "__main__":
    main()