"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Boxes, LayoutDashboard, Package, Settings, LogOut, Building } from "lucide-react";

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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Boxes className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">
                Stock<span className="text-indigo-600">Flow</span>
              </span>
            </Link>

            <nav className="hidden md:flex space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3 text-sm">
                <div className="hidden sm:flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200">
                  <Building className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                  {user.organizationName}
                </div>
                <div className="hidden lg:block text-slate-500 text-xs">
                  {user.email}
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
