// フッタリンク(F-09)。張り方=操作説明・設計図はアーティファクト(要共有リンク)。

export interface FooterLink {
  label: string;
  href: string;
}

export const FOOTER_LINKS: readonly FooterLink[] = [
  {
    label: "MIT License",
    href: "https://github.com/twill3c/toba-bandit/blob/main/LICENSE",
  },
  { label: "GitHub", href: "https://github.com/twill3c/toba-bandit" },
  {
    label: "toba-bandit の張り方",
    href: "https://claude.ai/code/artifact/0247dcd3-42d9-4427-931d-f2810b159b7a",
  },
  {
    label: "toba-bandit 設計図",
    href: "https://claude.ai/code/artifact/dad86f96-19b5-4580-9644-3e2dc424214d",
  },
  { label: "App Menu", href: "https://app-menu-amber.vercel.app" },
] as const;
