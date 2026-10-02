import { useEffect, useState } from "react";

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
  "What should I focus on during the current stage?",
  "What problems should I watch for right now?",
  "How can I maintain healthy crop growth?",
  "What should I check in my soil at this stage?",
];



const AIAdvice = () => {
  const [cycleOptions, setCycleOptions] = useState([]);

  const [selectedCycleId, setSelectedCycleId] =
    useState("");

  const [dashboard, setDashboard] =
    useState(null);

  const [question, setQuestion] =
    useState("");

  const [advice, setAdvice] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [dashboardLoading, setDashboardLoading] =
    useState(false);

  const [adviceLoading, setAdviceLoading] =
    useState(false);

  const [error, setError] =
    useState("");



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

      setError(
        err.message ||
          "Unable to load your crop cycles."
      );
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

      setError(
        err.message ||
          "Unable to load crop context."
      );
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

      const data =
        await api.post(
          `/crop-cycles/${selectedCycleId}/advice`,
          {
            question:
              trimmedQuestion,
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
      <div className="ai-advice-page">

        <div className="ai-advice-loading">

          <LoaderCircle
            size={28}
            className="spin"
          />

          <h2>
            Preparing KrishiSphere AI
          </h2>

          <p>
            Loading your fields
            and crop cycles...
          </p>

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

            KRISHISPHERE AI

          </div>

          <h1>
            Ask about your crop
          </h1>

          <p>
            Get context-aware guidance
            using your crop stage,
            soil and current field
            conditions.
          </p>

        </div>

        <div className="ai-advice-header-icon">

          <Sprout size={34} />

        </div>

      </section>

      {error && (
        <div className="ai-advice-error">

          <AlertCircle size={18} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={loadData}
          >
            <RefreshCw size={15} />
            Retry
          </button>

        </div>
      )}


      {!cycleOptions.length && (
        <div className="ai-advice-empty">

          <div className="ai-advice-empty-icon">

            <Leaf size={25} />

          </div>

          <h2>
            No crop cycle available
          </h2>

          <p>
            Create a crop cycle first,
            then you can ask
            KrishiSphere AI questions
            about it.
          </p>

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
                  SELECT CROP CYCLE
                </span>

                <h2>
                  Which crop would you
                  like help with?
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
                      "Crop";

                    const fieldName =
                      cycle?.__field?.name ||
                      "Field";

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

              Loading crop context...

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
                      Crop
                    </span>

                    <strong>
                      {dashboard.crop?.name ||
                        "—"}
                    </strong>

                    <small>
                      {dashboard.currentStage
                        ?.name ||
                        "Current stage unavailable"}
                    </small>

                  </div>

                </div>



                <div className="ai-context-card">

                  <div className="ai-context-icon field">

                    <MapPin size={19} />

                  </div>

                  <div>

                    <span>
                      Field
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
                        "Location unavailable"}
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
                      Weather
                    </span>

                    <strong>
                      {dashboard.weather
                        ?.temperature ??
                        "—"}
                      °C
                    </strong>

                    <small>
                      {dashboard.weather
                        ?.humidity ??
                        "—"}
                      % humidity
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
                      Soil pH
                    </span>

                    <strong>
                      {dashboard.soilTest
                        ?.pH ??
                        "—"}
                    </strong>

                    <small>
                      Moisture{" "}
                      {dashboard.soilTest
                        ?.moisture ??
                        "—"}
                      %
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

                      CONTEXT-AWARE
                      ASSISTANT

                    </div>

                    <h2>
                      What would you
                      like to know?
                    </h2>

                    <p>
                      Your question will
                      be answered using
                      the selected crop
                      cycle's available
                      context.
                    </p>

                  </div>


                  <div className="ai-advice-stage">

                    <Leaf size={16} />

                    <span>
                      {dashboard
                        .currentStage
                        ?.name ||
                        "Current stage"}
                    </span>

                  </div>

                </div>


                <div className="ai-question-suggestions">

                  {suggestedQuestions.map(
                    (item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setQuestion(
                            item
                          )
                        }
                      >
                        {item}
                      </button>
                    )
                  )}

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
                      placeholder="Ask something about your crop..."
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

                        Thinking...
                      </>
                    ) : (
                      <>
                        <Send size={16} />

                        Ask AI
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
                          Based on your crop
                          context
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

                    <span>
                      FIELD CONTEXT
                    </span>

                    <h3>
                      Current conditions
                      used by AI
                    </h3>

                  </div>

                </div>


                <div className="ai-condition-list">


                  <div>

                    <CloudRain
                      size={18}
                    />

                    <span>
                      Rainfall
                    </span>

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

                    <span>
                      Temperature
                    </span>

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

                    <span>
                      Humidity
                    </span>

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

                    <span>
                      Crop stage
                    </span>

                    <strong>
                      {dashboard.currentStage
                        ?.name ||
                        "—"}
                    </strong>

                  </div>

                </div>

              </section>


              <p className="ai-advice-note">
                AI-generated guidance is
                intended to support farm
                decisions. For exact
                fertilizer quantities or
                treatment decisions, use
                validated agronomic
                recommendations and
                product labels.
              </p>

            </>

          ) : (

            <div className="ai-advice-context-empty">

              <Leaf size={22} />

              <p>
                Select a crop cycle to
                load its context.
              </p>

            </div>

          )}

        </>
      )}

    </div>
  );
};

export default AIAdvice;