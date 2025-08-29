import React, { useState } from "react";
import { TabBar } from "./TabBar";
import { AddTabModal } from "./AddTabModal";

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);

  const handleAddTab = () => {
    setIsAddTabModalOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TabBar onAddTab={handleAddTab} />

      <main className="flex-1 overflow-hidden">
        {children || (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Welcome to Tame</h2>
              <p className="text-sm">Add your first tab to get started</p>
            </div>
          </div>
        )}
      </main>

      <AddTabModal
        isOpen={isAddTabModalOpen}
        onClose={() => setIsAddTabModalOpen(false)}
      />
    </div>
  );
};
