import { MagnifyingGlass, X as XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Input } from "~/components/ui/input";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import type { TabData } from "~/lib/types";

interface ViewHeaderProps {
    title: string;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    extraBtn?: {
        title: string;
        url: string;
        isLink?: boolean;
    };
    tabs: TabData[];
    activeTabId: string | undefined;
    setActiveTabId: (id: string) => void;
    workspaceSwitcher?: React.ReactNode;
}

export function ViewHeader({
    title,
    searchQuery,
    onSearchChange,
    extraBtn,
    tabs,
    activeTabId,
    setActiveTabId,
    workspaceSwitcher,
}: ViewHeaderProps) {
    const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);

    useEffect(() => {
        if (activeTabId) {
            const activeTabElement = document.getElementById(`tab-${activeTabId}`);
            if (activeTabElement) {
                activeTabElement.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center",
                });
            }
        }
    }, [activeTabId]);

    return (
        <>
            <div className="z-10 bg-card backdrop-blur-sm shadow-lg px-0 pt-4 pb-0 space-y-2">
                <div className="flex items-center justify-between px-6">
                    <div className="flex items-center space-x-3">
                        <h1 className="text-xl font-semibold text-foreground/90">
                            {title}
                        </h1>
                        {workspaceSwitcher && (
                            <div className="ml-6">
                                {workspaceSwitcher}
                            </div>
                        )}
                    </div>
                    <div className="md:flex items-center gap-3">
                        {/* 搜尋功能 */}
                        <div className="relative hidden md:block">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="搜尋書籤..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-64 pl-9 rounded-full"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => onSearchChange("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xl leading-none"
                                >
                                    <XIcon className="size-4" />
                                </button>
                            )}
                        </div>

                        {extraBtn && (
                            extraBtn.isLink ? (
                                <a
                                    href={extraBtn.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full transition-colors font-medium text-sm flex items-center gap-2"
                                >
                                    {extraBtn.title}
                                </a>
                            ) : (
                                <button
                                    onClick={() => window.location.href = extraBtn.url}
                                    className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full transition-colors font-medium text-sm flex items-center gap-2"
                                >
                                    {extraBtn.title}
                                </button>
                            )
                        )}
                    </div>
                </div>
                {/* Tabs Bar */}
                {tabs.length > 0 && (
                    <ScrollArea className="w-full">
                        <div className="flex items-center gap-0 pl-4 pr-6 pt-2 pb-3">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    id={`tab-${tab.id}`}
                                    onClick={() => setActiveTabId(tab.id)}
                                    className={`
                  px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors rounded-full
                  ${activeTabId === tab.id
                                            ? "border-primary bg-primary text-background"
                                            : "border-transparent text-muted-foreground hover:text-primary"
                                        }
                `}
                                >
                                    {tab.title}
                                </button>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                )}
            </div>

            {/* Mobile Search Button */}
            <button
                onClick={() => setIsSearchSheetOpen(true)}
                className="md:hidden fixed bottom-32 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
                aria-label="搜尋書籤"
            >
                <MagnifyingGlass className="w-6 h-6" />
            </button>

            {/* Mobile Search Sheet */}
            <Sheet open={isSearchSheetOpen} onOpenChange={setIsSearchSheetOpen}>
                <SheetContent side="bottom" className="h-auto">
                    <SheetHeader>
                        <SheetTitle>搜尋書籤</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 pb-2 space-y-3">
                        <div className="relative">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="輸入關鍵字搜尋..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchQuery) {
                                        setIsSearchSheetOpen(false);
                                    }
                                }}
                                className="pl-10 h-12 text-lg rounded-xl"
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => onSearchChange("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xl leading-none"
                                >
                                    <XIcon className="size-4" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                if (searchQuery) {
                                    setIsSearchSheetOpen(false);
                                }
                            }}
                            disabled={!searchQuery}
                            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            搜尋
                        </button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
