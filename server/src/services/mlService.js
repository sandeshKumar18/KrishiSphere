const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

export const predictCrop = async (inputData) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inputData),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `ML service error: ${response.status} - ${errorText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("ML service request failed:", error.message);
    throw new Error("Unable to get crop prediction");
  }
};