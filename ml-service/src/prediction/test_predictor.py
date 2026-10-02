from predictor import CropPredictor


def main():
    predictor = CropPredictor()

    sample = {
        "N": 40,
        "P": 30,
        "K": 50,
        "temperature": 25,
        "humidity": 70,
        "ph": 6.8,
        "rainfall": 120,
    }

    result = predictor.predict(sample)

    print("\n prediction -> ")
    print(result["prediction"])

    print("\ntop 3 recomemndatiions")

    for recommendation in result["recommendations"]:
        print(
            f"{recommendation['crop']} "
            f"-> {recommendation['score']:.4f}"
        )


if __name__ == "__main__":
    main()