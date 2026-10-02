const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

let requestCounter = 0;

const inFlightGetRequests = new Map();

const request = async (
  endpoint,
  options = {}
) => {
  const token =
    localStorage.getItem("token");

  const method = (
    options.method || "GET"
  ).toUpperCase();

  if (
    method === "GET" &&
    !options.skipDeduplication
  ) {
    const existingRequest =
      inFlightGetRequests.get(endpoint);

    if (existingRequest) {
      return existingRequest;
    }
  }

  const requestId =
    ++requestCounter;

  const {
    skipDeduplication,
    ...fetchOptions
  } = options;

  const executeRequest = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          ...fetchOptions,
          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),

            ...(fetchOptions.headers || {}),
          },
        }
      );

      let data = null;

      const contentType =
        response.headers.get(
          "content-type"
        );

      if (
        contentType?.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text =
          await response.text();

        data = text
          ? { message: text }
          : {};
      }

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          data?.errors?.[0]?.message ||
          `Request failed with status ${response.status}`;

        throw new Error(message);
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  if (
    method === "GET" &&
    !skipDeduplication
  ) {
    const promise =
      executeRequest();

    inFlightGetRequests.set(
      endpoint,
      promise
    );

    promise.finally(() => {
      if (
        inFlightGetRequests.get(
          endpoint
        ) === promise
      ) {
        inFlightGetRequests.delete(
          endpoint
        );
      }
    });

    return promise;
  }

  return executeRequest();
};

export const api = {
  get: (endpoint) =>
    request(endpoint),

  post: (endpoint, body) =>
    request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  patch: (endpoint, body) =>
    request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (endpoint) =>
    request(endpoint, {
      method: "DELETE",
    }),
};