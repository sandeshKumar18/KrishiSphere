import pandas as pd
import matplotlib.pyplot as plt

DATA_PATH = "data/crop_data.csv"


def main():
    df = pd.read_csv(DATA_PATH)

    features = [
        "N",
        "P",
        "K",
        "temperature",
        "humidity",
        "ph",
        "rainfall",
    ]

    print("\n CROP-WISE MEANS ")
    crop_means = df.groupby("label")[features].mean()
    print(crop_means.round(2))

    print("\nCROP-WISE MEDIANS ")
    crop_medians = df.groupby("label")[features].median()
    print(crop_medians.round(2))

    print("\n CROP SAMPLE COUNTS ")
    counts = df["label"].value_counts().sort_values()
    print(counts)

    for feature in features:
        plt.figure(figsize=(14, 7))

        df.boxplot(
            column=feature,
            by="label",
            rot=90,
            figsize=(14, 7)
        )

        plt.title(f"{feature} Distribution Across Crops")
        plt.suptitle("")
        plt.xlabel("Crop")
        plt.ylabel(feature)
        plt.tight_layout()
        plt.show()


if __name__ == "__main__":
    main()