# 資料 Markdown 変換版（markitdown 版） — 目次

`.claude/資料/` 配下の入力資料を **Microsoft markitdown 0.1.6（`[all]`）** で Markdown 化したもの。
テキスト・表中心の軽量変換。**図・レイアウト・埋込画像は保持しない**（テキスト抽出のみ）。

> 高精細版（図・全セルを画像/忠実抽出で保持）は隣の [`../md/`](../md/INDEX.md) を参照。用途に応じて使い分けること。

| 原本ファイル | 形式 | 変換後 | 備考 |
|---|---|---|---|
| 20260512_資料12_基本設計書 v2_0515.docx | docx | [資料12_基本設計書.md](資料12_基本設計書.md) | mammoth で本文・見出し・表を抽出（図は非保持） |
| RBAC図.xlsx | xlsx(7sheet) | [RBAC図.md](RBAC図.md) | 各シートの表を抽出（権限マトリクスの図は非保持） |
| TRION開発標準_UIデザイン.xlsx | xlsx(1sheet) | [TRION開発標準_UIデザイン.md](TRION開発標準_UIデザイン.md) | 表抽出（UIカタログ画像は非保持） |
| 資料14_スキーマ定義 v6_0601.xlsx | xlsx(49sheet) | [資料14_スキーマ定義.md](資料14_スキーマ定義.md) | 全シートの表を抽出（ER図は非保持） |
| 資料15_コード定義_採番済 v4_0518.xlsx | xlsx(6sheet) | [資料15_コード定義.md](資料15_コード定義.md) | 表抽出 |
| 資料7-1_機能一覧 v3_0515.xlsx | xlsx(3sheet) | [資料7-1_機能一覧.md](資料7-1_機能一覧.md) | 表抽出 |
| 資料7-2_帳票一覧_List biểu mẫu, report.xlsx | xlsx(23sheet) | [資料7-2_帳票一覧.md](資料7-2_帳票一覧.md) | 表抽出（帳票レイアウト画像は非保持） |
| 資料8_画面遷移図 v5_0601.pdf | pdf | [資料8_画面遷移図.md](資料8_画面遷移図.md) | PDF テキスト層のみ（遷移図そのものは非保持） |
| 資料_業務フロー v2_0323.pptx | pptx(26slide) | [資料_業務フロー.md](資料_業務フロー.md) | 全スライドのテキスト・表を抽出（`<!-- Slide number -->` 区切り、図は非保持） |

## 変換コマンド（再実行用）

```bash
export TMPDIR=/Users/masayakato/Desktop/TRION/.tmp
MD=/Users/masayakato/Desktop/TRION/.claude/markitdown-main/.venv/bin/markitdown
"$MD" "原本.xlsx" -o "md_markitdown/出力.md"
```

## md/（高精細版）との違い

| 観点 | この markitdown 版 | ../md/（高精細版） |
|---|---|---|
| xlsx 表 | pandas 経由（空セル=`NaN`、結合由来=`Unnamed:N` が残る） | openpyxl で忠実抽出・結合セル補完・ノイズ除去 |
| 図/レイアウト/ER図/帳票 | **非保持**（テキストのみ） | 画像化して保持（184点） |
| docx 図 | 非保持 | pandoc で inline 保持 |
| pdf/pptx の図 | 非保持（テキストのみ） | 各ページ/スライドを画像化 |
| 生成物 | MD 9 ファイルのみ・軽量 | MD ＋ assets 画像多数 |

> レビュー（`/review:spec` 等）で図・レイアウトの確認が必要な場合は `../md/` を使うこと。
