// config/brand.ts

export const MASTER_BRAND = {
    companyName: "Kosisko Ventures Private Limited",
    brandName: "KOSISKO",
    tagline: "कोशिश से कामयाबी की ओर",
    logoUrl: "/Logo.png", // यह आपके public फोल्डर में मौजूद Logo.jpg को पकड़ेगा
  };
  
  /**
   * यह फंक्शन चेक करेगा कि क्या टेनेंट के पास व्हाइट-लेबल सब्सक्रिप्शन एक्टिव है।
   * अगर नहीं है, तो यह हमेशा मास्टर (KOSISKO) ब्रांडिंग ही रिटर्न करेगा।
   */
  export function getTenantBranding(tenantData?: { 
    hasWhiteLabel?: boolean; 
    customCompanyName?: string; 
    customBrandName?: string; 
    customLogoUrl?: string; 
  }) {
    if (tenantData?.hasWhiteLabel) {
      return {
        companyName: tenantData.customCompanyName || MASTER_BRAND.companyName,
        brandName: tenantData.customBrandName || MASTER_BRAND.brandName,
        tagline: "", // व्हाइट-लेबल पर टैगलाइन हटा सकते हैं या कस्टमाइज़ कर सकते हैं
        logoUrl: tenantData.customLogoUrl || MASTER_BRAND.logoUrl,
        isWhiteLabel: true,
      };
    }
  
    // डिफ़ॉल्ट KOSISKO ब्रांडिंग (जब तक सब्सक्रिप्शन न हो)
    return {
      companyName: MASTER_BRAND.companyName,
      brandName: MASTER_BRAND.brandName,
      tagline: MASTER_BRAND.tagline,
      logoUrl: MASTER_BRAND.logoUrl,
      isWhiteLabel: false,
    };
  }