import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api } from "../lib/api";

import "./FarmAlerts.css";

const getEntityId = (entity) => {
  if (!entity) return null;

  if (typeof entity === "string") {
    return entity;
  }

  if (entity?._id?.$oid) {
    return String(entity._id.$oid);
  }

  if (entity?._id) {
    return String(entity._id);
  }

  if (entity?.id) {
    return String(entity.id);
  }

  return null;
};

const FarmAlerts = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [farmDashboard, setFarmDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const data = await api.get("/dashboard/farm");

      const normalized =
        data?.data?.summary
          ? data.data
          : data;

      setFarmDashboard(normalized);
    } catch (error) {
      console.error(
        "Farm alerts error:",
        error
      );

      setFarmDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    const interval = setInterval(
      loadAlerts,
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, []);

  const alerts = useMemo(() => {
    const fieldAlerts = Array.isArray(
      farmDashboard?.fields
    )
      ? farmDashboard.fields
      : [];

    const todayTasks = Array.isArray(
      farmDashboard?.todayTasks?.records
    )
      ? farmDashboard.todayTasks.records
      : [];

    const result = [];

    // Field alerts
    fieldAlerts
      .filter(
        (field) =>
          field?.needsAttention
      )
      .slice(0, 4)
      .forEach((field) => {
        result.push({
          id: `field-${getEntityId(field)}`,
          type: "field",
          title: "Field needs attention",
          description:
            field?.attentionReasons?.join(
              " · "
            ) ||
            "Review this field.",
          fieldId:
            getEntityId(field),
          fieldName:
            field?.name ||
            "Unnamed field",
        });
      });

    // Today's pending tasks
    todayTasks
      .filter(
        (task) =>
          task?.status !== "completed"
      )
      .slice(0, 4)
      .forEach((task) => {
        result.push({
          id: `task-${getEntityId(task)}`,
          type: "task",
          title: "Task due today",
          description:
            task?.title ||
            "Farm task needs attention.",
          cropCycleId:
            getEntityId(
              task?.cropCycleId
            ),
          fieldName:
            task?.field?.name ||
            "Field",
          cropName:
            task?.crop?.name ||
            "Crop",
        });
      });

    return result;
  }, [farmDashboard]);

  const alertCount = alerts.length;

  const handleAlertClick = (alert) => {
    setOpen(false);

    if (alert.type === "field") {
      if (alert.fieldId) {
        navigate(
          `/fields/${alert.fieldId}`
        );
      }

      return;
    }

    if (
      alert.type === "task" &&
      alert.cropCycleId
    ) {
      navigate(
        `/crop-cycles/${alert.cropCycleId}`
      );
    }
  };

  return (
    <div className="farm-alerts">

      <button
        type="button"
        className={`farm-alert-trigger ${
          open ? "open" : ""
        }`}
        onClick={() =>
          setOpen((value) => !value)
        }
        aria-label={`Farm alerts${
          alertCount
            ? `, ${alertCount} alerts`
            : ""
        }`}
        aria-expanded={open}
      >
        <Bell size={19} />

        {alertCount > 0 && (
          <span className="farm-alert-badge">
            {alertCount > 9
              ? "9+"
              : alertCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="farm-alert-backdrop"
            onClick={() =>
              setOpen(false)
            }
          />

          <div className="farm-alert-panel">

            <div className="farm-alert-header">
              <div>
                <span>
                  FARM ALERTS
                </span>

                <h3>
                  {alertCount > 0
                    ? `${alertCount} item${
                        alertCount === 1
                          ? ""
                          : "s"
                      } need your attention`
                    : "Everything looks clear"}
                </h3>
              </div>

              <button
                type="button"
                className="farm-alert-close"
                onClick={() =>
                  setOpen(false)
                }
                aria-label="Close alerts"
              >
                <X size={16} />
              </button>
            </div>

            {loading ? (
              <div className="farm-alert-empty">
                Loading alerts...
              </div>
            ) : alerts.length > 0 ? (
              <div className="farm-alert-list">

                {alerts.map((alert) => (
                  <button
                    type="button"
                    key={alert.id}
                    className="farm-alert-item"
                    onClick={() =>
                      handleAlertClick(
                        alert
                      )
                    }
                  >
                    <div
                      className={`farm-alert-icon ${
                        alert.type
                      }`}
                    >
                      {alert.type ===
                      "field" ? (
                        <AlertTriangle
                          size={17}
                        />
                      ) : (
                        <CalendarDays
                          size={17}
                        />
                      )}
                    </div>

                    <div className="farm-alert-content">
                      <strong>
                        {alert.title}
                      </strong>

                      <span>
                        {alert.description}
                      </span>

                      <small>
                        {alert.type ===
                        "field"
                          ? alert.fieldName
                          : `${alert.fieldName} · ${alert.cropName}`}
                      </small>
                    </div>

                    <ArrowRight
                      size={15}
                      className="farm-alert-arrow"
                    />
                  </button>
                ))}

              </div>
            ) : (
              <div className="farm-alert-empty success">
                <div className="farm-alert-success-icon">
                  <CheckCircle2
                    size={20}
                  />
                </div>

                <strong>
                  No urgent farm alerts
                </strong>

                <span>
                  Your fields and today's
                  tasks are currently clear.
                </span>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
};

export default FarmAlerts;