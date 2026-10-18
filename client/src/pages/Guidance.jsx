import "./Guidance.css";
import { useTranslation } from "react-i18next";

const workflowSteps = [
  {
    number: "01",
    title: "guidance.steps.profile.title",
    description: "guidance.steps.profile.description",
  },
  {
    number: "02",
    title: "guidance.steps.field.title",
    description: "guidance.steps.field.description",
  },
  {
    number: "03",
    title: "guidance.steps.cropCycle.title",
    description: "guidance.steps.cropCycle.description",
  },
  {
    number: "04",
    title: "guidance.steps.manageCrop.title",
    description: "guidance.steps.manageCrop.description",
  },
  {
    number: "05",
    title: "guidance.steps.marketGuidance.title",
    description: "guidance.steps.marketGuidance.description",
  },
];

const modules = [
  {
    icon: "⌂",
    title: "guidance.modules.items.dashboard.title",
    description: "guidance.modules.items.dashboard.description",
  },
  {
    icon: "▣",
    title: "guidance.modules.items.fields.title",
    description: "guidance.modules.items.fields.description",
  },
  {
    icon: "◈",
    title: "guidance.modules.items.cropCycles.title",
    description: "guidance.modules.items.cropCycles.description",
  },
  {
    icon: "◉",
    title: "guidance.modules.items.market.title",
    description: "guidance.modules.items.market.description",
  },
  {
    icon: "✦",
    title: "guidance.modules.items.aiAdvice.title",
    description: "guidance.modules.items.aiAdvice.description",
  },
  {
    icon: "🌱",
    title: "guidance.modules.items.cropCatalog.title",
    description: "guidance.modules.items.cropCatalog.description",
  },
  {
    icon: "▤",
    title: "guidance.modules.items.governmentSchemes.title",
    description: "guidance.modules.items.governmentSchemes.description",
  },
  {
    icon: "⚙",
    title: "guidance.modules.items.settings.title",
    description: "guidance.modules.items.settings.description",
  },
];

const Guidance = () => {
  const { t } = useTranslation();
  return (
    <div className="guidance-page">

      <section className="guidance-hero">
        <div>
          <p className="guidance-eyebrow">
            {t("guidance.hero.eyebrow")}
          </p>

          <h1>
            {t("guidance.hero.titleLine1")}
            <br />
            {t("guidance.hero.titleLine2")}
          </h1>

          <p className="guidance-hero-description">
            {t("guidance.hero.description")}
          </p>
        </div>

        <div className="guidance-hero-card">
          <div className="guidance-hero-card-icon">
            ?
          </div>

          <strong>{t("guidance.hero.firstTimeTitle")}</strong>

          <p>
             {t("guidance.hero.firstTimeDescription")}
          </p>
        </div>
      </section>

      <section className="guidance-section">
        <div className="guidance-section-heading">
          <div>
            <p className="guidance-eyebrow">
              {t("guidance.workflow.eyebrow")}
            </p>

            <h2>
              {t("guidance.workflow.title")}
            </h2>
          </div>

          <p>
            {t("guidance.workflow.description")}
          </p>
        </div>

        <div className="guidance-workflow">
          {workflowSteps.map((step, index) => (
            <div
              className="guidance-workflow-item"
              key={step.number}
            >
              <div className="guidance-step-card">
                <span className="guidance-step-number">
                  {step.number}
                </span>

                <h3>{t(step.title)}</h3>

                <p>{t(step.description)}</p>
              </div>

              {index < workflowSteps.length - 1 && (
                <div className="guidance-arrow">
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="guidance-section">
        <div className="guidance-section-heading">
          <div>
            <p className="guidance-eyebrow">
              {t("guidance.modules.eyebrow")}
            </p>

            <h2>
              {t("guidance.modules.title")}
            </h2>
          </div>
        </div>

        <div className="guidance-module-grid">
          {modules.map((module) => (
            <div
              className="guidance-module-card"
              key={module.title}
            >
              <div className="guidance-module-icon">
                {module.icon}
              </div>

              <div>
                <h3>{t(module.title)}</h3>
                <p>{t(module.description)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="guidance-section">
        <div className="guidance-section-heading">
          <div>
            <p className="guidance-eyebrow">
              {t("guidance.journey.eyebrow")}
            </p>

            <h2>
              {t("guidance.journey.title")}
            </h2>
          </div>
        </div>

        <div className="guidance-flow-diagram">

          <div className="guidance-flow-node">
            <span>1</span>
            <strong>{t("guidance.journey.profile")}</strong>
            <small>{t("guidance.journey.profileDescription")}</small>
          </div>

          <div className="guidance-flow-line" />

          <div className="guidance-flow-node">
            <span>2</span>
            <strong>{t("guidance.journey.field")}</strong>
            <small>{t("guidance.journey.fieldDescription")}</small>
          </div>

          <div className="guidance-flow-line" />

          <div className="guidance-flow-node">
            <span>3</span>
            <strong>{t("guidance.journey.cropCycle")}</strong>
            <small>{t("guidance.journey.cropCycleDescription")}</small>
          </div>

          <div className="guidance-flow-line" />

          <div className="guidance-flow-node">
            <span>4</span>
            <strong>{t("guidance.journey.manage")}</strong>
            <small>{t("guidance.journey.manageDescription")}</small>
          </div>

          <div className="guidance-flow-line" />

          <div className="guidance-flow-node">
            <span>5</span>
            <strong>{t("guidance.journey.decide")}</strong>
            <small>{t("guidance.journey.decideDescription")}</small>
          </div>

        </div>
      </section>

      <section className="guidance-tips">
        <div className="guidance-tips-icon">
          💡
        </div>

        <div>
          <p className="guidance-eyebrow">
           {t("guidance.tips.eyebrow")}
          </p>

          <h2>
            {t("guidance.tips.title")}
          </h2>

          <p>
            {t("guidance.tips.description")}
          </p>
        </div>
      </section>

    </div>
  );
};

export default Guidance;