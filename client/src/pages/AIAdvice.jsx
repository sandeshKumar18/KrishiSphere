import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AlertCircle,
  ChevronDown,
  CloudRain,
  Droplets,
  Leaf,
  LoaderCircle,
  MapPin,
  MessageSquareText,
  RefreshCw,
  Send,
  Sparkles,
  Sprout,
  Thermometer,
} from "lucide-react";

import { api } from "../lib/api";
import "./AIAdvice.css";

const getEntityId = (entity) =>
  entity?._id?.$oid ||
  entity?._id ||
  entity?.id ||
  entity?.cropCycleId ||
  null;


const extractArray = (data, possibleKeys = []) => {
  if (Array.isArray(data)) {
    return data;
  }


  if (data && typeof data === "object") {
    for (const key of possibleKeys) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }

    if (data.data !== undefined) {
      const nestedData = extractArray(
        data.data,
        possibleKeys
      );

      if (nestedData.length > 0) {
        return nestedData;
      }
    }

    if (data.result !== undefined) {
      const nestedResult = extractArray(
        data.result,
        possibleKeys
      );

      if (nestedResult.length > 0) {
        return nestedResult;
      }
    }
  }

  return [];
};


const extractFields = (data) => {
  return extractArray(data, [
    "fields",
    "results",
  ]);
};


const extractCycles = (data) => {
  return extractArray(data, [
    "cropCycles",
    "cycles",
    "results",
  ]);
};


const normalizeDashboard = (data) => {
 
  if (
    data &&
    typeof data === "object" &&
    data.data &&
    typeof data.data === "object" &&
    !Array.isArray(data.data)
  ) {
    if (
      data.data.cropCycle ||
      data.data.crop ||
      data.data.field ||
      data.data.currentStage
    ) {
      return data.data;
    }
  }

  return data;
};


const formatAIResponse = (text) => {
  if (!text) return "";

  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
};



const suggestedQuestions = [
  "ai.suggestedQuestionStage",
  "ai.suggestedQuestionProblems",
  "ai.suggestedQuestionGrowth",
  "ai.suggestedQuestionSoil",
];



const AIAdvice = () => {

  const { t, i18n } = useTranslation();
  const [cycleOptions, setCycleOptions] = useState([]);

  const [selectedCycleId, setSelectedCycleId] = useState("");

  const [dashboard, setDashboard] = useState(null);

  const [question, setQuestion] = useState("");

  const [advice, setAdvice] = useState("");

  const [loading, setLoading] = useState(true);

  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [adviceLoading, setAdviceLoading] = useState(false);

  const [error, setError] = useState("");



  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const fieldData =
        await api.get("/fields");

      const loadedFields =
        extractFields(fieldData);

      // console.log(
      //   "AI Advice - loaded fields:",
      //   loadedFields
      // );
       const results =
        await Promise.all(
          loadedFields.map(
            async (field) => {
              const fieldId =
                getEntityId(field);

              if (!fieldId) {
                return [];
              }

              try {
                const cycleData =
                  await api.get(
                    `/fields/${fieldId}/crop-cycles`
                  );

                const cycles =
                  extractCycles(cycleData);

                return cycles.map(
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
            }
          )
        );


      const allCycles =
        results.flat();

      // console.log(
      //   "AI Advice - crop cycles:",
      //   allCycles
      // );

      setCycleOptions(
        allCycles
      );

      if (allCycles.length > 0) {
        const preferredCycle =
          allCycles.find(
            (cycle) =>
              cycle.status === "active"
          ) ||
          allCycles.find(
            (cycle) =>
              cycle.status === "planned"
          ) ||
          allCycles[0];

        const preferredId =
          getEntityId(
            preferredCycle
          );

        if (preferredId) {
          setSelectedCycleId(
            preferredId
          );
        }
      } else {
        setSelectedCycleId("");
        setDashboard(null);
      }

    } catch (err) {
      console.error(
        "AI Advice load error:",
        err
      );

      setError("ai.errorLoadCycles");
    } finally {
      setLoading(false);
    }
  };


  const loadDashboard = async (
    cycleId
  ) => {
    if (!cycleId) {
      setDashboard(null);
      return;
    }

    try {
      setDashboardLoading(true);
      setError("");
      setAdvice("");

      const data =
        await api.get(
          `/crop-cycles/${cycleId}/dashboard`
        );

      const normalizedDashboard =
        normalizeDashboard(data);

      // console.log(
      //   "AI Advice - dashboard:",
      //   normalizedDashboard
      // );

      setDashboard(
        normalizedDashboard
      );

    } catch (err) {
      console.error(
        "AI Advice dashboard error:",
        err
      );

      setDashboard(null);

      setError("ai.errorLoadContext");
    } finally {
      setDashboardLoading(false);
    }
  };



  useEffect(() => {
    loadData();
  }, []);



  useEffect(() => {
    if (selectedCycleId) {
      loadDashboard(
        selectedCycleId
      );
    } else {
      setDashboard(null);
    }
  }, [selectedCycleId]);


  const askAI = async (event) => {
    event.preventDefault();

    const trimmedQuestion =
      question.trim();

    if (
      !trimmedQuestion ||
      !selectedCycleId
    ) {
      return;
    }

    try {
      setAdviceLoading(true);
      setError("");
      setAdvice("");

      const activeLanguage = i18n.resolvedLanguage || i18n.language || "en";

      const data = await api.post(
        `/crop-cycles/${selectedCycleId}/advice`,
        {
          question: trimmedQuestion,
          language: activeLanguage.startsWith("hi")
            ? "hi"
            : "en",
        }
      );

      setAdvice(
        formatAIResponse(
          data?.advice || ""
        )
      );

    } catch (err) {
      console.error(
        "AI advice error:",
        err
      );

      setError("ai.errorGenerateAdvice");
    } finally {
      setAdviceLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="ai-advice-page">

        <div className="ai-advice-loading">

          <LoaderCircle
            size={28}
            className="spin"
          />

          <h2>{t("ai.preparing")}</h2>

          <p>{t("ai.loadingFieldsAndCycles")}</p>

        </div>

      </div>
    );
  }

  return (
    <div className="ai-advice-page">

      <section className="ai-advice-header">

        <div>

          <div className="ai-advice-eyebrow">

            <Sparkles size={15} />

            {t("ai.title").toUpperCase()}

          </div>

          <h1>{t("ai.askAboutCrop")}</h1>

          <p>{t("ai.pageDescription")}</p>

        </div>

        <div className="ai-advice-header-icon">

          <Sprout size={34} />

        </div>

      </section>

      {error && (
        <div className="ai-advice-error">

          <AlertCircle size={18} />

          <span>
            {error ? t(error) : ""}
          </span>

          <button
            type="button"
            onClick={loadData}
          >
            <RefreshCw size={15} />
            {t("common.retry")}
          </button>

        </div>
      )}


      {!cycleOptions.length && (
        <div className="ai-advice-empty">

          <div className="ai-advice-empty-icon">

            <Leaf size={25} />

          </div>

          <h2>{t("ai.noCropCycleAvailable")}</h2>

          <p>{t("ai.createCropCycleFirst")}</p>

        </div>
      )}

      {cycleOptions.length > 0 && (
        <>

          <section className="ai-advice-selector-card">

            <div className="ai-advice-selector-heading">

              <div className="ai-advice-selector-icon">

                <Leaf size={19} />

              </div>

              <div>

                <span>
                  {t("ai.selectCropCycle")}
                </span>

                <h2>
                  {t("ai.whichCropHelp")}
                </h2>

              </div>

            </div>


            <div className="ai-advice-select-wrap">

              <select
                value={
                  selectedCycleId
                }
                onChange={(event) => {
                  setSelectedCycleId(
                    event.target.value
                  );
                }}
              >

                {cycleOptions.map(
                  (cycle, index) => {

                    const cycleId =
                      getEntityId(
                        cycle
                      );

                    const cycleCrop =
                      cycle?.cropId?.name ||
                      cycle?.crop?.name ||
                      t("ai.cropLabel");

                    const fieldName =
                      cycle?.__field?.name ||
                     t("ai.fieldLabel");

                    return (
                      <option
                        key={
                          cycleId ||
                          `${fieldName}-${index}`
                        }
                        value={
                          cycleId || ""
                        }
                      >
                        {cycleCrop} ·{" "}
                        {fieldName}
                      </option>
                    );
                  }
                )}

              </select>

              <ChevronDown
                size={18}
              />

            </div>

          </section>


          {dashboardLoading ? (

            <div className="ai-advice-context-loading">

              <LoaderCircle
                size={22}
                className="spin"
              />

             {t("ai.loadingCropContext")}

            </div>

          ) : dashboard ? (

            <>

              <section className="ai-context-grid">

                {/* CROP */}

                <div className="ai-context-card">

                  <div className="ai-context-icon crop">

                    <Leaf size={19} />

                  </div>

                  <div>

                    <span>
                      {t("ai.cropLabel")}
                    </span>

                    <strong>
                      {dashboard.crop?.name ||
                        "—"}
                    </strong>

                    <small>
                      {dashboard.currentStage
                        ?.name ||
                        t("ai.currentStageUnavailable")}
                    </small>

                  </div>

                </div>



                <div className="ai-context-card">

                  <div className="ai-context-icon field">

                    <MapPin size={19} />

                  </div>

                  <div>

                    <span>
                      {t("ai.fieldLabel")}
                    </span>

                    <strong>
                      {dashboard.field?.name ||
                        "—"}
                    </strong>

                    <small>
                      {[
                        dashboard.field
                          ?.location
                          ?.district,

                        dashboard.field
                          ?.location
                          ?.state,
                      ]
                        .filter(Boolean)
                        .join(", ") ||
                        t("ai.locationUnavailable")}
                    </small>

                  </div>

                </div>



                <div className="ai-context-card">

                  <div className="ai-context-icon weather">

                    <Thermometer
                      size={19}
                    />

                  </div>

                  <div>

                    <span>
                      {t("ai.weatherLabel")}
                    </span>

                    <strong>
                      {dashboard.weather
                        ?.temperature ??
                        "—"}
                      °C
                    </strong>

                    <small>
                      {dashboard.weather?.humidity ?? "—"}%{" "}
                      {t("ai.humidityLabel")}
                    </small>

                  </div>

                </div>



                <div className="ai-context-card">

                  <div className="ai-context-icon soil">

                    <Droplets
                      size={19}
                    />

                  </div>

                  <div>

                    <span>
                      {t("ai.soilPhLabel")}
                    </span>

                    <strong>
                      {dashboard.soilTest
                        ?.pH ??
                        "—"}
                    </strong>

                    <small>
                      {t("ai.moistureLabel")}{" "}
                      {dashboard.soilTest?.moisture ?? "—"}%
                    </small>

                  </div>

                </div>

              </section>


              <section className="ai-advice-main">

                <div className="ai-advice-main-top">

                  <div>

                    <div className="ai-advice-main-label">
                      <Sparkles
                        size={15}
                      />
                      {t("ai.contextAwareAssistant")}
                    </div>

                    <h2>
                      {t("ai.whatWouldYouLikeToKnow")}
                    </h2>

                    <p>
                      {t("ai.questionContextDescription")}
                    </p>

                  </div>


                  <div className="ai-advice-stage">

                    <Leaf size={16} />

                    <span>
                      {dashboard
                        .currentStage
                        ?.name ||
                        t("ai.currentStage")}
                    </span>

                  </div>

                </div>


                <div className="ai-question-suggestions">
                  {suggestedQuestions.map((key) => {
                    const item = t(key);

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setQuestion(item)}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>


                <form
                  className="ai-advice-form"
                  onSubmit={askAI}
                >

                  <div className="ai-input-wrap">

                    <MessageSquareText
                      size={19}
                    />

                    <input
                      type="text"
                      value={question}
                      onChange={(event) =>
                        setQuestion(
                          event.target.value
                        )
                      }
                      placeholder={t("ai.questionPlaceholder")}
                    />

                  </div>


                  <button
                    type="submit"
                    disabled={
                      adviceLoading ||
                      !question.trim()
                    }
                  >

                    {adviceLoading ? (
                      <>
                        <LoaderCircle
                          size={17}
                          className="spin"
                        />
                        {t("ai.thinking")}
                      </>
                    ) : (
                      <>
                        <Send size={16} />

                        {t("ai.ask")}
                      </>
                    )}

                  </button>

                </form>


                {advice && (
                  <div className="ai-answer">

                    <div className="ai-answer-icon">

                      <Sparkles
                        size={18}
                      />

                    </div>

                    <div className="ai-answer-content">

                      <div className="ai-answer-title">

                        <strong>
                          KrishiSphere AI
                        </strong>

                        <span>
                          {t("ai.basedOnCropContext")}
                        </span>

                      </div>

                      <p>
                        {advice}
                      </p>

                    </div>

                  </div>
                )}

              </section>


              <section className="ai-conditions">

                <div className="ai-conditions-heading">

                  <div>
                    <span>{t("ai.fieldContext")}</span>

                    <h3>{t("ai.currentConditionsUsedByAI")}</h3>

                  </div>

                </div>


                <div className="ai-condition-list">


                  <div>

                    <CloudRain
                      size={18}
                    />

                    <span>{t("ai.rainfallLabel")}</span>

                    <strong>
                      {dashboard.weather
                        ?.rainfall ??
                        "—"}{" "}
                      mm
                    </strong>

                  </div>



                  <div>

                    <Thermometer
                      size={18}
                    />

                     <span>{t("ai.temperatureLabel")}</span>

                    <strong>
                      {dashboard.weather
                        ?.temperature ??
                        "—"}
                      °C
                    </strong>

                  </div>



                  <div>

                    <Droplets
                      size={18}
                    />

                    <span>{t("ai.humidityLabel")}</span>

                    <strong>
                      {dashboard.weather
                        ?.humidity ??
                        "—"}
                      %
                    </strong>

                  </div>



                  <div>

                    <Leaf
                      size={18}
                    />

                     <span>{t("ai.cropStageLabel")}</span>

                    <strong>
                      {dashboard.currentStage
                        ?.name ||
                        "—"}
                    </strong>

                  </div>

                </div>

              </section>


              <p className="ai-advice-note">
                {t("ai.safetyNote")}
              </p>

            </>

          ) : (

            <div className="ai-advice-context-empty">

              <Leaf size={22} />

              <p>{t("ai.selectCycleToLoadContext")}</p>

            </div>

          )}

        </>
      )}

    </div>
  );
};

export default AIAdvice;