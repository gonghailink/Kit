import { ArrowSquareOutIcon, BookmarkSimpleIcon as BookmarkIcon } from "@phosphor-icons/react";
import type { Bookmark, Tag } from "~/lib/types";

interface BookmarkItemProps {
    bookmark: Bookmark;
    tags?: Tag[];
    tagColorMap?: Record<string, string | null>;
}

export function BookmarkItem({ bookmark, tags, tagColorMap }: BookmarkItemProps) {
    return (
        <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-secondary rounded-lg p-4 hover:shadow-lg border border-secondary/50 hover:border-primary/70 transition-all"
        >
            <div className="flex items-start gap-3">
                {bookmark.favicon_url ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90">
                        <img
                            src={bookmark.favicon_url}
                            alt=""
                            className="w-5 h-5 flex-shrink-0 rounded-sm"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                    </div>
                ) : (
                    <BookmarkIcon className="w-5 h-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                        {bookmark.title}
                    </h4>
                    {bookmark.memo && (
                        <p className="text-sm text-muted-foreground mt-2">
                            {bookmark.memo}
                        </p>
                    )}
                    {tags && tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {tags.map((tag) => {
                                const color = tagColorMap?.[tag.tag_group_id] || null;
                                return (
                                    <span
                                        key={tag.id}
                                        className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                        style={{
                                            backgroundColor: color ? `${color}20` : "hsl(var(--secondary))",
                                            color: color || "hsl(var(--muted-foreground))",
                                        }}
                                    >
                                        {tag.title}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </a>
    );
}
