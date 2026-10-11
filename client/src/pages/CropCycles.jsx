import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Leaf,
  LoaderCircle,
  MapPin,
  Search,
  Sprout,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import "./CropCycles.css";

const getEntityId = (entity) => {
  if (!entity) return null;

  if (
    typeof entity === "string" ||
    typeof entity === "number"
  ) {
    return String(entity);
  }

  return (
    entity?._id?.$oid ||
    entity?._id ||
    entity?.id ||
    entity?.cropCycleId ||
    null
  );
};

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

const getCropName = (cycle) =>
  cycle?.cropId?.name ||
  cycle?.crop?.name ||
  cycle?.cropName ||
  "Crop";

const getStatusLabel = (status, t) => {
  if (!status) {
    return t("cropCycles.planned");
  }

  const normalized = status
    .toLowerCase()
    .replace(/_/g, "");

  const statusKeys = {
    active: "cropCycles.active",
    planned: "cropCycles.planned",
    completed: "cropCycles.completed",
  };

  if (statusKeys[normalized]) {
    return t(statusKeys[normalized]);
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const getProgress = (cycle) => {
  if (cycle?.status === "completed") {
    return 100;
  }

  const progress = cycle?.progress;

  if (
    typeof progress === "number" &&
    Number.isFinite(progress)
  ) {
    return Math.min(
      Math.max(progress, 0),
      100
    );
  }

  if (
    typeof progress === "string" &&
    progress.trim() !== ""
  ) {
    const numericProgress =
      Number(progress);

    if (Number.isFinite(numericProgress)) {
      return Math.min(
        Math.max(numericProgress, 0),
        100
      );
    }
  }

  if (
    progress &&
    typeof progress === "object"
  ) {
    const percentage = Number(
      progress?.percentage ??
        progress?.progress ??
        0
    );

    if (Number.isFinite(percentage)) {
      return Math.min(
        Math.max(percentage, 0),
        100
      );
    }
  }

  const completionPercentage =
    Number(
      cycle?.completionPercentage ??
        cycle?.progressPercentage ??
        0
    );

  if (
    Number.isFinite(completionPercentage) &&
    completionPercentage > 0
  ) {
    return Math.min(
      Math.max(completionPercentage, 0),
      100
    );
  }

  const completed =
    Number(
      cycle?.completedStages ??
        progress?.completedStages ??
        0
    );

  const total =
    Number(
      cycle?.totalStages ??
        progress?.totalStages ??
        0
    );

  if (total > 0) {
    return Math.round(
      (completed / total) * 100
    );
  }

  return 0;
};

const CropCycles = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadCycles = async () => {
  try {
    setLoading(true);
    setError("");

    const [fieldResponse, cycleResponse] =
      await Promise.all([
        api.get("/fields"),
        api.get("/crop-cycles"),
      ]);

    const fields = extractFields(fieldResponse);
    const allCycles = extractCycles(cycleResponse);

    if (!fields.length || !allCycles.length) {
      setCycles([]);
      return;
    }


    const fieldMap = new Map();

    fields.forEach((field) => {
      const fieldId = getEntityId(field);

      if (fieldId) {
        fieldMap.set(String(fieldId), field);
      }
    });

    const normalizedCycles = allCycles
      .map((cycle) => {
        const cycleFieldId =
          getEntityId(cycle?.fieldId) ||
          cycle?.fieldId?.toString?.();

        const field = fieldMap.get(
          String(cycleFieldId)
        );

        if (!field) {
          return null;
        }

        return {
          ...cycle,
          __field: field,
        };
      })
      .filter(Boolean);

    setCycles(normalizedCycles);
  } catch (err) {
    console.error(
      "Crop cycles loading error:",
      err
    );

    setError("cropCycles.errorLoadCycles");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadCycles();
  }, []);

  const counts = useMemo(() => {
    return {
      all: cycles.length,
      active: cycles.filter(
        (cycle) => cycle.status === "active"
      ).length,
      planned: cycles.filter(
        (cycle) => cycle.status === "planned"
      ).length,
      completed: cycles.filter(
        (cycle) =>
          cycle.status === "completed"
      ).length,
    };
  }, [cycles]);

  const filteredCycles = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return cycles
      .filter((cycle) => {
        if (
          filter !== "all" &&
          cycle.status !== filter
        ) {
          return false;
        }

        if (!query) return true;

        const crop =
          getCropName(cycle).toLowerCase();

        const field =
          cycle?.__field?.name
            ?.toLowerCase() || "";

        const district =
          cycle?.__field?.location?.district
            ?.toLowerCase() || "";

        return (
          crop.includes(query) ||
          field.includes(query) ||
          district.includes(query)
        );
      })
      .sort((a, b) => {
        const dateA = a?.startDate
          ? new Date(a.startDate).getTime()
          : 0;

        const dateB = b?.startDate
          ? new Date(b.startDate).getTime()
          : 0;

        return dateB - dateA;
      });
  }, [cycles, filter, search]);

  if (loading) {
    return (
      <div className="crop-cycles-page">
        <div className="crop-cycles-loading">
          <LoaderCircle
            size={28}
            className="crop-cycles-spin"
          />

          <h2>
            {t("cropCycles.loadingTitle")}
          </h2>

          <p>
            {t("cropCycles.loadingDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="crop-cycles-page">

      <section className="crop-cycles-header">
        <div>
          <span className="crop-cycles-kicker">
            <Leaf size={14} />
            {t("cropCycles.management").toUpperCase()}
          </span>

          <h1>{t("cropCycles.title")}</h1>

          <p>
            {t("cropCycles.description")}
          </p>
        </div>
      </section>

      {error && (
        <div className="crop-cycles-error">
          <span>{error ? t(error) : ""}</span>

          <button
            type="button"
            onClick={loadCycles}
          >
            {t("common.retry")}
          </button>
        </div>
      )}

      <section className="crop-cycle-stat-grid">

        <div className="crop-cycle-stat">
          <span>{t("cropCycles.totalCycles")}</span>
          <strong>{counts.all}</strong>
          <small>{t("cropCycles.allJourneys")}</small>
        </div>

        <div className="crop-cycle-stat active">
          <span>{t("cropCycles.active")}</span>
          <strong>{counts.active}</strong>
          <small>{t("cropCycles.currentlyGrowing")}</small>
        </div>

        <div className="crop-cycle-stat planned">
          <span>{t("cropCycles.planned")}</span>
          <strong>{counts.planned}</strong>
          <small>{t("cropCycles.readyToBegin")}</small>
        </div>

        <div className="crop-cycle-stat completed">
          <span>{t("cropCycles.completed")}</span>
          <strong>{counts.completed}</strong>
          <small>{t("cropCycles.finishedJourneys")}</small>
        </div>

      </section>

      <section className="crop-cycles-toolbar">

        <div className="crop-cycle-tabs">
          {[
            ["all", t("cropCycles.filterAll")],
            ["active", t("cropCycles.active")],
            ["planned", t("cropCycles.planned")],
            ["completed", t("cropCycles.completed")],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                filter === value
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(value)
              }
            >
              {label}
              <span>
                {counts[value]}
              </span>
            </button>
          ))}
        </div>

        <div className="crop-cycle-search">
          <Search size={16} />

          <input
            type="text"
            placeholder={t("cropCycles.searchPlaceholder")}
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

      </section>

      {!cycles.length ? (
        <section className="crop-cycles-empty">

          <div className="crop-cycles-empty-icon">
            <Sprout size={28} />
          </div>

          <h2>{t("cropCycles.noCyclesYet")}</h2>

          <p>{t("cropCycles.noCyclesDescription")}</p>

          <button
            type="button"
            onClick={() => navigate("/fields")}
          >
            {t("cropCycles.openMyFields")}
            <ArrowRight size={16} />
          </button>

        </section>
      ) : !filteredCycles.length ? (
        <section className="crop-cycles-empty compact">

          <div className="crop-cycles-empty-icon">
            <Search size={25} />
          </div>

          <h2>{t("cropCycles.noMatchingCycles")}</h2>

          <p>{t("cropCycles.noMatchingDescription")}</p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            {t("cropCycles.resetFilters")}
          </button>

        </section>
      ) : (
        <section className="crop-cycle-list">

          {filteredCycles.map((cycle) => {
            const cycleId =
              getEntityId(cycle);

            const cropName =
              getCropName(cycle);

            const field =
              cycle?.__field;

            const progress =
              getProgress(cycle);

            const status =
              cycle?.status || "planned";

            const currentStage =
              cycle?.currentStage?.name ||
              cycle?.stage?.name ||
              cycle?.currentStageName ||
              t("cropCycles.cropJourney");

            return (
              <article
                key={cycleId}
                className="crop-cycle-card"
              >

                <div className="crop-cycle-card-top">

                  <div className="crop-cycle-crop-icon">
                    <Sprout size={24} />
                  </div>

                  <div className="crop-cycle-card-title">

                    <div className="crop-cycle-title-row">
                      <h2>{cropName}</h2>

                      <span
                        className={`crop-cycle-status ${status}`}
                      >
                        <CircleDot size={11} />
                        {getStatusLabel(status, t)}
                      </span>
                    </div>

                    <div className="crop-cycle-location">
                      <MapPin size={13} />

                      <span>
                        {field?.name ||
                          t("cropCycles.fieldLabel")}

                        {field?.location
                          ?.district
                          ? ` • ${field.location.district}`
                          : ""}
                      </span>
                    </div>

                  </div>

                </div>

                <div className="crop-cycle-stage">

                  <div>
                    <span>
                      {t("cropCycles.currentStageLabel")}
                    </span>

                    <strong>
                      {currentStage}
                    </strong>
                  </div>

                  <span className="crop-cycle-progress-value">
                    {progress}%
                  </span>

                </div>

                <div className="crop-cycle-progress">
                  <div>
                    <span
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="crop-cycle-meta">

                  <div>
                    <CalendarDays size={14} />

                    <span>
                      {t("cropCycles.started", {
                        date: formatDate(cycle?.startDate),
                      })}
                    </span>
                  </div>

                  <div>
                    {status === "completed" ? (
                      <CheckCircle2
                        size={14}
                      />
                    ) : (
                      <Leaf size={14} />
                    )}

                    <span>
                      {status === "completed"
                        ? t("cropCycles.completedOn", {
                            date: formatDate(
                              cycle?.actualHarvestDate ||
                                cycle?.endDate
                            ),
                          })
                        : t("cropCycles.journeyProgress", {
                            progress,
                          })}
                    </span>
                  </div>

                </div>

                <button
                  type="button"
                  className="crop-cycle-open"
                  onClick={() =>
                    navigate(
                      `/crop-cycles/${cycleId}`
                    )
                  }
                >
                  {t("cropCycles.openCropDashboard")}
                  <ArrowRight size={16} />
                </button>

              </article>
            );
          })}

        </section>
      )}

    </div>
  );
};

export default CropCycles;