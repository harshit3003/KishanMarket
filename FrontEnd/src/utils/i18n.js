// KishanMarket Clean Production i18n System (Hindi & English)

const translations = {
  en: {
    // General
    marketplace: "KishanMarket Agritech Direct Trading",
    buyer: "Agri Buyer",
    farmer: "Farmer / Seller",
    superadmin: "SuperAdmin HQ",
    logout: "Logout",
    search_placeholder: "Search by crop name or district...",
    all_crops: "All Crops",
    mandi_rates: "Live Mandi Rates",
    confirm: "Confirm",
    cancel: "Cancel",

    // Seller Page
    seller_tagline: "Direct Farm Produce Marketplace",
    list_new_crop: "List Produce",
    crop_name: "Crop Name",
    weight_quintal: "Weight (Quintal)",
    asking_rate: "Target Rate (₹/Quintal)",
    submit_listing: "Post Crop Listing",

    // Buyer Page
    buyer_tagline: "Direct Farm Procurement Engine",
    my_watchlist: "Saved Watchlist",
    place_bid: "Submit Direct Bid",
    request_procurement: "Post Bulk Demand",

    // Messages & Alerts
    bid_success: "Your offer has been sent directly to the farmer!",
    added_to_watchlist: "Crop saved to your watchlist",
    removed_from_watchlist: "Crop removed from your watchlist"
  },
  hi: {
    // General
    marketplace: "किसानमार्केट सीधा कृषि व्यापार",
    buyer: "कृषि खरीददार",
    farmer: "किसान / विक्रेता",
    superadmin: "सुपर-एडमिन केंद्र",
    logout: "लॉगआउट",
    search_placeholder: "फ़सल का नाम या ज़िला खोजें...",
    all_crops: "सभी फ़सलें",
    mandi_rates: "लाइव मंडी भाव",
    confirm: "पुष्टि करें",
    cancel: "रद्द करें",

    // Seller Page
    seller_tagline: "किसान से सीधा मंडी बाज़ार",
    list_new_crop: "फ़सल लिस्ट करें",
    crop_name: "फ़सल का नाम",
    weight_quintal: "वज़न (क्विंटल)",
    asking_rate: "मांग दर (₹/क्विंटल)",
    submit_listing: "फ़सल लिस्ट पोस्ट करें",

    // Buyer Page
    buyer_tagline: "सीधा किसान खरीद इंजन",
    my_watchlist: "मेरी वॉचलिस्ट",
    place_bid: "सीधी बोली लगाएं",
    request_procurement: "थोक मांग पोस्ट करें",

    // Messages & Alerts
    bid_success: "आपका प्रस्ताव सीधे किसान को भेज दिया गया है!",
    added_to_watchlist: "फ़सल आपकी वॉचलिस्ट में जोड़ी गई",
    removed_from_watchlist: "फ़सल वॉचलिस्ट से हटाई गई"
  }
};

export const getTranslation = (lang, key) => {
  return translations[lang]?.[key] || translations['en']?.[key] || key;
};

export default translations;
