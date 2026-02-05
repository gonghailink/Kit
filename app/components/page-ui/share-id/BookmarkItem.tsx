import { ExternalLink, Bookmark as BookmarkIcon } from "lucide-react";
import type { Bookmark } from "~/lib/types";

interface BookmarkItemProps {
    bookmark: Bookmark;
}

export function BookmarkItem({ bookmark }: BookmarkItemProps) {
    return (
        <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-secondary/50 rounded-lg p-4 hover:shadow-lg border border-secondary/50 hover:border-primary/70 transition-all group"
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
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {bookmark.memo}
                        </p>
                    )}
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </a>
    );
}
