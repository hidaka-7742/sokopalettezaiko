"use client"

import { useState } from "react";
import { Layout, Package, Boxes, FileSpreadsheet, BarChart3, Settings, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Overview } from "@/components/dashboard/overview";
import { Products } from "@/components/dashboard/products";
import { Inventory } from "@/components/dashboard/inventory";
import { Reports } from "@/components/dashboard/reports";
import { ShelfSettings } from "@/components/dashboard/shelf-settings";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";

const navigation = [
  { name: "概要", icon: BarChart3, component: Overview },
  { name: "商品管理", icon: Package, component: Products },
  { name: "在庫管理", icon: Boxes, component: Inventory },
  { name: "レポート", icon: FileSpreadsheet, component: Reports },
  { name: "棚設定", icon: Settings, component: ShelfSettings },
];

export function DashboardShell() {
  const [currentTab, setCurrentTab] = useState("概要");
  const [isOpen, setIsOpen] = useState(false);
  const CurrentComponent = navigation.find(nav => nav.name === currentTab)?.component || Overview;

  const handleNavigation = (tabName: string) => {
    setCurrentTab(tabName);
    setIsOpen(false); // メニューを閉じる
  };

  const NavigationContent = () => (
    <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-blue-50 h-full">
      <div className="flex items-center flex-shrink-0 px-4">
        <Layout className="h-8 w-8 text-blue-600" />
        <span className="ml-2 text-xl font-semibold text-blue-900">倉庫管理システム</span>
      </div>
      <nav className="mt-8 flex-1 px-2 space-y-1">
        {navigation.map((item) => (
          <Button
            key={item.name}
            variant={currentTab === item.name ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              currentTab === item.name
                ? "bg-blue-100 text-blue-900"
                : "text-blue-700 hover:bg-blue-100 hover:text-blue-900"
            )}
            onClick={() => handleNavigation(item.name)}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* デスクトップサイドバー */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r">
        <NavigationContent />
      </div>

      {/* モバイルヘッダー */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Layout className="h-6 w-6 text-blue-600" />
            <span className="ml-2 text-lg font-semibold text-blue-900">倉庫管理システム</span>
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="メニューを開く">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <DialogTitle className="sr-only">ナビゲーションメニュー</DialogTitle>
              <DialogDescription className="sr-only">
                倉庫管理システムのメインナビゲーションメニューです。
              </DialogDescription>
              <NavigationContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1 pb-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* モバイルでヘッダーの高さ分のスペースを確保 */}
            <div className="lg:hidden h-16"></div>
            <div className="py-6">
              <h1 className="text-2xl font-semibold text-blue-900">{currentTab}</h1>
              <Separator className="my-4" />
              <CurrentComponent />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}