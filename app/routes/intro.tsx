import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";
import {
  ArrowRight,
  Compass,
  HeartHandshake,
  Layers,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

const highlights = [
  {
    title: "自己部屬的書籤系統",
    description: "資料與權限由你掌控，在自家環境維持一致的收藏流程。",
    icon: Sparkles,
  },
  {
    title: "專案導向的整理方式",
    description: "用資料夾與分享頁串起專案脈絡，交付更清楚。",
    icon: HeartHandshake,
  },
  {
    title: "安全與隱私優先",
    description: "保留登入與權限控管，維持內部資料的安全性。",
    icon: ShieldCheck,
  },
];

const services = [
  {
    title: "分享頁生成器",
    description: "為每個主題打造漂亮的分享頁，快速對外呈現。",
    meta: "適合客戶報告與作品集",
    icon: Wand2,
  },
];

const features = [
  {
    title: "輕量化管理",
    description: "用最少步驟整理收藏，適合自行部屬與日常維護。",
    icon: Layers,
  },
  {
    title: "分享頁生成器",
    description: "支援分享書籤，並可自訂 Header 的重要連結。",
    icon: Rocket,
  },
];

const steps = [
  {
    title: "建立收藏帳號",
    description: "2 分鐘完成註冊，立即開始整理。",
  },
  {
    title: "導入你的書籤",
    description: "支援瀏覽器匯入與批次貼上。",
  },
  {
    title: "分享你的成果",
    description: "一鍵生成分享頁或私密連結。",
  },
];

export const meta: MetaFunction = () => {
  const title = "自架書籤管理系統｜Kit";
  const description = "可自行部屬的書籤管理系統，整理、分享、交付一次完成。";

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
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/90 text-primary-foreground shadow-sm">
              <img src="/favicon-white.svg" alt="Kit" className="h-full w-full object-contain p-[1px] rounded-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Kit</p>
              <h1 className="text-lg font-semibold">自架書籤管理</h1>
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
                自己部屬，完全掌控收藏資料
              </p>
              <h2 className="mt-8 text-4xl/8 font-semibold leading-tight text-foreground md:text-5xl/16 ">
                打造可自行部屬的
                <span className="text-primary">書籤管理系統</span>
              </h2>
              <p className="mt-8 max-w-xl text-base text-muted-foreground md:text-lg">
                以自架為核心，讓收藏保留在你掌控的環境中。適合研究、專案交付與對外分享，
                在單一系統完成整理、彙整與展示。
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

            <div className="rounded-3xl border border-border bg-card/90 p-8 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">核心能力</p>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  1 個推薦模組
                </span>
              </div>
              <div className="mt-8 space-y-6">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex gap-5 rounded-2xl border border-border/70 bg-background/60 p-5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/70 text-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h3 className="text-3xl font-semibold">推薦模組內容</h3>
            <p className="mt-2 text-muted-foreground">
              針對對外分享與交付流程設計，讓自架系統也能快速產出專業頁面。
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group rounded-3xl border border-border bg-card/80 p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.meta}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h3 className="text-3xl font-semibold">特點</h3>
            <p className="mt-2 text-muted-foreground">
              聚焦自架場景，兼顧易管理與分享展示。
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-3xl border border-border bg-card/80 p-8 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
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
              <h3 className="text-3xl font-semibold">3 步驟完成自架設定</h3>
              <p className="mt-3 text-muted-foreground">
                從部屬到整理再到分享，用最短流程完成上線。
              </p>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-secondary/70 px-4 py-2 text-sm font-medium">
                <Compass className="h-4 w-4" />
                平均 10 分鐘內完成設定
              </div>
            </div>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex items-start gap-5 rounded-2xl border border-border bg-card/80 p-5"
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
              <h3 className="text-3xl font-semibold">準備好開始自架了嗎？</h3>
              <p className="mt-2 text-primary-foreground/80">
                把書籤留在自己的環境，打造專屬的分享入口。
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-semibold text-foreground"
            >
              立即開始
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
