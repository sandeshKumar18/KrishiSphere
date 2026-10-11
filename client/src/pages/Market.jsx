import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const [searchParams, setSearchParams] =  useSearchParams();
  const { t } = useTranslation();

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

      setError("market.errorLoadCycles");
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

      setError("market.errorLoadPrices");
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

          <h2>{t("market.loadingTitle")}</h2>

          <p>{t("market.loadingDescription")}</p>
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
            {t("market.intelligence").toUpperCase()}
          </span>

          <h1>{t("market.title")}</h1>

          <p>{t("market.description")}</p>
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

          {t("market.refresh")}
        </button>
      </section>

      {error && (
        <div className="market-error">
          <div>
            <strong>
              {t("market.errorTitle")}
            </strong>

            <span>{error ? t(error) : ""}</span>
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
            {t("common.retry")}
          </button>
        </div>
      )}

      {!cycles.length ? (
        <section className="market-empty">
          <div className="market-empty-icon">
            <Store size={27} />
          </div>

          <h2>{t("market.noCropCycle")}</h2>

          <p>{t("market.noCropCycleDescription")}</p>
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
                  {t("market.marketForCropCycle").toUpperCase()}
                </span>

                <h2>{selectedCrop}</h2>

                <p>
                  {selectedField?.name ||
                    t("market.selectedField")}
                  {locationText
                    ? ` • ${locationText}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="market-selector">
              <label htmlFor="market-cycle">
                  {t("market.cropCycle")}
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
                      t("market.crop");

                    const fieldName =
                      cycle?.__field?.name ||
                      t("market.field");

                    const statusKey = {
                      active: "market.statusActive",
                      planned: "market.statusPlanned",
                      completed: "market.statusCompleted",
                    }[cycle?.status];

                    const status = statusKey
                      ? t(statusKey)
                      : "";

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
                {t("market.fetchingLatestPrices")}
              </span>
            </div>
          ) : (
            <>
              <section className="market-summary-grid">
                <article className="market-summary-card">
                  <div className="market-summary-top">
                    <span>{t("market.averageMin")}</span>
                  </div>

                  <strong>
                    {summary.min !== null
                      ? formatPrice(summary.min)
                      : "—"}
                  </strong>

                  <small>{t("market.acrossAvailableMarkets")}</small>
                </article>

                <article className="market-summary-card">
                  <div className="market-summary-top">
                    <span>{t("market.averageModal")}</span>
                    <TrendingUp size={17} />
                  </div>

                  <strong>
                    {summary.modal !== null
                      ? formatPrice(
                          summary.modal
                        )
                      : "—"}
                  </strong>

                  <small>{t("market.typicalReportedPrice")}</small>
                </article>

                <article className="market-summary-card">
                  <div className="market-summary-top">
                    <span>{t("market.averageMax")}</span>
                  </div>

                  <strong>
                    {summary.max !== null
                      ? formatPrice(summary.max)
                      : "—"}
                  </strong>

                  <small>{t("market.acrossAvailableMarkets")}</small>
                </article>
              </section>

              <section className="market-main-grid">
                <div className="market-records-card">
                  <div className="market-section-heading">
                    <div>
                      <span>
                        {t("market.marketRecords").toUpperCase()}
                      </span>

                      <h2>
                        {t("market.recentMandiPrices")}
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
                                  <span>{t("market.minPrice")}</span>

                                  <strong>
                                    {formatPrice(
                                      minPrice
                                    )}
                                  </strong>
                                </div>

                                <div className="modal-price">
                                  <span>{t("market.modalPrice")}</span>

                                  <strong>
                                    {formatPrice(
                                      modalPrice
                                    )}
                                  </strong>
                                </div>

                                <div>
                                  <span>{t("market.maxPrice")}</span>

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
                                  {t("market.priceUnit")}
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
                        {t("market.noRecordsFound")}
                      </h3>

                      <p>
                        {t("market.noPriceData", {
                          crop: selectedCrop,
                        })}
                      </p>
                    </div>
                  )}
                </div>

                <aside className="market-side-card">
                  <div className="market-side-icon">
                    <MapPin size={20} />
                  </div>

                  <span className="market-side-label">
                    {t("market.priceContext").toUpperCase()}
                  </span>

                  <h2>
                    {locationText ||t("market.yourFieldLocation")}
                  </h2>

                  <p>
                    {t("market.governmentDataDescription")}
                  </p>

                  <div className="market-side-divider" />

                  <div className="market-side-row">
                    <span>{t("market.cropLabel")}</span>
                    <strong>
                      {selectedCrop}
                    </strong>
                  </div>

                  <div className="market-side-row">
                    <span>{t("market.marketsFound")}</span>
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
                    {t("market.priceDisclaimer")}
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