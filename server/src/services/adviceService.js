
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    retryOptions: {
      attempts: 1,
    },
  },
});

const primaryModel =
  process.env.GEMINI_MODEL || "gemini-3.6-flash";

const fallbackModels = [
  primaryModel,
  "gemini-3.5-flash-lite",
];



const CROP_SYSTEM_INSTRUCTION = `
You are the agricultural guidance assistant for KrishiSphere.

Your job is to provide clear, practical, farmer-friendly guidance based on the supplied farm context.

IMPORTANT RULES:
- Use the supplied farm context as your primary source.
- Do not invent soil measurements, weather values, crop stages, farm conditions, or other farm facts.
- Do not fabricate fertilizer, pesticide, irrigation, or chemical doses.
- Do not give unsupported numeric thresholds or measurements.
- Do not make a definitive disease diagnosis from insufficient information.
- Clearly distinguish farm-specific facts from general agricultural guidance.
- When important information is missing, clearly say what is missing.
- Do not use tables.
- Do not use horizontal separators such as "---".
- Keep the response concise and practical.
- Avoid repeating the farm context unnecessarily.

ALWAYS use exactly this structure:

Summary:
2 to 3 short sentences explaining the current situation and the main point.

What to do now:
- Give 3 to 5 practical actions.
- Keep each action short and clear.

What to monitor:
- Give 2 to 4 important things the farmer should observe or check.

When to take action:
- Explain the conditions or observations that should trigger the next action.
- Do not invent unsupported numeric thresholds.

Important note:
- Mention limitations, missing information, or when local agricultural verification is appropriate.

Use plain language suitable for a farmer.
`;

/* gov. Scheme */

const SCHEME_SYSTEM_INSTRUCTION = `
You are the Government Scheme assistant for KrishiSphere.

Your job is to help farmers understand government schemes using the supplied
scheme information from KrishiSphere.

IMPORTANT RULES:

- Use the supplied scheme information as your primary source.
- Do not invent scheme names, benefits, eligibility conditions, documents,
  deadlines, subsidy amounts, application rules, or government policies.
- Do not claim that a farmer is definitely eligible.
- Explain that final eligibility is determined by the relevant government
  department, authority, bank, or implementing agency where appropriate.
- When information is missing from the supplied scheme context, clearly say
  that it is not available in the current KrishiSphere information.
- Prefer the official portal/source supplied in the context when directing
  the farmer to apply or verify information.
- Do not present general AI knowledge as though it came from the government.
- Do not use tables.
- Do not use horizontal separators such as "---".
- Use simple, farmer-friendly language.
- Keep normal conversations natural and concise.

The farmer may ask:
- What is this scheme?
- What are its benefits?
- Who can apply?
- What documents are needed?
- How do I apply?
- Which schemes are related to insurance, irrigation, credit, soil, etc.?
- Compare two schemes.
- Which scheme may be relevant to my situation?
- What is the official website?
- Follow-up questions about a previous answer.

When comparing schemes, describe the differences without declaring an
overall "best" scheme.

When discussing eligibility:
- Explain the relevant conditions from the supplied scheme data.
- Use "may be relevant" or "may be eligible" when appropriate.
- Do not make a final eligibility decision.

When the user asks a question that is unrelated to government schemes,
politely explain that this assistant is focused on government agricultural
schemes and farmer support programmes.

For every useful answer, include relevant scheme names and official portal
links when those links are available in the supplied context.
`;

/* gemini */

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  const message = String(error?.message || error);

  return (
    message.includes('"code":503') ||
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.includes("high demand")
  );
};

const runGemini = async (
  systemInstruction,
  input
) => {
  let lastError;

  for (const model of fallbackModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const interaction = await ai.interactions.create({
          model,
          system_instruction: systemInstruction,
          input,
        });

        return interaction.output_text;
      } catch (error) {
        lastError = error;

        if (!isRetryableError(error)) {
          throw error;
        }

        await sleep(2000 * 2 ** attempt);
      }
    }
  }

  throw new Error(
    `Gemini advice service unavailable after retries: ${
      lastError?.message || lastError
    }`
  );
};


export const generateCropAdvice = async (
  context,
  question
) => {
  const input = `
FARM CONTEXT:
${JSON.stringify(context, null, 2)}

FARMER QUESTION:
${question}

Answer the farmer using the exact structure required by the system instruction:

Summary:
...

What to do now:
- ...
- ...
- ...

What to monitor:
- ...
- ...

When to take action:
- ...

Important note:
- ...

Use only information supported by the supplied farm context or clearly identified general guidance.
Do not invent numeric values, doses, measurements, or farm conditions.
`;

  return runGemini(
    CROP_SYSTEM_INSTRUCTION,
    input
  );
};


export const generateSchemeAdvice = async (
  schemes,
  question,
  conversationHistory = []
) => {
  const historyText = conversationHistory.length
    ? conversationHistory
        .map((message) => {
          const role =
            message.role === "assistant"
              ? "KRISHISPHERE AI"
              : "FARMER";

          return `${role}: ${message.content}`;
        })
        .join("\n")
    : "No previous conversation.";

  const schemeContext = schemes.map((scheme) => ({
    name: scheme.name,
    slug: scheme.slug,
    level: scheme.level,
    state: scheme.state,
    category: scheme.category,
    department: scheme.department,
    shortDescription: scheme.shortDescription,
    benefits: scheme.benefits,
    eligibility: scheme.eligibility,
    documents: scheme.documents,
    applicationSteps: scheme.applicationSteps,
    officialPortal: scheme.officialPortal,
    officialSource: scheme.officialSource,
    tags: scheme.tags,
    lastVerifiedAt: scheme.lastVerifiedAt,
  }));

  const input = `
GOVERNMENT SCHEME CONTEXT:
${JSON.stringify(schemeContext, null, 2)}

PREVIOUS CONVERSATION:
${historyText}

CURRENT FARMER QUESTION:
${question}

Answer naturally as a normal conversation.

Use the supplied scheme context as the primary source.

When the question refers to a specific scheme, use the relevant scheme
information.

When the question asks which scheme is relevant, identify the relevant
scheme(s) and explain why based on the stored information.

When comparing schemes, explain their differences without declaring one
scheme as universally best.

When an official portal is available, include it in the answer.

If the supplied information is insufficient, say so clearly instead of
inventing an answer.

Do not claim that the farmer is definitely eligible.
`;

  return runGemini(
    SCHEME_SYSTEM_INSTRUCTION,
    input
  );
};
