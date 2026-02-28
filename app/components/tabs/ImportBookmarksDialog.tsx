import { useState, useRef, useCallback } from "react";
import { useRevalidator } from "react-router";
import { CircleNotchIcon, UploadSimpleIcon, FileHtmlIcon, FileIcon, FolderIcon, BookmarkSimpleIcon, TagIcon } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { TabData } from "~/lib/types";
import { parseHTMLBookmarks, parseJSONBookmarks, type ParsedImportData } from "~/lib/bookmark-io";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface ImportBookmarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabs: TabData[];
  workspaceId: string;
}

type Step = "file" | "preview" | "done";

export default function ImportBookmarksDialog({
  open,
  onOpenChange,
  tabs,
  workspaceId,
}: ImportBookmarksDialogProps) {
  const revalidator = useRevalidator();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("file");
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  // Target selection
  const [targetType, setTargetType] = useState<"new" | "existing">("new");
  const [newTabTitle, setNewTabTitle] = useState("");
  const [selectedTabId, setSelectedTabId] = useState<string>(tabs[0]?.id || "");

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ bookmarks: number; folders: number } | null>(null);

  const resetState = useCallback(() => {
    setStep("file");
    setParsedData(null);
    setParseError(null);
    setFileName("");
    setTargetType("new");
    setNewTabTitle("");
    setSelectedTabId(tabs[0]?.id || "");
    setIsImporting(false);
    setImportError(null);
    setImportResult(null);
  }, [tabs]);

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      let parsed: ParsedImportData;

      if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
        parsed = parseHTMLBookmarks(text);
      } else if (file.name.endsWith(".json")) {
        parsed = parseJSONBookmarks(text);
        if (parsed.tabTitle) {
          setNewTabTitle(parsed.tabTitle);
        }
      } else {
        setParseError("不支援的檔案格式，請選擇 .html 或 .json 檔案");
        return;
      }

      if (parsed.bookmarks.length === 0 && parsed.folders.length === 0) {
        setParseError("檔案中未找到任何書籤資料");
        return;
      }

      setParsedData(parsed);
      setStep("preview");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "檔案解析失敗");
    }

    // Reset file input so the same file can be re-selected
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!parsedData) return;

    const target = targetType === "new"
      ? { type: "new" as const, title: newTabTitle || fileName.replace(/\.(html|htm|json)$/i, ""), workspaceId }
      : { type: "existing" as const, tabId: selectedTabId };

    setIsImporting(true);
    setImportError(null);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, data: parsedData }),
      });

      const result = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || result.error) {
        setImportError(result.error || "匯入失敗");
        setIsImporting(false);
        return;
      }

      setImportResult({
        bookmarks: parsedData.bookmarks.length,
        folders: parsedData.folders.length,
      });
      setStep("done");
      revalidator.revalidate();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "匯入失敗");
    } finally {
      setIsImporting(false);
    }
  };

  const canImport = targetType === "existing"
    ? !!selectedTabId
    : (newTabTitle.trim() !== "" || fileName !== "");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>匯入書籤</DialogTitle>
          <DialogDescription>
            從瀏覽器匯出的 HTML 檔案或 JSON 備份檔匯入書籤
          </DialogDescription>
        </DialogHeader>

        {step === "file" && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-card/50 transition-colors"
            >
              <UploadSimpleIcon className="w-10 h-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-foreground">點擊選擇檔案</p>
                <p className="text-sm text-muted-foreground mt-1">
                  支援 .html（瀏覽器書籤）和 .json（備份檔）
                </p>
              </div>
            </button>

            {parseError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {parseError}
              </div>
            )}
          </div>
        )}

        {step === "preview" && parsedData && (
          <div className="space-y-4 pb-8">
            {/* File info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
              {parsedData.source === "html" ? (
                <FileHtmlIcon className="w-6 h-6 text-primary shrink-0" />
              ) : (
                <FileIcon className="w-6 h-6 text-primary shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  {parsedData.folders.length > 0 && (
                    <span className="flex items-center gap-1">
                      <FolderIcon className="w-3.5 h-3.5" />
                      {parsedData.folders.length} 個資料夾
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <BookmarkSimpleIcon className="w-3.5 h-3.5" />
                    {parsedData.bookmarks.length} 個書籤
                  </span>
                  {parsedData.tagGroups.length > 0 && (
                    <span className="flex items-center gap-1">
                      <TagIcon className="w-3.5 h-3.5" />
                      {parsedData.tags.length} 個標籤
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Target selection */}
            <div className="space-y-2">
              <Label>匯入到</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetType("new")}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all
                    ${targetType === "new"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                    }
                  `}
                >
                  <p className={`text-sm font-medium ${targetType === "new" ? "text-primary" : "text-foreground"}`}>
                    建立新 Tab
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("existing")}
                  disabled={tabs.length === 0}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all
                    ${targetType === "existing"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                    }
                    ${tabs.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <p className={`text-sm font-medium ${targetType === "existing" ? "text-primary" : "text-foreground"}`}>
                    現有 Tab
                  </p>
                </button>
              </div>
            </div>

            {targetType === "new" && (
              <div className="space-y-2">
                <Label htmlFor="import-tab-title">Tab 名稱</Label>
                <Input
                  id="import-tab-title"
                  placeholder="輸入新 Tab 名稱"
                  value={newTabTitle}
                  onChange={(e) => setNewTabTitle(e.target.value)}
                />
              </div>
            )}

            {targetType === "existing" && (
              <div className="space-y-2">
                <Label>選擇 Tab</Label>
                <Select value={selectedTabId} onValueChange={setSelectedTabId}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇 Tab" />
                  </SelectTrigger>
                  <SelectContent>
                    {tabs.map((tab) => (
                      <SelectItem key={tab.id} value={tab.id}>
                        {tab.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {importError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {importError}
              </div>
            )}
          </div>
        )}

        {step === "done" && importResult && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <BookmarkSimpleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">匯入完成</p>
                <p className="text-sm text-muted-foreground mt-1">
                  成功匯入 {importResult.bookmarks} 個書籤
                  {importResult.folders > 0 && `、${importResult.folders} 個資料夾`}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("file");
                  setParsedData(null);
                }}
                disabled={isImporting}
              >
                上一步
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !canImport}
              >
                {isImporting ? (
                  <>
                    <CircleNotchIcon className="w-4 h-4 animate-spin" />
                    匯入中...
                  </>
                ) : (
                  "匯入"
                )}
              </Button>
            </>
          )}
          {step === "done" && (
            <Button type="button" onClick={() => handleOpenChange(false)}>
              完成
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
