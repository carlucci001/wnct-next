import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreakingNews from "@/components/BreakingNews";
import ChatAssistant from "@/components/ChatAssistant";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <BreakingNews />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <ChatAssistant />
    </div>
  );
}
