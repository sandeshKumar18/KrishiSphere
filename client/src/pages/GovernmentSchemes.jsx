
import { useEffect, useMemo, useState } from "react";
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

const GovernmentSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] =
    useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

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

        setError(
          err.message ||
            "Unable to load government schemes"
        );
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
      const data = await api.post(
        "/government-schemes/ai",
        {
          question: trimmedQuestion,
          conversationHistory: messages,
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

      setAiError(
        err.message ||
          "Unable to get help from KrishiSphere AI."
      );
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
            Loading government schemes...
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
            FARMER SUPPORT
          </span>

          <h1>Government Schemes</h1>

          <p>
            Explore government schemes and farmer
            support programmes collected from
            official sources.
          </p>
        </div>

        <div className="schemes-trust-badge">
          <ShieldCheck size={18} />

          <div>
            <strong>
              Official Sources
            </strong>

            <span>
              Linked to government portals
            </span>
          </div>
        </div>

      </div>


      {error && (
        <div className="schemes-error">
          {error}
        </div>
      )}

      <div className="schemes-toolbar">

        <div className="scheme-search">
          <Search size={19} />

          <input
            type="text"
            placeholder="Search schemes, categories or benefits..."
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
              {item}
            </option>
          ))}
        </select>

      </div>

      <div className="schemes-result-info">
        Showing{" "}
        <strong>
          {filteredSchemes.length}
        </strong>{" "}
        of{" "}
        <strong>{schemes.length}</strong>{" "}
        schemes
      </div>

      {filteredSchemes.length === 0 ? (
        <div className="schemes-empty">

          <FileText size={42} />

          <h3>No schemes found</h3>

          <p>
            Try a different search term or category.
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
                  {scheme.category}
                </span>

                <span className="scheme-level">
                  {scheme.level}
                </span>

              </div>

              <h2>{scheme.name}</h2>

              <p className="scheme-description">
                {scheme.shortDescription}
              </p>

              <div className="scheme-meta">

                <span>
                  📍 {scheme.state}
                </span>

                {scheme.department && (
                  <span>
                    {scheme.department}
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
                  View Details
                </button>

                <a
                  href={scheme.officialPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="scheme-official-btn"
                >
                  Official Portal
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
                Ask about government schemes
              </h2>

              <p>
                Ask questions normally and continue
                the conversation with follow-up
                questions.
              </p>
            </div>

          </div>

          {messages.length > 0 && (
            <button
              type="button"
              className="scheme-ai-clear"
              onClick={clearChat}
            >
              Clear chat
            </button>
          )}

        </div>

        {messages.length === 0 && (
          <div className="scheme-ai-suggestions">

            <button
              type="button"
              onClick={() =>
                askSuggestedQuestion(
                  "Which scheme is related to crop insurance?"
                )
              }
            >
              Crop insurance
            </button>

            <button
              type="button"
              onClick={() =>
                askSuggestedQuestion(
                  "Which scheme can help with irrigation?"
                )
              }
            >
              Irrigation support
            </button>

            <button
              type="button"
              onClick={() =>
                askSuggestedQuestion(
                  "Tell me about Kisan Credit Card."
                )
              }
            >
              Kisan Credit Card
            </button>

            <button
              type="button"
              onClick={() =>
                askSuggestedQuestion(
                  "What is the Soil Health Card scheme?"
                )
              }
            >
              Soil health
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
                      ? "You"
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
            {aiError}
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
              placeholder="Ask anything about government schemes..."
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
                ? "Thinking..."
                : "Ask AI"}
            </span>
          </button>

        </form>

        <p className="scheme-ai-note">
          KrishiSphere AI explains the scheme information
          available in KrishiSphere. Final eligibility and
          application decisions are made by the relevant
          government authority.
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
                  {selectedScheme.category}
                </span>

                <h2>
                  {selectedScheme.name}
                </h2>
              </div>

              <button
                type="button"
                className="scheme-modal-close"
                onClick={() =>
                  setSelectedScheme(null)
                }
                aria-label="Close scheme details"
              >
                <X size={21} />
              </button>

            </div>

            <p className="scheme-modal-description">
              {selectedScheme.shortDescription}
            </p>

            <SchemeSection
              title="Benefits"
              items={selectedScheme.benefits}
            />

            <SchemeSection
              title="Eligibility"
              items={selectedScheme.eligibility}
            />

            <SchemeSection
              title="Required Documents"
              items={selectedScheme.documents}
            />

            <SchemeSection
              title="How to Apply"
              items={
                selectedScheme.applicationSteps
              }
            />

            <div className="scheme-source-box">

              <div>
                <strong>
                  Government Source
                </strong>

                <span>
                  Last verified:{" "}
                  {selectedScheme.lastVerifiedAt
                    ? new Date(
                        selectedScheme.lastVerifiedAt
                      ).toLocaleDateString(
                        "en-IN"
                      )
                    : "Not available"}
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
                Visit Official Portal
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
