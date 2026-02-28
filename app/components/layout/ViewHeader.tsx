import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEffect } from "react";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { ThemeModeToggle } from "~/components/shared/ThemeModeToggle";
import { Kbd, KbdGroup } from "~/components/ui/kbd";
import type { TabData } from "~/lib/types";

interface ViewHeaderProps {
    title: string;
    onSearchClick: () => void;
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
    onSearchClick,
    extraBtn,
    tabs,
    activeTabId,
    setActiveTabId,
    workspaceSwitcher,
}: ViewHeaderProps) {
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
            <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm shadow-lg px-0 pt-4 pb-0 space-y-2">
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
                    <div className="flex items-center gap-3">
                        {/* 搜尋按鈕 */}
                        <button
                            onClick={onSearchClick}
                            className="relative hidden md:flex items-center w-54 pl-9 pr-20 h-9 rounded-full border bg-transparent text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        >
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <span>搜尋書籤...</span>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <KbdGroup className="opacity-50">
                                    <Kbd>⌘</Kbd>
                                    <span className="text-muted-foreground text-xs">+</span>
                                    <Kbd>K</Kbd>
                                </KbdGroup>
                            </div>
                        </button>

                        <ThemeModeToggle />

                        {extraBtn && (
                            extraBtn.isLink ? (
                                <a
                                    href={extraBtn.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-background rounded-full transition-colors font-medium text-sm flex items-center gap-2"
                                >
                                    {extraBtn.title}
                                </a>
                            ) : (
                                <button
                                    onClick={() => window.location.href = extraBtn.url}
                                    className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-background rounded-full transition-colors font-medium text-sm flex items-center gap-2"
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
                        <div className="flex items-center gap-0 pl-4 pt-2 pb-3">
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
                            <div className="shrink-0 w-6" />
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                )}
            </div>

            {/* Mobile Search Button */}
            <button
                onClick={onSearchClick}
                className="md:hidden fixed bottom-32 right-6 p-4 bg-primary text-background rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
                aria-label="搜尋書籤"
            >
                <MagnifyingGlassIcon className="w-6 h-6" />
            </button>
        </>
    );
}
