# requirements.md

## 目的

Bun の標準テストランナー (`bun test`) を用いて生成した **LCOV** カバレッジレポートを、Pull Request 上でわかりやすく可視化する GitHub Action **「bun‑coverage‑report‑action」** を実装・導入する。既存の `vitest-coverage-report-action` を参考にしつつ、最小限の改修で Bun 対応を実現することを目指す。

---

## 背景

- プロジェクトでは当初から **Bun** のテストランナーを採用しているが、Vitest 用カバレッジ Action はそのまま利用できないため、Bun 対応の Action が必要。
- 参考リポジトリ: [vitest-coverage-report-action](https://github.com/davelosert/vitest-coverage-report-action)
- `bun test` は `--coverage --coverage-reporter=lcov` オプションで `coverage/lcov.info` を出力可能。
- 既存の `vitest-coverage-report-action` は JSON 形式を前提としているため、そのままでは Bun の LCOV を処理できない。

---

## 要件

1. **入力フォーマット**

   - `coverage/lcov.info`（Bun が出力）を直接読み込む。

2. **出力**

   - Pull Request へのコメント（既存コメントがあれば更新）。
   - 行・関数・ブランチ・ステートメントのカバレッジ値をテーブル表示。
   - 指標毎の閾値チェック機能（未達の場合はジョブ失敗）。

3. **互換性**

   - UI／コメント形式は `vitest-coverage-report-action` と極力そろえる。

4. **拡張性**

   - 将来的に差分カバレッジ比較・HTML アーティファクト生成を追加できる構成。

---

## ディレクトリ構成

```
.bun-coverage-report-action/
├── action.yml           # GitHub Action メタデータ
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts         # エントリポイント
│   ├── inputs/
│   │   └── parseLcov.ts # LCOV → JsonSummary 変換
│   └── types/
│        └── JsonSummary.ts (既存型定義を流用)
└── dist/index.js        # ビルド後ファイル（esbuild または @vercel/ncc）
```

---

## 主要ライブラリ

| 目的       | ライブラリ                         | 備考                   |
| ---------- | ---------------------------------- | ---------------------- |
| LCOV 解析  | `lcov-parse`                       | `bun add lcov-parse`   |
| GitHub API | `@actions/github`, `@actions/core` | コメント操作・失敗判定 |

開発時は型定義 `@types/lcov-parse` を devDependencies に追加。

---

## Action インターフェース (`action.yml` 抜粋)

```yaml
author: "Your Name"
inputs:
  lcov-path:
    description: "Path to coverage/lcov.info"
    default: "coverage/lcov.info"
  min-coverage:
    description: "Fail if total line coverage below this %"
    default: "0"
runs:
  using: "node20"
  main: "dist/index.js"
```

---

## 解析ロジック概要

1. `lcov-path` で指定したファイルを読み込み `lcov-parse` でパース。
2. 行・関数・ブランチ等の hit / found を集計し `JsonSummary` 形式へマッピング。
3. 総合パーセンテージを算出し、Markdown テーブルを構築。
4. PR コメントを作成／更新（ヘッダー一致で自分のコメントを特定）。
5. `min-coverage` 未達の場合 `core.setFailed()` でジョブ失敗。

---

## ビルドタスク例

```bash
bunx tsc
bunx esbuild src/index.ts \
  --bundle --platform=node --target=node20 \
  --outfile=dist/index.js
```

※ Node 20 Runtime を利用するため、`--target=node20` を指定。

---

## サンプル GitHub Workflow (`.github/workflows/test.yml`)

```yaml
name: Test (Bun + Coverage)

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.2.x"
      - run: bun install --frozen-lockfile
      - name: Run Bun tests with LCOV
        run: >
          bun test --coverage --coverage-reporter=lcov \
                   --coverage-dir=coverage
      - name: Report coverage
        uses: ./.github/actions/bun-coverage-report-action
        with:
          lcov-path: coverage/lcov.info
          min-coverage: 80
```

---

## 今後の拡張計画（任意）

- **差分カバレッジ**: `octokit.rest.pulls.files` で変更ファイルを取得し比較。
- **Step Summary 出力**: `$GITHUB_STEP_SUMMARY` に同内容を追記。
- **HTML レポート**: `bun test --coverage-reporter=html` + `actions/upload-artifact`。
- **バッジ生成**: `shields.io` の静的 JSON を更新し README へ表示。

---

### 完了条件

1. Pull Request にカバレッジコメントが自動投稿される。
2. 同一 PR で再実行した場合はコメントを更新する。
3. 閾値未満でワークフロー全体が失敗する。

---

> このドキュメントは Claude Code へ共有する要件仕様書として作成したものです。
