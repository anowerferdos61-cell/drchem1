/**
 * Sidebar — RAG toggle + conversation list with rename/delete.
 */
import { useState } from "react";
import {
  BookOpen,
  MessageSquarePlus,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import {
  deleteConversation,
  newConversation,
  renameConversation,
  selectConversation,
  setRagMode,
  useTutorState,
} from "@/lib/tutor-store";

export default function ChatSidebar() {
  const { conversations, activeId, ragMode } = useTutorState();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  const startRename = (id: string, current: string) => {
    setEditingId(id);
    setEditValue(current);
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      renameConversation(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="flex h-full w-full flex-col border-r bg-card/30">
      {/* Header */}
      <div className="space-y-3 border-b p-3">
        <Button
          className="w-full justify-start gap-2"
          onClick={() => newConversation()}
        >
          <MessageSquarePlus className="h-4 w-4" />
          নতুন চ্যাট
        </Button>

        <div className="flex items-center justify-between rounded-xl border bg-background p-2.5">
          <div className="flex items-center gap-2">
            <BookOpen
              className={cn(
                "h-4 w-4",
                ragMode ? "text-amber-500" : "text-muted-foreground",
              )}
            />
            <div>
              <p className="text-xs font-medium leading-none">
                বই থেকে উত্তর
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Class 9-10 Chemistry
              </p>
            </div>
          </div>
          <Switch checked={ragMode} onCheckedChange={setRagMode} />
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="চ্যাট খুঁজুন…"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            {conversations.length === 0
              ? "এখনো কোনো চ্যাট নেই।"
              : "কিছু পাওয়া যায়নি।"}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((c) => (
              <li key={c.id}>
                <div
                  className={cn(
                    "group flex items-center gap-1 rounded-lg px-2 py-2 text-sm transition hover:bg-accent/60",
                    activeId === c.id && "bg-accent",
                  )}
                >
                  {editingId === c.id ? (
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-6 px-1.5 text-xs"
                    />
                  ) : (
                    <button
                      onClick={() => selectConversation(c.id)}
                      className="flex flex-1 items-center gap-2 truncate text-left"
                    >
                      {c.mode === "book" && (
                        <BookOpen className="h-3 w-3 shrink-0 text-amber-500" />
                      )}
                      <span className="truncate text-xs">{c.title}</span>
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => startRename(c.id, c.title)}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteConversation(c.id)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t p-3 text-[10px] text-muted-foreground">
        💾 Local storage · login করলে cloud-এ save হবে।
      </div>
    </aside>
  );
}
