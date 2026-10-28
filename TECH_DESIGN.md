# TECH_DESIGN.md（技术设计文档）

## 一、技术选型

| 层 | 选型 | 理由 |
|----|------|------|
| 整体架构 | 纯静态单页（无框架、无构建工具） | MVP 最简路径，双击 index.html 即可运行，任何静态托管平台可直接部署 |
| 结构 | 单文件 `index.html` | 页面规模小，CSS/JS 内联，零依赖零配置 |
| 样式 | 原生 CSS（CSS 变量管理主题色） | 不引 Tailwind，保持零构建；变量集中在 `:root` 便于换肤 |
| 动效 | IntersectionObserver + CSS transition | 滚动入场动画与导航高亮，性能好、兼容性够 |
| 星空背景 | Canvas 2D | 粒子漂移 + 闪烁，devicePixelRatio 适配 |
| 部署 | GitHub Pages | 仓库已在 GitHub，设置 Pages 后自动获得公网域名 |

## 二、项目结构

```
personal-site/
├── index.html      # 全部页面（结构 + 样式 + 脚本）
├── PRD.md          # 产品需求文档
├── TECH_DESIGN.md  # 本文档
└── AGENTS.md       # AI 代理开发约定
```

## 三、数据模型

无后端，项目/博客/技能数据以 JS 数组常量形式内联：

```js
{ title, desc, tags[], link, date }   // 项目 / 博客条目
{ name, level, icon }                 // 技能条目
```

后续接真实后端时，只需把渲染函数改为读 API，数据结构保持一致。

## 四、关键技术点

1. **星空性能**：粒子数按屏宽降级（桌面 ~220 / 移动 ~120），`requestAnimationFrame` 驱动；`prefers-reduced-motion: reduce` 时停止动画
2. **响应式断点**：`<640px` 单列 / `640~1024px` 两列 / `>1024px` 三列，内容最大宽 1200px 居中
3. **导航高亮**：IntersectionObserver 监听各 section，进入视口即高亮对应导航项
4. **入场动画**：`.reveal` 元素进入视口后加 `in` 类触发过渡；对无 JS 环境做渐进增强兜底
5. **无障碍**：语义化标签（header/nav/main/section/footer）、对比度 ≥ AA、键盘可达

## 五、部署方案

- 推送 GitHub 仓库 `Leo-Chen66/personal-site` → Settings → Pages → 选择 `main` 分支根目录 → 自动构建
- 获得访问域名：`https://leo-chen66.github.io/personal-site/`
