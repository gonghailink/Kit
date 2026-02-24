import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";
import {
  ArrowRight,
  CloudIcon,
  FolderTreeIcon,
  GithubIcon,
  MonitorUpIcon,
  Rocket,
  ShieldCheckIcon,
} from "lucide-react";

const features = [
  {
    title: "極速原生部署",
    description: "結合 Cloudflare 邊緣運算，全球存取暢通無阻，為你帶來極致效能。",
    icon: CloudIcon,
    image: "/info/Cloudflare 原生部署.png",
  },
  {
    title: "優雅一鍵分享",
    description: "自動生成帶有精美預覽的展示頁面，展現你的專屬數位品味。",
    icon: MonitorUpIcon,
    image: "/info/自訂分享資訊.png",
  },
  {
    title: "無縫巢狀收納",
    description: "擺脫層級限制，再龐雜的書籤庫也能有條不紊，井然有序。",
    icon: FolderTreeIcon,
    image: "/info/巢狀資料夾與分頁.png",
  },
  {
    title: "100% 資料自主",
    description: "開源且完全免費，告別綁架，你的資訊資產永遠掌握在自己手中。",
    icon: ShieldCheckIcon,
    image: "/info/完全免費且開源.png",
  },
];

const steps = [
  {
    title: "一鍵 Fork & 部署",
    description: "授權 GitHub，連接 Cloudflare，無痛配置，幾分鐘即可專案上線。",
  },
  {
    title: "建構專屬知識庫",
    description: "直覺流暢的介面，輕鬆建立無限層級資料夾，快速匯入所有收藏。",
  },
  {
    title: "自由探索與分享",
    description: "隨心所欲地組織內容庫，將精華與洞見化作連結，分享給全世界。",
  },
];

const deploymentSteps = [
  {
    step: "1",
    title: "Fork 專案到 GitHub",
    items: [
      "前往 GitHub 專案頁面",
      "點擊右上角的「Fork」按鈕",
      "將專案 Fork 到你的個人帳號",
    ],
  },
  {
    step: "2",
    title: "建立 D1 資料庫",
    items: [
      "本地終端登入: npx wrangler login",
      "建立資料庫: npx wrangler d1 create bookmarks-db",
      "將生成的 database_id 填入 wrangler.toml",
      "初始化結構: npm run db:migrate:remote",
    ],
  },
  {
    step: "3",
    title: "建立 Pages 專案",
    items: [
      "登入 Cloudflare → 進入 Pages",
      "「Create a project」→「Connect to Git」",
      "選擇 Fork 的分支，Framework 選 Remix",
      "Build command: npm run build",
      "Output directory: build/client",
    ],
  },
  {
    step: "4",
    title: "綁定 D1 與變數",
    items: [
      "在專案「Settings」→「Functions」綁定 D1 (變數名: DB)",
      "在「Environment variables」新增變數",
      "新增安全字串 JWT_KW",
      "(選填) 新增 REGISTRATION_WHITELIST 限制註冊",
    ],
  },
  {
    step: "5",
    title: "即刻啟航",
    items: [
      "等待自動化部署完成 (約需 2-3 分鐘)",
      "訪問你的專屬 Cloudflare Pages 網域",
      "註冊首個帳號，開始打造你的書籤宇宙",
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
    <div className="min-h-screen text-foreground selection:bg-primary/20">
      {/* Header (Glassmorphism) */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/50 backdrop-blur-2xl transition-all duration-300">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-2xl shadow-sm overflow-hidden bg-primary/10 transition-transform duration-300 group-hover:scale-105">
              <img
                src="/favicon-re.svg"
                alt="Kit"
                className="h-full w-full object-contain p-1.5"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">Kit</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/gahgah147/BookmarksRemix"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full border border-border/50 bg-background/40 px-5 py-2 text-sm font-medium text-foreground backdrop-blur-md shadow-sm transition hover:bg-background/80 hover:border-border sm:inline-flex"
            >
              <GithubIcon className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <Link
              to="/login"
              className="hidden rounded-full px-5 py-2 text-sm font-medium text-foreground transition hover:text-primary sm:block"
            >
              會員登入
            </Link>
            <Link
              to="/dashboard"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
            >
              進入控制台
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 md:pt-24 pb-20 md:pb-32">
        {/* Dynamic Background Gradients */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-float absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--primary-rgb),0.15)_0%,transparent_70%)] opacity-70 blur-3xl mix-blend-screen" />
          <div className="absolute top-20 right-[10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.1)_0%,transparent_70%)] opacity-50 blur-3xl" />
          <div className="absolute bottom-10 left-[10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(var(--secondary-rgb),0.15)_0%,transparent_70%)] opacity-60 blur-3xl" />

          {/* Subtle Grid Pattern overlay */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>

        <section className="mx-auto w-full max-w-7xl px-6 relative z-10">
          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-slide-up space-y-8 relative">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm">
                <Rocket className="h-4 w-4" />
                <span className="tracking-wide">開源免費 · 極速部署 · 數據自主</span>
              </div>

              <h1 className="text-5xl font-extrabold leading-[1.15] tracking-tight text-foreground md:text-6xl lg:text-7xl">
                打造你的<br />
                <span className="relative inline-block mt-2">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">專屬書籤宇宙</span>
                  <div className="absolute -bottom-2 left-0 right-0 h-3 bg-primary/20 -z-10 rounded-full blur-sm" />
                </span>
              </h1>

              <p className="max-w-xl text-lg md:text-xl leading-relaxed text-muted-foreground font-light">
                擺脫第三方服務綁架。零成本部署在你的 Cloudflare，以無限層級的巢狀資料夾完美收納，並一鍵優雅分享你的數位品味。
              </p>

              <div className="flex flex-wrap items-center gap-5 pt-4">
                <Link
                  to="/login"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/40 active:scale-95"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    免費開始建構 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] transition-transform duration-1000 group-hover:translate-x-[100%]" />
                </Link>
                <a
                  href="https://github.com/gahgah147/BookmarksRemix"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 backdrop-blur-md px-8 py-4 text-base font-medium text-foreground transition-all hover:bg-accent/10 hover:border-accent/30"
                >
                  <GithubIcon className="h-5 w-5" />
                  檢視原始碼
                </a>
              </div>
            </div>

            <div className="animate-fade-in relative z-10 lg:pl-10" style={{ animationDelay: "0.2s" }}>
              <div className="relative rounded-2xl border border-border/40 bg-card/60 p-2 backdrop-blur-xl shadow-2xl shadow-primary/10">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-primary/30 to-accent/30 blur-xl opacity-50 -z-10" />
                <img
                  src="/info/mockup.png"
                  alt="Kit 系統預覽"
                  className="w-full rounded-xl border border-border/20 shadow-inner"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Features Grid (Glassmorphism) */}
      <section className="mx-auto w-full max-w-7xl px-6 py-24 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold md:text-5xl tracking-tight">為什麼選擇 Kit？</h2>
          <p className="mt-5 text-lg text-muted-foreground font-light leading-relaxed">
            強大、極簡、而且完全屬於你。我們去蕪存菁，為你打造最純粹的書籤管理體驗。
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="aspect-[16/9] w-full overflow-hidden bg-muted/30 border-b border-border/20 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>

                <div className="relative z-20 -mt-10 p-8 pt-0">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30 ring-4 ring-background">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-3">{item.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Steps Timeline (Modern Visual) */}
      <section className="mx-auto w-full max-w-7xl px-6 py-24 border-y border-border/30 bg-muted/10 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/5 blur-[100px] -z-10 rounded-full" />

        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-3xl font-extrabold md:text-5xl tracking-tight">三步曲，建構個人宇宙</h2>
          <p className="mt-5 text-lg text-muted-foreground font-light">
            從零到上線，最快只需喝杯咖啡的時間。
          </p>
        </div>

        <div className="max-w-5xl mx-auto relative">
          <div className="absolute top-8 left-6 md:left-1/2 md:-translate-x-1/2 bottom-8 w-px bg-gradient-to-b from-primary/10 via-primary/30 to-primary/10" />

          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => (
              <div key={index} className={`relative flex flex-col md:flex-row gap-8 md:gap-16 items-start md:items-center ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>

                {/* Number Circle */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-background bg-gradient-to-br from-primary to-accent text-xl font-bold text-white shadow-lg shadow-primary/20 z-10 transition-transform hover:scale-110">
                  {index + 1}
                </div>

                {/* Content Box */}
                <div className={`w-full pl-20 md:pl-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16 md:text-left'}`}>
                  <div className="group rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-8 transition-all hover:bg-card/80 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployment Details (Accordion-style look) */}
      <section className="mx-auto w-full max-w-4xl px-6 py-24 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold md:text-4xl tracking-tight">技術部署指南</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            跟隨指令，五分鐘內完成專屬且安全的自動化部署。
          </p>
        </div>

        <div className="space-y-6">
          {deploymentSteps.map((step) => (
            <div
              key={step.title}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm transition-all hover:bg-card/80 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 sm:p-8">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted/50 text-3xl font-black text-muted-foreground/40 transition-colors group-hover:bg-primary/10 group-hover:text-primary/70">
                  {step.step}
                </div>
                <div className="flex-1 space-y-4">
                  <h4 className="text-xl font-bold">{step.title}</h4>
                  <ul className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                    {step.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3 text-sm text-foreground/80">
                        <MonitorUpIcon className="h-4 w-4 shrink-0 text-primary/60 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
              <GithubIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">進階設定需求？</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                包含 SQL schema 初始化腳本、環境參數詳解，請參閱{" "}
                <a
                  href="https://github.com/gahgah147/BookmarksRemix"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-500 hover:text-blue-600 underline underline-offset-4"
                >
                  GitHub README 官方文件
                </a>
                。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24 relative z-10">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-accent px-8 py-20 text-white shadow-2xl shadow-primary/30 md:px-16 text-center md:text-left">
          {/* Glass Overlay Elements */}
          <div className="pointer-events-none absolute top-0 right-0 h-full w-1/2 bg-white/5 backdrop-blur-3xl skew-x-12 translate-x-1/4" />
          <div className="pointer-events-none absolute -bottom-1/2 -left-1/4 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl mix-blend-overlay" />

          <div className="relative flex flex-col items-center gap-10 md:flex-row md:justify-between z-10">
            <div className="max-w-xl">
              <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl mb-6">
                準備好啟航了嗎？
              </h2>
              <p className="text-lg text-white/90 font-medium leading-relaxed">
                告別昂貴且受限的訂閱服務。加入我們，幾分鐘內部屬一套自由、強大、專屬於你的個人知識庫系統。
              </p>
            </div>
            <Link
              to="/login"
              className="group flex shrink-0 items-center justify-center gap-3 rounded-full bg-white px-8 py-5 text-lg font-bold text-primary shadow-xl transition-all hover:bg-gray-50 hover:scale-105 hover:shadow-2xl"
            >
              立刻建立宇宙
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/30 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
          <p className="text-sm font-medium text-muted-foreground">
            &copy; {new Date().getFullYear()} Kit. Crafted with passion. Released under MIT.
          </p>
          <div className="flex gap-6">
            <a
              href="https://github.com/gahgah147/BookmarksRemix"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <GithubIcon className="h-5 w-5 group-hover:text-primary transition-colors" />
              <span>Source Code</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

