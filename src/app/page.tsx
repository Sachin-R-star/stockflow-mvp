import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Boxes, ArrowRight, ShieldCheck, Zap, Layers, Sparkles } from "lucide-react";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50/40 via-slate-50 to-pink-50/30 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-pink-300/25 to-rose-400/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-gradient-to-tr from-rose-200/20 to-purple-300/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="h-18 w-18 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-pink-500/25 hover:rotate-3 transition-transform duration-300">
            <Boxes className="h-10 w-10" />
          </div>
        </div>

        <div className="space-y-3">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200/80 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
            Next-Gen Multi-Tenant SaaS
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Stock<span className="bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">Flow</span> MVP
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-lg mx-auto font-normal">
            Intelligent inventory operations, real-time stock monitoring, and automated low-inventory alerts built for modern sellers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3.5 justify-center max-w-sm mx-auto">
          <Link
            href="/signup"
            className="flex items-center justify-center py-3 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:via-pink-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-pink-500/25 transition-all text-sm hover:scale-[1.02]"
          >
            Create Organization
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center py-3 px-6 rounded-xl bg-white hover:bg-rose-50/50 text-slate-800 font-semibold border border-rose-200/80 shadow-xs transition-colors text-sm"
          >
            Sign In
          </Link>
        </div>

        <div className="pt-8 border-t border-rose-100 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
          <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xs border border-rose-100 shadow-sm hover:border-rose-300 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Tenant Isolated</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Strict per-organization data boundary. 100% leak-proof multi-tenancy.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xs border border-pink-100 shadow-sm hover:border-pink-300 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center mb-3">
              <Zap className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Live Stock Alerts</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Automated threshold detection, quick 1-click restock actions, and warnings.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xs border border-indigo-100 shadow-sm hover:border-indigo-300 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Layers className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Streamlined CRUD</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Instant catalog search, SKU deduplication, and fast inline stock adjustments.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
