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

    print("\n WITHIN-CROP STANDARD DEVIATION \n")

    std = df.groupby("label")[FEATURES].std()

    print(std.round(3).to_string())

    print("\n WITHIN-CROP UNIQUE VALUE COUNTS \n")

    for crop, group in df.groupby("label"):
        print(f"\n{crop}")

        for feature in FEATURES:
            unique_count = group[feature].nunique()
            print(f"  {feature}: {unique_count}")


if __name__ == "__main__":
    main()