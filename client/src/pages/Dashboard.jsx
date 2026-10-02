import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CloudRain,
  CloudSun,
  Droplets,
  FlaskConical,
  Leaf,
  MapPin,
  ShoppingBag,
  Sparkles,
  Sprout,
  Sun,
  Thermometer,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import "./Dashboard.css";

const getEntityId = (item) => {
  if (item === null || item === undefined) return null;

  if (typeof item === "string" || typeof item === "number") {
    return String(item);
  }

  if (item?._id?.$oid) return String(item._id.$oid);
  if (item?._id) return String(item._id);
  if (item?.id) return String(item.id);
  if (item?.cropCycleId) return getEntityId(item.cropCycleId);

  return null;
};

const extractList = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getLatestCycle = (cycles) => {
  if (!cycles?.length) return null;

  return [...cycles].sort((a, b) => {
    const aTime = a?.startDate ? new Date(a.startDate).getTime() : 0;
    const bTime = b?.startDate ? new Date(b.startDate).getTime() : 0;
    return bTime - aTime;
  })[0];
};

const formatDate = (value, fallback = "Not set") => {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};



const getProgressValue = (cycle, dashboard) => {
  if (cycle?.status === "completed") return 100;

  const progress = dashboard?.progress;

  if (typeof progress === "number") return progress;

  if (typeof progress === "string" && progress.trim() !== "") {
    const number = Number(progress);
    if (Number.isFinite(number)) return number;
  }

  if (progress && typeof progress === "object") {
    const percentage =
      progress.percentage ??
      progress.progress ??
      progress.completionPercentage ??
      progress.progressPercentage;

    if (percentage !== undefined) {
      const number = Number(percentage);
      if (Number.isFinite(number)) return number;
    }

    const completedStages = Number(progress.completedStages);
    const totalStages = Number(progress.totalStages);

    if (
      Number.isFinite(completedStages) &&
      Number.isFinite(totalStages) &&
      totalStages > 0
    ) {
      return (completedStages / totalStages) * 100;
    }
  }

  const fallback = Number(
    dashboard?.cropCycle?.progress ??
      cycle?.progress ??
      0
  );

  return Number.isFinite(fallback) ? fallback : 0;
};


const getFarmFieldStatus = (field) => {
  if (field?.needsAttention) {
    return {
      label: "Needs attention",
      className: "attention",
    };
  }

  const cycleStatus =
    field?.cropCycle?.status;

  if (cycleStatus === "active") {
    return {
      label: "Active",
      className: "active",
    };
  }

  if (cycleStatus === "planned") {
    return {
      label: "Planned",
      className: "planned",
    };
  }

  if (cycleStatus === "completed") {
    return {
      label: "Completed",
      className: "completed",
    };
  }

  return {
    label: "Ready",
    className: "ready",
  };
};



const clampProgress = (value) =>
  Math.min(Math.max(Math.round(Number(value) || 0), 0), 100);

const normalizeWeather = (weather) => {
  if (!weather) return null;

  return {
    temperature:
      weather.temperature ??
      weather.current?.temperature ??
      weather.current?.temperature_2m ??
      null,

    humidity:
      weather.humidity ??
      weather.current?.humidity ??
      weather.current?.relative_humidity_2m ??
      null,

    rainfall:
      weather.rainfall ??
      weather.current?.rainfall ??
      weather.current?.precipitation ??
      null,
  };
};

const formatMarketPrice = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const getLatestMarketRecord = (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  return [...records].sort((a, b) => {
    const aTime = a?.arrival_date
      ? new Date(a.arrival_date).getTime()
      : 0;

    const bTime = b?.arrival_date
      ? new Date(b.arrival_date).getTime()
      : 0;

    return bTime - aTime;
  })[0];
};

const Dashboard = () => {
  const { user } = useAuth();

  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState("");

  const [soilTest, setSoilTest] = useState(null);
  const [cropCycles, setCropCycles] = useState([]);
  const [cycleDashboard, setCycleDashboard] = useState(null);

  const [loading, setLoading] = useState(true);
  const [fieldLoading, setFieldLoading] = useState(false);
  const [error, setError] = useState("");

  const [farmDashboard, setFarmDashboard] = useState(null);
  const [farmDashboardLoading, setFarmDashboardLoading] = useState(true);

  const [selectedFieldWeather, setSelectedFieldWeather] = useState(null);
  const [selectedFieldWeatherLoading, setSelectedFieldWeatherLoading] = useState(false);

  const requestRef = useRef(0);

  const firstName =
    user?.name?.split(" ")[0] ||
    user?.fullName?.split(" ")[0] ||
    user?.username?.split(" ")[0] ||
    "Farmer";

  const selectedField = useMemo(
    () =>
      fields.find(
        (field) =>
          String(getEntityId(field)) ===
          String(selectedFieldId)
      ) || null,
    [fields, selectedFieldId]
  );

  const loadSelectedFieldWeather = async (fieldId) => {
    if (!fieldId) {
      setSelectedFieldWeather(null);
      return;
    }

    try {
      setSelectedFieldWeatherLoading(true);

      const response = await api.get(
        `/fields/${fieldId}/weather`
      );

      setSelectedFieldWeather(response?.weather || null);
    } catch (error) {
      console.error("Dashboard weather error:", error);
      setSelectedFieldWeather(null);
    } finally {
      setSelectedFieldWeatherLoading(false);
    }
  };

  useEffect(() => {
    loadSelectedFieldWeather(selectedFieldId);
  }, [selectedFieldId]);

  const selectedCycle = useMemo(() => {
    return (
      cropCycles.find((cycle) => cycle?.status === "active") ||
      cropCycles.find((cycle) => cycle?.status === "planned") ||
      getLatestCycle(cropCycles)
    );
  }, [cropCycles]);


  const farmSummary = farmDashboard?.summary || {};

  const todayTasks = farmDashboard?.todayTasks || {};

  const farmFields = Array.isArray(farmDashboard?.fields) ? farmDashboard.fields : [];

  const attentionFields =
    farmFields.filter(
      (field) => field.needsAttention
    );

  const todayTaskRecords =
    Array.isArray(todayTasks?.records)
      ? todayTasks.records
      : [];

  const pendingTodayTasks =
    todayTaskRecords.filter(
      (task) =>
        task.status !== "completed"
    );

  const loadFarmDashboard = async () => {
      try {
        setFarmDashboardLoading(true);

        const data = await api.get(
          "/dashboard/farm"
        );

        const normalized =
          data?.data?.summary
            ? data.data
            : data;

        setFarmDashboard(normalized);
      } catch (err) {
        console.error(
          "Farm dashboard summary error:",
          err
        );
        setFarmDashboard(null);
      } finally {
        setFarmDashboardLoading(false);
      }
    };

  const loadFields = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/fields");
      const fieldList = extractList(response, "fields");

      setFields(fieldList);

      if (fieldList.length) {
        const firstId = getEntityId(fieldList[0]);
        if (firstId) setSelectedFieldId(firstId);
      }
    } catch (err) {
      console.error("Dashboard field load error:", err);
      setError(err.message || "Unable to load your farm.");
    } finally {
      setLoading(false);
    }
  };

  const loadFieldData = async (fieldId) => {
    if (!fieldId) return;

    const requestId = ++requestRef.current;

    try {
      setFieldLoading(true);
      setError("");

      setSoilTest(null);
      setCropCycles([]);
      setCycleDashboard(null);

      const [soilResult, cycleResult] =
        await Promise.allSettled([
          api.get(`/fields/${fieldId}/soil-tests/latest`),
          api.get(`/fields/${fieldId}/crop-cycles`),
        ]);

      if (requestId !== requestRef.current) return;

      if (soilResult.status === "fulfilled") {
        const data = soilResult.value;
        setSoilTest(
          data?.soilTest ||
            data?.data?.soilTest ||
            data?.data ||
            data ||
            null
        );
      }

      const cycles =
        cycleResult.status === "fulfilled"
          ? extractList(cycleResult.value, "cropCycles")
          : [];

      setCropCycles(cycles);

      const cycle =
        cycles.find((item) => item?.status === "active") ||
        cycles.find((item) => item?.status === "planned") ||
        getLatestCycle(cycles);

      const cycleId = getEntityId(cycle);

      if (!cycleId) {
        setCycleDashboard(null);
        return;
      }

      try {
        const response = await api.get(
          `/crop-cycles/${cycleId}/dashboard`
        );

        if (requestId !== requestRef.current) return;

        setCycleDashboard(
          response?.dashboard ||
            response?.data?.dashboard ||
            response?.data ||
            response ||
            null
        );
      } catch (dashboardError) {
        if (requestId !== requestRef.current) return;

        console.error(
          "Dashboard cycle load error:",
          dashboardError
        );

        setCycleDashboard(null);
        setError(
          dashboardError.message ||
            "Unable to load the crop dashboard."
        );
      }
    } catch (err) {
      if (requestId !== requestRef.current) return;

      console.error("Dashboard load error:", err);
      setError(
        err.message ||
          "Unable to load field information."
      );
    } finally {
      if (requestId === requestRef.current) {
        setFieldLoading(false);
      }
    }
  };

  useEffect(() => {
    loadFields();
    loadFarmDashboard();
  }, []);

  useEffect(() => {
    if (selectedFieldId) {
      loadFieldData(selectedFieldId);
    }
  }, [selectedFieldId]);

  

  const currentCycle =
    cycleDashboard?.cropCycle ||
    selectedCycle ||
    null;

  const cycleId = getEntityId(currentCycle);

  const crop =
    cycleDashboard?.crop ||
    currentCycle?.cropId ||
    currentCycle?.crop ||
    null;

  const cropPlan = cycleDashboard?.cropPlan || null;

  const currentStageOrder =
    Number(currentCycle?.currentStageOrder) || 1;

  const currentStage =
    cycleDashboard?.currentStage ||
    cropPlan?.stages?.find(
      (stage) =>
        Number(stage.order) === currentStageOrder
    ) ||
    null;

  const nextStage =
    cropPlan?.stages?.find(
      (stage) =>
        Number(stage.order) === currentStageOrder + 1
    ) || null;

  const progress = clampProgress(
    getProgressValue(currentCycle, cycleDashboard)
  );

  const progressData =
    cycleDashboard?.progress &&
    typeof cycleDashboard.progress === "object"
      ? cycleDashboard.progress
      : null;

  const totalStages =
    Number(progressData?.totalStages) ||
    Number(cropPlan?.stages?.length) ||
    0;

  const completedStages =
    currentCycle?.status === "completed"
      ? totalStages
      : Number(progressData?.completedStages) || 0;

  const weather = normalizeWeather(
    cycleDashboard?.weather
  );

  const market = cycleDashboard?.market || null;

  const latestMarketRecord =
      getLatestMarketRecord(
        market?.records
      );

    const latestModalPrice =
      latestMarketRecord?.modal_price ??
      latestMarketRecord?.modalPrice ??
      null;

  const tasks = Array.isArray(cycleDashboard?.tasks)
    ? cycleDashboard.tasks
    : [];

  const pendingTasks = tasks.filter(
    (task) => task.status !== "completed"
  );

  const completedTaskCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const currentStageTasks = tasks.filter(
    (task) =>
      Number(task.stageOrder) ===
      currentStageOrder
  );

  const visibleTasks =
    currentStageTasks.filter(
      (task) => task.status !== "completed"
    ).length > 0
      ? currentStageTasks.filter(
          (task) => task.status !== "completed"
        )
      : pendingTasks;

  const fieldLocation = [
    selectedField?.location?.district,
    selectedField?.location?.state,
    selectedField?.district,
    selectedField?.state,
  ]
    .filter(Boolean)
    .filter(
      (value, index, array) =>
        array.indexOf(value) === index
    )
    .slice(0, 2)
    .join(", ");

  const isCompleted =
    currentCycle?.status === "completed";

  const cropDashboardPath = cycleId
    ? `/crop-cycles/${cycleId}`
    : null;

  const fieldPath = selectedFieldId
    ? `/fields/${selectedFieldId}`
    : "/fields";

  const progressLabel =
    totalStages > 0
      ? `${completedStages} of ${totalStages} stages`
      : "Lifecycle progress";

  const statusLabel = isCompleted
    ? "Completed"
    : currentCycle?.status === "planned"
    ? "Planned"
    : "Active";

  const nextAction = useMemo(() => {
    if (!selectedField) {
      return {
        title: "Add your first field",
        description:
          "Create a field before starting your farm workflow.",
        label: "Add Field",
        path: "/fields",
      };
    }

    if (!soilTest) {
      return {
        title: "Complete the soil test",
        description:
          "Add the latest soil values to unlock crop recommendations.",
        label: "Open Field",
        path: fieldPath,
      };
    }

    if (!currentCycle) {
      return {
        title: "Generate a crop recommendation",
        description:
          "Use your latest soil data and field conditions to choose a suitable crop.",
        label: "Open Field",
        path: fieldPath,
      };
    }

    if (isCompleted) {
      return {
        title: "Review the completed crop cycle",
        description:
          "View the crop journey, completed tasks and recorded results.",
        label: "Open Crop Dashboard",
        path: cropDashboardPath,
      };
    }

    if (currentStageTasks.length === 0) {
      return {
        title: "Set up the current stage task",
        description:
          `No task is currently recorded for ${currentStage?.name || "this stage"}.`,
        label: "Open Crop Dashboard",
        path: cropDashboardPath,
      };
    }

    const incompleteCurrentTasks =
      currentStageTasks.filter(
        (task) => task.status !== "completed"
      );

    if (incompleteCurrentTasks.length > 0) {
      return {
        title: "Complete your current crop task",
        description:
          incompleteCurrentTasks.length === 1
            ? incompleteCurrentTasks[0]?.title ||
              "Finish the current crop task."
            : `${incompleteCurrentTasks.length} tasks are still pending for ${currentStage?.name || "the current stage"}.`,
        label: "Open Crop Dashboard",
        path: cropDashboardPath,
      };
    }

    if (nextStage) {
      return {
        title: `Move to ${nextStage.name}`,
        description:
          "The current stage is complete. Continue the crop journey from the crop dashboard.",
        label: "Continue Crop Cycle",
        path: cropDashboardPath,
      };
    }

    return {
      title: "Complete the crop cycle",
      description:
        "All stages and tasks are complete. Review the final cycle before closing it.",
      label: "Open Crop Dashboard",
      path: cropDashboardPath,
    };
  }, [
    selectedField,
    soilTest,
    currentCycle,
    isCompleted,
    currentStageTasks,
    currentStage,
    nextStage,
    fieldPath,
    cropDashboardPath,
  ]);

  if (loading) {
    return (
      <div className="db3-loading">
        <div className="db3-loading-mark">
          <Sprout size={25} />
        </div>
        <div>
          <strong>Loading your farm</strong>
          <span>Preparing today&apos;s overview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="db3-page">
      <section className="db3-header">
        <div>
          <span className="db3-eyebrow">
            FARM COMMAND CENTER
          </span>

          <h1>
            {getGreeting()}, {firstName}
          </h1>

          <p>
            One clear view of your field, crop progress,
            today&apos;s work, and farm conditions.
          </p>
        </div>

        
      </section>

      {error && (
        <div className="db3-alert">
          <span>!</span>
          <p>{error}</p>
        </div>
      )}


      {fields.length > 0 && ( 
        <section className="db-farm-overview">

          <div className="db-farm-overview-header">
            <div>
              <span className="dashboard-card-kicker">
                FARM OVERVIEW
              </span>

              <h2>
                Your whole farm at a glance
              </h2>

              <p>
                Monitor fields, crop cycles,
                soil coverage and areas that need
                attention.
              </p>
            </div>

            <div className="db-farm-task-chip">
              <CalendarDays size={15} />

              <span>
                {todayTasks.pending || 0} tasks
                pending today
              </span>
            </div>
          </div>

          {farmDashboardLoading ? (
            <div className="db-farm-summary-loading">
              Loading farm insights...
            </div>
          ) : (
            <div className="db-farm-summary-grid">

              <div className="db-farm-stat">
                <div className="db-farm-stat-icon field">
                  <MapPin size={18} />
                </div>

                <div>
                  <span>Fields</span>
                  <strong>
                    {farmSummary.totalFields || 0}
                  </strong>
                  <small>
                    Total farm fields
                  </small>
                </div>
              </div>

              <div className="db-farm-stat">
                <div className="db-farm-stat-icon active">
                  <Sprout size={18} />
                </div>

                <div>
                  <span>Active cycles</span>
                  <strong>
                    {farmSummary.activeCycles || 0}
                  </strong>
                  <small>
                    Currently growing
                  </small>
                </div>
              </div>

              <div className="db-farm-stat">
                <div className="db-farm-stat-icon planned">
                  <CalendarDays size={18} />
                </div>

                <div>
                  <span>Planned</span>
                  <strong>
                    {farmSummary.plannedCycles || 0}
                  </strong>
                  <small>
                    Ready to begin
                  </small>
                </div>
              </div>

              <div className="db-farm-stat">
                <div className="db-farm-stat-icon completed">
                  <CheckCircle2 size={18} />
                </div>

                <div>
                  <span>Completed</span>
                  <strong>
                    {farmSummary.completedCycles || 0}
                  </strong>
                  <small>
                    Finished crop cycles
                  </small>
                </div>
              </div>

              <div className="db-farm-stat attention">
                <div className="db-farm-stat-icon warning">
                  <CloudSun size={18} />
                </div>

                <div>
                  <span>Needs attention</span>
                  <strong>
                    {farmSummary.fieldsNeedingAttention || 0}
                  </strong>
                  <small>
                    Fields requiring action
                  </small>
                </div>
              </div>

              <div className="db-farm-stat">
                <div className="db-farm-stat-icon soil">
                  <FlaskConical size={18} />
                </div>

                <div>
                  <span>Soil coverage</span>
                  <strong>
                    {farmSummary.soilTestCoverage || 0}%
                  </strong>
                  <small>
                    Fields with soil tests
                  </small>
                </div>
              </div>

            </div>
          )}
        </section>
      )}

      {fields.length > 0 && (
        <div className="field-picker-top">

          <div className="db3-select-option-text">
            <h1>Select Field</h1>
          </div> 
          <div className="db3-field-picker">
            <span>
              Viewing field
            </span>

            <div>
              <select
                value={selectedFieldId}
                onChange={(event) =>
                  setSelectedFieldId(event.target.value)
                }
              >
                {fields.map((field) => {
                  const id = getEntityId(field);

                  return (
                    <option key={id} value={id}>
                      {field.name || "Unnamed field"}
                    </option>
                  );
                })}
              </select>

              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      )}


   
      {fields.length === 0 ? (
        <section className="db3-empty">
          <div className="db3-empty-icon">
            <Sprout size={38} />
          </div>

          <div>
            <span className="db3-eyebrow">
              FIRST STEP
            </span>

            <h2>Set up your first field</h2>

            <p>
              Add a field and its soil test. KrishiSphere
              will then build the crop recommendation,
              crop cycle, tasks, weather, market and AI
              context around it.
            </p>

            <Link
              to="/fields"
              className="db3-primary"
            >
              Add field
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="db3-pulse">
            <div>
              <span>FIELD</span>
              <strong>
                {selectedField?.name || "—"}
              </strong>
              <small>
                {fieldLocation || "Location not specified"}
              </small>
            </div>

            <div>
              <span>SOIL</span>
              <strong>
                {soilTest ? "Tested" : "Not tested"}
              </strong>
              <small>
                {soilTest
                  ? `pH ${soilTest.pH ?? soilTest.ph ?? "—"}`
                  : "Add a soil test"}
              </small>
            </div>

            <div>
              <span>CROP</span>
              <strong>
                {crop?.name || "Not selected"}
              </strong>
              <small>
                {currentStage?.name || "No active cycle"}
              </small>
            </div>

            <div>
              <span>PROGRESS</span>
              <strong>{currentCycle ? `${progress}%` : "—"}</strong>
              <small>
                {currentCycle
                  ? progressLabel
                  : "Start a crop cycle"}
              </small>
            </div>
          </section>

          <section className="db3-next-action">
              <div className="db3-next-action-icon">
                {isCompleted ? (
                  <CheckCircle2 size={21}  />
                ) : !soilTest ? (
                  <FlaskConical size={21} />
                ) : !currentCycle ? (
                  <Sprout size={21} />
                ) : (
                  <Leaf size={21} />
                )}
              </div>

              <div className="db3-next-action-content">
                <span className="db3-card-kicker">
                  NEXT ACTION
                </span>

                <h2>
                  {nextAction.title}
                </h2>

                <p>
                  {nextAction.description}
                </p>
              </div>

              {nextAction.path && (
                <Link
                  to={nextAction.path}
                  className="db3-primary"
                >
                  {nextAction.label}
                  <ArrowRight size={16} />
                </Link>
              )}
            </section>

          {currentCycle ? (
            <section className="db3-main-grid">
              <div className="db3-crop-card">
                <div className="db3-card-topline">
                  <span className="db3-status-pill">
                    <i />
                    {statusLabel}
                  </span>

                  <span className="db3-location">
                    <MapPin size={13} />
                    {fieldLocation || "Field location"}
                  </span>
                </div>

                <div className="db3-crop-identity">
                  <div className="db3-crop-symbol">
                    <Sprout size={31} />
                  </div>

                  <div>
                    <span>
                      {isCompleted
                        ? "COMPLETED CROP"
                        : "CURRENT CROP"}
                    </span>

                    <h2>{crop?.name || "Crop cycle"}</h2>

                    <p>
                      {isCompleted
                        ? currentStage?.name ||
                          "Crop lifecycle completed"
                        : currentStage?.name ||
                          "Lifecycle ready to begin"}
                    </p>
                  </div>
                </div>

                <div className="db3-progress-row">
                  <div>
                    <span>Lifecycle progress</span>
                    <strong>{progress}%</strong>
                  </div>

                  <div className="db3-progress-track">
                    <span
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <small>
                    {progressLabel}
                  </small>
                </div>

                <div className="db3-crop-details">
                  <div>
                    <span>STARTED</span>
                    <strong>
                      {formatDate(
                        currentCycle?.startDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {isCompleted
                        ? "HARVEST"
                        : "EXPECTED HARVEST"}
                    </span>

                    <strong>
                      {formatDate(
                        isCompleted
                          ? currentCycle?.actualHarvestDate
                          : currentCycle?.expectedHarvestDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>NEXT</span>

                    <strong>
                      {isCompleted
                        ? "Completed"
                        : nextStage?.name ||
                          currentStage?.name ||
                          "—"}
                    </strong>
                  </div>
                </div>

                {cropDashboardPath && (
                  <Link
                    to={cropDashboardPath}
                    className="db3-primary"
                  >
                    Open crop dashboard
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>

              <aside className="db3-today-card">
                <div className="db3-card-heading">
                  <div>
                    <span className="db3-card-kicker">
                      TODAY
                    </span>
                    <h2>What needs attention</h2>
                  </div>

                  <CalendarDays size={19} />
                </div>

                {visibleTasks.length > 0 ? (
                  <div className="db3-task-list">
                    {visibleTasks
                      .slice(0, 4)
                      .map((task, index) => (
                        <div
                          className="db3-task"
                          key={
                            getEntityId(task) ||
                            `${task.title}-${index}`
                          }
                        >
                          <div
                            className={
                              task.status === "completed"
                                ? "done"
                                : ""
                            }
                          >
                            <CheckCircle2 size={17} />
                          </div>

                          <section>
                            <strong>
                              {task.title ||
                                "Crop management task"}
                            </strong>

                            <span>
                              {task.description ||
                                "Continue the current crop plan."}
                            </span>
                          </section>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="db3-task-empty">
                    <CheckCircle2 size={28} />
                    <strong>
                      {isCompleted
                        ? "Crop cycle completed"
                        : tasks.length
                        ? "Current stage is clear"
                        : "No tasks yet"}
                    </strong>
                    <p>
                      {isCompleted
                        ? "There is no pending farm work for this cycle."
                        : tasks.length
                        ? "You can continue from the crop dashboard."
                        : "Tasks will appear when the crop plan is active."}
                    </p>
                  </div>
                )}

                {cropDashboardPath && (
                  <Link
                    to={cropDashboardPath}
                    className="db3-text-link"
                  >
                    View all crop work
                    <ArrowRight size={14} />
                  </Link>
                )}
              </aside>
            </section>
          ) : (
            <section className="db3-no-cycle">
              <div className="db3-no-cycle-icon">
                <Leaf size={30} />
              </div>

              <div>
                <span className="db3-card-kicker">
                  READY FOR THE NEXT STEP
                </span>

                <h2>
                  Your field needs a crop decision
                </h2>

                <p>
                  Open the field, add or review the soil
                  test, generate a recommendation, and
                  select the crop you want to track.
                </p>
              </div>

              <Link
                to={fieldPath}
                className="db3-primary"
              >
                Open field
                <ArrowRight size={16} />
              </Link>
            </section>
          )}

          <section className="db3-info-grid">
            <div className="db3-info-card">
              <div className="db3-card-heading">
                <div>
                  <span className="db3-card-kicker">
                    FIELD CONDITIONS
                  </span>
                  <h2>Weather & soil</h2>
                </div>

                <CloudRain size={19} />
              </div>

              <div className="db3-condition-list">
                <div>
                  <span>
                    <Thermometer size={14} />
                    Temperature
                  </span>

                  <strong>
                    {selectedFieldWeather?.temperature ?? "—"}
                    {selectedFieldWeather?.temperature != null
                      ? "°C"
                      : ""}
                  </strong>
                </div>

                <div>
                  <span>
                    <Droplets size={14} />
                    Humidity
                  </span>

                  <strong>
                    {selectedFieldWeather?.humidity ?? "—"}
                    {selectedFieldWeather?.humidity != null
                      ? "%"
                      : ""}
                  </strong>
                </div>

                <div>
                  <span>
                    <CloudRain size={14} />
                    Rainfall
                  </span>

                  <strong>
                    {selectedFieldWeather?.rainfall ?? "—"}
                    {selectedFieldWeather?.rainfall != null
                      ? " mm"
                      : ""}
                  </strong>
                </div>

                <div>
                  <span>
                    <FlaskConical size={14} />
                    Soil pH
                  </span>

                  <strong>
                    {soilTest
                      ? soilTest.pH ??
                        soilTest.ph ??
                        "—"
                      : "Not tested"}
                  </strong>
                </div>
              </div>

              <p className="db3-muted">
                {selectedFieldWeatherLoading
                  ? "Loading current weather..."
                  : selectedFieldWeather
                  ? "Current weather is available for this field."
                  : "Weather data is not available right now."}
              </p>
            </div>

            <div className="db3-info-card">
              <div className="db3-card-heading">
                <div>
                  <span className="db3-card-kicker">
                    MARKET
                  </span>
                  <h2>Crop price signal</h2>
                </div>

                <ShoppingBag size={19} />
              </div>

              <div className="db3-market-value">
                <strong>
                  {latestModalPrice != null
                    ? formatMarketPrice(latestModalPrice)
                    : "—"}
                </strong>

                <span>
                  {latestModalPrice != null
                    ? "Latest modal price"
                    : "No current price available"}
                </span>
              </div>

              <div className="db3-market-value">
                <strong>
                  {latestModalPrice != null
                    ? formatMarketPrice(latestModalPrice)
                    : "—"}
                </strong>

                <span>
                  {latestModalPrice != null
                    ? "Latest modal price"
                    : "No current price available"}
                </span>
              </div>

              <Link
                to={
                  cycleId
                    ? `/market?cycle=${cycleId}`
                    : "/market"
                }
                className="db3-text-link"
              >
                View market
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="db3-info-card db3-ai-card">
              <div className="db3-ai-icon">
                <Sparkles size={19} />
              </div>

              <span className="db3-card-kicker">
                KRISHISPHERE AI
              </span>

              <h2>Need help deciding the next action?</h2>

              <p>
                Ask questions using your field, soil,
                crop stage and current conditions as
                context.
              </p>

              <Link
                to="/ai-advice"
                className="db3-text-link"
              >
                Open AI Advice
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          <section className="db3-support">
            <div className="db3-support-heading">
              <span className="db3-card-kicker">
                SUPPORT & RESOURCES
              </span>

              <h2>
                Need more help?
              </h2>

              <p>
                Use KrishiSphere's guidance and official
                scheme resources whenever you need
                additional information.
              </p>
            </div>

            <div className="db3-support-actions">
              <Link
                to="/guidance"
                className="db3-support-card"
              >
                <div className="db3-support-icon">
                  <Leaf size={19} />
                </div>

                <div>
                  <strong>
                    Farmer Guidance
                  </strong>

                  <span>
                    Understand the KrishiSphere workflow
                    and available tools.
                  </span>
                </div>

                <ArrowRight size={15} />
              </Link>

              <Link
                to="/government-schemes"
                className="db3-support-card"
              >
                <div className="db3-support-icon scheme">
                  <ShoppingBag size={19} />
                </div>

                <div>
                  <strong>
                    Government Schemes
                  </strong>

                  <span>
                    Explore scheme information and
                    official government portals.
                  </span>
                </div>

                <ArrowRight size={15} />
              </Link>
            </div>
          </section>

          <section className="db3-bottom">
            <div>
              <span className="db3-card-kicker">
                FARM SNAPSHOT
              </span>

              <h2>
                {currentCycle
                  ? `${crop?.name || "Your crop"} is ${
                      isCompleted ? "complete" : "moving"
                    }.`
                  : "Your field is ready for planning."}
              </h2>

              <p>
                {currentCycle
                  ? `${completedTaskCount} of ${tasks.length} cycle tasks completed${
                      nextStage?.name
                        ? ` · next stage: ${nextStage.name}`
                        : ""
                    }.`
                  : "The next useful action is to complete the field setup and crop selection."}
              </p>
            </div>

            <div className="db3-quick-actions">
              <Link to={fieldPath}>
                <MapPin size={15} />
                Field
              </Link>

              <Link to="/ai-advice">
                <Sparkles size={15} />
                AI Advice
              </Link>

              <Link
                to={
                  cycleId
                    ? `/market?cycle=${cycleId}`
                    : "/market"
                }
              >
                <Sun size={15} />
                Market
              </Link>
            </div>
          </section>

          {fieldLoading && (
            <div className="db3-refreshing">
              Updating field information…
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
