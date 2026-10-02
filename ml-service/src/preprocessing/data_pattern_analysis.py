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


def inspect_crop(df, crop):
    data = df[df["label"] == crop].copy()

    print("\n" + "=" * 70)
    print(f"CROP: {crop}")
    print("=" * 70)

    print(f"Rows: {len(data)}")

    print("\nUnique values:")
    for feature in FEATURES:
        print(f"{feature}: {data[feature].nunique()}")

    print("\nFirst 10 rows:")
    print(data[FEATURES].head(10).to_string(index=False))

    print("\nFeature standard deviation:")
    print(data[FEATURES].std().round(4))


def main():
    df = pd.read_csv(DATA_PATH)

    crops_to_check = [
        "Apple",
        "Barley (Jau)",
        "Potato (Aloo)",
        "Wheat (Gehun)",
        "Rice",
        "Jowar (Sorghum)",
    ]

    for crop in crops_to_check:
        inspect_crop(df, crop)


if __name__ == "__main__":
    main()