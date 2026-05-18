import {
  BadgeInfo,
  Clock3,
  CreditCard,
  Globe2,
  Wallet,
} from 'lucide-react';

interface ProjectIntroCardProps {
  fetchedAt: string;
}

function formatBeijingTime(value: string) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(value));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get(
    'minute'
  )}`;
}

const highlights = [
  {
    icon: Globe2,
    title: '跨区订阅价格不同',
    description: 'GPT、Claude 等服务在不同 Apple 区域的订阅标价并不一致。',
  },
  {
    icon: CreditCard,
    title: '卡组织汇率不同',
    description: 'Visa 和 Mastercard 的实时结算汇率会有差异，最终人民币成本也会不同。',
  },
  {
    icon: Wallet,
    title: '统一换算成人民币',
    description: '这里把不同地区、不同支付渠道的订阅方式统一换算为人民币，方便直接比较。',
  },
] as const;

export function ProjectIntroCard({ fetchedAt }: ProjectIntroCardProps) {
  const dataUpdatedAt = formatBeijingTime(fetchedAt);

  return (
    <section className="relative mb-6 overflow-hidden rounded-3xl border border-border/90 bg-gradient-to-br from-white via-warm-panel to-soft-green p-6 shadow-xl shadow-brand-navy/5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(31,95,168,0.10),transparent_28rem),radial-gradient(circle_at_86%_12%,rgba(61,149,86,0.13),transparent_24rem)]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy">
              这是干嘛的？
            </h2>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              GPT、Claude 在不同 Apple 区域的订阅价格并不一样，Visa 和
              Mastercard 信用卡的汇率也会有差异。在这里我们展示了不同渠道的订阅方式，
              并统一换算到人民币价格，方便大家快速比较怎么买更划算。
            </p>
          </div>

          <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-border/80 bg-white/75 px-3 py-2 text-sm text-brand-navy shadow-sm">
            <Clock3 className="h-4 w-4 text-brand-blue" />
            <span className="font-medium">最新数据时间：</span>
            <span>{dataUpdatedAt}（北京时间）</span>
          </div>
        </div>

        <div className="hidden gap-3 lg:grid lg:max-w-2xl lg:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/80 bg-white/75 p-4 shadow-sm shadow-brand-navy/5"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
