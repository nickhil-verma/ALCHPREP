// components/navbar.jsx
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Package2, CircleUser, Sun, Moon, Monitor } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Navbar() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render theme-dependent content until mounted
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between px-6">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Image
                  src="/alchprep-logo.svg"
                  alt="ALCHPREP Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-md"
                />
              </div>
              <Link
                href="/"
                className="text-xl font-bold tracking-tight text-foreground transition-colors hover:text-primary"
              >
                ALCHPREP
              </Link>
            </div>
            
            {/* Skeleton for theme toggle */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full border border-border/50 bg-muted animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const ThemeToggle = ({ isMobile = false }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative rounded-full border border-border/50 hover:border-border hover:bg-accent transition-all duration-200 ${
            isMobile ? "h-9 w-9" : "h-9 w-9"
          }`}
        >
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <Sun className="h-4 w-4 transition-transform duration-200" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`flex items-center gap-2 cursor-pointer ${
            theme === "light" ? "bg-accent text-accent-foreground" : ""
          }`}
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-2 cursor-pointer ${
            theme === "dark" ? "bg-accent text-accent-foreground" : ""
          }`}
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`flex items-center gap-2 cursor-pointer ${
            theme === "system" ? "bg-accent text-accent-foreground" : ""
          }`}
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Image
                src="/alchprep-logo.svg"
                alt="ALCHPREP Logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-md"
              />
            </div>
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-foreground transition-colors hover:text-primary"
            >
              ALCHPREP
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:text-foreground relative group"
              >
                Dashboard
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
              </Link>
              <Link
                href="/prepare"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:text-foreground relative group"
              >
                Prepare
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="default"
                size="sm"
                className="px-4 py-2 font-medium hover:bg-primary/90 transition-colors duration-200"
              >
                <Link href="/login">Login</Link>
              </Button>

              {/* Professional Theme Toggle */}
              <ThemeToggle />

              {/* User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-9 w-9 rounded-full border border-border/50 hover:border-border hover:bg-accent transition-all duration-200"
                  >
                    <CircleUser className="h-4 w-4" />
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-1">
                  <DropdownMenuLabel className="px-3 py-2">
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="px-3 py-2 cursor-pointer">
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="px-3 py-2 cursor-pointer">
                    Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="px-3 py-2 cursor-pointer text-destructive focus:text-destructive">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>

          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-9 w-9 p-0 hover:bg-accent transition-colors duration-200"
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-80 p-0">
              {/* Mobile Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <Package2 className="h-6 w-6 text-primary" />
                  <span className="text-lg font-semibold">ALCHPREP</span>
                </div>
                <ThemeToggle isMobile />
              </div>

              {/* Mobile Navigation Links */}
              <div className="px-6 py-6">
                <nav className="flex flex-col gap-4">
                  <Link
                    href="/dashboard"
                    className="flex items-center py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md hover:bg-accent px-2"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/prepare"
                    className="flex items-center py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md hover:bg-accent px-2"
                  >
                    Prepare
                  </Link>

                  <div className="pt-4 border-t border-border">
                    <Button asChild className="w-full mb-6 font-medium">
                      <Link href="/login">Login</Link>
                    </Button>

                    {/* Mobile User Menu */}
                    <div className="space-y-1">
                      <div className="px-2 py-2 text-sm font-medium text-muted-foreground">
                        My Account
                      </div>
                      <Link
                        href="/settings"
                        className="block px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground rounded-md hover:bg-accent"
                      >
                        Settings
                      </Link>
                      <Link
                        href="/support"
                        className="block px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground rounded-md hover:bg-accent"
                      >
                        Support
                      </Link>
                      <button className="block w-full px-2 py-2 text-left text-sm text-destructive transition-colors hover:text-destructive/80 rounded-md hover:bg-destructive/10">
                        Logout
                      </button>
                    </div>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}