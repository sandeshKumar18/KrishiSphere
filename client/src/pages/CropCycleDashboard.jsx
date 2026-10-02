import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  CloudRain,
  Droplets,
  FlaskConical,
  Leaf,
  LoaderCircle,
  MapPin,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Sprout,
  Thermometer,
  TrendingUp,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../lib/api";

import "./CropCycleDashboard.css";

const getEntityId = (entity) => {
  return (
    entity?._id?.$oid ||
    entity?._id ||
    entity?.id ||
    entity?.cropCycleId ||
    null
  );
};

const formatDate = (value) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatMarketPrice = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return `₹${numericValue.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const parseAIResponse = (text) => {
  if (!text) return [];

  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const headings = [
    "Summary:",
    "What to do now:",
    "What to monitor:",
    "When to take action:",
    "Important note:",
  ];

  const sections = [];
  let currentSection = null;

  lines.forEach((line) => {
    const heading = headings.find(
      (item) =>
        line.toLowerCase() ===
        item.toLowerCase()
    );

    if (heading) {
      currentSection = {
        title: heading.replace(":", ""),
        bullets: [],
        paragraphs: [],
      };

      sections.push(currentSection);
      return;
    }

    const cleanLine = line
      .replace(/^[-*•]\s*/, "")
      .replace(/^#{1,6}\s*/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1");

    if (!currentSection) {
      currentSection = {
        title: "Guidance",
        bullets: [],
        paragraphs: [],
      };

      sections.push(currentSection);
    }

    if (
      line.startsWith("-") ||
      line.startsWith("*") ||
      line.startsWith("•")
    ) {
      currentSection.bullets.push(cleanLine);
    } else {
      currentSection.paragraphs.push(cleanLine);
    }
  });

  return sections;
};

const CropCycleDashboard = () => {
  const { cropCycleId } = useParams();
  const navigate = useNavigate();

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [updatingTask, setUpdatingTask] =
    useState(null);

  const [updatingStage, setUpdatingStage] =
    useState(false);

  const [generatingTasks, setGeneratingTasks] =
    useState(false);

  const [completingCycle, setCompletingCycle] =
    useState(false);

  const [question, setQuestion] = useState("");

  const [advice, setAdvice] = useState("");

  const [adviceLoading, setAdviceLoading] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        `/crop-cycles/${cropCycleId}/dashboard`
      );

      const normalized =
        data?.dashboard ||
        data?.data?.dashboard ||
        data?.data ||
        data;

      setDashboard(normalized);
    } catch (err) {
      console.error(
        "Crop dashboard error:",
        err
      );

      setError(
        err.message ||
          "Unable to load crop dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      !cropCycleId ||
      cropCycleId === "undefined"
    ) {
      setLoading(false);
      setError(
        "Crop cycle ID is missing from the URL."
      );
      return;
    }

    loadDashboard();
  }, [cropCycleId]);

const completeTask = async (taskId) => {
  // console.log("CLICKED TASK:", taskId);

  if (!taskId) {
    console.error("Task ID is missing");
    return;
  }

  try {
    setUpdatingTask(taskId);
    setError("");

    const response = await api.patch(
      `/tasks/${taskId}/status`,
      {
        status: "completed",
      }
    );

    // console.log(
    //   "TASK UPDATE RESPONSE:",
    //   response
    // );

    await loadDashboard();
  } catch (err) {
    console.error(
      "COMPLETE TASK ERROR:",
      err
    );

    setError(
      err.message ||
        "Unable to update task."
    );
  } finally {
    setUpdatingTask(null);
  }
};

  const generateCurrentStageTasks =
    async () => {
      try {
        setGeneratingTasks(true);
        setError("");

        if (
          !dashboard?.cropPlan?.stages?.length
        ) {
          try {
            await api.post(
              `/crop-cycles/${cropCycleId}/plan`
            );
          } catch (planError) {
            const message =
              planError.message?.toLowerCase() ||
              "";

            if (
              !message.includes(
                "already exists"
              )
            ) {
              throw planError;
            }
          }
        }

        await api.post(
          `/crop-cycles/${cropCycleId}/tasks/generate-current`
        );

        await loadDashboard();
      } catch (err) {
        setError(
          err.message ||
            "Unable to generate crop tasks."
        );
      } finally {
        setGeneratingTasks(false);
      }
    };

  const moveToNextStage = async () => {
    if (!dashboard?.cropPlan?.stages) {
      return;
    }

    const nextStageOrder =
      dashboard.cropCycle
        .currentStageOrder + 1;

    const nextStage =
      dashboard.cropPlan.stages.find(
        (stage) =>
          stage.order === nextStageOrder
      );

    if (!nextStage) {
      return;
    }

    try {
      setUpdatingStage(true);
      setError("");

      await api.patch(
        `/crop-cycles/${cropCycleId}/stage`,
        {
          stageOrder: nextStageOrder,
        }
      );

      await api.post(
        `/crop-cycles/${cropCycleId}/tasks/generate-current`
      );

      await loadDashboard();
    } catch (err) {
      console.error(
        "Stage update error:",
        err
      );

      setError(
        err.message ||
          "Unable to update crop stage."
      );
    } finally {
      setUpdatingStage(false);
    }
  };

  const completeCropCycle = async () => {
    try {
      setCompletingCycle(true);
      setError("");

      const completedTasks =
        dashboard?.progress
          ?.completedTasks || 0;

      const totalTasks =
        dashboard?.progress
          ?.totalTasks || 0;

      if (
        totalTasks === 0 ||
        completedTasks < totalTasks
      ) {
        setError(
          "Complete all crop tasks before completing the crop cycle."
        );
        return;
      }

      await api.patch(
        `/crop-cycles/${cropCycleId}/status`,
        {
          status: "completed",
        }
      );

      await loadDashboard();
    } catch (err) {
      console.error(
        "Complete crop cycle error:",
        err
      );

      setError(
        err.message ||
          "Unable to complete crop cycle."
      );
    } finally {
      setCompletingCycle(false);
    }
  };

  const askAI = async (event) => {
    event.preventDefault();

    const trimmedQuestion =
      question.trim();

    if (!trimmedQuestion) {
      return;
    }

    try {
      setAdviceLoading(true);
      setError("");
      setAdvice("");

      const data = await api.post(
        `/crop-cycles/${cropCycleId}/advice`,
        {
          question: trimmedQuestion,
        }
      );

      setAdvice(
        data?.advice ||
          data?.data?.advice ||
          ""
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to get AI advice."
      );
    } finally {
      setAdviceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ccd-page">
        <div className="ccd-loading">
          <div className="ccd-loading-mark">
            <Leaf size={25} />
          </div>

          <div className="ccd-loading-line ccd-loading-title" />

          <div className="ccd-loading-line ccd-loading-text" />

          <div className="ccd-loading-grid">
            <div />
            <div />
            <div />
            <div />
          </div>

          <div className="ccd-loading-large" />
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="ccd-page">
        <div className="ccd-error-state">
          <div className="ccd-error-mark">
            <RefreshCw size={25} />
          </div>

          <p className="ccd-eyebrow">
            CROP DASHBOARD
          </p>

          <h1>
            Unable to load this crop
          </h1>

          <p>
            {error ||
              "Something went wrong while loading this crop cycle."}
          </p>

          <div className="ccd-error-actions">
            <button
              type="button"
              className="ccd-outline-button"
              onClick={() =>
                navigate("/fields")
              }
            >
              <ArrowLeft size={16} />
              Back to Fields
            </button>

            <button
              type="button"
              className="ccd-primary-button"
              onClick={loadDashboard}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    field,
    cropCycle,
    crop,
    currentStage,
    progress,
    soilTest,
    cropPlan,
    tasks = [],
    weather,
    market,
  } = dashboard;

  const currentStageOrder =
    cropCycle?.currentStageOrder || 1;

  const stages =
    cropPlan?.stages || [];

  const nextStage =
    stages.find(
      (stage) =>
        stage.order ===
        currentStageOrder + 1
    ) || null;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status === "completed"
    ).length;

  const taskCount = tasks.length;

  const totalStages =
    progress?.totalStages ||
    stages.length ||
    0;

  const completedStages =
    progress?.completedStages || 0;

  const progressPercentage =
    cropCycle?.status === "completed"
      ? 100
      : Math.min(
          Math.max(
            Number(
              progress?.percentage || 0
            ),
            0
          ),
          100
        );

  const currentStageTasks =
    cropCycle?.status === "completed"
      ? []
      : tasks.filter(
          (task) =>
            task.stageOrder ===
            currentStageOrder
        );

  const completedTaskHistory =
    tasks.filter(
      (task) =>
        task.stageOrder <
          currentStageOrder ||
        cropCycle?.status ===
          "completed"
    );

  const getStageName = (order) =>
    stages.find(
      (stage) => stage.order === order
    )?.name ||
    `Stage ${order}`;

  const formattedStartDate =
    formatDate(
      cropCycle?.startDate
    );

  const formattedHarvestDate =
    formatDate(
      cropCycle?.expectedHarvestDate
    );

  const formattedActualHarvestDate =
    cropCycle?.actualHarvestDate
      ? formatDate(
          cropCycle.actualHarvestDate
        )
      : null;

  const locationText = [
    field?.location?.district,
    field?.location?.state,
  ]
    .filter(Boolean)
    .join(", ");

  const isCompleted =
    cropCycle?.status === "completed";

  const isFinalStage = !nextStage;

  const currentTasksComplete =
    currentStageTasks.length > 0 &&
    currentStageTasks.every(
      (task) =>
        task.status === "completed"
    );

  const cycleStatusLabel =
    cropCycle?.status ===
    "completed"
      ? "Completed"
      : cropCycle?.status ===
        "active"
      ? "Active"
      : "Planned";

  return (
    <div className="ccd-page">
      {/* header */}

      <section className="ccd-header">
        <button
          type="button"
          className="ccd-back"
          onClick={() =>
            navigate("/fields")
          }
        >
          <ArrowLeft size={16} />
          Back to fields
        </button>

        <div className="ccd-header-row">
          <div>
            <div className="ccd-eyebrow">
              <Leaf size={14} />
              CROP MANAGEMENT
            </div>

            <div className="ccd-title-line">
              <div className="ccd-title-icon">
                <Sprout size={25} />
              </div>

              <div>
                <h1>
                  {crop?.name ||
                    "Crop Dashboard"}
                </h1>

                <div className="ccd-location">
                  <MapPin size={14} />

                  <span>
                    {field?.name ||
                      "Field"}

                    {locationText
                      ? ` · ${locationText}`
                      : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="ccd-header-status">
            <span
              className={`ccd-status-dot ${
                isCompleted
                  ? "completed"
                  : ""
              }`}
            />

            {cycleStatusLabel}

            {isCompleted &&
              formattedActualHarvestDate && (
                <small>
                  Completed{" "}
                  {formattedActualHarvestDate}
                </small>
              )}
          </div>
        </div>
      </section>

      {error && (
        <div className="ccd-alert">
          <div className="ccd-alert-mark">
            !
          </div>

          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>
        </div>
      )}

      {/* CURRENT stage */}

      <section className="ccd-stage-hero">
        <div className="ccd-stage-hero-main">
          <div className="ccd-section-kicker">
            {isCompleted
              ? "CROP CYCLE COMPLETED"
              : "CURRENT STAGE"}
          </div>

          <div className="ccd-stage-heading">
            <div className="ccd-stage-symbol">
              <Leaf size={27} />
            </div>

            <div>
              <h2>
                {currentStage?.name ||
                  "Not started"}
              </h2>

              <p>
                {currentStage?.description ||
                  "No stage information available."}
              </p>
            </div>
          </div>

          <div className="ccd-progress">
            <div className="ccd-progress-top">
              <span>
                Overall crop progress
              </span>

              <strong>
                {progressPercentage}%
              </strong>
            </div>

            <div className="ccd-progress-track">
              <span
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>

            <div className="ccd-progress-bottom">
              <span>
                {isCompleted
                  ? totalStages
                  : completedStages}{" "}
                of {totalStages} stages
              </span>

              <span>
                Started{" "}
                {formattedStartDate}
              </span>
            </div>
          </div>

          <div className="ccd-stage-actions">
            {!isFinalStage &&
              !isCompleted && (
                <button
                  type="button"
                  className="ccd-primary-button"
                  onClick={
                    moveToNextStage
                  }
                  disabled={
                    updatingStage
                  }
                >
                  {updatingStage ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="ccd-spin"
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      Move to{" "}
                      {nextStage.name}
                      <ArrowRight
                        size={16}
                      />
                    </>
                  )}
                </button>
              )}

            {isFinalStage &&
              !isCompleted &&
              (progress?.totalTasks || 0) >
                0 &&
              progress?.completedTasks ===
                progress?.totalTasks && (
                <button
                  type="button"
                  className="ccd-primary-button"
                  onClick={
                    completeCropCycle
                  }
                  disabled={
                    completingCycle
                  }
                >
                  {completingCycle ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="ccd-spin"
                      />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Complete Crop Cycle
                    </>
                  )}
                </button>
              )}

            {!isFinalStage &&
              !isCompleted && (
                <span className="ccd-stage-hint">
                  {currentTasksComplete
                    ? `Current tasks complete. You can move to ${nextStage.name}.`
                    : "Complete all current-stage tasks before moving forward."}
                </span>
              )}

            {isFinalStage &&
              !isCompleted &&
              !(
                progress?.totalTasks > 0 &&
                progress?.completedTasks ===
                  progress?.totalTasks
              ) && (
                <div className="ccd-stage-warning">
                  <Check size={15} />
                  Complete all crop tasks
                  before closing the cycle.
                </div>
              )}

            {isCompleted && (
              <div className="ccd-stage-success">
                <Check size={15} />
                Crop cycle completed
              </div>
            )}
          </div>
        </div>

        <div className="ccd-stage-hero-side">
          <div className="ccd-date-block">
            <span>STARTED</span>
            <strong>
              {formattedStartDate}
            </strong>
          </div>

          <div className="ccd-date-divider" />

          <div className="ccd-date-block">
            <span>
              {isCompleted
                ? "ACTUAL HARVEST"
                : "EXPECTED HARVEST"}
            </span>

            <strong>
              {isCompleted
                ? formattedActualHarvestDate ||
                  "Not set"
                : formattedHarvestDate}
            </strong>
          </div>

          <div className="ccd-date-divider" />

          <div className="ccd-date-block">
            <span>TASKS</span>
            <strong>
              {completedTasks}/
              {taskCount}
            </strong>
          </div>
        </div>
      </section>

      {/* quick stats */}

      <section className="ccd-summary">
        <div className="ccd-summary-card">
          <div className="ccd-summary-icon weather">
            <Thermometer size={19} />
          </div>

          <div>
            <span>Temperature</span>

            <strong>
              {weather?.temperature ??
                "—"}
              °C
            </strong>

            <small>
              {weather?.humidity ??
                "—"}
              % humidity
            </small>
          </div>
        </div>

        <div className="ccd-summary-card">
          <div className="ccd-summary-icon soil">
            <FlaskConical size={19} />
          </div>

          <div>
            <span>Soil pH</span>

            <strong>
              {soilTest?.pH ??
                "—"}
            </strong>

            <small>
              Moisture{" "}
              {soilTest?.moisture ??
                "—"}
              %
            </small>
          </div>
        </div>

        <div className="ccd-summary-card">
          <div className="ccd-summary-icon task">
            <Check size={19} />
          </div>

          <div>
            <span>Task progress</span>

            <strong>
              {completedTasks}/
              {taskCount}
            </strong>

            <small>
              {taskCount === 0
                ? "No tasks"
                : "completed"}
            </small>
          </div>
        </div>

        <div className="ccd-summary-card">
          <div className="ccd-summary-icon market">
            <TrendingUp size={19} />
          </div>

          <div>
            <span>Market records</span>

            <strong>
              {market?.records
                ?.length || 0}
            </strong>

            <small>
              {market?.scope ===
              "district"
                ? "local"
                : market?.scope === "state"
                ? "state"
                : "available"}
            </small>
          </div>
        </div>
      </section>

      {/* MAIN GRID */}

      <section className="ccd-main-grid">

        <div className="ccd-panel ccd-journey-panel">
          <div className="ccd-panel-header">
            <div>
              <span className="ccd-panel-kicker">
                CROP JOURNEY
              </span>

              <h3>
                Growth stages
              </h3>

              <p>
                Track where the crop is in
                its lifecycle.
              </p>
            </div>

            <span className="ccd-count">
              {stages.length}
            </span>
          </div>

          <div className="ccd-stage-list">
            {stages.map((stage) => {
              const isCurrent =
                !isCompleted &&
                stage.order ===
                  currentStageOrder;

              const isCompletedStage =
                isCompleted ||
                stage.order <
                  currentStageOrder;

              return (
                <div
                  key={
                    stage._id ||
                    stage.order
                  }
                  className={`ccd-growth-stage ${
                    isCurrent
                      ? "current"
                      : ""
                  } ${
                    isCompletedStage
                      ? "completed"
                      : ""
                  }`}
                >
                  <div className="ccd-growth-marker">
                    {isCompletedStage ? (
                      <Check size={14} />
                    ) : isCurrent ? (
                      <Leaf size={14} />
                    ) : (
                      <Circle size={8} />
                    )}
                  </div>

                  <div className="ccd-growth-line" />

                  <div className="ccd-growth-content">
                    <div className="ccd-growth-top">
                      <strong>
                        {stage.name}
                      </strong>

                      {isCurrent && (
                        <span className="current-badge">
                          Current
                        </span>
                      )}

                      {isCompletedStage && (
                        <span className="done-badge">
                          Done
                        </span>
                      )}
                    </div>

                    <p>
                      {stage.description ||
                        "Growth stage information"}
                    </p>

                    <small>
                      Stage {stage.order}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* task */}

        <div className="ccd-panel ccd-task-panel">
          <div className="ccd-panel-header">
            <div>
              <span className="ccd-panel-kicker">
                {isCompleted
                  ? "TASK HISTORY"
                  : "TODAY'S WORK"}
              </span>

              <h3>
                {isCompleted
                  ? "Completed tasks"
                  : "Current tasks"}
              </h3>

              <p>
                {isCompleted
                  ? "Work recorded during this crop cycle."
                  : `Tasks for ${currentStage?.name || "the current stage"}.`}
              </p>
            </div>

            <span className="ccd-count">
              {currentStageTasks.length ||
                taskCount}
            </span>
          </div>

          {!isCompleted && (
            <div className="ccd-task-block">
              {currentStageTasks.length >
              0 ? (
                <div className="ccd-task-list">
                  {currentStageTasks.map(
                    (task) => {
                      const completed =
                        task.status ===
                        "completed";

                      return (
                        <div
                          key={task._id}
                          className={`ccd-task-row ${
                            completed
                              ? "completed"
                              : ""
                          }`}
                        >
                          <button
                              type="button"
                              className="ccd-task-check"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();

                                if (completed) {
                                  return;
                                }

                                completeTask(task._id);
                              }}
                              disabled={
                                updatingTask === task._id
                              }
                              aria-label={
                                completed
                                  ? "Task completed"
                                  : "Complete task"
                              }
                            >
                            
                            {completed ? (
                              <Check
                                size={14}
                              />
                            ) : updatingTask ===
                              task._id ? (
                              <LoaderCircle
                                size={14}
                                className="ccd-spin"
                              />
                            ) : (
                              <Circle
                                size={15}
                              />
                            )}
                          </button>

                          <div className="ccd-task-content">
                            <strong>
                              {task.title}
                            </strong>

                            <span>
                              Stage{" "}
                              {
                                task.stageOrder
                              }{" "}
                              ·{" "}
                              {getStageName(
                                task.stageOrder
                              )}
                            </span>

                            <p>
                              {task.description ||
                                "Current crop management task"}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="ccd-empty compact">
                  <div className="ccd-empty-icon">
                    <CalendarDays
                      size={21}
                    />
                  </div>

                  <h4>
                    No task for this stage
                  </h4>

                  <p>
                    Create the current-stage
                    task to begin tracking
                    your work.
                  </p>

                  <button
                    type="button"
                    className="ccd-outline-button"
                    onClick={
                      generateCurrentStageTasks
                    }
                    disabled={
                      generatingTasks
                    }
                  >
                    {generatingTasks ? (
                      <>
                        <LoaderCircle
                          size={15}
                          className="ccd-spin"
                        />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate task
                        <ArrowRight
                          size={15}
                        />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {completedTaskHistory.length >
            0 && (
            <div className="ccd-history">
              <div className="ccd-history-header">
                <strong>
                  Completed history
                </strong>

                <span>
                  Previous stage work
                </span>
              </div>

              <div className="ccd-history-list">
                {completedTaskHistory.map(
                  (task) => (
                    <div
                      key={task._id}
                      className="ccd-history-row"
                    >
                      <div className="ccd-history-check">
                        <Check size={13} />
                      </div>

                      <div>
                        <strong>
                          {task.title}
                        </strong>

                        <span>
                          Stage{" "}
                          {
                            task.stageOrder
                          }{" "}
                          ·{" "}
                          {getStageName(
                            task.stageOrder
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {taskCount === 0 &&
            isCompleted && (
              <div className="ccd-empty">
                <div className="ccd-empty-icon">
                  <CalendarDays
                    size={21}
                  />
                </div>

                <h4>
                  No tasks recorded
                </h4>

                <p>
                  There are no tasks stored
                  for this crop cycle.
                </p>
              </div>
            )}
        </div>

        {/* weather */}

        <div className="ccd-panel">
          <div className="ccd-panel-header">
            <div>
              <span className="ccd-panel-kicker">
                FIELD CONDITIONS
              </span>

              <h3>Weather</h3>
            </div>

            <CloudRain size={20} />
          </div>

          <div className="ccd-weather-main">
            <div className="ccd-temperature">
              {weather?.temperature ??
                "—"}
              °
            </div>

            <div>
              <strong>
                {field?.location?.district ||
                  "Field location"}
              </strong>

              <span>
                Current conditions
              </span>
            </div>
          </div>

          <div className="ccd-weather-grid">
            <div>
              <span>
                <Droplets size={14} />
                Humidity
              </span>

              <strong>
                {weather?.humidity ??
                  "—"}
                %
              </strong>
            </div>

            <div>
              <span>
                <CloudRain size={14} />
                Rainfall
              </span>

              <strong>
                {weather?.rainfall ??
                  "—"}{" "}
                mm
              </strong>
            </div>
          </div>
        </div>

        {/* soil */}

        <div className="ccd-panel">
          <div className="ccd-panel-header">
            <div>
              <span className="ccd-panel-kicker">
                SOIL STATUS
              </span>

              <h3>
                Latest soil test
              </h3>
            </div>

            <FlaskConical size={20} />
          </div>

          {soilTest ? (
            <div className="ccd-soil-grid">
              <div>
                <span>Nitrogen</span>
                <strong>
                  {soilTest.nitrogen}
                </strong>
              </div>

              <div>
                <span>Phosphorus</span>
                <strong>
                  {soilTest.phosphorus}
                </strong>
              </div>

              <div>
                <span>Potassium</span>
                <strong>
                  {soilTest.potassium}
                </strong>
              </div>

              <div>
                <span>pH</span>
                <strong>
                  {soilTest.pH}
                </strong>
              </div>

              <div>
                <span>Moisture</span>
                <strong>
                  {soilTest.moisture}%
                </strong>
              </div>
            </div>
          ) : (
            <div className="ccd-empty compact">
              <Droplets size={21} />

              <p>
                No soil test is available
                for this crop cycle.
              </p>
            </div>
          )}
        </div>

        {/* market */}

        <div className="ccd-panel ccd-market-panel">
          <div className="ccd-panel-header">
            <div>
              <span className="ccd-panel-kicker">
                MARKET
              </span>

              <h3>
                {crop?.name || "Crop"}
              </h3>
            </div>

            <TrendingUp size={20} />
          </div>

          {market?.records?.length ? (
            <>
              <div className="ccd-market-context">
                <div>
                  <strong>
                    {market.scope ===
                    "district"
                      ? "District prices"
                      : market.scope ===
                        "state"
                      ? "State prices"
                      : "Market prices"}
                  </strong>

                  <span>
                    Latest available data
                  </span>
                </div>

                <span>
                  {market.scope ===
                  "district"
                    ? "Local"
                    : market.scope ===
                      "state"
                    ? "State"
                    : "Market"}
                </span>
              </div>

              <div className="ccd-market-list">
                {market.records
                  .slice(0, 5)
                  .map(
                    (
                      record,
                      index
                    ) => {
                      const minPrice =
                        record.min_price ??
                        record.minPrice;

                      const maxPrice =
                        record.max_price ??
                        record.maxPrice;

                      const modalPrice =
                        record.modal_price ??
                        record.modalPrice;

                      return (
                        <div
                          key={`${record.market}-${index}`}
                          className="ccd-market-row"
                        >
                          <div className="ccd-market-name">
                            <strong>
                              {
                                record.market
                              }
                            </strong>

                            <span>
                              {record.arrival_date ||
                                "Date unavailable"}
                            </span>
                          </div>

                          <div className="ccd-market-values">
                            <div>
                              <span>
                                Min
                              </span>

                              <strong>
                                {formatMarketPrice(
                                  minPrice
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Modal
                              </span>

                              <strong>
                                {formatMarketPrice(
                                  modalPrice
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Max
                              </span>

                              <strong>
                                {formatMarketPrice(
                                  maxPrice
                                )}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
              </div>

              <button
                type="button"
                className="ccd-market-link"
                onClick={() =>
                  navigate(
                    `/market?cycle=${cropCycleId}`
                  )
                }
              >
                Open market
                <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <div className="ccd-empty compact">
              <TrendingUp size={21} />

              <p>
                No market data is currently
                available for this crop.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* AI */}

      <section className="ccd-ai">
        <div className="ccd-ai-head">
          <div className="ccd-ai-icon">
            <Sparkles size={22} />
          </div>

          <div>
            <span className="ccd-panel-kicker">
              KRISHISPHERE AI
            </span>

            <h3>
              Ask about your current crop
              stage
            </h3>

            <p>
              Your question is sent with
              the crop, current stage, soil
              and weather context.
            </p>
          </div>
        </div>

        <form
          className="ccd-ai-form"
          onSubmit={askAI}
        >
          <input
            type="text"
            value={question}
            onChange={(event) =>
              setQuestion(
                event.target.value
              )
            }
            placeholder="e.g. What should I focus on during this stage?"
          />

          <button
            type="submit"
            disabled={
              adviceLoading ||
              !question.trim()
            }
          >
            {adviceLoading ? (
              <LoaderCircle
                size={16}
                className="ccd-spin"
              />
            ) : (
              <MessageSquareText
                size={16}
              />
            )}

            {adviceLoading
              ? "Thinking..."
              : "Ask AI"}
          </button>
        </form>

        {advice && (
          <div className="ccd-ai-answer">
            <div className="ccd-ai-answer-icon">
              <Sparkles size={17} />
            </div>

            <div className="ccd-ai-response">
              <strong>
                KrishiSphere AI
              </strong>

              {parseAIResponse(
                advice
              ).map((section) => (
                <div
                  key={section.title}
                  className="ccd-ai-section"
                >
                  <h4>
                    {section.title}
                  </h4>

                  {section.paragraphs
                    .length >
                    0 && (
                    <div>
                      {section.paragraphs.map(
                        (
                          paragraph,
                          index
                        ) => (
                          <p
                            key={
                              index
                            }
                          >
                            {
                              paragraph
                            }
                          </p>
                        )
                      )}
                    </div>
                  )}

                  {section.bullets.length >
                    0 && (
                    <ul>
                      {section.bullets.map(
                        (
                          bullet,
                          index
                        ) => (
                          <li
                            key={
                              index
                            }
                          >
                            {
                              bullet
                            }
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ccd-ai-note">
          AI guidance supports farm decisions. Use validated agronomic recommendations and product labels for exact fertilizer quantities or treatment decisions.
        </div>
      </section>
    </div>
  );
};

export default CropCycleDashboard;