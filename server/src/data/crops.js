const createStages = (durationMax, type = "annual") => {
  const templates = {
    annual: [
      [
        "Establishment",
        0,
        0.15,
        "Germination, emergence, or initial field establishment.",
      ],
      [
        "Vegetative Growth",
        0.15,
        0.40,
        "Active vegetative growth and canopy development.",
      ],
      [
        "Flowering and Reproductive Development",
        0.40,
        0.65,
        "Flowering, pollination, or reproductive development.",
      ],
      [
        "Yield Development",
        0.65,
        0.85,
        "Development of grain, pod, fruit, bulb, tuber, or other harvestable product.",
      ],
      [
        "Maturity and Harvest",
        0.85,
        1.00,
        "Crop reaches harvest maturity and enters the harvest window.",
      ],
    ],

    vegetable: [
      [
        "Establishment",
        0,
        0.15,
        "Germination, transplanting, and early establishment.",
      ],
      [
        "Vegetative Growth",
        0.15,
        0.40,
        "Leaf, stem, and canopy development.",
      ],
      [
        "Flowering and Fruit Development",
        0.40,
        0.65,
        "Flowering and development of the harvestable crop.",
      ],
      [
        "Yield Development",
        0.65,
        0.85,
        "Continued development toward marketable maturity.",
      ],
      [
        "Maturity and Harvest",
        0.85,
        1.00,
        "Harvest-ready stage and harvest window.",
      ],
    ],

    root: [
      [
        "Establishment",
        0,
        0.15,
        "Germination and early crop establishment.",
      ],
      [
        "Vegetative Growth",
        0.15,
        0.45,
        "Leaf and root-system development.",
      ],
      [
        "Root or Tuber Development",
        0.45,
        0.75,
        "Bulking and development of the underground harvestable portion.",
      ],
      [
        "Maturation",
        0.75,
        0.90,
        "Crop approaches harvest maturity.",
      ],
      [
        "Harvest",
        0.90,
        1.00,
        "Harvest window for the mature crop.",
      ],
    ],

    fruit: [
      [
        "Establishment",
        0,
        0.15,
        "Plant establishment and early root and shoot development.",
      ],
      [
        "Vegetative Growth",
        0.15,
        0.40,
        "Canopy and structural development.",
      ],
      [
        "Flowering",
        0.40,
        0.60,
        "Flower initiation and flowering development.",
      ],
      [
        "Fruit Set and Development",
        0.60,
        0.80,
        "Fruit set, enlargement, and crop development.",
      ],
      [
        "Maturation",
        0.80,
        0.93,
        "Fruit maturation toward harvest readiness.",
      ],
      [
        "Harvest and Production",
        0.93,
        1.00,
        "Harvest window and continued productive management where applicable.",
      ],
    ],

    perennial: [
      [
        "Establishment",
        0,
        0.15,
        "Initial establishment after planting.",
      ],
      [
        "Vegetative Development",
        0.15,
        0.40,
        "Root, stem, and canopy development.",
      ],
      [
        "Flowering and Reproductive Development",
        0.40,
        0.60,
        "Development toward flowering and reproductive activity.",
      ],
      [
        "Fruit or Seed Development",
        0.60,
        0.78,
        "Development of the harvestable reproductive product.",
      ],
      [
        "Maturation",
        0.78,
        0.92,
        "Maturation toward harvest readiness.",
      ],
      [
        "Harvest and Productive Period",
        0.92,
        1.00,
        "Harvest or productive period for the established crop.",
      ],
    ],
  };

  const selected =
    templates[type] || templates.annual;

  return selected.map(
    (
      [name, startRatio, endRatio, description],
      index
    ) => {
      const startDay =
        index === 0
          ? 0
          : Math.floor(
              durationMax * startRatio
            ) + 1;

      const endDay =
        index === selected.length - 1
          ? durationMax
          : Math.floor(
              durationMax * endRatio
            );

      return {
        name,
        order: index + 1,
        startDay,
        endDay,
        description,
      };
    }
  );
};

const createCrop = ({
  name,
  scientificName,
  description,
  minDays,
  maxDays,
  seasons,
  type = "annual",
}) => ({
  name,

  scientificName,

  description:
    description ||
    `${name} crop lifecycle configuration for farm planning and progress tracking.`,

  durationDays: {
    min: minDays,
    max: maxDays,
  },

  seasons,

  nutrientRequirements: {},

  environmentalRequirements: {},

  growthStages: createStages(
    maxDays,
    type
  ),
});

const crops = [
  createCrop({
    name: "Apple",
    scientificName: "Malus domestica",
    minDays: 1095,
    maxDays: 1825,
    seasons: ["Spring", "Summer", "Autumn"],
    type: "fruit",
  }),

  createCrop({
    name: "Banana",
    scientificName: "Musa spp.",
    minDays: 270,
    maxDays: 450,
    seasons: ["Summer", "Monsoon"],
    type: "fruit",
  }),

  createCrop({
    name: "Barley (Jau)",
    scientificName: "Hordeum vulgare",
    minDays: 120,
    maxDays: 180,
    seasons: ["Winter"],
    type: "annual",
  }),

  createCrop({
    name: "Bitter Gourd (Karela)",
    scientificName: "Momordica charantia",
    minDays: 90,
    maxDays: 150,
    seasons: ["Summer", "Monsoon"],
    type: "vegetable",
  }),

  createCrop({
    name: "Black Gram (Urad)",
    scientificName: "Vigna mungo",
    minDays: 70,
    maxDays: 120,
    seasons: ["Summer", "Monsoon"],
    type: "annual",
  }),

  createCrop({
    name: "Black Pepper (Kali Mirch)",
    scientificName: "Piper nigrum",
    minDays: 730,
    maxDays: 1460,
    seasons: ["Monsoon", "Autumn"],
    type: "perennial",
  }),

  createCrop({
    name: "Bottle Gourd (Lauki)",
    scientificName: "Lagenaria siceraria",
    minDays: 90,
    maxDays: 150,
    seasons: ["Summer", "Monsoon"],
    type: "vegetable",
  }),

  createCrop({
    name: "Brinjal (Eggplant/Baingan)",
    scientificName: "Solanum melongena",
    minDays: 120,
    maxDays: 180,
    seasons: ["Summer", "Monsoon", "Winter"],
    type: "vegetable",
  }),

  createCrop({
    name: "Cabbage (Band Gobi)",
    scientificName: "Brassica oleracea var. capitata",
    minDays: 90,
    maxDays: 150,
    seasons: ["Winter"],
    type: "vegetable",
  }),

  createCrop({
    name: "Cardamom (Elaichi)",
    scientificName: "Elettaria cardamomum",
    minDays: 730,
    maxDays: 1095,
    seasons: ["Monsoon", "Autumn"],
    type: "perennial",
  }),

  createCrop({
    name: "Cauliflower (Phool Gobi)",
    scientificName: "Brassica oleracea var. botrytis",
    minDays: 90,
    maxDays: 150,
    seasons: ["Winter"],
    type: "vegetable",
  }),

  createCrop({
    name: "Chickpea (Gram)",
    scientificName: "Cicer arietinum",
    minDays: 100,
    maxDays: 150,
    seasons: ["Winter"],
    type: "annual",
  }),

  createCrop({
    name: "Coconut (Nariyal)",
    scientificName: "Cocos nucifera",
    minDays: 1825,
    maxDays: 2555,
    seasons: ["Summer", "Monsoon"],
    type: "perennial",
  }),

  createCrop({
    name: "Coffee",
    scientificName: "Coffea spp.",
    minDays: 1095,
    maxDays: 1460,
    seasons: ["Monsoon", "Autumn", "Winter"],
    type: "perennial",
  }),

  createCrop({
    name: "Coriander (Dhania)",
    scientificName: "Coriandrum sativum",
    minDays: 60,
    maxDays: 120,
    seasons: ["Winter"],
    type: "annual",
  }),

  createCrop({
    name: "Cotton (Kapash)",
    scientificName: "Gossypium spp.",
    minDays: 150,
    maxDays: 210,
    seasons: ["Summer", "Monsoon"],
    type: "annual",
  }),

  createCrop({
    name: "Cucumber (Kheera)",
    scientificName: "Cucumis sativus",
    minDays: 60,
    maxDays: 100,
    seasons: ["Summer", "Monsoon"],
    type: "vegetable",
  }),

  createCrop({
    name: "Drumstick (Moringa/Sahjan)",
    scientificName: "Moringa oleifera",
    minDays: 180,
    maxDays: 365,
    seasons: ["Summer", "Monsoon"],
    type: "perennial",
  }),

  createCrop({
    name: "Garlic (Lehsun)",
    scientificName: "Allium sativum",
    minDays: 120,
    maxDays: 180,
    seasons: ["Winter"],
    type: "root",
  }),

  createCrop({
    name: "Grapes",
    scientificName: "Vitis vinifera",
    minDays: 365,
    maxDays: 730,
    seasons: ["Winter", "Spring"],
    type: "fruit",
  }),

  createCrop({
    name: "Horse Gram (Kulthi)",
    scientificName: "Macrotyloma uniflorum",
    minDays: 100,
    maxDays: 150,
    seasons: ["Monsoon", "Winter"],
    type: "annual",
  }),

  createCrop({
    name: "Jackfruit (Kathal)",
    scientificName: "Artocarpus heterophyllus",
    minDays: 1095,
    maxDays: 1825,
    seasons: ["Spring", "Summer", "Monsoon"],
    type: "fruit",
  }),

  createCrop({
    name: "Jute",
    scientificName: "Corchorus spp.",
    minDays: 100,
    maxDays: 150,
    seasons: ["Summer", "Monsoon"],
    type: "annual",
  }),

  createCrop({
    name: "Kidney Beans (Rajma)",
    scientificName: "Phaseolus vulgaris",
    minDays: 90,
    maxDays: 150,
    seasons: ["Summer", "Monsoon"],
    type: "annual",
  }),

  createCrop({
    name: "Lentil (Masoor)",
    scientificName: "Lens culinaris",
    minDays: 100,
    maxDays: 150,
    seasons: ["Winter"],
    type: "annual",
  }),

  createCrop({
    name: "Maize (Corn)",
    scientificName: "Zea mays",
    minDays: 80,
    maxDays: 150,
    seasons: ["Summer", "Monsoon", "Winter"],
    type: "annual",
  }),

  createCrop({
    name: "Mango",
    scientificName: "Mangifera indica",
    minDays: 1095,
    maxDays: 1825,
    seasons: ["Spring", "Summer", "Monsoon"],
    type: "fruit",
  }),

  createCrop({
    name: "Moth Beans",
    scientificName: "Vigna aconitifolia",
    minDays: 70,
    maxDays: 120,
    seasons: ["Monsoon"],
    type: "annual",
  }),

  createCrop({
    name: "Mung Bean (Green Gram/Moong)",
    scientificName: "Vigna radiata",
    minDays: 60,
    maxDays: 100,
    seasons: ["Summer", "Monsoon"],
    type: "annual",
  }),

  createCrop({
    name: "Muskmelon (Kharbuja)",
    scientificName: "Cucumis melo",
    minDays: 80,
    maxDays: 120,
    seasons: ["Summer"],
    type: "fruit",
  }),

  createCrop({
    name: "Lady Finger (Okra/Bhindi)",
    scientificName: "Abelmoschus esculentus",
    minDays: 90,
    maxDays: 150,
    seasons: ["Summer", "Monsoon"],
    type: "vegetable",
  }),

  createCrop({
    name: "Onion (Pyaaz)",
    scientificName: "Allium cepa",
    minDays: 100,
    maxDays: 180,
    seasons: ["Winter", "Spring"],
    type: "root",
  }),

  createCrop({
    name: "Orange (Santra)",
    scientificName: "Citrus sinensis",
    minDays: 730,
    maxDays: 1460,
    seasons: ["Winter", "Spring"],
    type: "fruit",
  }),

  createCrop({
    name: "Papaya",
    scientificName: "Carica papaya",
    description:
      "Papaya is a tropical fruit crop suitable for warm growing conditions.",
    minDays: 240,
    maxDays: 900,
    seasons: ["Spring", "Monsoon", "Autumn"],
    type: "fruit",
  }),

  createCrop({
    name: "Pigeon Peas (Tur/Arhar)",
    scientificName: "Cajanus cajan",
    minDays: 150,
    maxDays: 240,
    seasons: ["Monsoon", "Winter"],
    type: "annual",
  }),

  createCrop({
    name: "Pineapple (Ananas)",
    scientificName: "Ananas comosus",
    minDays: 365,
    maxDays: 540,
    seasons: ["Summer", "Monsoon"],
    type: "fruit",
  }),

  createCrop({
    name: "Pomegranate",
    scientificName: "Punica granatum",
    minDays: 365,
    maxDays: 730,
    seasons: ["Summer", "Monsoon", "Winter"],
    type: "fruit",
  }),

  createCrop({
    name: "Potato (Aloo)",
    scientificName: "Solanum tuberosum",
    minDays: 90,
    maxDays: 150,
    seasons: ["Winter"],
    type: "root",
  }),

  createCrop({
    name: "Pumpkin (Kaddu)",
    scientificName: "Cucurbita spp.",
    minDays: 90,
    maxDays: 150,
    seasons: ["Summer", "Monsoon"],
    type: "vegetable",
  }),

  createCrop({
    name: "Radish (Mooli)",
    scientificName: "Raphanus sativus",
    minDays: 30,
    maxDays: 70,
    seasons: ["Winter", "Spring"],
    type: "root",
  }),

  createCrop({
    name: "Ragi (Finger Millet)",
    scientificName: "Eleusine coracana",
    minDays: 90,
    maxDays: 150,
    seasons: ["Monsoon"],
    type: "annual",
  }),

  createCrop({
    name: "Rapeseed (Sarson)",
    scientificName: "Brassica napus",
    minDays: 120,
    maxDays: 180,
    seasons: ["Winter"],
    type: "annual",
  }),

  createCrop({
    name: "Rice",
    scientificName: "Oryza sativa",
    minDays: 100,
    maxDays: 180,
    seasons: ["Monsoon", "Winter"],
    type: "annual",
  }),

  createCrop({
    name: "Jowar (Sorghum)",
    scientificName: "Sorghum bicolor",
    minDays: 90,
    maxDays: 150,
    seasons: ["Summer", "Monsoon"],
    type: "annual",
  }),

  createCrop({
    name: "Soybean (Soyabean)",
    scientificName: "Glycine max",
    minDays: 90,
    maxDays: 150,
    seasons: ["Monsoon"],
    type: "annual",
  }),

  createCrop({
    name: "Sunflower (Surajmukhi)",
    scientificName: "Helianthus annuus",
    minDays: 90,
    maxDays: 150,
    seasons: ["Summer", "Monsoon", "Winter"],
    type: "annual",
  }),

  createCrop({
    name: "Sweet Potato (Shakarkandi)",
    scientificName: "Ipomoea batatas",
    minDays: 90,
    maxDays: 180,
    seasons: ["Summer", "Monsoon"],
    type: "root",
  }),

  createCrop({
    name: "Tomato (Tamatar)",
    scientificName: "Solanum lycopersicum",
    minDays: 100,
    maxDays: 180,
    seasons: ["Winter", "Summer", "Monsoon"],
    type: "vegetable",
  }),

  createCrop({
    name: "Turmeric (Haldi)",
    scientificName: "Curcuma longa",
    minDays: 180,
    maxDays: 300,
    seasons: ["Monsoon", "Winter"],
    type: "root",
  }),

  createCrop({
    name: "Watermelon",
    scientificName: "Citrullus lanatus",
    minDays: 80,
    maxDays: 120,
    seasons: ["Summer"],
    type: "fruit",
  }),

  createCrop({
    name: "Wheat (Gehun)",
    scientificName: "Triticum aestivum",
    minDays: 120,
    maxDays: 180,
    seasons: ["Winter"],
    type: "annual",
  }),
];

export default crops;