import { Calculator } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              汇率转换器
            </h1>
            <p className="text-sm text-muted-foreground">
              多货币订阅价格计算工具
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
