import mongoose from "mongoose";
import dotenv from "dotenv";

import GovernmentScheme from "../models/GovernmentScheme.js";

dotenv.config();

const governmentSchemes = [
  {
    name: "PM-KISAN",
    nameHi: "पीएम-किसान",
    stateHi: "पूरे भारत में",
    departmentHi: "कृषि एवं किसान कल्याण विभाग",
    shortDescriptionHi:"पीएम-किसान योजना पात्र भूमिधारक किसान परिवारों को प्रत्यक्ष लाभ अंतरण के माध्यम से आय सहायता प्रदान करती है।",
    benefitsHi: [
      "प्रति वर्ष ₹6,000 की आय सहायता",
      "तीन समान किस्तों में भुगतान",
      "धनराशि सीधे पात्र लाभार्थियों के बैंक खातों में भेजी जाती है",
    ],

    eligibilityHi: [
      "पीएम-किसान दिशानिर्देशों के अनुसार पात्र भूमिधारक किसान परिवार",
      "पात्र लाभार्थियों की पहचान राज्य सरकार या केंद्र शासित प्रदेश का प्रशासन करता है",
      "कुछ श्रेणियों के लोगों को योजना से बाहर रखा गया है",
    ],

    documentsHi: [
      "आधार संबंधी जानकारी",
      "बैंक खाते का विवरण",
      "भूमि संबंधी जानकारी",
      "पंजीकरण या सत्यापन के दौरान आवश्यक अन्य जानकारी",
    ],

    applicationStepsHi: [
      "पीएम-किसान के आधिकारिक पोर्टल पर जाएँ",
      "किसान पंजीकरण पूरा करें",
      "आवश्यक पहचान सत्यापन और eKYC पूरा करें",
      "आधिकारिक पोर्टल पर लाभार्थी की स्थिति जाँचें",
    ],
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
    nameHi: "प्रधानमंत्री फसल बीमा योजना",

    stateHi: "पूरे भारत में",

    departmentHi: "कृषि एवं किसान कल्याण मंत्रालय",

    shortDescriptionHi:
      "प्रधानमंत्री फसल बीमा योजना अधिसूचित फसलों को निर्धारित जोखिमों से होने वाले नुकसान के लिए बीमा सुरक्षा प्रदान करती है।",

    benefitsHi: [
      "योजना के अंतर्गत अधिसूचित फसलों और जोखिमों के लिए बीमा सुरक्षा",
      "ऑनलाइन बीमा आवेदन और पॉलिसी की स्थिति जाँचने की सुविधा",
      "फसल नुकसान की सूचना देने और शिकायत दर्ज करने की सुविधा",
    ],

    eligibilityHi: [
      "पात्रता अधिसूचित फसलों, क्षेत्रों, मौसम और योजना की शर्तों पर निर्भर करती है",
      "ऋण लेने वाले और ऋण न लेने वाले किसानों के लिए पीएमएफबीवाई के नियमों के अनुसार प्रावधान लागू होते हैं",
      "किसान का बीमित फसल में बीमा योग्य हित होना आवश्यक है",
    ],

    documentsHi: [
      "किसान की पहचान संबंधी जानकारी",
      "बैंक खाते का विवरण",
      "भूमि या खेती संबंधी जानकारी",
      "फसल और क्षेत्रफल का विवरण",
    ],

    applicationStepsHi: [
      "जाँचें कि आपकी फसल और क्षेत्र पीएमएफबीवाई के अंतर्गत अधिसूचित हैं या नहीं",
      "आधिकारिक पीएमएफबीवाई पोर्टल पर किसान सेवाएँ देखें",
      "आवश्यक किसान, फसल और बैंक संबंधी जानकारी जमा करें",
      "आधिकारिक पोर्टल पर आवेदन या पॉलिसी की स्थिति जाँचें",
    ],
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
    nameHi: "किसान क्रेडिट कार्ड",

    stateHi: "पूरे भारत में",

    departmentHi: "कृषि एवं किसान कल्याण मंत्रालय",

    shortDescriptionHi:
      "किसान क्रेडिट कार्ड योजना का उद्देश्य खेती के कामकाज और पात्र संबद्ध गतिविधियों के लिए समय पर कृषि ऋण उपलब्ध कराना है।",

    benefitsHi: [
      "कृषि कार्यों के लिए ऋण की सुविधा",
      "खेती के काम समय पर करने के लिए वित्तीय सहायता",
      "योजना के अंतर्गत ब्याज सहायता और समय पर ऋण चुकाने से जुड़े प्रावधान लागू हो सकते हैं",
    ],

    eligibilityHi: [
      "पात्र कृषि गतिविधियों में लगे किसान",
      "पात्रता और ऋण सीमा का आकलन संबंधित बैंक करता है",
      "शर्तें ऋण देने वाली संस्था और लागू दिशानिर्देशों के अनुसार अलग-अलग हो सकती हैं",
    ],

    documentsHi: [
      "पहचान का प्रमाण",
      "पते का विवरण",
      "जहाँ आवश्यक हो, भूमि या खेती संबंधी जानकारी",
      "बैंक द्वारा माँगे गए दस्तावेज़",
    ],

    applicationStepsHi: [
      "किसी पात्र बैंक या ऋण देने वाली संस्था से संपर्क करें",
      "किसान क्रेडिट कार्ड का आवेदन और आवश्यक दस्तावेज़ जमा करें",
      "बैंक पात्रता और ऋण की आवश्यकताओं का आकलन करेगा",
      "बैंक की जाँच और ऋण स्वीकृति की प्रक्रिया पूरी करें",
    ],
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
    nameHi: "मृदा स्वास्थ्य कार्ड",

    stateHi: "पूरे भारत में",

    departmentHi: "कृषि एवं किसान कल्याण विभाग",

    shortDescriptionHi:
      "मृदा स्वास्थ्य कार्ड सेवा मिट्टी में पोषक तत्वों की स्थिति की जानकारी और उर्वरक या मिट्टी सुधार के लिए सुझाव प्रदान करती है।",

    benefitsHi: [
      "मिट्टी में पोषक तत्वों की स्थिति की जानकारी",
      "मिट्टी के अनुसार उर्वरक संबंधी सुझाव",
      "जहाँ लागू हो, मिट्टी में सुधार के लिए सुझाव",
      "पोषक तत्वों के बेहतर प्रबंधन में सहायता",
    ],

    eligibilityHi: [
      "सरकारी मिट्टी-जाँच प्रणाली के माध्यम से खेतों को इस सेवा के अंतर्गत शामिल किया जा सकता है",
      "मिट्टी की जाँच और रिपोर्ट संबंधित सरकारी कृषि तथा मिट्टी-जाँच प्रणाली के माध्यम से की जाती है",
    ],

    documentsHi: [
      "किसान और खेत के भूखंड का विवरण",
      "स्थान और भूमि संबंधी जानकारी",
      "नमूना लेने के लिए आवश्यक होने पर फसल की जानकारी",
      "मिट्टी के नमूने से संबंधित जानकारी",
    ],

    applicationStepsHi: [
      "आधिकारिक मृदा स्वास्थ्य कार्ड प्रणाली या संबंधित राज्य की प्रक्रिया का उपयोग करें",
      "आवश्यक किसान और खेत संबंधी जानकारी दें",
      "मिट्टी का नमूना लेकर उसकी जाँच की जाती है",
      "मिट्टी के स्वास्थ्य की रिपोर्ट और उसमें दिए गए सुझाव प्राप्त करें",
    ],
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
    nameHi: "प्रधानमंत्री कृषि सिंचाई योजना",

    stateHi: "पूरे भारत में",

    departmentHi: "भारत सरकार",

    shortDescriptionHi:
      "प्रधानमंत्री कृषि सिंचाई योजना का उद्देश्य सिंचाई की सुविधा बेहतर बनाना, पानी के कुशल उपयोग को बढ़ावा देना और खेती में पानी बचाने वाली तकनीकों को अपनाने में सहायता करना है।",

    benefitsHi: [
      "सिंचाई की सुविधा बेहतर बनाने में सहायता",
      "खेत में पानी के कुशल उपयोग को बढ़ावा",
      "पानी बचाने वाली और आधुनिक सिंचाई तकनीकों को अपनाने में सहायता",
      "सिंचाई की उपलब्धता बढ़ाने और पानी की बर्बादी कम करने पर ध्यान",
    ],

    eligibilityHi: [
      "पात्रता संबंधित योजना घटक और लागू कार्यक्रम पर निर्भर करती है",
      "कार्यान्वयन और लाभार्थियों की शर्तें राज्य तथा योजना घटक के अनुसार अलग-अलग हो सकती हैं",
    ],

    documentsHi: [
      "किसान की पहचान संबंधी जानकारी",
      "भूमि और कृषि संबंधी विवरण",
      "लागू राज्य या योजना घटक के अंतर्गत आवश्यक दस्तावेज़",
    ],

    applicationStepsHi: [
      "अपने क्षेत्र में उपलब्ध प्रधानमंत्री कृषि सिंचाई योजना के संबंधित घटक की पहचान करें",
      "संबंधित राज्य कृषि विभाग या कार्यान्वयन विभाग से जानकारी प्राप्त करें",
      "आवश्यक आवेदन और दस्तावेज़ जमा करें",
      "संबंधित प्राधिकरण की सत्यापन प्रक्रिया पूरी करें",
    ],
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
    nameHi: "कृषि अवसंरचना कोष",

    stateHi: "पूरे भारत में",

    departmentHi: "कृषि एवं किसान कल्याण विभाग",

    shortDescriptionHi:
      "कृषि अवसंरचना कोष पात्र कृषि अवसंरचना और फसल कटाई के बाद प्रबंधन से जुड़ी परियोजनाओं के लिए वित्तीय सहायता प्रदान करता है।",

    benefitsHi: [
      "पात्र कृषि अवसंरचना परियोजनाओं के लिए वित्तीय सहायता",
      "फसल कटाई के बाद प्रबंधन से जुड़ी अवसंरचना के लिए सहायता",
      "पात्र सामुदायिक कृषि परिसंपत्तियों और कृषि उत्पाद एकत्रीकरण से जुड़ी अवसंरचना के लिए सहायता",
    ],

    eligibilityHi: [
      "पात्रता कृषि अवसंरचना कोष के दिशानिर्देशों और परियोजना की श्रेणी पर निर्भर करती है",
      "पात्र आवेदकों में दिशानिर्देशों के अनुसार कुछ कृषि संगठन, किसान उत्पादक संगठन (FPO), सहकारी संस्थाएँ, उद्यमी और अन्य निर्धारित संस्थाएँ शामिल हो सकती हैं",
      "परियोजना और वित्तपोषण से संबंधित शर्तें लागू होती हैं",
    ],

    documentsHi: [
      "आवेदक की पहचान और संगठन का विवरण",
      "परियोजना का प्रस्ताव",
      "वित्तीय और बैंक संबंधी दस्तावेज़",
      "लागू कृषि अवसंरचना कोष दिशानिर्देशों के अंतर्गत आवश्यक दस्तावेज़",
    ],

    applicationStepsHi: [
      "जाँचें कि प्रस्तावित परियोजना कृषि अवसंरचना कोष की पात्र श्रेणी में आती है या नहीं",
      "आवश्यक परियोजना और वित्तीय दस्तावेज़ तैयार करें",
      "लागू वित्तपोषण और कृषि अवसंरचना कोष प्रक्रिया के माध्यम से आवेदन करें",
      "ऋणदाता और योजना से संबंधित सत्यापन प्रक्रिया पूरी करें",
    ],
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

    const operations = governmentSchemes.map((scheme) => ({
      updateOne: {
        filter: {
          slug: scheme.slug,
        },
        update: {
          $set: scheme,
        },
        upsert: true,
      },
    }));

    const result = await GovernmentScheme.bulkWrite(
      operations
    );

    console.log("Government schemes synchronized successfully.");
    console.log(`New schemes inserted: ${result.upsertedCount}`);
    console.log(`Existing schemes updated: ${result.modifiedCount}`);
    console.log(`Existing schemes matched: ${result.matchedCount}`);
  } catch (error) {
    console.error("Government scheme synchronization failed:");
    console.error(error);

    process.exitCode = 1;
  } finally {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log("MongoDB disconnected.");
      }
    } catch (disconnectError) {
      console.error("MongoDB disconnect error:", disconnectError);
      process.exitCode = 1;
    }
  }
};

seedGovernmentSchemes();