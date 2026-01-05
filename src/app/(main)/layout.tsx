import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatAssistant from "@/components/ChatAssistant";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface SiteSettings {
  tagline: string;
  logoUrl: string;
  brandingMode: 'text' | 'logo';
  showTagline: boolean;
  primaryColor: string;
}

async function getSettings(): Promise<SiteSettings> {
  try {
    const settingsDoc = await getDoc(doc(db, "settings", "config"));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        tagline: data.tagline || "Engaging Our Community",
        logoUrl: data.logoUrl || "",
        brandingMode: data.brandingMode || "text",
        showTagline: data.showTagline !== undefined ? data.showTagline : true,
        primaryColor: data.primaryColor || "#1d4ed8",
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
      <Header initialSettings={initialSettings} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <ChatAssistant />
    </div>
  );
}
