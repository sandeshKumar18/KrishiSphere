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

  const [field, setField] = useState(null);
  const [soilTest, setSoilTest] = useState(null);

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] =
    useState(false);

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
          "Unable to load field details."
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
          "Unable to save soil test."
      );
    } finally {
      setSavingSoil(false);
    }
  };

  const generateRecommendation =
    async () => {
      if (!soilTest) {
        setError(
          "Add a soil test before generating crop recommendations."
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
          err.message ||
            "Unable to generate crop recommendations."
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
        `This field already has a ${String(
          currentCropCycle.status
        ).toLowerCase()} crop cycle. Open the current crop dashboard instead of starting another crop cycle.`
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
        `${getCropName(
          crop
        )} does not have complete lifecycle data. Configure its duration and growth stages in the Crop Master before selecting it.`
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
        "Selected crop data is incomplete. Please generate the recommendation again."
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
          "Unable to select this crop."
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
          `This field already has a ${String(
            currentCropCycle.status
          ).toLowerCase()} crop cycle. Complete or cancel the current cycle before starting another one.`
        );
        return;
      }

      const recommendationId =
        getEntityId(
          recommendation
        );

      if (!recommendationId) {
        setError(
          "Generate a crop recommendation first."
        );
        return;
      }

      if (!selectedCrop) {
        setError(
          "Select a crop before starting a crop cycle."
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
          "This crop cannot start a lifecycle yet. Complete its duration and growth-stage configuration in the Crop Master."
        );

        return;
      }

      const cropId =
        getEntityId(
          lifecycleCrop
        );

      if (!cropId) {
        setError(
          "Selected crop data is incomplete. Please select the crop again."
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
          err.message ||
            "Unable to create crop cycle."
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
            Field not found
          </h1>

          <p>
            We could not find this field or it
            may no longer be available.
          </p>

          <button
            type="button"
            className="fd2-primary-button"
            onClick={() =>
              navigate("/fields")
            }
          >
            <ArrowLeft size={15} />
            Back to My Fields
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
          Back to My Fields
        </button>

        <div className="fd2-header-main">

          <div>
            <span className="fd2-eyebrow">
              <Leaf size={13} />
              FIELD MANAGEMENT
            </span>

            <h1>
              {field.name ||
                "Field Details"}
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
                FIELD AREA
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
                ? "Success"
                : "Something went wrong"}
            </strong>

            <p>
              {error || notice}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close message"
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
            <span>SOIL TYPE</span>

            <strong>
              {field.soilType ||
                "Not specified"}
            </strong>
          </div>

        </div>

        <div className="fd2-overview-card">

          <div className="fd2-overview-icon">
            <MapPin size={18} />
          </div>

          <div>
            <span>LOCATION</span>

            <strong>
              {locationText ||
                "Not specified"}
            </strong>
          </div>

        </div>

        <div className="fd2-overview-card">

          <div className="fd2-overview-icon">
            <Sprout size={18} />
          </div>

          <div>
            <span>CURRENT CROP</span>

            <strong>
              {currentCropName ||
                "No active crop"}
            </strong>
          </div>

        </div>

      </section>

      {/* CURRENT CROP */}

      <section className="fd2-current-crop-card">

        <div className="fd2-current-crop-heading">

          <div>
            <span className="fd2-section-kicker">
              CURRENT FIELD STATUS
            </span>

            <h2>
              {currentCropName ||
                "No active crop"}
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
                  ? "Currently growing"
                  : "Planned crop"}
              </span>

            </div>

            <div className="fd2-current-crop-details">

              <div>
                <span>
                  CURRENT STAGE
                </span>

                <strong>
                  {currentCycleStage}
                </strong>
              </div>

              <div>
                <span>
                  START DATE
                </span>

                <strong>
                  {formatDate(
                    currentCropCycle.startDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  EXPECTED HARVEST
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
                {currentCycleStatus ===
                "active"
                  ? "This field already has a crop growing on it. Start another crop cycle only after the current cycle is completed or cancelled."
                  : "This field already has a planned crop cycle. Complete or cancel the planned cycle before starting another one."}
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
                View Current Crop
                <ArrowRight size={14} />
              </button>

            </div>
          </>
        ) : (
          <div className="fd2-current-crop-empty">

            <p>
              No crop is currently growing or
              planned on this field.
            </p>

            <span>
              You can generate a recommendation
              and start a new crop cycle when
              you're ready.
            </span>

          </div>
        )}

      </section>

      {/* WORKFLOW */}

      <section className="fd2-workflow">

        <div className="fd2-workflow-heading">

          <div>
            <span className="fd2-section-kicker">
              FIELD WORKFLOW
            </span>

            <h2>
              From soil data to crop cycle
            </h2>
          </div>

          <span className="fd2-workflow-count">
            {currentCropCycle
              ? "Crop cycle in progress"
              : createdCycle
              ? "3 of 3 completed"
              : selectedCrop
              ? "2 of 3 completed"
              : soilTest
              ? "1 of 3 completed"
              : "Start with soil testing"}
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
                Soil Test
              </strong>

              <span>
                Record field condition
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
                Crop Selection
              </strong>

              <span>
                Find suitable crops
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
                Crop Cycle
              </strong>

              <span>
                Start crop journey
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
              STEP 1
            </span>

            <h2>
              Soil profile
            </h2>

            <p>
              Keep the latest measured soil
              values connected to this field.
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
                Update Soil Test
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
                      LATEST TEST
                    </span>

                    <h3>
                      Current soil values
                    </h3>
                  </div>

                  <span className="fd2-source">
                    {soilTest.source ||
                      "manual"}
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
                      Nitrogen
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
                      Phosphorus
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
                      Potassium
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
                      Acidity
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
                      Moisture
                    </small>
                  </div>

                </div>

                <div className="fd2-soil-meta">
                  Tested on{" "}
                  <strong>
                    {formatDate(
                      soilTest.testedAt
                    )}
                  </strong>
                </div>

                {soilTest.notes && (
                  <div className="fd2-soil-note">

                    <span>
                      Notes
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
                  No soil test yet
                </h3>

                <p>
                  Add N, P, K, pH and moisture
                  values to unlock crop
                  recommendations.
                </p>

              </div>
            )}

          </div>

          {showSoilForm && (
            <div className="fd2-panel fd2-soil-form-panel">

              <div className="fd2-panel-top">

                <div>
                  <span className="fd2-panel-kicker">
                    SOIL INPUT
                  </span>

                  <h3>
                    Enter test values
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
                    Test date
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
                      Nitrogen
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
                      Phosphorus
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
                      Potassium
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
                      pH
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
                      placeholder="e.g. 6.8"
                      required
                    />
                  </div>

                  <div className="fd2-field">
                    <label htmlFor="moisture">
                      Moisture{" "}
                      <span>
                        optional
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
                    Source
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
                      Manual entry
                    </option>

                    <option value="lab">
                      Laboratory
                    </option>

                    <option value="sensor">
                      Sensor
                    </option>
                  </select>
                </div>

                <div className="fd2-field">
                  <label htmlFor="notes">
                    Notes{" "}
                    <span>
                      optional
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
                    placeholder="Add any useful soil-test notes..."
                  />
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Save Soil Test
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
              STEP 2
            </span>

            <h2>
              Crop recommendation
            </h2>

            <p>
              Use the latest soil profile and
              field context to generate suitable
              crop candidates.
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
                Analyzing...
              </>
            ) : (
              <>
                <Sprout size={16} />

                {recommendations.length
                  ? "Refresh Recommendation"
                  : "Generate Recommendation"}
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
                Soil test required
              </strong>

              <p>
                Add your latest soil values
                before generating crop
                recommendations.
              </p>
            </div>

          </div>
        ) : (
          <div className="fd2-recommendation">

            <div className="fd2-weather">

              <div className="fd2-panel-top">

                <div>
                  <span className="fd2-panel-kicker">
                    FIELD CONDITIONS
                  </span>

                  <h3>
                    Current weather
                  </h3>
                </div>

                <CloudRain size={18} />

              </div>

              <div className="fd2-weather-list">

                <div>
                  <span>
                    <Thermometer size={14} />
                    Temperature
                  </span>

                  <strong>
                    {weatherLoading
                      ? "Loading..."
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
                    Humidity
                  </span>

                  <strong>
                    {weatherLoading
                      ? "Loading..."
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
                    Rainfall
                  </span>

                  <strong>
                    {weatherLoading
                      ? "Loading..."
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
                TOP MATCH
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
                  ? "Highest-ranked crop from the current recommendation."
                  : "Generate a recommendation to see the best-ranked crop."}
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
                    ? `${topLifecycleCrop.growthStages.length} growth stages • ${topLifecycleCrop.durationDays.min}–${topLifecycleCrop.durationDays.max} days`
                    : "Lifecycle data unavailable for this crop."}
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
                    "Lifecycle unavailable"
                  ) : currentCropCycle ? (
                    "Cycle already exists"
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
                      Selecting...
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
                      Selected
                    </>
                  ) : (
                    <>
                      Select Crop
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
                    RANKED OPTIONS
                  </span>

                  <h3>
                    Recommended crops
                  </h3>
                </div>

                <span>
                  {cropResults.length
                    ? `${cropResults.length} options`
                    : "No results"}
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
                                  ? `${lifecycleCrop.growthStages.length} growth stages • ${lifecycleCrop.durationDays.min}–${lifecycleCrop.durationDays.max} days`
                                  : "Lifecycle data unavailable"}
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
                                "Lifecycle unavailable"
                              ) : currentCropCycle ? (
                                "Cycle already exists"
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
                                  Selected
                                </>
                              ) : (
                                "Select"
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
                    No recommendations yet
                  </h3>

                  <p>
                    Generate a recommendation
                    after saving the soil test.
                  </p>

                </div>
              )}

              {recommendations.length > 0 &&
                cropCatalog.length === 0 && (
                  <p className="fd2-score-note">
                    Crop Master data is currently
                    unavailable, so crop lifecycle
                    actions are disabled.
                  </p>
                )}

              {cropResults.length > 0 && (
                <p className="fd2-score-note">
                  Model score is a ranking signal
                  returned by the crop prediction
                  service, not a guaranteed crop
                  success probability.
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
              STEP 3
            </span>

            <h2>
              Start a crop cycle
            </h2>

            <p>
              Once you select a crop, create its
              growing cycle and begin tracking
              stages and tasks.
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
                {currentCycleStatus ===
                "active"
                  ? `${currentCropName || "This crop"} is already growing on this field`
                  : `${currentCropName || "This crop"} is already planned for this field`}
              </strong>

              <p>
                {currentCycleStatus ===
                "active"
                  ? `The field is currently in ${currentCycleStage.toLowerCase()}. Complete or cancel the current crop cycle before starting another one.`
                  : "A planned crop cycle already exists on this field. Complete or cancel it before starting another one."}
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
                Open Current Crop Dashboard
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
                Select a crop first
              </strong>

              <p>
                Choose one of the recommended
                crops above to start a crop cycle.
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
                Lifecycle data unavailable
              </strong>

              <p>
                This crop cannot start a crop cycle
                until its duration and growth stages
                are configured in the Crop Master.
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
                  SELECTED CROP
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
                  Start date
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
                  Expected harvest{" "}
                  <span>
                    optional
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
                    Creating...
                  </>
                ) : (
                  <>
                    Start Crop Cycle
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
              CROP CYCLE CREATED
            </span>

            <h2>
              Your crop journey has started
            </h2>

            <p>
              KrishiSphere created the crop cycle
              and can now track its stages, tasks,
              progress, weather, market context,
              and AI guidance.
            </p>

            <div className="fd2-cycle-meta">

              <div>
                <span>
                  CROP
                </span>

                <strong>
                  {getCropName(
                    selectedLifecycleCrop ||
                      selectedCrop
                  )}
                </strong>
              </div>

              <div>
                <span>
                  START DATE
                </span>

                <strong>
                  {formatDate(
                    createdCycle?.startDate ||
                      cycleForm.startDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  STATUS
                </span>

                <strong>
                  {createdCycle?.status ||
                    "planned"}
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
              Open Crop Dashboard
              <ArrowRight size={16} />
            </button>

          </div>

        </section>
      )}

    </div>
  );
};

export default FieldDetails;
