import mongoose from "mongoose";
import dotenv from "dotenv";

import GovernmentScheme from "../models/GovernmentScheme.js";

dotenv.config();

const governmentSchemes = [
  {
    name: "PM-KISAN",
    slug: "pm-kisan",
    level: "Central",
    state: "All India",
    category: "Income Support",
    department: "Department of Agriculture & Farmers Welfare",

    shortDescription:
      "PM-KISAN provides income support to eligible landholding farmer families through direct benefit transfers.",

    benefits: [
      "Income support of ₹6,000 per year",
      "Paid in three equal installments",
      "Funds are transferred directly to eligible beneficiaries' bank accounts",
    ],

    eligibility: [
      "Eligible landholding farmer families as defined under the PM-KISAN guidelines",
      "The State Government or UT administration identifies eligible beneficiaries",
      "Certain exclusion categories apply",
    ],

    documents: [
      "Aadhaar details",
      "Bank account details",
      "Landholding details",
      "Other information required during registration or verification",
    ],

    applicationSteps: [
      "Open the official PM-KISAN portal",
      "Complete farmer registration",
      "Complete the required identity verification and eKYC",
      "Check beneficiary status through the official portal",
    ],

    officialPortal: "https://pmkisan.gov.in/",
    officialSource: "https://pmkisan.gov.in/",

    tags: [
      "pm-kisan",
      "income",
      "farmer",
      "financial-support",
      "direct-benefit-transfer",
    ],

    aiContext:
      "PM-KISAN is a Central Sector scheme of the Government of India. It provides income support of ₹6,000 per year in three equal installments to eligible landholding farmer families. Eligibility exclusions apply, and beneficiary identification is handled by State Governments and UT administrations.",

    lastVerifiedAt: new Date("2026-09-24"),
    isActive: true,
  },

  {
    name: "Pradhan Mantri Fasal Bima Yojana",
    slug: "pm-fasal-bima-yojana",
    level: "Central",
    state: "All India",
    category: "Crop Insurance",
    department: "Ministry of Agriculture & Farmers Welfare",

    shortDescription:
      "PMFBY provides crop insurance coverage against specified crop losses and supports farmers through an integrated crop-insurance platform.",

    benefits: [
      "Crop insurance coverage for notified crops and risks under the scheme",
      "Online insurance application and policy-status services",
      "Crop-loss reporting and grievance support",
    ],

    eligibility: [
      "Eligibility depends on notified crops, areas, season and scheme conditions",
      "Loanee and non-loanee farmer provisions apply according to PMFBY rules",
      "Farmers must have an insurable interest in the insured crop",
    ],

    documents: [
      "Farmer identity details",
      "Bank account details",
      "Land or cultivation details",
      "Crop and area information",
    ],

    applicationSteps: [
      "Check whether the crop and area are notified under PMFBY",
      "Use the official PMFBY farmer services",
      "Submit the required farmer, crop and bank information",
      "Track application or policy status through the official portal",
    ],

    officialPortal: "https://pmfby.gov.in/",
    officialSource: "https://pmfby.gov.in/",

    tags: [
      "pmfby",
      "crop-insurance",
      "insurance",
      "crop-loss",
      "farmer-protection",
    ],

    aiContext:
      "PMFBY is a Government of India crop-insurance programme. Coverage depends on notified crops, areas, seasons and applicable scheme rules. The official portal provides farmer enrollment, premium-calculation, policy-status and crop-loss/grievance services. AI should not declare a farmer eligible without checking the applicable notification and scheme conditions.",

    lastVerifiedAt: new Date("2026-09-24"),
    isActive: true,
  },

  {
    name: "Kisan Credit Card",
    slug: "kisan-credit-card",
    level: "Central",
    state: "All India",
    category: "Agricultural Credit",
    department: "Ministry of Agriculture & Farmers Welfare",

    shortDescription:
      "The Kisan Credit Card scheme is designed to provide timely agricultural credit for farming operations and eligible allied activities.",

    benefits: [
      "Access to agricultural credit",
      "Support for timely financing of farming operations",
      "Interest-subvention and prompt-repayment provisions may apply under the scheme",
    ],

    eligibility: [
      "Farmers engaged in eligible agricultural activities",
      "Eligibility and credit limits are assessed by the implementing bank",
      "Terms can vary according to the lending institution and applicable guidelines",
    ],

    documents: [
      "Identity proof",
      "Address details",
      "Land or cultivation details, where required",
      "Bank-required documents",
    ],

    applicationSteps: [
      "Approach an eligible bank or lending institution",
      "Submit the KCC application and required documents",
      "The bank assesses eligibility and credit requirements",
      "Complete the bank's verification and sanction process",
    ],

    officialPortal: "https://www.myscheme.gov.in/schemes/kcc",
    officialSource: "https://www.myscheme.gov.in/schemes/kcc",

    tags: [
      "kcc",
      "kisan-credit-card",
      "agricultural-credit",
      "farm-loan",
      "credit",
    ],

    aiContext:
      "The Kisan Credit Card scheme aims to provide adequate and timely credit to farmers for agricultural operations and eligible allied activities. The myScheme listing describes interest-subvention and prompt-repayment provisions and notes that implementing banks have discretion within scheme guidelines. AI should explain that final loan eligibility, amount and terms are determined by the lending institution.",

    lastVerifiedAt: new Date("2026-09-24"),
    isActive: true,
  },

  {
    name: "Soil Health Card",
    slug: "soil-health-card",
    level: "Central",
    state: "All India",
    category: "Soil Health",
    department:
      "Department of Agriculture & Farmers Welfare",

    shortDescription:
      "The Soil Health Card service provides information about soil nutrient status and fertilizer or soil-amendment recommendations.",

    benefits: [
      "Information about soil nutrient status",
      "Soil-based fertilizer recommendations",
      "Recommendations for soil amendments where applicable",
      "Support for improved nutrient management",
    ],

    eligibility: [
      "Farm holdings can be covered through the government soil-testing system",
      "Testing and reporting are implemented through the relevant government agriculture and soil-testing system",
    ],

    documents: [
      "Farmer and plot details",
      "Location and land details",
      "Crop information where required for sample collection",
      "Soil sample information",
    ],

    applicationSteps: [
      "Use the official Soil Health Card system or relevant state process",
      "Provide the required farmer and plot information",
      "Soil sample is collected and tested",
      "Access the resulting soil-health information and recommendations",
    ],

    officialPortal: "https://soilhealth.dac.gov.in/",
    officialSource:
      "https://support.soilhealth.dac.gov.in/kb/faq.php?id=37",

    tags: [
      "soil-health",
      "soil-test",
      "fertilizer",
      "nutrients",
      "soil-management",
    ],

    aiContext:
      "The Soil Health Card scheme provides farmers with soil nutrient status and recommendations on fertilizer dosage and soil amendments. Official material describes soil parameters including pH, electrical conductivity, organic carbon and macro- and micronutrients. AI should use the farmer's actual soil-test data when giving personalized advice and should distinguish scheme information from agronomic recommendations.",

    lastVerifiedAt: new Date("2026-09-24"),
    isActive: true,
  },

  {
    name: "Pradhan Mantri Krishi Sinchayee Yojana",
    slug: "pm-krishi-sinchayee-yojana",
    level: "Central",
    state: "All India",
    category: "Irrigation & Water Management",
    department: "Government of India",

    shortDescription:
      "PMKSY aims to improve access to irrigation, water-use efficiency and adoption of water-saving technologies in agriculture.",

    benefits: [
      "Improved access to irrigation",
      "Promotion of efficient on-farm water use",
      "Support for water-saving and precision-irrigation approaches",
      "Focus on expanding assured irrigation and reducing water wastage",
    ],

    eligibility: [
      "Specific eligibility depends on the component and implementing programme",
      "Implementation and beneficiary conditions can vary by state and component",
    ],

    documents: [
      "Farmer identity details",
      "Land and agricultural details",
      "Documents required by the applicable state or programme component",
    ],

    applicationSteps: [
      "Identify the relevant PMKSY component available in the farmer's area",
      "Check the applicable state agriculture or implementing department",
      "Submit the required application and documents",
      "Follow the implementing authority's verification process",
    ],

    officialPortal: "https://pmksy.gov.in/",
    officialSource: "https://pmksy.gov.in/pdfLinks/FAQ.pdf",

    tags: [
      "pmksy",
      "irrigation",
      "water-management",
      "micro-irrigation",
      "water-efficiency",
    ],

    aiContext:
      "PMKSY is intended to improve access to irrigation and promote efficient water use, including 'Per Drop More Crop' and precision or water-saving technologies. Exact beneficiary eligibility depends on the applicable component and state-level implementation.",

    lastVerifiedAt: new Date("2026-09-24"),
    isActive: true,
  },

  {
    name: "Agriculture Infrastructure Fund",
    slug: "agriculture-infrastructure-fund",
    level: "Central",
    state: "All India",
    category: "Agricultural Infrastructure",
    department:
      "Department of Agriculture & Farmers Welfare",

    shortDescription:
      "The Agriculture Infrastructure Fund provides financing support for eligible agricultural infrastructure and post-harvest management projects.",

    benefits: [
      "Financing support for eligible agricultural infrastructure projects",
      "Support for post-harvest management infrastructure",
      "Support for eligible community farming assets and aggregation infrastructure",
    ],

    eligibility: [
      "Eligibility depends on the AIF guidelines and project category",
      "Eligible applicants can include specified agricultural organizations, FPOs, cooperatives, entrepreneurs and other covered entities",
      "Project and financing conditions apply",
    ],

    documents: [
      "Applicant identity and organization details",
      "Project proposal",
      "Financial and banking documents",
      "Documents required under the applicable AIF guidelines",
    ],

    applicationSteps: [
      "Check whether the proposed project fits an eligible AIF category",
      "Prepare the required project and financial documents",
      "Apply through the applicable financing and AIF process",
      "Complete lender and scheme-level verification",
    ],

    officialPortal: "https://agriinfra.dac.gov.in/",
    officialSource:
      "https://agriinfra.dac.gov.in/Content/DocAttachment/FINALSchemeGuidelinesAIF.pdf",

    tags: [
      "aif",
      "agriculture-infrastructure",
      "post-harvest",
      "storage",
      "farmer-producer-organization",
    ],

    aiContext:
      "The Agriculture Infrastructure Fund is a Central Sector financing facility for eligible post-harvest management infrastructure and community farming assets. Official guidelines cover eligible project categories and financing support. AI should explain that eligibility depends on the applicant type, project category and applicable AIF guidelines and should not promise approval.",

    lastVerifiedAt: new Date("2026-09-24"),
    isActive: true,
  },
];

const seedGovernmentSchemes = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");

    await GovernmentScheme.deleteMany({});

    const insertedSchemes = await GovernmentScheme.insertMany(
      governmentSchemes
    );

    console.log(
      `${insertedSchemes.length} government schemes inserted successfully.`
    );

    await mongoose.disconnect();

    console.log("MongoDB disconnected.");
    process.exit(0);
  } catch (error) {
    console.error("Government scheme seeding failed:");
    console.error(error);

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error("MongoDB disconnect error:", disconnectError);
    }

    process.exit(1);
  }
};

seedGovernmentSchemes();