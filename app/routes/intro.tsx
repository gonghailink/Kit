import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";
import {
  ArrowRight,
  CloudIcon,
  Compass,
  FolderTreeIcon,
  GithubIcon,
  Layers,
  MonitorUpIcon,
  Rocket,
  SquareTerminalIcon,
  Wand2,
} from "lucide-react";



const features = [
  {
    title: "Cloudflare 原生部署",
    description: "只需 Cloudflare 帳號即可完成部署，效能強大且穩定。",
    icon: CloudIcon,
    image: "/info/Cloudflare 原生部署.png",
  },
  {
    title: "自訂分享資訊",
    description: "一鍵生成分享網頁，並可在網頁中客製化 Header 資訊。",
    icon: MonitorUpIcon,
    image: "/info/自訂分享資訊.png",
  },
  {
    title: "巢狀資料夾與分頁",
    description: "支援無限層級的巢狀資料夾與分頁，讓大量資料也井然有序。",
    icon: FolderTreeIcon,
    image: "/info/巢狀資料夾與分頁.png",
  },
  {
    title: "完全免費且開源",
    description: "基礎設施完全免費，你可以完全掌控自己的數據與系統。",
    icon: SquareTerminalIcon,
    image: "/info/完全免費且開源.png",
  },
];

const steps = [
  {
    title: "連結 Cloudflare 帳號",
    description: "利用 Cloudflare 生態系，幾分鐘內完成基礎設施設定。",
  },
  {
    title: "整理與導入書籤",
    description: "支援巢狀資料夾管理，輕鬆匯入你現有的書籤資料。",
  },
  {
    title: "自訂與分享成果",
    description: "生成專屬分享連結，並自訂頁面資訊展現個人風格。",
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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,200,150,0.45)_0%,rgba(255,200,150,0.05)_55%,transparent_70%)]" />
          <div className="absolute top-24 right-10 h-56 w-56 rounded-3xl bg-[linear-gradient(135deg,rgba(255,214,165,0.6)_0%,rgba(255,214,165,0.1)_70%)] blur-3xl" />
          <div className="absolute bottom-0 left-8 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,236,200,0.7)_0%,transparent_70%)]" />
        </div>

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-12">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-3xl shadow-md">
              <img src="/favicon-re.svg" alt="Kit" className="h-full w-full object-contain p-[1px]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Kit</h1>
              <p className="text-sm font-medium text-muted-foreground">書籤管理系統</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
        </header>

        <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-20">
          <div className="grid gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-secondary/60 px-4 py-2 text-sm font-medium text-foreground">
                只需 Cloudflare，打造你的專屬書籤庫
              </p>
              <h2 className="mt-8 text-4xl/8 font-semibold leading-tight text-foreground md:text-5xl/16 ">
                極致簡約、完全免費的
                <span className="text-primary">書籤管理系統</span>
              </h2>
              <p className="mt-8 max-w-xl text-base text-muted-foreground md:text-lg">
                這是一個專為愛好整理者開發的開源書籤管理工具。
                基於 Cloudflare 部署，支援巢狀資料夾與分頁，讓你的收藏井然有序。
                同時能快速生成專屬分享網頁，甚至還能客製化部分資訊。
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
                >
                  開始建立
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="px-2">
              <img src="/info/mockup.png" alt="Kit" className="w-full" />
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h3 className="text-3xl font-semibold">系統特點</h3>
            <p className="mt-2 text-muted-foreground">
              完全由你掌控的數據中心。
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="overflow-hidden rounded-3xl border border-border bg-card/80 shadow-sm transition hover:shadow-lg"
              >
                <div className="bg-secondary/30 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full rounded-t-xl object-cover shadow-sm transition hover:scale-[1.02]"
                  />
                </div>
                <div className="p-6 border-t border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{item.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-border bg-background/70 p-10 shadow-lg backdrop-blur md:p-12">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h3 className="text-3xl font-semibold">簡單 3 步驟，快速上手</h3>
              <p className="mt-3 text-muted-foreground">
                從部署到分享，流程直覺流暢。
              </p>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-secondary/70 px-4 py-2 text-sm font-medium">
                <Compass className="h-4 w-4" />
                最快 10 分鐘內可完成所有設定
              </div>
            </div>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex items-start gap-5 rounded-2xl border border-border bg-card/80 p-5 transition hover:bg-card"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-base font-semibold">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-28">
        <div className="rounded-3xl bg-primary px-10 py-12 text-primary-foreground shadow-xl">
          <div className="flex flex-col items-start gap-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-3xl font-semibold">把書籤留在你的地盤</h3>
              <p className="mt-2 text-primary-foreground/80">
                立即開始建立你專屬、免費且強大的書籤分享系統。
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:opacity-90"
            >
              立刻建立
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
