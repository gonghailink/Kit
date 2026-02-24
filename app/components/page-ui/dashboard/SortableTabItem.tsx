import { Tag as TagIcon } from "@phosphor-icons/react";
import type { Tab } from "~/lib/types";

interface SortableTabItemProps {
    tab: Tab;
    isActive: boolean;
    onSelect: () => void;
}

export function SortableTabItem({
    tab,
    isActive,
    onSelect,
}: SortableTabItemProps) {
    return (
        <div id={`tab-${tab.id}`} className="flex items-center">
            <button
                onClick={onSelect}
                className={`
                    flex items-center gap-1.5 px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors rounded-full
                    ${isActive
                        ? "border-primary bg-primary text-background"
                        : "border-transparent text-muted-foreground hover:text-primary"
                    }
                `}
            >
                {tab.title}
            </button>
        </div>
    );
}
