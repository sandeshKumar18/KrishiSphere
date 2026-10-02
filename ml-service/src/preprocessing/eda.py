import pandas as pd
import matplotlib.pyplot as plt

DATA_PATH = "data/crop_data.csv"


def main():
    df = pd.read_csv(DATA_PATH)

    print("\n CLASS DISTRIBUTION ")
    print(df["label"].value_counts().sort_index())

    print("\n DESCRIPTIVE STATISTICS ")
    print(df.describe())

    print("\n FEATURE RANGES ")
    numeric_columns = df.select_dtypes(include="number").columns

    for column in numeric_columns:
        print(
            f"{column}: "
            f"min={df[column].min():.3f}, "
            f"max={df[column].max():.3f}"
        )

    plt.figure(figsize=(10, 6))
    df["label"].value_counts().sort_index().plot(kind="bar")
    plt.title("Samples per Crop")
    plt.xlabel("Crop")
    plt.ylabel("Number of Samples")
    plt.xticks(rotation=90)
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    main()