import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TabManager } from "./TabManager";
import { SiteSelectionModal } from "./SiteSelectionModal";

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSiteSelectionModalOpen, setIsSiteSelectionModalOpen] =
    useState(false);

  const handleAddTab = () => {
    setIsSiteSelectionModalOpen(true);
  };

  return (
    <div className="h-screen flex bg-background">
      <Sidebar onAddTab={handleAddTab} />

      <main className="flex-1 overflow-hidden">
        {children || <TabManager />}
      </main>

      <SiteSelectionModal
        isOpen={isSiteSelectionModalOpen}
        onClose={() => setIsSiteSelectionModalOpen(false)}
      />
    </div>
  );
};
