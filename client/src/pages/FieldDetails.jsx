import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CloudRain,
  Droplets,
  FlaskConical,
  Leaf,
  LoaderCircle,
  MapPin,
  Sprout,
  Thermometer,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { api } from "../lib/api";
import "./FieldDetails.css";

const getEntityId = (entity) => {
  if (!entity) return null;

  if (
    typeof entity === "string" ||
    typeof entity === "number"
  ) {
    return String(entity);
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

  if (entity?.fieldId) {
    return getEntityId(entity.fieldId);
  }

  if (entity?.cropId) {
    return getEntityId(entity.cropId);
  }

  if (entity?.cropCycleId) {
    return getEntityId(entity.cropCycleId);
  }

  return null;
};

const extractEntity = (data, keys = []) => {
  if (!data) return null;

  for (const key of keys) {
    if (data?.[key]) {
      return data[key];
    }

    if (data?.data?.[key]) {
      return data.data[key];
    }
  }

  return data?.data || data || null;
};

const extractList = (data, keys = []) => {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }

    if (Array.isArray(data?.data?.[key])) {
      return data.data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
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

const formatValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return value;
};

const getCropName = (crop) =>
  crop?.name ||
  crop?.cropName ||
  crop?.label ||
  "Crop";

const isCropLifecycleReady = (crop) => {
  const stageCount = Array.isArray(
    crop?.growthStages
  )
    ? crop.growthStages.length
    : 0;

  return (
    crop?.durationDays?.min != null &&
    crop?.durationDays?.max != null &&
    stageCount > 0
  );
};

const getRecommendationCrop = (item) => {
  if (!item) {
    return {
      _id: null,
      name: "Crop",
    };
  }

  if (typeof item === "string") {
    return {
      _id: null,
      name: item,
    };
  }

  if (
    item?.crop &&
    typeof item.crop === "object"
  ) {
    return {
      ...item.crop,
      name:
        item.crop.name ||
        item.cropName ||
        item.name ||
        "Crop",
    };
  }

  if (
    item?.cropId &&
    typeof item.cropId === "object"
  ) {
    return {
      ...item.cropId,
      name:
        item.cropId.name ||
        item.cropName ||
        item.name ||
        "Crop",
    };
  }

  return {
    _id:
      item?.cropId ||
      item?.crop ||
      item?.id ||
      null,

    name:
      item?.cropName ||
      item?.name ||
      (typeof item?.crop === "string"
        ? item.crop
        : "Crop"),
  };
};

const getRecommendationScore = (item) => {
  const raw =
    item?.score ??
    item?.modelScore ??
    item?.probability ??
    item?.confidence ??
    0;

  const number = Number(raw);

  if (!Number.isFinite(number)) {
    return 0;
  }

  if (number > 0 && number <= 1) {
    return Math.round(number * 100);
  }

  return Math.round(
    Math.min(Math.max(number, 0), 100)
  );
};


const getCycleCrop = (cycle, cropCatalog = []) => {
  if (!cycle) return null;

  const embeddedCrop =
    cycle?.crop ||
    (cycle?.cropId &&
    typeof cycle.cropId === "object"
      ? cycle.cropId
      : null);

  if (embeddedCrop) {
    return embeddedCrop;
  }

  const cropId = getEntityId(
    cycle?.cropId ||
      cycle?.crop ||
      cycle?.selectedCropId
  );

  if (cropId) {
    const catalogCrop = cropCatalog.find(
      (crop) =>
        String(getEntityId(crop)) ===
        String(cropId)
    );

    if (catalogCrop) {
      return catalogCrop;
    }
  }

  if (
    cycle?.cropName ||
    cycle?.name
  ) {
    return {
      name:
        cycle.cropName ||
        cycle.name,
    };
  }

  return null;
};

const getCurrentStageName = (
  cycle,
  crop
) => {
  if (!cycle) return "—";

  const currentOrder =
    Number(cycle.currentStageOrder);

  if (!Number.isFinite(currentOrder)) {
    return "Not started";
  }

  const stages = Array.isArray(
    crop?.growthStages
  )
    ? crop.growthStages
    : [];

  const currentStage = stages.find(
    (stage, index) => {
      const stageOrder = Number(
        stage?.order ??
          stage?.stageOrder ??
          stage?.sequence ??
          index + 1
      );

      return stageOrder === currentOrder;
    }
  );

  return (
    currentStage?.name ||
    currentStage?.stageName ||
    currentStage?.title ||
    `Stage ${currentOrder}`
  );
};

const FieldDetails = () => {
  const { fieldId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [field, setField] = useState(null);
  const [soilTest, setSoilTest] = useState(null);

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [recommendation, setRecommendation] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [cropCatalog, setCropCatalog] = useState([]);
  const [cropCycles, setCropCycles] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);

  const [createdCycle, setCreatedCycle] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [savingSoil, setSavingSoil] =
    useState(false);

  const [recommendationLoading, setRecommendationLoading] =
    useState(false);

  const [selectingCropId, setSelectingCropId] =
    useState("");

  const [creatingCycle, setCreatingCycle] =
    useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showSoilForm, setShowSoilForm] =
    useState(false);

  const [soilForm, setSoilForm] = useState({
    testedAt: new Date()
      .toISOString()
      .slice(0, 10),

    nitrogen: "",
    phosphorus: "",
    potassium: "",
    pH: "",
    moisture: "",
    source: "manual",
    notes: "",
  });

  const [cycleForm, setCycleForm] =
    useState({
      startDate: new Date()
        .toISOString()
        .slice(0, 10),

      expectedHarvestDate: "",
    });

 
  const activeCropCycle = useMemo(() => {
    return (
      cropCycles.find(
        (cycle) =>
          String(cycle?.status).toLowerCase() ===
          "active"
      ) || null
    );
  }, [cropCycles]);

  const plannedCropCycle = useMemo(() => {
    return (
      cropCycles.find(
        (cycle) =>
          String(cycle?.status).toLowerCase() ===
          "planned"
      ) || null
    );
  }, [cropCycles]);

  const currentCropCycle =
    activeCropCycle ||
    plannedCropCycle ||
    null;

  const currentCycleCrop = useMemo(() => {
    return getCycleCrop(
      currentCropCycle,
      cropCatalog
    );
  }, [
    currentCropCycle,
    cropCatalog,
  ]);

  const currentCycleStage = useMemo(() => {
    return getCurrentStageName(
      currentCropCycle,
      currentCycleCrop
    );
  }, [
    currentCropCycle,
    currentCycleCrop,
  ]);

  const loadWeather = async () => {
    if (!fieldId) return;

    try {
      setWeatherLoading(true);

      const response = await api.get(
        `/fields/${fieldId}/weather`
      );

      setWeather(
        response?.weather || null
      );
    } catch (error) {
      console.error(
        "Weather error:",
        error
      );

      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadField = async () => {
    if (!fieldId) return;

    try {
      setLoading(true);
      setError("");
      setNotice("");

      const [
        fieldResponse,
        soilResponse,
        cropResponse,
        cropCycleResponse,
      ] = await Promise.all([
        api.get(
          `/fields/${fieldId}`
        ),

        api
          .get(
            `/fields/${fieldId}/soil-tests/latest`
          )
          .catch(() => null),

        api
          .get("/crops")
          .catch((cropError) => {
            console.error(
              "Crop catalog loading error:",
              cropError
            );

            return null;
          }),

        api
          .get(
            `/fields/${fieldId}/crop-cycles`
          )
          .catch((cycleError) => {
            console.error(
              "Crop cycle loading error:",
              cycleError
            );

            return null;
          }),
      ]);

      const loadedField = extractEntity(
        fieldResponse,
        ["field"]
      );

      const latestSoil = soilResponse?.soilTest ?? null;

      const loadedCrops = extractList(
        cropResponse,
        ["crops"]
      );

      const loadedCropCycles =
        extractList(
          cropCycleResponse,
          [
            "cropCycles",
            "cycles",
          ]
        );

      setField(loadedField);
      setSoilTest(latestSoil);
      setCropCatalog(loadedCrops);
      setCropCycles(
        loadedCropCycles
      );

      if (latestSoil) {
        setSoilForm({
          testedAt: latestSoil.testedAt
            ? new Date(
                latestSoil.testedAt
              )
                .toISOString()
                .slice(0, 10)
            : new Date()
                .toISOString()
                .slice(0, 10),

          nitrogen:
            latestSoil.nitrogen ??
            latestSoil.N ??
            "",

          phosphorus:
            latestSoil.phosphorus ??
            latestSoil.P ??
            "",

          potassium:
            latestSoil.potassium ??
            latestSoil.K ??
            "",

          pH:
            latestSoil.pH ??
            latestSoil.ph ??
            "",

          moisture:
            latestSoil.moisture ??
            "",

          source:
            latestSoil.source ||
            "manual",

          notes:
            latestSoil.notes ||
            "",
        });

        setShowSoilForm(false);
      } else {
        setShowSoilForm(true);
      }
    } catch (err) {
      console.error(
        "Field details loading error:",
        err
      );

      setError(
        err.message ||
          t("fieldDetails.loadError")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadField();
    loadWeather();
  }, [fieldId]);

  const getLifecycleCrop = (item) => {
    const recommendationCrop =
      getRecommendationCrop(item);

    const cropId =
      getEntityId(
        recommendationCrop
      );

    const cropName =
      getCropName(
        recommendationCrop
      );

    return (
      cropCatalog.find(
        (crop) =>
          cropId &&
          String(crop?._id) ===
            String(cropId)
      ) ||
      cropCatalog.find(
        (crop) =>
          crop?.name?.toLowerCase() ===
          cropName?.toLowerCase()
      ) ||
      null
    );
  };

  const handleSoilChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setSoilForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCycleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setCycleForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveSoilTest = async (event) => {
    event.preventDefault();

    try {
      setSavingSoil(true);
      setError("");
      setNotice("");

      const payload = {
        testedAt:
          soilForm.testedAt,

        nitrogen: Number(
          soilForm.nitrogen
        ),

        phosphorus: Number(
          soilForm.phosphorus
        ),

        potassium: Number(
          soilForm.potassium
        ),

        pH: Number(
          soilForm.pH
        ),

        moisture:
          soilForm.moisture === ""
            ? undefined
            : Number(
                soilForm.moisture
              ),

        source:
          soilForm.source,

        notes:
          soilForm.notes.trim(),
      };

      const response =
        await api.post(
          `/fields/${fieldId}/soil-tests`,
          payload
        );

      const savedSoil =
        extractEntity(
          response,
          ["soilTest"]
        );

      setSoilTest(
        savedSoil || payload
      );

      setShowSoilForm(false);

      setNotice(
        "Soil test saved successfully."
      );

      setRecommendations([]);
      setRecommendation(null);
      setSelectedCrop(null);
      setCreatedCycle(null);
    } catch (err) {
      console.error(
        "Save soil test error:",
        err
      );

      setError(
        err.message ||
           t("fieldDetails.soilTestSaveError")
      );
    } finally {
      setSavingSoil(false);
    }
  };

  const generateRecommendation =
    async () => {
      if (!soilTest) {
        setError(
          t("fieldDetails.soilTestRequired")
        );
        return;
      }

      try {
        setRecommendationLoading(
          true
        );

        setError("");
        setNotice("");
        setSelectedCrop(null);
        setCreatedCycle(null);

        const response =
          await api.post(
            `/fields/${fieldId}/recommendations`
          );

      
        if (response?.weather) {
          setWeather(
            response.weather
          );
        }

        console.log(
          "RECOMMENDATION API RESPONSE:",
          response
        );

        const savedRecommendation =
          extractEntity(
            response,
            ["recommendation"]
          );

        const predictionResults =
          Array.isArray(
            response?.prediction
              ?.recommendations
          )
            ? response.prediction
                .recommendations
            : [];

        const storedResults =
          Array.isArray(
            savedRecommendation?.results
          )
            ? savedRecommendation.results
            : [];

        let normalizedResults =
          storedResults.length
            ? storedResults
            : predictionResults;

        normalizedResults =
          normalizedResults.map(
            (
              item,
              index
            ) => {
              const predictionItem =
                predictionResults[
                  index
                ];

              return {
                ...item,

                cropId:
                  item?.cropId ||
                  null,

                cropName:
                  item?.cropName ||
                  item?.name ||
                  (
                    typeof item?.crop ===
                    "string"
                      ? item.crop
                      : null
                  ) ||
                  predictionItem?.crop ||
                  "Crop",

                score:
                  item?.score ??
                  predictionItem?.score ??
                  0,
              };
            }
          );

        setRecommendation(
          savedRecommendation
        );

        setRecommendations(
          normalizedResults
        );

        if (
          !normalizedResults.length
        ) {
          setNotice(
            "Recommendation generated, but no ranked crop list was returned."
          );
        }
      } catch (err) {
        console.error(
          "Recommendation error:",
          err
        );

        setError(
          err.message ||t("fieldDetails.recommendationsError")
        );
      } finally {
        setRecommendationLoading(
          false
        );
      }
    };

  const selectCrop = async (
    item
  ) => {
    
    if (currentCropCycle) {
      setError(
        t("fieldDetails.existingCropCycleError", {
          status: String(currentCropCycle.status).toLowerCase(),
        })
      );
      return;
    }

    const lifecycleCrop =
      getLifecycleCrop(item);

    if (
      !lifecycleCrop ||
      !isCropLifecycleReady(
        lifecycleCrop
      )
    ) {
      const crop =
        getRecommendationCrop(item);

      setError(
        t("fieldDetails.incompleteLifecycleData", {
          cropName: getCropName(crop),
        })
      );

      return;
    }

    const recommendationId =
      getEntityId(
        recommendation
      );

    const cropId =
      getEntityId(
        lifecycleCrop
      );

    if (
      !recommendationId ||
      !cropId
    ) {
      setError(
        t("fieldDetails.incompleteCropData")
      );

      return;
    }

    try {
      setSelectingCropId(
        String(cropId)
      );

      setError("");
      setNotice("");

      await api.patch(
        `/recommendations/${recommendationId}/select`,
        {
          cropId,
        }
      );

      setSelectedCrop(
        lifecycleCrop
      );

      setNotice(
        `${getCropName(
          lifecycleCrop
        )} selected for this field.`
      );
    } catch (err) {
      console.error(
        "Select crop error:",
        err
      );

      setError(
        err.message ||
          t("fieldDetails.selectCropError")
      );
    } finally {
      setSelectingCropId("");
    }
  };

  const createCropCycle =
    async (event) => {
      event.preventDefault();

      
      if (currentCropCycle) {
        setError(
          t("fieldDetails.activeCyclePreventsNew", {
            status: String(currentCropCycle.status).toLowerCase(),
          })
        );
        return;
      }

      const recommendationId =
        getEntityId(
          recommendation
        );

      if (!recommendationId) {
        setError(
          t("fieldDetails.recommendationRequired")
        );
        return;
      }

      if (!selectedCrop) {
        setError(
          t("fieldDetails.cropSelectionRequired")
        );
        return;
      }

      const lifecycleCrop =
        getLifecycleCrop(
          selectedCrop
        );

      if (
        !lifecycleCrop ||
        !isCropLifecycleReady(
          lifecycleCrop
        )
      ) {
        setError(
          t("fieldDetails.lifecycleNotConfigured")
        );

        return;
      }

      const cropId =
        getEntityId(
          lifecycleCrop
        );

      if (!cropId) {
        setError(
          t("fieldDetails.selectedCropIncomplete")
        );

        return;
      }

      try {
        setCreatingCycle(
          true
        );

        setError("");
        setNotice("");

        const payload = {
          startDate:
            cycleForm.startDate,

          expectedHarvestDate:
            cycleForm.expectedHarvestDate ||
            undefined,

          cropId,
        };

        const response =
          await api.post(
            `/recommendations/${recommendationId}/crop-cycle`,
            payload
          );

        const cycle =
          extractEntity(
            response,
            ["cropCycle"]
          );

        const savedCycle = cycle || response;

        setCropCycles(
          (previous) => [
            ...previous,
            savedCycle,
          ]
        );

        setCreatedCycle(
          savedCycle
        );

        setNotice(
          "Crop cycle created successfully."
        );
      } catch (err) {
        console.error(
          "Create crop cycle error:",
          err
        );

        setError(
          err.message ||t("fieldDetails.createCropCycleError")
        );
      } finally {
        setCreatingCycle(
          false
        );
      }
    };

  const cropResults = useMemo(() => {
    return recommendations.map(
      (item) => ({
        raw: item,

        crop:
          getRecommendationCrop(
            item
          ),

        lifecycleCrop:
          getLifecycleCrop(
            item
          ),

        score:
          getRecommendationScore(
            item
          ),
      })
    );
  }, [
    recommendations,
    cropCatalog,
  ]);

  const locationText = [
    field?.location?.district,
    field?.location?.state,
  ]
    .filter(Boolean)
    .join(", ");

  const topCrop =
    cropResults[0]?.crop ||
    null;

  const topLifecycleCrop =
    cropResults[0]?.lifecycleCrop ||
    null;

  const topLifecycleReady =
    isCropLifecycleReady(
      topLifecycleCrop
    );

  const selectedCropId =
    getEntityId(
      selectedCrop
    );

  const selectedLifecycleCrop =
    getLifecycleCrop(
      selectedCrop
    );

  const selectedLifecycleReady =
    isCropLifecycleReady(
      selectedLifecycleCrop
    );

  
  const currentCycleStatus =
    currentCropCycle
      ? String(
          currentCropCycle.status
        ).toLowerCase()
      : null;

  const currentCropName =
    currentCycleCrop
      ? getCropName(
          currentCycleCrop
        )
      : null;

  if (loading) {
    return (
      <div className="fd2-page">
        <div className="fd2-loading">

          <div className="fd2-loading-top">
            <div className="fd2-skeleton fd2-back" />

            <div>
              <div className="fd2-skeleton fd2-title" />

              <div className="fd2-skeleton fd2-subtitle" />
            </div>
          </div>

          <div className="fd2-skeleton-grid">
            <div className="fd2-skeleton fd2-stat" />
            <div className="fd2-skeleton fd2-stat" />
            <div className="fd2-skeleton fd2-stat" />
          </div>

          <div className="fd2-skeleton fd2-large" />

        </div>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="fd2-page">
        <div className="fd2-not-found">

          <div className="fd2-not-found-icon">
            <Leaf size={27} />
          </div>

          <h1>
            {t("fieldDetails.fieldNotFound")}
          </h1>

          <p>
            {t("fieldDetails.fieldNotFoundDescription")}
          </p>

          <button
            type="button"
            className="fd2-primary-button"
            onClick={() =>
              navigate("/fields")
            }
          >
            <ArrowLeft size={15} />
            {t("fieldDetails.backToMyFields")}
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="fd2-page">

      {/* HEADER */}

      <header className="fd2-header">

        <button
          type="button"
          className="fd2-back"
          onClick={() =>
            navigate("/fields")
          }
        >
          <ArrowLeft size={16} />
          {t("fieldDetails.backToMyFields")}
        </button>

        <div className="fd2-header-main">

          <div>
            <span className="fd2-eyebrow">
              <Leaf size={13} />
              {t("fieldDetails.fieldManagement")}
            </span>

            <h1>
              {field.name ||
                t("fieldDetails.title")}
            </h1>

            {locationText && (
              <div className="fd2-location">
                <MapPin size={15} />
                {locationText}
              </div>
            )}
          </div>

          <div className="fd2-area-card">

            <Leaf size={21} />

            <div>
              <span>
                {t("fieldDetails.fieldArea")}
              </span>

              <strong>
                {formatValue(
                  field.area
                )}{" "}
                {field.areaUnit ||
                  "acre"}
              </strong>
            </div>

          </div>

        </div>
      </header>

      {/* ALERT */}

      {(error || notice) && (
        <div
          className="fd2-alert"
          style={
            notice && !error
              ? {
                  borderColor:
                    "#d4e5d5",
                  background:
                    "#f5fbf5",
                  color:
                    "#356244",
                }
              : undefined
          }
        >
          <div className="fd2-alert-icon">
            {notice && !error ? (
              <Check size={14} />
            ) : (
              "!"
            )}
          </div>

          <div>
            <strong>
              {notice && !error
                ? t("fieldDetails.success")
                : t("fieldDetails.somethingWentWrong")}
            </strong>

            <p>
              {error || notice}
            </p>
          </div>

          <button
            type="button"
            aria-label={t("fieldDetails.closeMessage")}
            onClick={() => {
              setError("");
              setNotice("");
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* FIELD OVERVIEW */}

      <section className="fd2-field-overview">

        <div className="fd2-overview-card">

          <div className="fd2-overview-icon">
            <Leaf size={18} />
          </div>

          <div>
            <span>{t("fieldDetails.soilType")}</span>

            <strong>
              {field.soilType ||
                t("fieldDetails.notSpecified")}
            </strong>
          </div>

        </div>

        <div className="fd2-overview-card">

          <div className="fd2-overview-icon">
            <MapPin size={18} />
          </div>

          <div>
            <span>{t("fieldDetails.location")}</span>

            <strong>
              {locationText ||
                t("fieldDetails.notSpecified")}
            </strong>
          </div>

        </div>

        <div className="fd2-overview-card">

          <div className="fd2-overview-icon">
            <Sprout size={18} />
          </div>

          <div>
            <span>{t("fieldDetails.currentCrop")}</span>

            <strong>
              {currentCropName ||
                t("fieldDetails.noActiveCrop")}
            </strong>
          </div>

        </div>

      </section>

      {/* CURRENT CROP */}

      <section className="fd2-current-crop-card">

        <div className="fd2-current-crop-heading">

          <div>
            <span className="fd2-section-kicker">
              {t("fieldDetails.currentFieldStatus")}
            </span>

            <h2>
              {currentCropName ||
                t("fieldDetails.noActiveCrop")}
            </h2>
          </div>

          <div className="fd2-current-crop-icon">
            <Sprout size={22} />
          </div>

        </div>

        {currentCropCycle ? (
          <>
            <div className="fd2-current-crop-status-row">

              <span
                className={`fd2-current-crop-badge ${
                  currentCycleStatus ===
                  "active"
                    ? "is-active"
                    : "is-planned"
                }`}
              >
                {currentCycleStatus ===
                "active"
                  ? t("fieldDetails.currentlyGrowing")
                  : t("fieldDetails.plannedCrop")}
              </span>

            </div>

            <div className="fd2-current-crop-details">

              <div>
                <span>
                   {t("fieldDetails.currentStage")}
                </span>

                <strong>
                  {currentCycleStage}
                </strong>
              </div>

              <div>
                <span>
                 {t("fieldDetails.startDate")}
                </span>

                <strong>
                  {formatDate(
                    currentCropCycle.startDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  {t("fieldDetails.expectedHarvest")}
                </span>

                <strong>
                  {formatDate(
                    currentCropCycle.expectedHarvestDate
                  )}
                </strong>
              </div>

            </div>

            <div className="fd2-current-crop-footer">

              <p>
                {currentCycleStatus === "active"
                  ? t("fieldDetails.activeCropMessage")
                  : t("fieldDetails.plannedCropMessage")}
              </p>

              <button
                type="button"
                className="fd2-outline-button"
                onClick={() => {
                  const cycleId =
                    getEntityId(
                      currentCropCycle
                    );

                  if (cycleId) {
                    navigate(
                      `/crop-cycles/${cycleId}`
                    );
                  }
                }}
              >
                {t("fieldDetails.viewCurrentCrop")}
                <ArrowRight size={14} />
              </button>

            </div>
          </>
        ) : (
          <div className="fd2-current-crop-empty">

            <p>
              {t("fieldDetails.noCropGrowingOrPlanned")}
            </p>

            <span>
              {t("fieldDetails.startCropWhenReady")}
            </span>

          </div>
        )}

      </section>

      {/* WORKFLOW */}

      <section className="fd2-workflow">

        <div className="fd2-workflow-heading">

          <div>
            <span className="fd2-section-kicker">
              {t("fieldDetails.fieldWorkflow")}
            </span>

            <h2>
              {t("fieldDetails.workflowTitle")}
            </h2>
          </div>

          <span className="fd2-workflow-count">
            {currentCropCycle
              ? t("fieldDetails.cropCycleInProgress")
              : createdCycle
              ? t("fieldDetails.workflowCompleted")
              : selectedCrop
              ? t("fieldDetails.workflowTwoOfThree")
              : soilTest
              ? t("fieldDetails.workflowOneOfThree")
              : t("fieldDetails.startWithSoilTesting")}
          </span>

        </div>

        <div className="fd2-stepper">

          <div
            className={`fd2-step ${
              soilTest
                ? "is-complete"
                : "is-current"
            }`}
          >
            <div className="fd2-step-circle">
              {soilTest ? (
                <Check size={15} />
              ) : (
                "1"
              )}
            </div>

            <div>
              <strong>
                {t("fieldDetails.soilTest")}
              </strong>

              <span>
               {t("fieldDetails.recordFieldCondition")}
              </span>
            </div>
          </div>

          <ArrowRight
            className="fd2-step-arrow"
            size={16}
          />

          <div
            className={`fd2-step ${
              currentCropCycle ||
              selectedCrop
                ? "is-complete"
                : soilTest
                ? "is-current"
                : ""
            }`}
          >
            <div className="fd2-step-circle">
              {currentCropCycle ||
              selectedCrop ? (
                <Check size={15} />
              ) : (
                "2"
              )}
            </div>

            <div>
              <strong>
                {t("fieldDetails.cropSelection")}
              </strong>

              <span>
                {t("fieldDetails.findSuitableCrops")}
              </span>
            </div>
          </div>

          <ArrowRight
            className="fd2-step-arrow"
            size={16}
          />

          <div
            className={`fd2-step ${
              currentCropCycle ||
              createdCycle
                ? "is-complete"
                : selectedCrop
                ? "is-current"
                : ""
            }`}
          >
            <div className="fd2-step-circle">
              {currentCropCycle ||
              createdCycle ? (
                <Check size={15} />
              ) : (
                "3"
              )}
            </div>

            <div>
              <strong>
                {t("fieldDetails.cropCycle")}
              </strong>

              <span>
               {t("fieldDetails.startCropJourney")}
              </span>
            </div>
          </div>

        </div>

      </section>

      {/* SOIL */}

      <section className="fd2-section">

        <div className="fd2-section-heading">

          <div>
            <span className="fd2-section-kicker">
              {t("fieldDetails.step1")}
            </span>

            <h2>
              {t("fieldDetails.soilProfile")}
            </h2>

            <p>
              {t("fieldDetails.soilProfileDescription")}
            </p>
          </div>

          {soilTest &&
            !showSoilForm && (
              <button
                type="button"
                className="fd2-outline-button"
                onClick={() =>
                  setShowSoilForm(true)
                }
              >
                {t("fieldDetails.updateSoilTest")}
              </button>
            )}

        </div>

        <div className="fd2-soil-grid">

          <div className="fd2-panel fd2-soil-current">

            {soilTest ? (
              <>
                <div className="fd2-panel-top">

                  <div>
                    <span className="fd2-panel-kicker">
                      {t("fieldDetails.latestTest")}
                    </span>

                    <h3>
                      {t("fieldDetails.currentSoilValues")}
                    </h3>
                  </div>

                  <span className="fd2-source">
                    {t(`fieldDetails.sourceTypes.${soilTest.source || "manual"}`)}
                  </span>

                </div>

                <div className="fd2-soil-metrics">

                  <div className="fd2-soil-metric">
                    <span>N</span>

                    <strong>
                      {formatValue(
                        soilTest.nitrogen ??
                          soilTest.N
                      )}
                    </strong>

                    <small>
                      {t("fieldDetails.nitrogen")}
                    </small>
                  </div>

                  <div className="fd2-soil-metric">
                    <span>P</span>

                    <strong>
                      {formatValue(
                        soilTest.phosphorus ??
                          soilTest.P
                      )}
                    </strong>

                    <small>
                      {t("fieldDetails.phosphorus")}
                    </small>
                  </div>

                  <div className="fd2-soil-metric">
                    <span>K</span>

                    <strong>
                      {formatValue(
                        soilTest.potassium ??
                          soilTest.K
                      )}
                    </strong>

                    <small>
                      {t("fieldDetails.potassium")}
                    </small>
                  </div>

                  <div className="fd2-soil-metric">
                    <span>pH</span>

                    <strong>
                      {formatValue(
                        soilTest.pH ??
                          soilTest.ph
                      )}
                    </strong>

                    <small>
                      {t("fieldDetails.acidity")}
                    </small>
                  </div>

                  <div className="fd2-soil-metric">
                    <span>M</span>

                    <strong>
                      {formatValue(
                        soilTest.moisture
                      )}
                    </strong>

                    <small>
                      {t("fieldDetails.moisture")}
                    </small>
                  </div>

                </div>

                <div className="fd2-soil-meta">
                  {t("fieldDetails.testedOn")}{" "}
                  <strong>
                    {formatDate(
                      soilTest.testedAt
                    )}
                  </strong>
                </div>

                {soilTest.notes && (
                  <div className="fd2-soil-note">

                    <span>
                      {t("fieldDetails.notes")}
                    </span>

                    <p>
                      {soilTest.notes}
                    </p>

                  </div>
                )}
              </>
            ) : (
              <div className="fd2-soil-empty">

                <div className="fd2-empty-icon">
                  <FlaskConical size={25} />
                </div>

                <h3>
                  {t("fieldDetails.noSoilTest")}
                </h3>

                <p>
                  {t("fieldDetails.addSoilValuesPrompt")}
                </p>

              </div>
            )}

          </div>

          {showSoilForm && (
            <div className="fd2-panel fd2-soil-form-panel">

              <div className="fd2-panel-top">

                <div>
                  <span className="fd2-panel-kicker">
                     {t("fieldDetails.soilInput")}
                  </span>

                  <h3>
                    {t("fieldDetails.enterTestValues")}
                  </h3>
                </div>

                <div className="fd2-panel-icon">
                  <FlaskConical size={18} />
                </div>

              </div>

              <form
                className="fd2-form"
                onSubmit={saveSoilTest}
              >

                <div className="fd2-field">
                  <label htmlFor="testedAt">
                    {t("fieldDetails.testDate")}
                  </label>

                  <input
                    id="testedAt"
                    name="testedAt"
                    type="date"
                    value={
                      soilForm.testedAt
                    }
                    onChange={
                      handleSoilChange
                    }
                    required
                  />
                </div>

                <div className="fd2-nutrient-grid">

                  <div className="fd2-field">
                    <label htmlFor="nitrogen">
                      {t("fieldDetails.nitrogen")}
                    </label>

                    <input
                      id="nitrogen"
                      name="nitrogen"
                      type="number"
                      min="0"
                      step="any"
                      value={
                        soilForm.nitrogen
                      }
                      onChange={
                        handleSoilChange
                      }
                      placeholder="N"
                      required
                    />
                  </div>

                  <div className="fd2-field">
                    <label htmlFor="phosphorus">
                      {t("fieldDetails.phosphorus")}
                    </label>

                    <input
                      id="phosphorus"
                      name="phosphorus"
                      type="number"
                      min="0"
                      step="any"
                      value={
                        soilForm.phosphorus
                      }
                      onChange={
                        handleSoilChange
                      }
                      placeholder="P"
                      required
                    />
                  </div>

                  <div className="fd2-field">
                    <label htmlFor="potassium">
                      {t("fieldDetails.potassium")}
                    </label>

                    <input
                      id="potassium"
                      name="potassium"
                      type="number"
                      min="0"
                      step="any"
                      value={
                        soilForm.potassium
                      }
                      onChange={
                        handleSoilChange
                      }
                      placeholder="K"
                      required
                    />
                  </div>

                </div>

                <div className="fd2-form-grid">

                  <div className="fd2-field">
                    <label htmlFor="pH">
                      {t("fieldDetails.ph")}
                    </label>

                    <input
                      id="pH"
                      name="pH"
                      type="number"
                      min="0"
                      max="14"
                      step="0.01"
                      value={
                        soilForm.pH
                      }
                      onChange={
                        handleSoilChange
                      }
                      placeholder={t("fieldDetails.phPlaceholder")}
                      required
                    />
                  </div>

                  <div className="fd2-field">
                    <label htmlFor="moisture">
                      {t("fieldDetails.moisture")}{" "}
                      <span>
                        {t("fieldDetails.optional")}
                      </span>
                    </label>

                    <input
                      id="moisture"
                      name="moisture"
                      type="number"
                      min="0"
                      step="any"
                      value={
                        soilForm.moisture
                      }
                      onChange={
                        handleSoilChange
                      }
                      placeholder="%"
                    />
                  </div>

                </div>

                <div className="fd2-field">
                  <label htmlFor="source">
                    {t("fieldDetails.source")}
                  </label>

                  <select
                    id="source"
                    name="source"
                    value={
                      soilForm.source
                    }
                    onChange={
                      handleSoilChange
                    }
                  >
                    <option value="manual">
                      {t("fieldDetails.manualEntry")}
                    </option>

                    <option value="lab">
                      {t("fieldDetails.laboratory")}
                    </option>

                    <option value="sensor">
                      {t("fieldDetails.sensor")}
                    </option>
                  </select>
                </div>

                <div className="fd2-field">
                  <label htmlFor="notes">
                    {t("fieldDetails.notes")}{" "}
                    <span>
                      {t("fieldDetails.optional")}
                    </span>
                  </label>

                  <textarea
                    id="notes"
                    name="notes"
                    value={
                      soilForm.notes
                    }
                    onChange={
                      handleSoilChange
                    }
                    placeholder={t("fieldDetails.soilNotesPlaceholder")}                  />
                </div>

                <button
                  type="submit"
                  className="fd2-primary-button fd2-full-button"
                  disabled={savingSoil}
                >
                  {savingSoil ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="fd2-spin"
                      />
                      {t("fieldDetails.saving")}
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {t("fieldDetails.saveSoilTest")}
                    </>
                  )}
                </button>

              </form>

            </div>
          )}

        </div>
      </section>

      {/* RECOMMENDATION */}

      <section className="fd2-section">

        <div className="fd2-section-heading">

          <div>
            <span className="fd2-section-kicker">
              {t("fieldDetails.step2")}
            </span>

            <h2>
              {t("fieldDetails.cropRecommendation")}
            </h2>

            <p>
              {t("fieldDetails.cropRecommendationDescription")}
            </p>
          </div>

          <button
            type="button"
            className="fd2-primary-button"
            onClick={
              generateRecommendation
            }
            disabled={
              !soilTest ||
              recommendationLoading
            }
          >
            {recommendationLoading ? (
              <>
                <LoaderCircle
                  size={16}
                  className="fd2-spin"
                />
                {t("fieldDetails.analyzing")}
              </>
            ) : (
              <>
                <Sprout size={16} />

                {recommendations.length
                  ? t("fieldDetails.refreshRecommendation")
                  : t("fieldDetails.generateRecommendation")}
              </>
            )}
          </button>

        </div>

        {!soilTest ? (
          <div className="fd2-locked">

            <div className="fd2-locked-icon">
              <FlaskConical size={17} />
            </div>

            <div>
              <strong>
                {t("fieldDetails.soilTestRequiredTitle")}
              </strong>

              <p>
                {t("fieldDetails.soilTestRequiredDescription")}
              </p>
            </div>

          </div>
        ) : (
          <div className="fd2-recommendation">

            <div className="fd2-weather">

              <div className="fd2-panel-top">

                <div>
                  <span className="fd2-panel-kicker">
                    {t("fieldDetails.fieldConditions")}
                  </span>

                  <h3>
                   {t("fieldDetails.currentWeather")}
                  </h3>
                </div>

                <CloudRain size={18} />

              </div>

              <div className="fd2-weather-list">

                <div>
                  <span>
                    <Thermometer size={14} />
                    {t("fieldDetails.temperature")}
                  </span>

                  <strong>
                    {weatherLoading
                      ? t("fieldDetails.loading")
                      : weather?.temperature ??
                        "—"}

                    {!weatherLoading &&
                      weather?.temperature !=
                        null &&
                      "°C"}
                  </strong>
                </div>

                <div>
                  <span>
                    <Droplets size={14} />
                    {t("fieldDetails.humidity")}
                  </span>

                  <strong>
                    {weatherLoading
                      ? t("fieldDetails.loading")
                      : weather?.humidity ??
                        "—"}

                    {!weatherLoading &&
                      weather?.humidity !=
                        null &&
                      "%"}
                  </strong>
                </div>

                <div>
                  <span>
                    <CloudRain size={14} />
                    {t("fieldDetails.rainfall")}
                  </span>

                  <strong>
                    {weatherLoading
                      ? t("fieldDetails.loading")
                      : weather?.rainfall ??
                        "—"}

                    {!weatherLoading &&
                      weather?.rainfall !=
                        null &&
                      " mm"}
                  </strong>
                </div>

              </div>

            </div>

            <div className="fd2-top-pick">

              <span className="fd2-panel-kicker">
                {t("fieldDetails.topMatch")}
              </span>

              <div className="fd2-top-pick-icon">
                <Sprout size={31} />
              </div>

              <h3>
                {topCrop
                  ? getCropName(
                      topCrop
                    )
                  : "—"}
              </h3>

              <p>
                {topCrop
                  ? t("fieldDetails.topMatchDescription")
                  : t("fieldDetails.topMatchEmpty")}
              </p>

              {topCrop && (
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "12px",
                    color: topLifecycleReady
                      ? "#356244"
                      : "#8a5a23",
                    lineHeight: 1.5,
                  }}
                >
                  {topLifecycleReady
                    ? t("fieldDetails.growthStagesDuration", {
                        count: topLifecycleCrop.growthStages.length,
                        min: topLifecycleCrop.durationDays.min,
                        max: topLifecycleCrop.durationDays.max,
                      })
                    : t("fieldDetails.lifecycleUnavailableMessage")}
                </div>
              )}

              {topCrop && (
                <button
                  type="button"
                  className={
                    selectedCropId &&
                    String(
                      selectedCropId
                    ) ===
                      String(
                        getEntityId(
                          topLifecycleCrop ||
                            topCrop
                        )
                      )
                      ? "fd2-selected-button"
                      : "fd2-select-button"
                  }
                  style={{
                    marginTop: "16px",
                  }}
                  onClick={() =>
                    selectCrop(
                      cropResults[0]
                        .raw
                    )
                  }
                  disabled={
                    selectingCropId !== "" ||
                    !topLifecycleReady ||
                    Boolean(
                      currentCropCycle
                    )
                  }
                >
                  {!topLifecycleReady ? (
                    t("fieldDetails.lifecycleUnavailable")
                  ) : currentCropCycle ? (
                    t("fieldDetails.cycleAlreadyExists")
                  ) : selectingCropId &&
                    String(
                      selectingCropId
                    ) ===
                      String(
                        getEntityId(
                          topLifecycleCrop ||
                            topCrop
                        )
                      ) ? (
                    <>
                      <LoaderCircle
                        size={13}
                        className="fd2-spin"
                      />
                      {t("fieldDetails.selecting")}
                    </>
                  ) : selectedCropId &&
                    String(
                      selectedCropId
                    ) ===
                      String(
                        getEntityId(
                          topLifecycleCrop ||
                            topCrop
                        )
                      ) ? (
                    <>
                      <Check size={13} />
                      {t("fieldDetails.selected")}
                    </>
                  ) : (
                    <>
                      {t("fieldDetails.selectCrop")}
                      <ArrowRight
                        size={13}
                      />
                    </>
                  )}
                </button>
              )}

            </div>

            <div className="fd2-results">

              <div className="fd2-results-heading">

                <div>
                  <span className="fd2-panel-kicker">
                    {t("fieldDetails.rankedOptions")}
                  </span>

                  <h3>
                    {t("fieldDetails.recommendedCrops")}
                  </h3>
                </div>

                <span>
                  {cropResults.length
                    ? `${cropResults.length} ${t("fieldDetails.options")}`
                    : t("fieldDetails.noResults")}
                </span>

              </div>

              {cropResults.length ? (
                <div className="fd2-crop-list">

                  {cropResults
                    .slice(0, 5)
                    .map(
                      (
                        item,
                        index
                      ) => {
                        const crop =
                          item.crop;

                        const lifecycleCrop =
                          item.lifecycleCrop;

                        const lifecycleReady =
                          isCropLifecycleReady(
                            lifecycleCrop
                          );

                        const cropId =
                          getEntityId(
                            lifecycleCrop ||
                              crop
                          );

                        const selected =
                          selectedCropId &&
                          String(
                            selectedCropId
                          ) ===
                            String(
                              cropId
                            );

                        return (
                          <div
                            key={
                              cropId ||
                              `${getCropName(
                                crop
                              )}-${index}`
                            }
                            className={`fd2-crop-row ${
                              selected
                                ? "is-selected"
                                : ""
                            }`}
                          >

                            <div className="fd2-rank">
                              {index + 1}
                            </div>

                            <div className="fd2-crop-main">

                              <div className="fd2-crop-title">

                                <strong>
                                  {getCropName(
                                    crop
                                  )}
                                </strong>

                                <span>
                                  {item.score}%
                                </span>

                              </div>

                              <div className="fd2-score-bar">
                                <span
                                  style={{
                                    width: `${item.score}%`,
                                  }}
                                />
                              </div>

                              <div
                                style={{
                                  marginTop: "6px",
                                  fontSize: "11px",
                                  color:
                                    lifecycleReady
                                      ? "#356244"
                                      : "#8a5a23",
                                }}
                              >
                                {lifecycleReady
                                  ? t("fieldDetails.growthStagesDuration", {
                                      count: lifecycleCrop.growthStages.length,
                                      min: lifecycleCrop.durationDays.min,
                                      max: lifecycleCrop.durationDays.max,
                                    })
                                  : t("fieldDetails.lifecycleUnavailable")}
                              </div>

                            </div>

                            <button
                              type="button"
                              className={
                                selected
                                  ? "fd2-selected-button"
                                  : "fd2-select-button"
                              }
                              onClick={() =>
                                selectCrop(
                                  item.raw
                                )
                              }
                              disabled={
                                !lifecycleReady ||
                                Boolean(
                                  currentCropCycle
                                ) ||
                                (
                                  selectingCropId !==
                                    "" &&
                                  String(
                                    selectingCropId
                                  ) !==
                                    String(
                                      cropId
                                    )
                                )
                              }
                            >
                              {!lifecycleReady ? (
                                t("fieldDetails.lifecycleUnavailable")
                              ) : currentCropCycle ? (
                                t("fieldDetails.cycleAlreadyExists")
                              ) : selectingCropId &&
                                String(
                                  selectingCropId
                                ) ===
                                  String(
                                    cropId
                                  ) ? (
                                <LoaderCircle
                                  size={12}
                                  className="fd2-spin"
                                />
                              ) : selected ? (
                                <>
                                  <Check
                                    size={12}
                                  />
                                  {t("fieldDetails.selected")}
                                </>
                              ) : (
                                t("fieldDetails.select")
                              )}
                            </button>

                          </div>
                        );
                      }
                    )}

                </div>
              ) : (
                <div className="fd2-soil-empty">

                  <div className="fd2-empty-icon">
                    <Sprout size={23} />
                  </div>

                  <h3>
                    {t("fieldDetails.noRecommendations")}
                  </h3>

                  <p>
                    {t("fieldDetails.generateRecommendationAfterSoilTest")}
                  </p>

                </div>
              )}

              {recommendations.length > 0 &&
                cropCatalog.length === 0 && (
                  <p className="fd2-score-note">
                    {t("fieldDetails.cropMasterUnavailable")}
                  </p>
                )}

              {cropResults.length > 0 && (
                <p className="fd2-score-note">
                  {t("fieldDetails.modelScoreExplanation")}
                </p>
              )}

            </div>

          </div>
        )}

      </section>

      {/* CROP CYCLE */}

      <section className="fd2-section">

        <div className="fd2-section-heading">

          <div>
            <span className="fd2-section-kicker">
              {t("fieldDetails.step3")}
            </span>

            <h2>
              {t("fieldDetails.startCropCycle")}
            </h2>

            <p>
              {t("fieldDetails.startCropCycleDescription")}
            </p>
          </div>

        </div>

        {currentCropCycle ? (
          <div className="fd2-locked">

            <div className="fd2-locked-icon">
              <Sprout size={17} />
            </div>

            <div>
              <strong>
                {currentCycleStatus === "active"
                ? t("fieldDetails.cropAlreadyGrowing", {
                    cropName: currentCropName || t("fieldDetails.thisCrop"),
                  })
                : t("fieldDetails.cropAlreadyPlanned", {
                    cropName: currentCropName || t("fieldDetails.thisCrop"),
                  })}
              </strong>

              <p>
                {currentCycleStatus === "active"
                ? t("fieldDetails.activeCycleDescription", {
                    stage: t(`cropStages.${currentCycleStage}`, {
                          defaultValue: currentCycleStage,
                        }),
                  })
                : t("fieldDetails.plannedCycleDescription")}
              </p>

              <button
                type="button"
                className="fd2-outline-button"
                style={{
                  marginTop: "12px",
                }}
                onClick={() => {
                  const cycleId =
                    getEntityId(
                      currentCropCycle
                    );

                  if (cycleId) {
                    navigate(
                      `/crop-cycles/${cycleId}`
                    );
                  }
                }}
              >
                {t("fieldDetails.openCurrentCropDashboard")}
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        ) : !selectedCrop ? (
          <div className="fd2-locked">

            <div className="fd2-locked-icon">
              <Sprout size={17} />
            </div>

            <div>
              <strong>
                {t("fieldDetails.selectCropFirst")}
              </strong>

              <p>
                {t("fieldDetails.selectCropFirstDescription")}
              </p>
            </div>

          </div>
        ) : !selectedLifecycleReady ? (
          <div className="fd2-locked">

            <div className="fd2-locked-icon">
              <Sprout size={17} />
            </div>

            <div>
              <strong>
                {t("fieldDetails.lifecycleUnavailable")}
              </strong>

              <p>
                {t("fieldDetails.lifecycleUnavailableDescription")}
              </p>
            </div>

          </div>
        ) : (
          <div className="fd2-cycle-panel">

            <div className="fd2-selected-crop">

              <div className="fd2-selected-icon">
                <Sprout size={22} />
              </div>

              <div>
                <span>
                  {t("fieldDetails.selectedCrop")}
                </span>

                <strong>
                  {getCropName(
                    selectedLifecycleCrop ||
                      selectedCrop
                  )}
                </strong>
              </div>

            </div>

            <form
              className="fd2-cycle-form"
              onSubmit={
                createCropCycle
              }
            >

              <div className="fd2-field">
                <label htmlFor="startDate">
                  {t("fieldDetails.startDateLabel")}
                </label>

                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={
                    cycleForm.startDate
                  }
                  onChange={
                    handleCycleChange
                  }
                  required
                />
              </div>

              <div className="fd2-field">
                <label htmlFor="expectedHarvestDate">
                  {t("fieldDetails.expectedHarvestLabel")}{" "}
                  <span>
                    {t("fieldDetails.optional")}
                  </span>
                </label>

                <input
                  id="expectedHarvestDate"
                  name="expectedHarvestDate"
                  type="date"
                  value={
                    cycleForm.expectedHarvestDate
                  }
                  onChange={
                    handleCycleChange
                  }
                />
              </div>

              <button
                type="submit"
                className="fd2-primary-button"
                disabled={
                  creatingCycle ||
                  !selectedLifecycleReady ||
                  Boolean(
                    currentCropCycle
                  )
                }
              >
                {creatingCycle ? (
                  <>
                    <LoaderCircle
                      size={15}
                      className="fd2-spin"
                    />
                    {t("fieldDetails.creating")}
                  </>
                ) : (
                  <>
                    {t("fieldDetails.startCropCycleButton")}
                    <ArrowRight
                      size={15}
                    />
                  </>
                )}
              </button>

            </form>

          </div>
        )}

      </section>

      {/* CREATED */}

      {createdCycle && (
        <section className="fd2-cycle-created">

          <div className="fd2-success-icon">
            <CheckCircle2 size={25} />
          </div>

          <div className="fd2-cycle-created-content">

            <span className="fd2-section-kicker">
               {t("fieldDetails.cropCycleCreated")}
            </span>

            <h2>
              {t("fieldDetails.cropJourneyStarted")}
            </h2>

            <p>
              {t("fieldDetails.cropJourneyDescription")}
            </p>

            <div className="fd2-cycle-meta">

              <div>
                <span>{t("fieldDetails.cropLabel")}</span>

                <strong>
                  {getCropName(
                    selectedLifecycleCrop ||
                      selectedCrop
                  )}
                </strong>
              </div>

              <div>
                <span>{t("fieldDetails.startDateLabel")}</span>

                <strong>
                  {formatDate(
                    createdCycle?.startDate ||
                      cycleForm.startDate
                  )}
                </strong>
              </div>

              <div>
                <span>{t("fieldDetails.statusLabel")}</span>

                <strong>
                  {t(`cropCycle.status.${createdCycle?.status || "planned"}`)}
                </strong>
              </div>

            </div>

            <button
              type="button"
              className="fd2-primary-button"
              onClick={() => {
                const createdId =
                  getEntityId(
                    createdCycle
                  );

                if (createdId) {
                  navigate(
                    `/crop-cycles/${createdId}`
                  );
                } else {
                  navigate(
                    "/crop-cycles"
                  );
                }
              }}
            >
              {t("fieldDetails.openCropDashboard")}
              <ArrowRight size={16} />
            </button>

          </div>

        </section>
      )}

    </div>
  );
};

export default FieldDetails;
