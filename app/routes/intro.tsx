import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";
import {
  CloudIcon,
  LightningIcon,
  TagIcon,
  TreeStructureIcon,
  GithubLogoIcon,
  MonitorIcon,
  ShieldCheckIcon,
  RocketIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@phosphor-icons/react";

const features = [
  {
    title: "極速原生部署",
    description:
      "結合 Cloudflare 邊緣運算，全球存取暢通無阻，為你帶來極致效能。",
    icon: CloudIcon,
    span: 2,
  },
  {
    title: "100% 資料自主",
    description:
      "開源且完全免費，告別綁架，你的資訊資產永遠掌握在自己手中。",
    icon: ShieldCheckIcon,
    span: 1,
  },
  {
    title: "優雅一鍵分享",
    description:
      "自動生成帶有精美預覽的展示頁面，展現你的專屬數位品味。",
    icon: MonitorIcon,
    span: 1,
  },
  {
    title: "無縫巢狀收納",
    description: "擺脫層級限制，再龐雜的書籤庫也能有條不紊，井然有序。",
    icon: TreeStructureIcon,
    span: 1,
  },
  {
    title: "靈活標籤分類",
    description:
      "為書籤自由標註標籤，跨資料夾快速篩選，打造多維度知識索引。",
    icon: TagIcon,
    span: 1,
  },

  {
    title: "智慧緩存加速",
    description:
      "內建高效緩存機制，減少重複請求，讓瀏覽與載入速度再進化。",
    icon: LightningIcon,
    span: 2,
  },
];

const steps = [
  {
    title: "一鍵 Fork & 部署",
    description:
      "授權 GitHub，連接 Cloudflare，無痛配置，幾分鐘即可專案上線。",
  },
  {
    title: "建構專屬知識庫",
    description:
      "直覺流暢的介面，輕鬆建立無限層級資料夾，快速匯入所有收藏。",
  },
  {
    title: "自由探索與分享",
    description:
      "隨心所欲地組織內容庫，將精華與洞見化作連結，分享給全世界。",
  },
];

const deploymentSteps = [
  {
    step: "1",
    title: "Fork 專案到 GitHub",
    items: [
      "前往 GitHub 專案頁面",
      "點擊右上角的「Fork」按鈕",
      "Clone 到本機: git clone <your-fork-url>",
    ],
  },
  {
    step: "2",
    title: "執行自動化安裝腳本",
    items: [
      "安裝依賴: npm install",
      "啟動安裝精靈: npm run setup",
      "依照提示完成 D1 建立、環境設定、資料庫遷移",
      "腳本將自動建置並部署至 Cloudflare Pages",
    ],
  },
];

export const meta: MetaFunction = () => {
  const title = "打造你的專屬書籤宇宙｜Kit";
  const description =
    "零成本、全掌控。基於 Cloudflare 部署，支援無限層級的巢狀資料夾，輕鬆管理與優雅分享你的數位資產。";

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
    <div className="dark min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/20">
      {/* Dot grid background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
          <Link to="/intro" className="flex items-center gap-2.5">
            <div className="h-8 w-8 overflow-hidden rounded-lg">
              <img
                src="/favicon-white.svg"
                alt="Kit"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-base font-bold tracking-tight">Kit</span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/tony13382/Personal-BookmarksRemix"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-white/[0.2] hover:text-white sm:inline-flex"
            >
              <GithubLogoIcon className="h-4 w-4" />
              GitHub
            </a>
            <Link
              to="/dashboard"
              className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-neutral-200 active:scale-[0.98]"
            >
              進入控制台
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 h-[600px] w-[600px] rounded-full bg-primary/[0.07] blur-[120px]" />

        <div className="mx-auto max-w-4xl px-6 pb-20 pt-24 text-center md:pb-28 md:pt-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-sm text-neutral-400">
            <RocketIcon className="h-3.5 w-3.5 text-primary" weight="fill" />
            <span>開源免費 · 極速部署 · 數據自主</span>
          </div>

          <h1 className="mt-8 text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl">
            打造你的
            <br />
            <span className="bg-gradient-to-r from-white via-primary to-white bg-clip-text text-transparent">
              專屬書籤宇宙
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-400 md:text-xl">
            擺脫第三方服務綁架。零成本部署在你的 Cloudflare，
            <br className="hidden md:block" />
            以無限層級的巢狀資料夾完美收納，並一鍵優雅分享你的數位品味。
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/tony13382/Personal-BookmarksRemix"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-black transition-all hover:bg-neutral-200 active:scale-[0.98]"
            >
              <GithubLogoIcon className="h-4 w-4" />
              免費開始建構
            </a>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.15] px-6 py-3 text-base font-medium text-neutral-300 transition-colors hover:border-white/[0.3] hover:text-white"
            >
              進入控制台
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Features */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            為什麼選擇 Kit？
          </h2>
          <p className="mt-4 text-lg text-neutral-400">
            強大、極簡、而且完全屬於你。我們去蕪存菁，為你打造最純粹的書籤管理體驗。
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] ${feat.span === 2 ? "md:col-span-2" : ""
                  }`}
              >
                {feat.span === 2 && (
                  <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-[80px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                )}
                <div className="relative z-10">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
                    <Icon className="h-5 w-5 text-neutral-300" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-white/[0.06]">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
              三步曲，建構個人宇宙
            </h2>
            <p className="mt-4 text-lg text-neutral-400">
              從零到上線，最快只需喝杯咖啡的時間。
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <div className="mb-6 text-5xl font-black text-neutral-800 transition-colors group-hover:text-neutral-700">
                  0{i + 1}
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 leading-relaxed text-neutral-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployment Guide */}
      <section className="mx-auto w-full max-w-4xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            技術部署指南
          </h2>
          <p className="mt-4 text-lg text-neutral-400">
            跟隨指令，五分鐘內完成專屬且安全的自動化部署。
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {deploymentSteps.map((step) => (
            <div
              key={step.step}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="flex items-start gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-sm font-bold text-neutral-500 transition-colors group-hover:border-primary/30 group-hover:text-primary">
                  {step.step}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg font-semibold">{step.title}</h4>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {step.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-neutral-400"
                      >
                        <CheckIcon
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary/60"
                          weight="bold"
                        />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <GithubLogoIcon className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">進階設定需求？</p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                包含 SQL schema 初始化腳本、環境參數詳解，請參閱{" "}
                <a
                  href="https://github.com/tony13382/Personal-BookmarksRemix"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-400 underline underline-offset-4 hover:text-blue-300"
                >
                  GitHub README 官方文件
                </a>
                。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-neutral-900 to-neutral-950 p-12 text-center md:p-20">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-primary/[0.08] blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 h-[200px] w-[400px] rounded-full bg-accent/[0.06] blur-[80px]" />

          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              準備好啟航了嗎？
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-neutral-400">
              告別昂貴且受限的訂閱服務。加入我們，幾分鐘內部署一套自由、強大、專屬於你的個人知識庫系統。
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-black transition-all hover:bg-neutral-200 active:scale-[0.98]"
              >
                立刻建立宇宙
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/tony13382/Personal-BookmarksRemix"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.15] px-8 py-3.5 text-base font-medium text-neutral-300 transition-colors hover:border-white/[0.3] hover:text-white"
              >
                <GithubLogoIcon className="h-4 w-4" />
                查看原始碼
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Kit. Made by{" "}
            <a
              href="https://lianglu.uk/"
              className="text-neutral-400 transition-colors hover:text-white"
            >
              Liang Chin Lu
            </a>
          </p>
          <a
            href="https://github.com/tony13382/Personal-BookmarksRemix"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-white"
          >
            <GithubLogoIcon className="h-4 w-4" />
            Source Code
          </a>
        </div>
      </footer>
    </div>
  );
}
