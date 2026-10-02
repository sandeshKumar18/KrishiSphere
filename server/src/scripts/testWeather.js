import { getWeatherForLocation } from "../services/weatherService.js";

const testWeather = async () => {
  try {
    const weather = await getWeatherForLocation({
      state: "Uttar Pradesh",
      district: "Aligarh",
    });

    console.log("WEATHER");
    console.log(weather);
  } catch (error) {
    console.error("Weather test failed:", error.message);
  }
};

testWeather();