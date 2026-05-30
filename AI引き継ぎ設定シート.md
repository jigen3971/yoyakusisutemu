# AI 引き継ぎ設定シート
## heart break 三 / 中牟田さん 開発環境

---

## 【基本プロフィール】
- 名前：中牟田
- GitHubアカウント：jigen3971
- Xserverアカウント：bellkikaku（サーバーID）
- サーバー番号：sv12549
- 主なドメイン一覧：
  - nakamuta.xyz
  - jigen3971.xyz
  - japaneselanguage.xyz
  - fujimii.wiki
  - sanhanguru.net

---

## 【開発環境】
- PC：Mac（Mac mini）
- コードエディタ：Visual Studio Code
- バージョン管理：GitHub Desktop
- ローカルリポジトリの場所：`~/Documents/GitHub/`
- ターミナル：zsh（標準ターミナル）

---

## 【Xserver デプロイ設定】

### FTP情報（GitHub Secretsに登録済み）
| Secret名 | 値 |
|----------|----|
| FTP_SERVER | sv12549.xserver.jp |
| FTP_USERNAME | bellkikaku |
| FTP_PASSWORD | ※本人のみ把握 |

### デプロイの仕組み
- GitHub の main ブランチに Push → 自動で Xserver にFTPデプロイ
- 使用ツール：`SamKirkland/FTP-Deploy-Action@v4.3.5`

### deploy.yml の場所
`.github/workflows/deploy.yml`

### deploy.yml のテンプレート
```yaml
name: Xserver FTP Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: リポジトリをチェックアウト
        uses: actions/checkout@v4

      - name: Xserver に FTP デプロイ
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          server-dir: /【ドメイン名】/public_html/
          local-dir: ./
          exclude: |
            **/.git*
            **/.git*/**
            **/node_modules/**
            README.md
```

※ `server-dir` の【ドメイン名】部分をデプロイ先ドメインに変更する

---

## 【新しいアプリを作る時の手順】

1. `https://github.com/new` でリポジトリ作成
   - "Repository template" で `yoyakusisutemu` を選択
2. GitHub Desktopでクローン
3. `deploy.yml` の `server-dir` をデプロイ先ドメインに変更
4. GitHubリポジトリの Settings → Secrets → Actions に3つ登録
   - FTP_SERVER / FTP_USERNAME / FTP_PASSWORD（値は毎回同じ）
5. Push するだけで自動デプロイ完了！

---

## 【主なリポジトリ一覧】
| リポジトリ名 | 内容 |
|-------------|------|
| yoyakusisutemu | 予約システム（テンプレートリポジトリ） |
| daisha-app | 代車アプリ |
| daisha-app-v2 | 代車アプリv2 |
| daisha-kun-simple | 代車くんシンプル版 |
| goyoukiki01 | ご用聞きアプリ |
| hospital-app | 病院アプリ |
| n3-grammar-app | N3文法アプリ |
| n3-grammar-v2 | N3文法アプリv2 |
| syaken01 | 車検アプリ |
| syuccho-repair | 出張修理アプリ |

---

## 【heart break 三 カフェ情報】
- サイト名：heart break 三
- キャッチコピー：クミニャンカレーを覚えて帰るカフェ
- 場所：福島県郡山市
- 営業時間：11:00〜18:00
- 定休日：火曜日・第2日曜日
- TEL：024-000-1234
- MAIL：info@heartbreak-cafe.jp
- Instagram：@heartbreak_cafe
- サイトカラー：ライムグリーン × イエロー × ダークネイビー
- 予約種別：食事 / 占い / PC教室（全て完全予約制）

---

## 【予約システム（yoyakusisutemu）の構成】

### デプロイ先
- URL：`https://jigen3971.xyz/reservation/`
- リポジトリ：`yoyakusisutemu`

### ファイル構成
| ファイル | 役割 |
|---------|------|
| index.html | 予約フォーム（食事・占い・PC教室） |
| proxy.php | GASへの中継役（CORS回避のため必須） |
| script.js | JavaScript |
| style.css | スタイル |
| .github/workflows/deploy.yml | 自動デプロイ設定 |

### 予約データの流れ
```
予約フォーム（index.html）
　↓
proxy.php（同じサーバー上）※CORSを回避するため必須
　↓
Google Apps Script（GAS）
　↓ ↓
スプレッドシート記録　＋　LINE通知
```

### GAS設定
- スプレッドシートID：`1iupd_GGxDm3WaP1vF0ovhxX1mYrtiKgy8Izaa8vMRo4`
- シート名：`予約一覧`
- GAS デプロイURL：`https://script.google.com/macros/s/AKfycbzcmJdhFS1MSQ79nL36tUVTpcnjS87FVOuUHGKPPIX23g3VIR4HflOxQRZofpUe5mfp/exec`

### GAS Script Properties（設定値）
| キー | 内容 |
|-----|------|
| LINE_TOKEN | LINEチャネルアクセストークン |
| LINE_USER_ID | 通知を受け取るLINEユーザーID（Uで始まる文字列） |
| LINE_URL | 友だち追加URL（例：https://lin.ee/OiWZie7）※未設定の場合はデフォルト値を使用 |

### GAS appsscript.json（権限設定）
外部通信を使うため以下のスコープが必要：
```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

### お客様のLINEに切り替える時
GAS の Script Properties の値を差し替えるだけでOK：
1. LINE_TOKEN → お客様のチャネルアクセストークン
2. LINE_USER_ID → お客様のLINEユーザーID
3. LINE_URL → お客様の公式LINE友だち追加URL（lin.ee/〜）
※ GASの再デプロイ・コード編集は不要

### LINE友だち追加ボタン（予約完了後に表示）
- 予約送信成功後、画面下に緑の「📲 LINE友だち追加はこちら」ボタンが表示される
- GASが返す `lineUrl` の値を使用（未取得時は LINE_URL のデフォルト値にフォールバック）
- コードの場所：index.html の約900行目付近（fetchのレスポンス処理部分）

### LINE公式アカウント ウェルカムメッセージ
設定場所：[manager.line.biz](https://manager.line.biz) → 応答設定 → あいさつメッセージ

```
heart break 三 公式LINEへようこそ！🍛
ご登録いただきありがとうございます。
こちらのアカウントでは、ご予約の確認・当日のご案内・お店からのお知らせをお届けします。
【営業時間】11:00〜18:00
【定休日】火曜日・第2日曜日
【場所】福島県郡山市
ご予約はこちら👇
https://jigen3971.xyz/reservation/
```

---

## 【AIへの依頼時のポイント】

このシートを冒頭に貼り付けて、以下のように伝えると伝わりやすいです：

```
上記の設定シートを読んでください。
私はMacを使っていてGitHub Desktopで管理しています。
Xserverにデプロイする環境が整っています。
コードはあまり読めないので、わかりやすく説明してください。
今日やりたいことは【ここに作業内容を書く】です。
```

---

*最終更新：2026年5月30日（LINE友だち追加ボタン実装済み・ウェルカムメッセージ設定方法追記）*
