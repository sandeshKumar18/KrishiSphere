import pandas as pd


DATA_PATH = "data/crop_data.csv"


def main():
    df = pd.read_csv(DATA_PATH)

    print("\n SHAPE ")
    print(df.shape)

    print("\n COLUMNS ")
    print(df.columns.tolist())

    print("\n FIRST 5 ROWS ")
    print(df.head())

    print("\n DATA TYPES ")
    print(df.dtypes)

    print("\n INFO ")
    df.info()

    print("\n MISSING VALUES ")
    print(df.isnull().sum())

    print("\n DUPLICATES ")
    print("Duplicate rows:", df.duplicated().sum())

    print("\n UNIQUE VALUES ")
    for column in df.columns:
        print(f"{column}: {df[column].nunique()}")


if __name__ == "__main__":
    main()