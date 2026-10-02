import "dotenv/config";
import { getMarketPrices } from "../services/marketService.js";

const testMarket = async () => {
  try {
    const records = await getMarketPrices({
      state: "Uttar Pradesh"
    });

    console.log(" MARKET DATA");
    console.log(records);
  } catch (error) {
    console.error("Market test failed:", error.message);
  }
};

testMarket();