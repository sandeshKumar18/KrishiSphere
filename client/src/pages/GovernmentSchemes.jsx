
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ExternalLink,
  FileText,
  LoaderCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { api } from "../lib/api";
import "./GovernmentSchemes.css";

const getSchemeCategoryLabel = (category, t) => {
  if (!category) {
    return t("govSchemes.uncategorized");
  }

  const normalized = String(category)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const categoryKeys = {
    insurance: "insurance",
    "crop insurance": "cropInsurance",
    irrigation: "irrigation",
    "irrigation support": "irrigation",
    credit: "credit",
    "kisan credit card": "credit",
    soil: "soil",
    "soil health": "soilHealth",
    "soil health card": "soilHealth",
    subsidy: "subsidy",
    "financial assistance": "financialAssistance",
    agriculture: "agriculture",
      "agricultural infrastructure": "agriculturalInfrastructure",
      "agricultural credit": "agriculturalCredit",
      "income support": "incomeSupport",
      "irrigation & water management": "irrigationWaterManagement",
  };

  const translationKey = categoryKeys[normalized];

  return translationKey
    ? t(`govSchemes.categories.${translationKey}`)
    : category;
};


const getSchemeLevelLabel = (level, t) => {
  if (!level) {
    return t("govSchemes.levelUnavailable");
  }

  const normalized = String(level)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    ["central", "central government", "national", "national level"]
      .includes(normalized)
  ) {
    return t("govSchemes.centralGovernment");
  }

  if (
    ["state", "state government", "state level"]
      .includes(normalized)
  ) {
    return t("govSchemes.stateGovernment");
  }

  return level;
};

const getLocalizedSchemeValue = (
  scheme,
  field,
  isHindi
) => {
  const originalValue = scheme?.[field];

  if (!isHindi) {
    return originalValue;
  }

  const hindiValue = scheme?.[`${field}Hi`];

  if (
    hindiValue === undefined ||
    hindiValue === null
  ) {
    return originalValue;
  }

  if (Array.isArray(hindiValue)) {
    return hindiValue.length
      ? hindiValue
      : originalValue;
  }

  if (
    typeof hindiValue === "string" &&
    !hindiValue.trim()
  ) {
    return originalValue;
  }

  return hindiValue;
};

const GovernmentSchemes = () => {
  const { t, i18n } = useTranslation();
  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] =  useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const isHindi = (
    i18n.resolvedLanguage ||
    i18n.language ||
    "en"
  ).startsWith("hi");

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await api.get(
          "/government-schemes"
        );

        setSchemes(data?.schemes || []);
      } catch (err) {
        console.error(
          "Government schemes error:",
          err
        );

        setError("govSchemes.errorLoad");
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        schemes
          .map((scheme) => scheme.category)
          .filter(Boolean)
      ),
    ];

    return ["All", ...uniqueCategories];
  }, [schemes]);

  const filteredSchemes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return schemes.filter((scheme) => {
      const matchesSearch =
        !query ||
        scheme.name
          ?.toLowerCase()
          .includes(query) ||
        scheme.shortDescription
          ?.toLowerCase()
          .includes(query) ||
        scheme.category
          ?.toLowerCase()
          .includes(query) ||
        scheme.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        );

      const matchesCategory =
        category === "All" ||
        scheme.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [schemes, search, category]);

  const askAI = async (event) => {
    event?.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || aiLoading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: trimmedQuestion,
    };

    const nextMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(nextMessages);
    setQuestion("");
    setAiLoading(true);
    setAiError("");

    try {
      const activeLanguage = i18n.resolvedLanguage || i18n.language || "en";

      const data = await api.post(
        "/government-schemes/ai",
        {
          question: trimmedQuestion,
          conversationHistory: messages,
          language: activeLanguage.startsWith("hi")
            ? "hi"
            : "en",
        }
      );

      const answer =
        data?.answer ||
        "I could not generate an answer right now.";

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (err) {
      console.error(
        "Government scheme AI error:",
        err
      );

      setAiError("error");
    } finally {
      setAiLoading(false);
    }
  };

  const askSuggestedQuestion = (text) => {
    setQuestion(text);

    setTimeout(() => {
      const fakeEvent = {
        preventDefault: () => {},
      };

      askAI(fakeEvent);
    }, 0);
  };

  const clearChat = () => {
    setMessages([]);
    setQuestion("");
    setAiError("");
  };

  if (loading) {
    return (
      <section className="schemes-page">
        <div className="schemes-loading">
          <LoaderCircle
            size={30}
            className="schemes-spinner-icon"
          />

          <p>
            {t("govSchemes.loading")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="schemes-page">


      <div className="schemes-hero">

        <div>
          <span className="schemes-eyebrow">
            {t("govSchemes.farmerSupport")}
          </span>

          <h1>{t("govSchemes.title")}</h1>

          <p>
            {t("govSchemes.description")}
          </p>
        </div>

        <div className="schemes-trust-badge">
          <ShieldCheck size={18} />

          <div>
            <strong>
              {t("govSchemes.officialSources")}
            </strong>

            <span>
              {t("govSchemes.governmentPortals")}
            </span>
          </div>
        </div>

      </div>


      {error && (
        <div className="schemes-error">
         {t(error)}
        </div>
      )}

      <div className="schemes-toolbar">

        <div className="scheme-search">
          <Search size={19} />

          <input
            type="text"
            placeholder={t("govSchemes.searchPlaceholder")}
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          className="scheme-category-filter"
        >
          {categories.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item === "All"
                ? t("govSchemes.allCategories")
                : getSchemeCategoryLabel(item,t)}
            </option>
          ))}
        </select>

      </div>

      <div className="schemes-result-info">
        {t("govSchemes.resultsCount", {
          shown: filteredSchemes.length,
          total: schemes.length,
        })}
      </div>

      {filteredSchemes.length === 0 ? (
        <div className="schemes-empty">

          <FileText size={42} />

          <h3>{t("govSchemes.noSchemesFound")}</h3>

          <p>
            {t("govSchemes.noSchemesDescription")}
          </p>

        </div>
      ) : (
        <div className="schemes-grid">

          {filteredSchemes.map((scheme) => (
            <article
              key={scheme._id}
              className="scheme-card"
            >

              <div className="scheme-card-top">

                <span className="scheme-category">
                  {getSchemeCategoryLabel(scheme.category,t)}
                </span>

                <span className="scheme-level">
                  {getSchemeLevelLabel(scheme.level,t)}
                </span>

              </div>

              <h2>
                {getLocalizedSchemeValue(
                  scheme,
                  "name",
                  isHindi
                )}
              </h2>

              <p className="scheme-description">
                {getLocalizedSchemeValue(
                  scheme,
                  "shortDescription",
                  isHindi
                )}
              </p>

              <div className="scheme-meta">

                <span>
                  📍{" "}
                  {getLocalizedSchemeValue(
                    scheme,
                    "state",
                    isHindi
                  )}
                </span>

                {scheme.department && (
                  <span>
                    {getLocalizedSchemeValue(
                      scheme,
                      "department",
                      isHindi
                    )}
                  </span>
                )}

              </div>

              <div className="scheme-card-actions">

                <button
                  type="button"
                  className="scheme-details-btn"
                  onClick={() =>
                    setSelectedScheme(scheme)
                  }
                >
                   {t("govSchemes.viewDetails")}
                </button>

                <a
                  href={scheme.officialPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="scheme-official-btn"
                >
                  {t("govSchemes.officialPortal")}
                  <ExternalLink size={16} />
                </a>

              </div>

            </article>
          ))}

        </div>
      )}


      <section className="scheme-ai-panel">

        <div className="scheme-ai-header">

          <div className="scheme-ai-brand">

            <div className="scheme-ai-icon">
              <Sparkles size={21} />
            </div>

            <div>
              <span className="scheme-ai-eyebrow">
                KRISHISPHERE AI
              </span>

              <h2>
                {t("govSchemes.aiHeading")}
              </h2>

              <p>
                {t("govSchemes.aiDescription")}
              </p>
            </div>

          </div>

          {messages.length > 0 && (
            <button
              type="button"
              className="scheme-ai-clear"
              onClick={clearChat}
            >
              {t("govSchemes.clearChat")}
            </button>
          )}

        </div>

        {messages.length === 0 && (
          <div className="scheme-ai-suggestions">
            <button
              type="button"
              onClick={() =>
                askSuggestedQuestion(
                  t("govSchemes.questionCropInsurance")
                )
              }
            >
              {t("govSchemes.suggestionCropInsurance")}
            </button>

            <button
              type="button"
              onClick={() =>
                askSuggestedQuestion(
                  t("govSchemes.questionIrrigation")
                )
              }
            >
              {t("govSchemes.suggestionIrrigation")}
            </button>

            <button
              type="button"
              onClick={() =>
                askSuggestedQuestion(
                  t("govSchemes.questionCreditCard")
                )
              }
            >
              {t("govSchemes.suggestionCreditCard")}
            </button>

            <button
              type="button"
              onClick={() =>
                askSuggestedQuestion(
                  t("govSchemes.questionSoilHealth")
                )
              }
            >
              {t("govSchemes.suggestionSoilHealth")}
            </button>
          </div>
        )}
        {messages.length > 0 && (
          <div className="scheme-ai-messages">

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`scheme-ai-message ${
                  message.role === "user"
                    ? "user"
                    : "assistant"
                }`}
              >

                {message.role === "assistant" && (
                  <div className="scheme-ai-message-icon">
                    <Sparkles size={16} />
                  </div>
                )}

                <div className="scheme-ai-message-content">

                  <span className="scheme-ai-message-label">
                    {message.role === "user"
                      ? t("govSchemes.youLabel")
                      : "KrishiSphere AI"}
                  </span>

                  <p>
                    {message.content}
                  </p>

                </div>

              </div>
            ))}

            {aiLoading && (
              <div className="scheme-ai-message assistant">

                <div className="scheme-ai-message-icon">
                  <Sparkles size={16} />
                </div>

                <div className="scheme-ai-message-content">

                  <span className="scheme-ai-message-label">
                    KrishiSphere AI
                  </span>

                  <div className="scheme-ai-thinking">
                    <span />
                    <span />
                    <span />
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {aiError && (
          <div className="scheme-ai-error">
            {t("govSchemes.errorGetAiHelp")}
          </div>
        )}

        <form
          className="scheme-ai-form"
          onSubmit={askAI}
        >

          <div className="scheme-ai-input-wrap">

            <Sparkles size={18} />

            <input
              type="text"
              value={question}
              onChange={(e) =>
                setQuestion(e.target.value)
              }
              placeholder={t("govSchemes.aiPlaceholder")}
              disabled={aiLoading}
            />

          </div>

          <button
            type="submit"
            disabled={
              aiLoading ||
              !question.trim()
            }
            className="scheme-ai-send"
          >
            {aiLoading ? (
              <LoaderCircle
                size={17}
                className="scheme-ai-spin"
              />
            ) : (
              <Send size={17} />
            )}

            <span>
              {aiLoading
                ? t("govSchemes.thinking")
                : t("govSchemes.askAI")}
            </span>
          </button>

        </form>

        <p className="scheme-ai-note">
          {t("govSchemes.aiSafetyNote")}
        </p>

      </section>


      {selectedScheme && (
        <div
          className="scheme-modal-backdrop"
          onClick={() =>
            setSelectedScheme(null)
          }
        >
          <div
            className="scheme-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="scheme-modal-header">

              <div>
                <span className="scheme-category">
                  {getSchemeCategoryLabel(selectedScheme.category, t)}
                </span>

                <h2>
                  {getLocalizedSchemeValue(
                    selectedScheme,
                    "name",
                    isHindi
                  )}
                </h2>
              </div>

              <button
                type="button"
                className="scheme-modal-close"
                onClick={() =>
                  setSelectedScheme(null)
                }
                aria-label={t("govSchemes.closeSchemeDetails")}
              >
                <X size={21} />
              </button>

            </div>

            <p className="scheme-modal-description">
              {getLocalizedSchemeValue(
                selectedScheme,
                "shortDescription",
                isHindi
              )}
            </p>

            <SchemeSection
              title={t("govSchemes.benefits")}
              items={getLocalizedSchemeValue(
                selectedScheme,
                "benefits",
                isHindi
              )}
            />

            <SchemeSection
              title={t("govSchemes.eligibility")}
              items={getLocalizedSchemeValue(
                selectedScheme,
                "eligibility",
                isHindi
              )}
            />

            <SchemeSection
              title={t("govSchemes.requiredDocuments")}
              items={getLocalizedSchemeValue(
                selectedScheme,
                "documents",
                isHindi
              )}
            />

            <SchemeSection
              title={t("govSchemes.howToApply")}
              items={getLocalizedSchemeValue(
                selectedScheme,
                "applicationSteps",
                isHindi
              )}
            />

            <div className="scheme-source-box">

              <div>
                <strong>
                   {t("govSchemes.governmentSource")}
                </strong>

                <span>
                  {t("govSchemes.lastVerified")}:{" "}
                  {selectedScheme.lastVerifiedAt
                    ? new Date(
                        selectedScheme.lastVerifiedAt
                      ).toLocaleDateString(
                        i18n.resolvedLanguage || i18n.language || "en-IN"
                      )
                    : t("govSchemes.notAvailable")}
                </span>
              </div>

              <a
                href={
                  selectedScheme.officialPortal
                }
                target="_blank"
                rel="noopener noreferrer"
                className="scheme-official-btn"
              >
                {t("govSchemes.visitOfficialPortal")}
                <ExternalLink size={16} />
              </a>

            </div>

          </div>
        </div>
      )}

    </section>
  );
};

const SchemeSection = ({
  title,
  items = [],
}) => {
  if (!items.length) return null;

  return (
    <div className="scheme-detail-section">

      <h3>{title}</h3>

      <ul>
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
          >
            {item}
          </li>
        ))}
      </ul>

    </div>
  );
};

export default GovernmentSchemes;
