export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          StockFlow MVP
        </h1>
        <p className="text-slate-600 text-sm mb-6">
          SaaS Inventory Management System
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="/login"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors"
          >
            Sign In
          </a>
          <a
            href="/signup"
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-sm transition-colors"
          >
            Create Organization Account
          </a>
        </div>
      </div>
    </main>
  );
}
