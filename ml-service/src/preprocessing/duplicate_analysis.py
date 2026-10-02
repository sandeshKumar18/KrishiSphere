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

    print("\n FULL FEATURE VECTOR UNIQUENESS ")

    for crop, group in df.groupby("label"):
        unique_rows = group[FEATURES].drop_duplicates().shape[0]
        total_rows = len(group)

        print(
            f"{crop}: "
            f"{unique_rows} unique / {total_rows} total"
        )

    print("\n EXACT DUPLICATE FEATURE VECTORS")

    duplicate_features = df.duplicated(
        subset=FEATURES,
        keep=False
    )

    duplicates = df[duplicate_features].sort_values(FEATURES)

    print(f"Rows involved in duplicate feature vectors: {len(duplicates)}")

    if not duplicates.empty:
        print(duplicates.head(20).to_string(index=False))


if __name__ == "__main__":
    main()