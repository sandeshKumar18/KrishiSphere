import dotenv from "dotenv";

dotenv.config();

const GEOCODING_URL=process.env.GEOCODING_URL;

const WEATHER_URL=process.env.WEATHER_URL;

const HISTORICAL_URL=process.env.HISTORICAL_URL;

const WEATHER_CACHE_TTL =
  10 * 60 * 1000; // 10 minutes

const weatherCache = new Map();

const weatherInFlight = new Map();


const createWeatherCacheKey = ({
  state,
  district,
}) => {
  return `${String(state || "")
    .trim()
    .toLowerCase()}|${String(district || "")
    .trim()
    .toLowerCase()}`;
};


const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

const getLocationCoordinates = async (
  state,
  district
) => {
  const params = new URLSearchParams({
    name: `${district}, ${state}`,
    count: "1",
    language: "en",
    format: "json",
    countryCode: "IN",
  });

  const response = await fetch(
    `${GEOCODING_URL}?${params}`
  );

  if (!response.ok) {
    throw new Error(
      "Weather location lookup failed"
    );
  }

  const data = await response.json();

  if (
    !data.results ||
    data.results.length === 0
  ) {
    throw new Error(
      `Could not find weather location for ${district}, ${state}`
    );
  }

  const location = data.results[0];

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
  };
};


const getCurrentWeather = async (
  latitude,
  longitude,
  timezone
) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,relative_humidity_2m",
    timezone: timezone || "auto",
    forecast_days: "1",
  });

  const url =
    `${WEATHER_URL}?${params.toString()}`;

  console.log(
    "[WEATHER] Current weather request:",
    url
  );

  const response = await fetch(url);

  const responseText =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `Weather API returned ${response.status}: ${responseText}`
    );
  }

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Weather API returned invalid JSON: ${responseText}`
    );
  }

  if (!data.current) {
    throw new Error(
      `Weather API response missing current data: ${responseText}`
    );
  }

  return {
    temperature:
      data.current.temperature_2m,

    humidity:
      data.current.relative_humidity_2m,
  };
};


const getAnnualRainfall = async (
  latitude,
  longitude,
  timezone
) => {
  const today = new Date();

  const endDate = new Date(today);
  endDate.setDate(
    endDate.getDate() - 1
  );

  const startDate = new Date(endDate);
  startDate.setDate(
    startDate.getDate() - 364
  );

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),

    start_date:
      formatDate(startDate),

    end_date:
      formatDate(endDate),

    daily: "precipitation_sum",

    timezone:
      timezone || "auto",
  });

  const response = await fetch(
    `${HISTORICAL_URL}?${params}`
  );

  if (!response.ok) {
    throw new Error(
      "Historical rainfall request failed"
    );
  }

  const data =
    await response.json();

  const precipitation =
    data.daily?.precipitation_sum || [];

  const totalRainfall =
    precipitation.reduce(
      (total, value) =>
        total +
        (Number(value) || 0),
      0
    );

  return Number(
    totalRainfall.toFixed(2)
  );
};



const fetchWeatherFromProvider = async ({
  state,
  district,
}) => {
  const coordinates =
    await getLocationCoordinates(
      state,
      district
    );

  const [
    currentWeather,
    rainfall,
  ] = await Promise.all([
    getCurrentWeather(
      coordinates.latitude,
      coordinates.longitude,
      coordinates.timezone
    ),

    getAnnualRainfall(
      coordinates.latitude,
      coordinates.longitude,
      coordinates.timezone
    ),
  ]);

  return {
    temperature:
      currentWeather.temperature,

    humidity:
      currentWeather.humidity,

    rainfall,

    location:
      coordinates,
  };
};



export const getWeatherForLocation =
  async ({
    state,
    district,
  }) => {
    if (!state || !district) {
      throw new Error(
        "State and district are required for weather lookup"
      );
    }

    const cacheKey =
      createWeatherCacheKey({
        state,
        district,
      });

    const now = Date.now();

    const cached =
      weatherCache.get(cacheKey);

    if (
      cached &&
      now - cached.timestamp <
        WEATHER_CACHE_TTL
    ) {
      console.log(
        `[WEATHER][CACHE HIT] ${cacheKey}`
      );

      return cached.data;
    }

    if (cached) {
      weatherCache.delete(
        cacheKey
      );
    }


    const existingRequest =
      weatherInFlight.get(cacheKey);

    if (existingRequest) {
      console.log(
        `[WEATHER][IN-FLIGHT] ${cacheKey}`
      );

      return existingRequest;
    }


    console.log(
      `[WEATHER][CACHE MISS] ${cacheKey}`
    );

    const requestPromise =
      fetchWeatherFromProvider({
        state,
        district,
      })
        .then((data) => {
          weatherCache.set(
            cacheKey,
            {
              data,
              timestamp: Date.now(),
            }
          );

          console.log(
            `[WEATHER][CACHE SET] ${cacheKey}`
          );

          return data;
        })
        .finally(() => {
          weatherInFlight.delete(
            cacheKey
          );
        });

    weatherInFlight.set(
      cacheKey,
      requestPromise
    );

    return requestPromise;
  };