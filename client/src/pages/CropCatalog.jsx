import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ChevronUp,
  Leaf,
  Search,
} from "lucide-react";

import { api } from "../lib/api.js";
import "./CropCatalog.css";

const CropCatalog = () => {
  const { t } = useTranslation();
  const [crops, setCrops] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedCrop, setExpandedCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCrops = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/crops");

        setCrops(
          Array.isArray(response?.crops)
            ? response.crops
            : []
        );
      } catch (err) {
        console.error("Crop catalog error:", err);

        setError("cropCatalog.errorLoad");
      } finally {
        setLoading(false);
      }
    };

    loadCrops();
  }, []);

  const filteredCrops = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return crops;
    }

    return crops.filter((crop) => {
      return (
        crop?.name
          ?.toLowerCase()
          .includes(query) ||
        crop?.scientificName
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [crops, search]);

  const toggleCrop = (cropId) => {
    setExpandedCrop((current) =>
      current === cropId ? null : cropId
    );
  };

  if (loading) {
    return (
      <div className="crop-page">
        <div className="crop-page-header">
          <div>
            <span className="crop-eyebrow">
              {t("cropCatalog.eyebrow")}
            </span>

            <h1>{t("cropCatalog.title")}</h1>

            <p>{t("cropCatalog.loadingDescription")}</p>
          </div>
        </div>

        <div className="crop-loading">
           {t("cropCatalog.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="crop-page">
      <div className="crop-page-header">
        <div>
          <span className="crop-eyebrow">
            {t("cropCatalog.eyebrow")}
          </span>

          <h1>{t("cropCatalog.title")}</h1>

          <p>{t("cropCatalog.description")}</p>
        </div>

        <div className="crop-count">
          <Leaf size={18} />
          <span>{t("cropCatalog.cropCount",{count:crops.length,})}</span>
        </div>
      </div>

      <div className="crop-toolbar">
        <div className="crop-search">
          <Search size={18} />

          <input
            type="text"
            placeholder={t("cropCatalog.searchPlaceholder")}
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      {error && (
        <div className="crop-error">
          {t(error)}
        </div>
      )}

      {!error && !filteredCrops.length && (
        <div className="crop-empty">
          <Leaf size={32} />

          <h3>{t("cropCatalog.noCropsFound")}</h3>
          <p>{t("cropCatalog.noCropsDescription")}</p>

        </div>
      )}

      <div className="crop-grid">
        {filteredCrops.map((crop) => {
          const cropId = crop._id;

          const durationText =
            crop?.durationDays?.min != null &&
            crop?.durationDays?.max != null
              ? t("cropCatalog.durationRange", {
                min: crop.durationDays.min,
                max: crop.durationDays.max,
              }) : t("cropCatalog.notConfigured");

          const stageCount = Array.isArray(
            crop?.growthStages
          )
            ? crop.growthStages.length
            : 0;

          const lifecycleReady =
            crop?.durationDays?.min != null &&
            crop?.durationDays?.max != null &&
            stageCount > 0;

          const isExpanded =
            expandedCrop === cropId;

          return (
            <article
              className={`crop-card ${
                isExpanded
                  ? "crop-card-expanded"
                  : ""
              }`}
              key={cropId}
            >
              {/* Header */}
              <div className="crop-card-top">
                <div className="crop-icon">
                  <Leaf size={22} />
                </div>

                <div className="crop-title">
                  <h2>{crop.name}</h2>

                  {crop.scientificName && (
                    <p>
                      {crop.scientificName}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              {crop.description && (
                <p className="crop-description">
                  {crop.description}
                </p>
              )}

              {/* Meta */}
              <div className="crop-meta">
                <div>
                  <span>{t("cropCatalog.duration")}</span>

                  <strong>
                    {lifecycleReady
                      ? durationText
                      : t("cropCatalog.notConfigured")}
                  </strong>
                </div>

                <div>
                  <span>{t("cropCatalog.growthStages")}</span>

                  <strong>
                    {lifecycleReady
                      ? stageCount
                      : t("cropCatalog.notConfigured")}
                  </strong>
                </div>
              </div>

              {/* Seasons */}
              {Array.isArray(crop.seasons) &&
                crop.seasons.length > 0 && (
                  <div className="crop-seasons">
                    <span>{t("cropCatalog.seasons")}</span>

                    <div>
                      {crop.seasons.map(
                        (season) => (
                          <span
                            key={season}
                            className="season-pill"
                          >
                            {season}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Expand Button */}
              <button
                type="button"
                className="crop-expand-button"
                onClick={() =>
                  toggleCrop(cropId)
                }
              >
                <span>
                  {isExpanded
                    ? t("cropCatalog.hideGrowthStages")
                    : t("cropCatalog.viewGrowthStages")}
                </span>

                {isExpanded ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>

              {/* Growth Stages */}
              {isExpanded && (
                <div className="growth-stage-list">
                  {Array.isArray(
                    crop.growthStages
                  ) &&
                  crop.growthStages.length > 0 ? (
                    crop.growthStages.map(
                      (stage) => (
                        <div
                          className="growth-stage"
                          key={`${cropId}-${stage.order}`}
                        >
                          <div className="stage-number">
                            {stage.order}
                          </div>

                          <div className="stage-content">
                            <div className="stage-header">
                              <h3>
                                {stage.name}
                              </h3>

                              <span>
                                {t("cropCatalog.dayRange", {
                                  start: stage.startDay,
                                  end: stage.endDay,
                                })}
                              </span>
                            </div>

                            {stage.description && (
                              <p>
                                {stage.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p className="stage-empty">
                      {t("cropCatalog.growthStagesNotConfigured")}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default CropCatalog;