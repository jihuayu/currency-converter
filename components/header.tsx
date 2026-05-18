import { Calculator } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-navy/95 shadow-lg shadow-brand-navy/10 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">
              汇率转换器
            </h1>
            <p className="text-sm text-slate-300">
              多货币订阅价格计算工具
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
