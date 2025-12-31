"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TestPage() {
  const [status, setStatus] = useState<string>("Starting...");
  const [articles, setArticles] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testFirebase() {
      try {
        setStatus("Fetching articles...");
        const querySnapshot = await getDocs(collection(db, "articles"));

        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Count by status
        const counts: Record<string, number> = {};
        docs.forEach((doc: any) => {
          const s = doc.status || "undefined";
          counts[s] = (counts[s] || 0) + 1;
        });
        setStatusCounts(counts);

        // Filter published ones
        const published = docs.filter((d: any) => d.status === "published");

        setArticles(docs.slice(0, 5));
        setStatus(`Total: ${docs.length} | Published: ${published.length}`);
      } catch (err: any) {
        setError(err.message || String(err));
        setStatus("FAILED");
      }
    }

    testFirebase();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", background: "#fff", color: "#000" }}>
      <h1>Firebase Debug</h1>
      <h2>Status: {status}</h2>

      {error && (
        <div style={{ color: "red", background: "#ffe0e0", padding: "10px" }}>
          <pre>{error}</pre>
        </div>
      )}

      <h3>Articles by Status:</h3>
      <pre style={{ background: "#f0f0f0", padding: "10px" }}>
        {JSON.stringify(statusCounts, null, 2)}
      </pre>

      <h3>First 5 Raw Articles:</h3>
      {articles.map((article, i) => (
        <div key={i} style={{ border: "1px solid #ccc", margin: "10px 0", padding: "10px", background: "#f9f9f9" }}>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px" }}>
            {JSON.stringify(article, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
