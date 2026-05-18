export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">页面不存在</h1>
        <p className="text-sm text-muted-foreground">
          你访问的页面不存在，请返回首页继续查看订阅价格换算。
        </p>
      </div>
    </div>
  );
}
