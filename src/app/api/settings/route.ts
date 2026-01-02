import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const settingsDoc = await getDoc(doc(db, "settings", "config"));

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return NextResponse.json({
        tagline: data.tagline || "Engaging Our Community",
        logoUrl: data.logoUrl || "",
        brandingMode: data.brandingMode || "text",
        showTagline: data.showTagline !== undefined ? data.showTagline : true,
        primaryColor: data.primaryColor || "#1d4ed8",
      });
    }

    // Return defaults if no settings exist
    return NextResponse.json({
      tagline: "Engaging Our Community",
      logoUrl: "",
      brandingMode: "text",
      showTagline: true,
      primaryColor: "#1d4ed8",
    });
  } catch (error) {
    console.error("[API/settings] Failed to load settings:", error);
    return NextResponse.json({
      tagline: "Engaging Our Community",
      logoUrl: "",
      brandingMode: "text",
      showTagline: true,
      primaryColor: "#1d4ed8",
    });
  }
}
