import "dotenv/config";

const MARKET_API_URL =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

const normalizeValue = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

const fetchMarketRecords = async ({
  state,
  district,
  commodity,
}) => {
  const params = new URLSearchParams({
    "api-key":
      process.env.DATA_GOV_IN_API_KEY,
    format: "json",
    limit: "50",
  });

  const cleanState =
    normalizeValue(state);

  const cleanDistrict =
    normalizeValue(district);

  const cleanCommodity =
    normalizeValue(commodity);

  if (cleanState) {
    params.set(
      "filters[state.keyword]",
      cleanState
    );
  }

  if (cleanDistrict) {
    params.set(
      "filters[district]",
      cleanDistrict
    );
  }

  if (cleanCommodity) {
    params.set(
      "filters[commodity]",
      cleanCommodity
    );
  }

  const url =
    `${MARKET_API_URL}?${params.toString()}`;

  let lastError = null;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    const controller =
      new AbortController();

    const timeoutId =
      setTimeout(
        () =>
          controller.abort(),
        REQUEST_TIMEOUT_MS
      );

    try {
      const response =
        await fetch(url, {
          signal:
            controller.signal,
        });

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          `Market API returned ${response.status}: ${responseText.slice(
            0,
            500
          )}`
        );
      }

      let data;

      try {
        data =
          JSON.parse(
            responseText
          );
      } catch {
        throw new Error(
          "Market API returned invalid JSON."
        );
      }

      const records =
        Array.isArray(
          data?.records
        )
          ? data.records
          : [];

      return records;
    } catch (error) {
      lastError = error;

      console.error(
        `Market API attempt ${attempt}/${MAX_RETRIES} failed:`,
        error.message
      );

      if (
        attempt < MAX_RETRIES
      ) {
        await sleep(
          500 * attempt
        );
      }
    } finally {
      clearTimeout(
        timeoutId
      );
    }
  }

  throw new Error(
    `Market provider unavailable: ${
      lastError?.message ||
      "Unknown error"
    }`
  );
};

export const getMarketPrices = async ({
  state,
  district,
  commodity,
}) => {
  if (
    !process.env.DATA_GOV_IN_API_KEY
  ) {
    throw new Error(
      "DATA_GOV_IN_API_KEY is not configured"
    );
  }

  const cleanState =
    normalizeValue(state);

  const cleanDistrict =
    normalizeValue(district);

  const cleanCommodity =
    normalizeValue(commodity);

  if (
    !cleanState ||
    !cleanCommodity
  ) {
    throw new Error(
      "state and commodity are required"
    );
  }

  if (cleanDistrict) {
    try {
      const districtRecords =
        await fetchMarketRecords({
          state: cleanState,
          district: cleanDistrict,
          commodity:
            cleanCommodity,
        });

      if (
        districtRecords.length > 0
      ) {
        return {
          records:
            districtRecords,
          scope: "district",
          state: cleanState,
          district:
            cleanDistrict,
          commodity:
            cleanCommodity,
        };
      }
    } catch (error) {
      console.error(
        "District market lookup failed:",
        error.message
      );
    }
  }


  try {
    const stateRecords =
      await fetchMarketRecords({
        state: cleanState,
        commodity:
          cleanCommodity,
      });

    if (
      stateRecords.length > 0
    ) {
      return {
        records:
          stateRecords,
        scope: "state",
        state: cleanState,
        district:
          cleanDistrict,
        commodity:
          cleanCommodity,
      };
    }
  } catch (error) {
    console.error(
      "State market lookup failed:",
      error.message
    );

    throw new Error(
      `Market provider is currently unavailable. ${
        error.message
      }`
    );
  }

  
  return {
    records: [],
    scope: "none",
    state: cleanState,
    district:
      cleanDistrict,
    commodity:
      cleanCommodity,
  };
};