import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Leaf,
  Search,
} from "lucide-react";

import { api } from "../lib/api.js";
import "./CropCatalog.css";

const CropCatalog = () => {
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

        setError(
          err.message ||
            "Unable to load crop catalog."
        );
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
              Crop knowledge
            </span>

            <h1>Crop Catalog</h1>

            <p>
              Explore crops available in
              KrishiSphere.
            </p>
          </div>
        </div>

        <div className="crop-loading">
          Loading crop catalog...
        </div>
      </div>
    );
  }

  return (
    <div className="crop-page">
      <div className="crop-page-header">
        <div>
          <span className="crop-eyebrow">
            Crop knowledge
          </span>

          <h1>Crop Catalog</h1>

          <p>
            Explore configured crops, growing
            duration, seasons and growth stages.
          </p>
        </div>

        <div className="crop-count">
          <Leaf size={18} />
          <span>{crops.length} crops</span>
        </div>
      </div>

      <div className="crop-toolbar">
        <div className="crop-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search crop or scientific name..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      {error && (
        <div className="crop-error">
          {error}
        </div>
      )}

      {!error && !filteredCrops.length && (
        <div className="crop-empty">
          <Leaf size={32} />

          <h3>No crops found</h3>

          <p>
            Try another crop name or scientific
            name.
          </p>
        </div>
      )}

      <div className="crop-grid">
        {filteredCrops.map((crop) => {
          const cropId = crop._id;

          const durationText =
            crop?.durationDays?.min != null &&
            crop?.durationDays?.max != null
              ? `${crop.durationDays.min}–${crop.durationDays.max} days`
              : "Not configured";

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
                  <span>Duration</span>

                  <strong>
                    {lifecycleReady
                      ? durationText
                      : "Not configured"}
                  </strong>
                </div>

                <div>
                  <span>Growth stages</span>

                  <strong>
                    {lifecycleReady
                      ? stageCount
                      : "Not configured"}
                  </strong>
                </div>
              </div>

              {/* Seasons */}
              {Array.isArray(crop.seasons) &&
                crop.seasons.length > 0 && (
                  <div className="crop-seasons">
                    <span>Seasons</span>

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
                    ? "Hide growth stages"
                    : "View growth stages"}
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
                                Day{" "}
                                {stage.startDay}–
                                {stage.endDay}
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
                      Growth stages have not been
                      configured for this crop.
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