import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Store,
  TrendingUp,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { api } from "../lib/api";
import "./Market.css";

const getEntityId = (entity) =>
  entity?._id?.$oid ||
  entity?._id ||
  entity?.id ||
  entity?.cropCycleId ||
  null;

const extractFields = (data) => {
  if (Array.isArray(data)) return data;

  return (
    data?.fields ||
    data?.data?.fields ||
    data?.data ||
    data?.results ||
    []
  );
};

const extractCycles = (data) => {
  if (Array.isArray(data)) return data;

  return (
    data?.cropCycles ||
    data?.cycles ||
    data?.data?.cropCycles ||
    data?.data ||
    data?.results ||
    []
  );
};

const extractMarket = (data) => {
  return (
    data?.market ||
    data?.data?.market ||
    data?.data ||
    data ||
    {}
  );
};

const extractRecords = (market) => {
  if (Array.isArray(market?.records)) {
    return market.records;
  }

  if (Array.isArray(market?.data)) {
    return market.data;
  }

  if (Array.isArray(market)) {
    return market;
  }

  return [];
};

const getValue = (record, keys, fallback = "") => {
  for (const key of keys) {
    if (
      record?.[key] !== undefined &&
      record?.[key] !== null &&
      record?.[key] !== ""
    ) {
      return record[key];
    }
  }

  return fallback;
};

const formatPrice = (value) => {
  const number = Number(
    String(value ?? "")
      .replace(/,/g, "")
      .trim()
  );

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `₹${number.toLocaleString("en-IN")}`;
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getRecordName = (record) =>
  getValue(
    record,
    ["market", "Market", "mandi", "Mandi"],
    "Market"
  );

const getCommodity = (record, fallback) =>
  getValue(
    record,
    ["commodity", "Commodity", "crop", "Crop"],
    fallback
  );

const getVariety = (record) =>
  getValue(
    record,
    ["variety", "Variety", "grade", "Grade"],
    "Standard"
  );

const getMinPrice = (record) =>
  getValue(record, [
    "min_price",
    "Min Price",
    "minPrice",
    "Minimum Price",
  ]);

const getMaxPrice = (record) =>
  getValue(record, [
    "max_price",
    "Max Price",
    "maxPrice",
    "Maximum Price",
  ]);

const getModalPrice = (record) =>
  getValue(record, [
    "modal_price",
    "Modal Price",
    "modalPrice",
    "Modal",
  ]);

const getArrivalDate = (record) =>
  getValue(record, [
    "arrival_date",
    "Arrival Date",
    "arrivalDate",
    "date",
    "Date",
  ]);

const Market = () => {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [fields, setFields] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] =
    useState(searchParams.get("cycle") || "");

  const [market, setMarket] = useState(null);

  const [loading, setLoading] = useState(true);
  const [marketLoading, setMarketLoading] =
    useState(false);

  const [error, setError] = useState("");

  const loadCycles = async () => {
    try {
      setLoading(true);
      setError("");

      const fieldResponse =
        await api.get("/fields");

      const fieldList =
        extractFields(fieldResponse);

      setFields(fieldList);

      if (!fieldList.length) {
        setCycles([]);
        setSelectedCycleId("");
        setMarket(null);
        return;
      }

      const cycleResults =
        await Promise.all(
          fieldList.map(async (field) => {
            const fieldId =
              getEntityId(field);

            if (!fieldId) {
              return [];
            }

            try {
              const response = await api.get(
                `/fields/${fieldId}/crop-cycles`
              );

              return extractCycles(response).map(
                (cycle) => ({
                  ...cycle,
                  __field: field,
                })
              );
            } catch (err) {
              console.error(
                `Unable to load cycles for field ${fieldId}:`,
                err
              );

              return [];
            }
          })
        );

      const allCycles =
        cycleResults.flat();

      setCycles(allCycles);

      if (!allCycles.length) {
        setSelectedCycleId("");
        setMarket(null);
        return;
      }

      const queryCycle =
        searchParams.get("cycle");

      const queryExists = allCycles.some(
        (cycle) =>
          String(getEntityId(cycle)) ===
          String(queryCycle)
      );

      if (
        queryExists &&
        queryCycle
      ) {
        setSelectedCycleId(queryCycle);
        return;
      }

      const preferredCycle =
        allCycles.find(
          (cycle) =>
            cycle?.status === "active"
        ) ||
        allCycles.find(
          (cycle) =>
            cycle?.status === "planned"
        ) ||
        allCycles[0];

      const preferredId =
        getEntityId(preferredCycle);

      if (preferredId) {
        setSelectedCycleId(
          String(preferredId)
        );

        setSearchParams(
          { cycle: String(preferredId) },
          { replace: true }
        );
      }
    } catch (err) {
      console.error(
        "Market cycle loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load your crop cycles."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMarket = async (cycleId) => {
    if (!cycleId) {
      setMarket(null);
      return;
    }

    try {
      setMarketLoading(true);
      setError("");

      const response = await api.get(
        `/crop-cycles/${cycleId}/market`
      );

      setMarket(
        extractMarket(response)
      );
    } catch (err) {
      console.error(
        "Market loading error:",
        err
      );

      setMarket(null);

      setError(
        err.message ||
          "Unable to load current market prices."
      );
    } finally {
      setMarketLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, []);

  useEffect(() => {
    if (selectedCycleId) {
      loadMarket(selectedCycleId);
    }
  }, [selectedCycleId]);

  const selectedCycle = useMemo(
    () =>
      cycles.find(
        (cycle) =>
          String(getEntityId(cycle)) ===
          String(selectedCycleId)
      ) || null,
    [cycles, selectedCycleId]
  );

  const records = useMemo(
    () => extractRecords(market),
    [market]
  );

  const selectedCrop =
    market?.crop?.name ||
    selectedCycle?.cropId?.name ||
    selectedCycle?.crop?.name ||
    "Crop";

  const selectedField =
    selectedCycle?.__field || null;

  const locationText = [
    market?.location?.district ||
      market?.district ||
      selectedField?.location?.district,

    market?.location?.state ||
      market?.state ||
      selectedField?.location?.state,
  ]
    .filter(Boolean)
    .join(", ");

  const summary = useMemo(() => {
    if (!records.length) {
      return {
        min: null,
        max: null,
        modal: null,
      };
    }

    const minValues = records
      .map((record) =>
        Number(
          String(getMinPrice(record))
            .replace(/,/g, "")
        )
      )
      .filter(Number.isFinite);

    const maxValues = records
      .map((record) =>
        Number(
          String(getMaxPrice(record))
            .replace(/,/g, "")
        )
      )
      .filter(Number.isFinite);

    const modalValues = records
      .map((record) =>
        Number(
          String(getModalPrice(record))
            .replace(/,/g, "")
        )
      )
      .filter(Number.isFinite);

    const average = (values) =>
      values.length
        ? values.reduce(
            (total, value) => total + value,
            0
          ) / values.length
        : null;

    return {
      min: average(minValues),
      max: average(maxValues),
      modal: average(modalValues),
    };
  }, [records]);

  const handleCycleChange = (event) => {
    const cycleId = event.target.value;

    setSelectedCycleId(cycleId);

    setSearchParams(
      { cycle: cycleId },
      { replace: true }
    );
  };

  const refreshMarket = () => {
    if (selectedCycleId) {
      loadMarket(selectedCycleId);
    }
  };

  if (loading) {
    return (
      <div className="market-page">
        <div className="market-loading">
          <LoaderCircle
            size={28}
            className="market-spin"
          />

          <h2>Preparing market data</h2>

          <p>
            Loading your crop cycles and
            market information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="market-page">
      <section className="market-header">
        <div>
          <span className="market-kicker">
            <TrendingUp size={14} />
            MARKET INTELLIGENCE
          </span>

          <h1>Crop Market Prices</h1>

          <p>
            View recent mandi prices for the
            crop you are currently growing.
          </p>
        </div>

        <button
          type="button"
          className="market-refresh-button"
          onClick={refreshMarket}
          disabled={
            !selectedCycleId ||
            marketLoading
          }
        >
          <RefreshCw
            size={16}
            className={
              marketLoading
                ? "market-spin"
                : ""
            }
          />

          Refresh
        </button>
      </section>

      {error && (
        <div className="market-error">
          <div>
            <strong>
              Market data could not be loaded
            </strong>

            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (selectedCycleId) {
                loadMarket(
                  selectedCycleId
                );
              } else {
                loadCycles();
              }
            }}
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      {!cycles.length ? (
        <section className="market-empty">
          <div className="market-empty-icon">
            <Store size={27} />
          </div>

          <h2>No crop cycle available</h2>

          <p>
            Start a crop cycle from one of your
            fields to view relevant market prices.
          </p>
        </section>
      ) : (
        <>
          <section className="market-context-card">
            <div className="market-context-left">
              <div className="market-context-icon">
                <Store size={20} />
              </div>

              <div>
                <span>
                  MARKET FOR CROP CYCLE
                </span>

                <h2>{selectedCrop}</h2>

                <p>
                  {selectedField?.name ||
                    "Selected field"}
                  {locationText
                    ? ` • ${locationText}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="market-selector">
              <label htmlFor="market-cycle">
                Crop cycle
              </label>

              <div className="market-select-wrap">
                <select
                  id="market-cycle"
                  value={selectedCycleId}
                  onChange={
                    handleCycleChange
                  }
                >
                  {cycles.map((cycle) => {
                    const cycleId =
                      getEntityId(cycle);

                    const cropName =
                      cycle?.cropId?.name ||
                      cycle?.crop?.name ||
                      "Crop";

                    const fieldName =
                      cycle?.__field?.name ||
                      "Field";

                    const status =
                      cycle?.status
                        ?.replace("_", " ")
                        ?.replace(
                          /^\w/,
                          (char) =>
                            char.toUpperCase()
                        ) || "";

                    return (
                      <option
                        key={cycleId}
                        value={cycleId}
                      >
                        {cropName} —{" "}
                        {fieldName}
                        {status
                          ? ` (${status})`
                          : ""}
                      </option>
                    );
                  })}
                </select>

                <ChevronDown
                  size={17}
                />
              </div>
            </div>
          </section>

          {marketLoading ? (
            <div className="market-panel-loading">
              <LoaderCircle
                size={25}
                className="market-spin"
              />

              <span>
                Fetching latest market prices...
              </span>
            </div>
          ) : (
            <>
              <section className="market-summary-grid">
                <article className="market-summary-card">
                  <div className="market-summary-top">
                    <span>Average Min</span>
                  </div>

                  <strong>
                    {summary.min !== null
                      ? formatPrice(summary.min)
                      : "—"}
                  </strong>

                  <small>
                    Across available markets
                  </small>
                </article>

                <article className="market-summary-card">
                  <div className="market-summary-top">
                    <span>Average Modal</span>
                    <TrendingUp size={17} />
                  </div>

                  <strong>
                    {summary.modal !== null
                      ? formatPrice(
                          summary.modal
                        )
                      : "—"}
                  </strong>

                  <small>
                    Typical reported price
                  </small>
                </article>

                <article className="market-summary-card">
                  <div className="market-summary-top">
                    <span>Average Max</span>
                  </div>

                  <strong>
                    {summary.max !== null
                      ? formatPrice(summary.max)
                      : "—"}
                  </strong>

                  <small>
                    Across available markets
                  </small>
                </article>
              </section>

              <section className="market-main-grid">
                <div className="market-records-card">
                  <div className="market-section-heading">
                    <div>
                      <span>
                        MARKET RECORDS
                      </span>

                      <h2>
                        Recent mandi prices
                      </h2>
                    </div>

                    {market?.scope && (
                      <span className="market-scope">
                        {market.scope}
                      </span>
                    )}
                  </div>

                  {records.length ? (
                    <div className="market-record-list">
                      {records.map(
                        (record, index) => {
                          const marketName =
                            getRecordName(
                              record
                            );

                          const commodity =
                            getCommodity(
                              record,
                              selectedCrop
                            );

                          const variety =
                            getVariety(
                              record
                            );

                          const minPrice =
                            getMinPrice(
                              record
                            );

                          const maxPrice =
                            getMaxPrice(
                              record
                            );

                          const modalPrice =
                            getModalPrice(
                              record
                            );

                          const arrivalDate =
                            getArrivalDate(
                              record
                            );

                          return (
                            <article
                              key={`${marketName}-${index}`}
                              className="market-record"
                            >
                              <div className="market-record-heading">
                                <div className="market-market-icon">
                                  <Store
                                    size={18}
                                  />
                                </div>

                                <div>
                                  <h3>
                                    {marketName}
                                  </h3>

                                  <p>
                                    {commodity}
                                    {variety
                                      ? ` • ${variety}`
                                      : ""}
                                  </p>
                                </div>
                              </div>

                              <div className="market-price-grid">
                                <div>
                                  <span>
                                    Min
                                  </span>

                                  <strong>
                                    {formatPrice(
                                      minPrice
                                    )}
                                  </strong>
                                </div>

                                <div className="modal-price">
                                  <span>
                                    Modal
                                  </span>

                                  <strong>
                                    {formatPrice(
                                      modalPrice
                                    )}
                                  </strong>
                                </div>

                                <div>
                                  <span>
                                    Max
                                  </span>

                                  <strong>
                                    {formatPrice(
                                      maxPrice
                                    )}
                                  </strong>
                                </div>
                              </div>

                              <div className="market-record-footer">
                                <span>
                                  <CalendarDays
                                    size={13}
                                  />

                                  {formatDate(
                                    arrivalDate
                                  )}
                                </span>

                                <span>
                                  ₹/quintal
                                </span>
                              </div>
                            </article>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="market-no-data">
                      <Store size={24} />

                      <h3>
                        No market records found
                      </h3>

                      <p>
                        There is currently no
                        price data available for
                        {` ${selectedCrop}`}.
                      </p>
                    </div>
                  )}
                </div>

                <aside className="market-side-card">
                  <div className="market-side-icon">
                    <MapPin size={20} />
                  </div>

                  <span className="market-side-label">
                    PRICE CONTEXT
                  </span>

                  <h2>
                    {locationText ||
                      "Your field location"}
                  </h2>

                  <p>
                    Prices are fetched from the
                    government market-data
                    source available to
                    KrishiSphere.
                  </p>

                  <div className="market-side-divider" />

                  <div className="market-side-row">
                    <span>Crop</span>
                    <strong>
                      {selectedCrop}
                    </strong>
                  </div>

                  <div className="market-side-row">
                    <span>Markets found</span>
                    <strong>
                      {records.length}
                    </strong>
                  </div>
                </aside>
              </section>

              {records.length > 0 && (
                <div className="market-note">
                  <div>
                    <TrendingUp
                      size={16}
                    />
                  </div>

                  <p>
                    Market prices are reference
                    data and may vary by mandi,
                    variety, quality, and trading
                    date. Use them as a pricing
                    signal rather than a guaranteed
                    selling price.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Market;