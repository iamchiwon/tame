import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTabStore } from "@/store/tab-store";
import { defaultSites, Site } from "@/lib/site-list";

interface SiteSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SiteSelectionModal: React.FC<SiteSelectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { addTab, tabs } = useTabStore();

  const filteredSites = defaultSites.filter(
    (site) =>
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSiteSelect = async (site: Site) => {
    try {
      await addTab({
        title: site.name,
        url: site.url,
        orderIndex: tabs.length,
      });
      onClose();
      setSearchTerm("");
    } catch (error) {
      console.error("Failed to add site:", error);
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    onClose();
  };

  const groupedSites = filteredSites.reduce((acc, site) => {
    if (!acc[site.category]) {
      acc[site.category] = [];
    }
    acc[site.category].push(site);
    return acc;
  }, {} as Record<string, Site[]>);

  const categoryLabels = {
    communication: "커뮤니케이션",
    professional: "전문 네트워킹",
    productivity: "생산성",
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">앱 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="앱 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base border-gray-300 dark:border-gray-600"
            />
          </div>

          {/* 사이트 목록 */}
          <div className="max-h-96 overflow-y-auto space-y-6">
            {Object.entries(groupedSites).map(([category, sites]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sites.map((site) => (
                    <div
                      key={site.id}
                      onClick={() => handleSiteSelect(site)}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-2xl">
                        {site.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base text-gray-900 dark:text-white">
                          {site.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {site.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredSites.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">검색 결과가 없습니다.</p>
              <p className="text-sm mt-2">다른 키워드로 검색해보세요.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
