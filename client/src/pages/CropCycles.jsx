import { useEffect, useMemo, useState } from "react";
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

const getStatusLabel = (status) => {
  if (!status) return "Planned";

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

    setError(
      err.message ||
        "Unable to load your crop cycles."
    );
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
            Loading crop journeys
          </h2>

          <p>
            Gathering your active and previous
            crop cycles...
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
            CROP MANAGEMENT
          </span>

          <h1>Crop Cycles</h1>

          <p>
            Track every crop from planting through
            its growth stages, tasks, and completion.
          </p>
        </div>
      </section>

      {error && (
        <div className="crop-cycles-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadCycles}
          >
            Retry
          </button>
        </div>
      )}

      <section className="crop-cycle-stat-grid">

        <div className="crop-cycle-stat">
          <span>Total cycles</span>
          <strong>{counts.all}</strong>
          <small>All crop journeys</small>
        </div>

        <div className="crop-cycle-stat active">
          <span>Active</span>
          <strong>{counts.active}</strong>
          <small>Currently growing</small>
        </div>

        <div className="crop-cycle-stat planned">
          <span>Planned</span>
          <strong>{counts.planned}</strong>
          <small>Ready to begin</small>
        </div>

        <div className="crop-cycle-stat completed">
          <span>Completed</span>
          <strong>{counts.completed}</strong>
          <small>Finished journeys</small>
        </div>

      </section>

      <section className="crop-cycles-toolbar">

        <div className="crop-cycle-tabs">
          {[
            ["all", "All"],
            ["active", "Active"],
            ["planned", "Planned"],
            ["completed", "Completed"],
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
            placeholder="Search crop or field..."
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

          <h2>No crop cycles yet</h2>

          <p>
            Select a recommended crop from one of
            your fields to start tracking its
            journey.
          </p>

          <button
            type="button"
            onClick={() => navigate("/fields")}
          >
            Open My Fields
            <ArrowRight size={16} />
          </button>

        </section>
      ) : !filteredCycles.length ? (
        <section className="crop-cycles-empty compact">

          <div className="crop-cycles-empty-icon">
            <Search size={25} />
          </div>

          <h2>No matching cycles</h2>

          <p>
            Try another search or change the
            selected filter.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            Reset filters
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
              "Crop journey";

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
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    <div className="crop-cycle-location">
                      <MapPin size={13} />

                      <span>
                        {field?.name ||
                          "Field"}

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
                      Current stage
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
                      Started{" "}
                      {formatDate(
                        cycle?.startDate
                      )}
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
                      {status ===
                      "completed"
                        ? `Completed ${formatDate(
                            cycle?.actualHarvestDate ||
                              cycle?.endDate
                          )}`
                        : `${progress}% journey complete`}
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
                  Open Crop Dashboard
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