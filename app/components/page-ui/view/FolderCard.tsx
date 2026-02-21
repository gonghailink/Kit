import type { FolderWithChildren } from "~/lib/types";
import { BookmarkItem } from "./BookmarkItem";
import { SubFolderTree } from "./SubFolderTree";

interface FolderCardProps {
    folder: FolderWithChildren;
}

export function FolderCard({ folder }: FolderCardProps) {
    return (
        <div className="bg-card/85 rounded-xl p-6 shadow-sm">
            {/* 資料夾標題 */}
            <h2 className="text-lg font-semibold text-foreground mb-4">
                {folder.title}
            </h2>

            {/* 書籤網格 */}
            {folder.bookmarks && folder.bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {folder.bookmarks.map((bookmark) => (
                        <BookmarkItem key={bookmark.id} bookmark={bookmark} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-secondary/40 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        此資料夾尚無書籤
                    </p>
                </div>
            )}

            {/* 子資料夾區域 */}
            {folder.children && folder.children.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                    <SubFolderTree folders={folder.children} />
                </div>
            )}
        </div>
    );
}
