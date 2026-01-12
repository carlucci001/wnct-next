import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatAssistant from "@/components/ChatAssistant";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { getDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface SiteSettings {
  tagline: string;
  logoUrl: string;
  brandingMode: 'text' | 'logo';
  showTagline: boolean;
  primaryColor: string;
  googleAnalyticsId: string;
}

async function getSettings(): Promise<SiteSettings> {
  try {
    // Try modern site-config first
    const siteConfigDoc = await getDoc(doc(getDb(), "settings", "site-config"));
    if (siteConfigDoc.exists()) {
      const data = siteConfigDoc.data();
      return {
        tagline: data.siteTagline || data.tagline || "Engaging Our Community",
        logoUrl: data.logoUrl || "",
        brandingMode: data.brandingMode || "text",
        showTagline: data.showTagline !== undefined ? data.showTagline : true,
        primaryColor: data.branding?.primaryColor || data.primaryColor || "#1d4ed8",
        googleAnalyticsId: data.seo?.googleAnalyticsId || "",
      };
    }

    // Fallback to old config doc
    const settingsDoc = await getDoc(doc(getDb(), "settings", "config"));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        tagline: data.tagline || "Engaging Our Community",
        logoUrl: data.logoUrl || "",
        brandingMode: data.brandingMode || "text",
        showTagline: data.showTagline !== undefined ? data.showTagline : true,
        primaryColor: data.primaryColor || "#1d4ed8",
        googleAnalyticsId: data.googleAnalyticsId || "",
      };
    }
  } catch (error) {
    console.error("[Layout] Failed to load settings:", error);
  }
  return {
    tagline: "Engaging Our Community",
    logoUrl: "",
    brandingMode: "text",
    showTagline: true,
    primaryColor: "#1d4ed8",
    googleAnalyticsId: "",
  };
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSettings = await getSettings();

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      {initialSettings.googleAnalyticsId && (
        <GoogleAnalytics gaId={initialSettings.googleAnalyticsId} />
      )}
      <Header initialSettings={initialSettings} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <ChatAssistant />
    </div>
  );
}
