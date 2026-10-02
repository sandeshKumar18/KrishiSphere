import "./Guidance.css";

const workflowSteps = [
  {
    number: "01",
    title: "Complete your profile",
    description:
      "Add your basic information so KrishiSphere can keep your farming workspace organized.",
  },
  {
    number: "02",
    title: "Add your field",
    description:
      "Create a field and record the important details about the land you want to manage.",
  },
  {
    number: "03",
    title: "Start a crop cycle",
    description:
      "Choose the crop and create a crop cycle so you can track the crop throughout its journey.",
  },
  {
    number: "04",
    title: "Manage your crop",
    description:
      "Use your crop cycle workspace to keep important farming activities and information together.",
  },
  {
    number: "05",
    title: "Use market & guidance tools",
    description:
      "Check market information, crop information and AI-based advice whenever you need help.",
  },
];

const modules = [
  {
    icon: "⌂",
    title: "Dashboard",
    description:
      "Your main overview of the KrishiSphere workspace.",
  },
  {
    icon: "▣",
    title: "Fields",
    description:
      "Create and manage the fields you want to track.",
  },
  {
    icon: "◈",
    title: "Crop Cycles",
    description:
      "Track the journey of individual crops from planning onward.",
  },
  {
    icon: "◉",
    title: "Market",
    description:
      "View market-related information available in the application.",
  },
  {
    icon: "✦",
    title: "AI Advice",
    description:
      "Use the AI guidance section when you need farming-related assistance.",
  },
  {
    icon: "🌱",
    title: "Crop Catalog",
    description:
      "Explore crop-related information available in KrishiSphere.",
  },
  {
    icon: "▤",
    title: "Government Schemes",
    description:
      "Find information about government farming schemes.",
  },
  {
    icon: "⚙",
    title: "Settings",
    description:
      "Manage your profile and application preferences.",
  },
];

const Guidance = () => {
  return (
    <div className="guidance-page">

      <section className="guidance-hero">
        <div>
          <p className="guidance-eyebrow">
            KRISHISPHERE GUIDE
          </p>

          <h1>
            Everything you need,
            <br />
            explained simply.
          </h1>

          <p className="guidance-hero-description">
            New to KrishiSphere? Start here. This guide
            explains what each section does and how the
            different parts of your farm workflow connect.
          </p>
        </div>

        <div className="guidance-hero-card">
          <div className="guidance-hero-card-icon">
            ?
          </div>

          <strong>First time here?</strong>

          <p>
            Follow the workflow below from top to bottom.
            You do not need to use every section immediately.
          </p>
        </div>
      </section>

      <section className="guidance-section">
        <div className="guidance-section-heading">
          <div>
            <p className="guidance-eyebrow">
              GETTING STARTED
            </p>

            <h2>
              How KrishiSphere works
            </h2>
          </div>

          <p>
            Think of KrishiSphere as a connected farming
            workspace. Each step builds on the previous one.
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

                <h3>{step.title}</h3>

                <p>{step.description}</p>
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
              APP OVERVIEW
            </p>

            <h2>
              What does each section do?
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
                <h3>{module.title}</h3>
                <p>{module.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="guidance-section">
        <div className="guidance-section-heading">
          <div>
            <p className="guidance-eyebrow">
              YOUR FARM JOURNEY
            </p>

            <h2>
              One simple workflow
            </h2>
          </div>
        </div>

        <div className="guidance-flow-diagram">

          <div className="guidance-flow-node">
            <span>1</span>
            <strong>Profile</strong>
            <small>
              Tell us about yourself
            </small>
          </div>

          <div className="guidance-flow-line" />

          <div className="guidance-flow-node">
            <span>2</span>
            <strong>Field</strong>
            <small>
              Add your land
            </small>
          </div>

          <div className="guidance-flow-line" />

          <div className="guidance-flow-node">
            <span>3</span>
            <strong>Crop Cycle</strong>
            <small>
              Start growing
            </small>
          </div>

          <div className="guidance-flow-line" />

          <div className="guidance-flow-node">
            <span>4</span>
            <strong>Manage</strong>
            <small>
              Track progress
            </small>
          </div>

          <div className="guidance-flow-line" />

          <div className="guidance-flow-node">
            <span>5</span>
            <strong>Decide</strong>
            <small>
              Market & advice
            </small>
          </div>

        </div>
      </section>

      <section className="guidance-tips">
        <div className="guidance-tips-icon">
          💡
        </div>

        <div>
          <p className="guidance-eyebrow">
            QUICK TIP
          </p>

          <h2>
            You do not need to complete everything at once.
          </h2>

          <p>
            Start with your profile and first field. As you
            continue using KrishiSphere, add crop cycles and
            explore the other sections when they become useful.
          </p>
        </div>
      </section>

    </div>
  );
};

export default Guidance;