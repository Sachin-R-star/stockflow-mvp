"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Boxes, LayoutDashboard, Package, Settings, LogOut, Building, Sparkles } from "lucide-react";

interface NavbarProps {
  user?: {
    email: string;
    organizationName: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Products", icon: Package },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-rose-100/70 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform duration-200">
                <Boxes className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                Stock<span className="bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">Flow</span>
              </span>
            </Link>

            <nav className="hidden md:flex space-x-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200/60 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${isActive ? "text-rose-600" : "text-slate-400"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3 text-sm">
                <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-rose-50 to-pink-50 text-rose-800 font-semibold text-xs border border-rose-200 shadow-2xs">
                  <Building className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
                  {user.organizationName}
                </div>
                <div className="hidden lg:block text-slate-500 text-xs font-medium">
                  {user.email}
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
            >
              <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
