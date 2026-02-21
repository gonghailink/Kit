import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";
import {
  ArrowRight,
  CloudIcon,
  FolderTreeIcon,
  GithubIcon,
  MonitorUpIcon,
  Rocket,
  SquareTerminalIcon,
} from "lucide-react";

const features = [
  {
    title: "Cloudflare 原生部署",
    description: "只需一個帳號，即刻擁有全球 CDN 級效能。",
    icon: CloudIcon,
    image: "/info/Cloudflare 原生部署.png",
  },
  {
    title: "一鍵生成分享頁面",
    description: "自訂 Header 資訊，打造屬於你的書籤展示頁。",
    icon: MonitorUpIcon,
    image: "/info/自訂分享資訊.png",
  },
  {
    title: "巢狀資料夾與分頁",
    description: "無限層級，再多書籤也井然有序。",
    icon: FolderTreeIcon,
    image: "/info/巢狀資料夾與分頁.png",
  },
  {
    title: "完全免費且開源",
    description: "零成本、零限制，你的數據完全由你掌控。",
    icon: SquareTerminalIcon,
    image: "/info/完全免費且開源.png",
  },
];

const steps = [
  {
    title: "部署到 Cloudflare",
    description: "Fork 專案並連結帳號，幾分鐘內上線。",
  },
  {
    title: "匯入你的書籤",
    description: "用巢狀資料夾整理所有收藏，一目了然。",
  },
  {
    title: "分享你的收藏",
    description: "生成專屬連結，展現你的個人風格。",
  },
];

export const meta: MetaFunction = () => {
  const title = "基於 Cloudflare 的免費書籤管理系統｜Kit";
  const description = "完全免費、易於編輯且支援巢狀資料夾的書籤管理系統，支援一鍵分享並可客製化分享頁面資訊。";

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/og-intro.svg" },
    { property: "twitter:card", content: "summary_large_image" },
    { property: "twitter:title", content: title },
    { property: "twitter:description", content: description },
    { property: "twitter:image", content: "/og-intro.svg" },
  ];
};

export default function IntroPage() {
  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl shadow-sm">
              <img src="/favicon-re.svg" alt="Kit" className="h-full w-full object-contain p-[1px]" />
            </div>
            <span className="text-lg font-semibold">Kit</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/gahgah147/BookmarksRemix"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-background sm:inline-flex"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub
            </a>
            <Link
              to="/login"
              className="rounded-full border border-border bg-background/70 px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-background"
            >
              登入
            </Link>
            <Link
              to="/dashboard"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              進入控制台
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-float absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,200,150,0.5)_0%,rgba(255,200,150,0.05)_55%,transparent_70%)]" />
          <div className="absolute top-20 right-12 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,214,165,0.4)_0%,transparent_70%)] blur-2xl" />
          <div className="absolute bottom-10 left-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,236,200,0.5)_0%,transparent_70%)] blur-xl" />
          <div className="absolute top-1/2 right-1/4 h-72 w-72 -translate-y-1/2 rounded-full border border-primary/10" />
        </div>

        <section className="mx-auto w-full max-w-6xl px-6 pb-28 pt-20 md:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="animate-slide-up">
              <p className="inline-flex items-center gap-2 rounded-full bg-secondary/60 px-4 py-2 text-sm font-medium text-foreground">
                <Rocket className="h-4 w-4 text-primary" />
                開源免費，數據自主
              </p>
              <h2 className="mt-8 text-5xl font-bold leading-[1.15] tracking-tight text-foreground md:text-6xl">
                你的書籤，
                <br />
                <span className="text-primary">你做主。</span>
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                不再依賴第三方服務。部署在你自己的 Cloudflare 上，
                用巢狀資料夾整理書籤，一鍵分享給全世界。
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                >
                  免費開始使用
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://github.com/gahgah147/BookmarksRemix"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-6 py-3 text-sm font-medium text-foreground transition hover:bg-background"
                >
                  <GithubIcon className="h-4 w-4" />
                  查看原始碼
                </a>
              </div>
            </div>

            <div className="animate-fade-in px-2" style={{ animationDelay: "0.3s" }}>
              <img src="/info/mockup.png" alt="Kit 書籤管理系統預覽" className="w-full drop-shadow-2xl" />
            </div>
          </div>
        </section>
      </div>

      {/* Features — Bento Grid */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-28">
        <div className="text-center">
          <h3 className="text-3xl font-bold md:text-4xl">為什麼選擇 Kit？</h3>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            簡單、強大、完全屬於你——不多不少，剛剛好。
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group overflow-hidden rounded-3xl border border-border bg-card/80 shadow-sm transition duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="overflow-hidden bg-secondary/20">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="border-t border-border p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Steps — Timeline */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-28">
        <div className="text-center">
          <h3 className="text-3xl font-bold md:text-4xl">三步驟，立即上手</h3>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            從部署到分享，最快 10 分鐘搞定。
          </p>
        </div>

        {/* Desktop: horizontal timeline */}
        <div className="mt-14 hidden md:block">
          <div className="relative grid grid-cols-3 gap-8">
            {/* Connecting line */}
            <div className="absolute top-6 left-[16.67%] right-[16.67%] h-px bg-border" />
            {steps.map((step, index) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-md shadow-primary/20">
                  {index + 1}
                </div>
                <p className="mt-5 text-lg font-semibold">{step.title}</p>
                <p className="mt-2 max-w-[220px] text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical stack */}
        <div className="mt-10 space-y-4 md:hidden">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card/80 p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </div>
              <div>
                <p className="font-semibold">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-28">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-primary-foreground shadow-xl md:px-14">
          {/* Decorative background */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-3xl font-bold md:text-4xl">準備好了嗎？</h3>
              <p className="mt-3 max-w-md text-lg text-primary-foreground/80">
                加入開源社群，打造完全屬於你的書籤管理系統。免費、自主、無限可能。
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-lg transition hover:opacity-90"
            >
              立刻開始
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Kit. Open source under MIT License.
          </p>
          <a
            href="https://github.com/gahgah147/BookmarksRemix"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <GithubIcon className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
