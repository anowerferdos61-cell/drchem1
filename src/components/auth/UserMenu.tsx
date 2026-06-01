import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, User as UserIcon, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Compact auth widget for any top bar.
 * - Logged-out: "লগইন" + "সাইনআপ" buttons
 * - Logged-in: avatar dropdown with profile + logout
 */
export default function UserMenu() {
  const { user, profile, roles, isAuthenticated, loading, signOut } = useAuth();

  if (loading) {
    return <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/login">লগইন</Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/signup">
            <Sparkles className="h-3.5 w-3.5" /> সাইনআপ
          </Link>
        </Button>
      </div>
    );
  }

  const name = profile?.display_name || user?.email?.split("@")[0] || "User";
  const initial = name.charAt(0).toUpperCase();
  const role = roles.includes("admin")
    ? "Admin"
    : roles.includes("teacher")
      ? "শিক্ষক"
      : "শিক্ষার্থী";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-accent transition-colors">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-sm font-semibold">
            {initial}
          </div>
          <span className="text-sm font-medium hidden sm:inline">{name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm">{name}</span>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
            <span className="text-xs text-primary mt-0.5">{role}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/">
            <UserIcon className="h-4 w-4" /> ল্যাব
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="h-4 w-4" /> লগআউট
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LoginButton() {
  return (
    <Button asChild size="sm" variant="outline">
      <Link to="/login">
        <LogIn className="h-3.5 w-3.5" /> লগইন
      </Link>
    </Button>
  );
}
