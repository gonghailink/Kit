import { useState } from "react";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import type { FolderWithChildren } from "~/lib/types";
import { BookmarkItem } from "~/components/bookmarks/BookmarkItem";

interface SubFolderTreeProps {
    folders: FolderWithChildren[];
}

export function SubFolderTree({ folders }: SubFolderTreeProps) {
    return (
        <div className="space-y-4">
            {folders.map((folder) => (
                <CollapsibleSubFolder key={folder.id} folder={folder} />
            ))}
        </div>
    );
}

function CollapsibleSubFolder({ folder }: { folder: FolderWithChildren }) {
    const [isOpen, setIsOpen] = useState(!folder.is_collapsed);

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-md font-medium text-muted-foreground mb-3 hover:text-primary transition-colors"
            >
                {isOpen ? (
                    <CaretDown className="w-4 h-4" />
                ) : (
                    <CaretRight className="w-4 h-4" />
                )}
                {folder.title}
            </button>

            {isOpen && (
                <div className="ml-2">
                    {folder.bookmarks && folder.bookmarks.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                            {folder.bookmarks.map((bookmark) => (
                                <BookmarkItem key={bookmark.id} bookmark={bookmark} />
                            ))}
                        </div>
                    )}

                    {folder.children && folder.children.length > 0 && (
                        <SubFolderTree folders={folder.children} />
                    )}
                </div>
            )}
        </div>
    );
}
