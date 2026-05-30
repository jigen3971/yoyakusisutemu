const SHEET_ID = "1iupd_GGxDm3WaP1vF0ovhxX1mYrtiKgy8Izaa8vMRo4";
const SHEET_NAME = "予約一覧";
const QUIZ_SHEET_ID = "1zKMq7dB4r-N3cqknWil-GC8m1k7miQs2mDBoSknAzEI";
const QUIZ_SHEET_NAME = "学習記録";

function sendLineMessage(message) {
  try {
    const token = PropertiesService.getScriptProperties().getProperty('LINE_TOKEN');
    const userId = PropertiesService.getScriptProperties().getProperty('LINE_USER_ID');
    Logger.log('token: ' + (token ? token.substring(0,10) + '...' : 'なし'));
    Logger.log('userId: ' + userId);
    if (!token || !userId) {
      Logger.log('LINE設定が見つかりません');
      return;
    }
    const url = 'https://api.line.me/v2/bot/message/push';
    const payload = {
      to: userId,
      messages: [{ type: 'text', text: message }]
    };
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log('LINE response: ' + response.getContentText());
  } catch(err) {
    Logger.log('LINE error: ' + err.toString());
  }
}

function doGet(e) {
  const action = e.parameter.action;

  if (action === "book") {
    try {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["受付日時","予約日","種別","時間","スロット数","お名前","人数","電話番号","ご要望","ステータス"]);
      }
      const date      = e.parameter.date      || "";
      const typeLabel = e.parameter.typeLabel  || "";
      const time      = e.parameter.time      || "";
      const duration  = e.parameter.duration  || 1;
      const name      = e.parameter.name      || "";
      const people    = e.parameter.people    || 1;
      const phone     = e.parameter.phone     || "";
      const note      = e.parameter.note      || "";

      sheet.appendRow([new Date(), date, typeLabel, time, duration, name, people, phone, note, "確定"]);

      const msg = "【新規予約が入りました】\n"
        + "種別：" + typeLabel + "\n"
        + "お名前：" + name + "\n"
        + "予約日：" + date + "\n"
        + "時間：" + time + "\n"
        + "人数：" + people + "名\n"
        + "電話：" + (phone || "未記入") + "\n"
        + (note ? "ご要望：" + note : "");

      sendLineMessage(msg);

    } catch(err) {
      Logger.log('エラー: ' + err.toString());
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // LINE URLはスクリプトプロパティから取得（変更時はコード不要・プロパティを更新するだけ）
    const lineUrl = PropertiesService.getScriptProperties().getProperty('LINE_URL') || 'https://lin.ee/OiWZie7';

    return ContentService.createTextOutput(JSON.stringify({
      status: "ok",
      message: "ご予約が確定しました！",
      lineUrl: lineUrl,
      userMessage: "当日のご案内をLINEでお送りします。以下のURLをタップして公式LINEの友だち追加を必ずお願いいたします！\n" + lineUrl
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "quiz") {
    try {
      const ss = SpreadsheetApp.openById(QUIZ_SHEET_ID);
      let sheet = ss.getSheetByName(QUIZ_SHEET_NAME);
      if (!sheet) {
        sheet = ss.insertSheet(QUIZ_SHEET_NAME);
        sheet.appendRow(["受験日時","名前","レッスン番号","レッスン名","スコア","合計問題数","正答率","間違えた問題番号"]);
      }
      const learnerName = e.parameter.learnerName || "（名前なし）";
      const lessonId    = e.parameter.lessonId    || "";
      const lessonTitle = e.parameter.lessonTitle  || "";
      const score       = e.parameter.score        || 0;
      const total       = e.parameter.total        || 0;
      const pct         = e.parameter.pct          || "";
      const wrongNums   = e.parameter.wrongNums    || "";

      sheet.appendRow([new Date(), learnerName, lessonId, lessonTitle, score, total, pct + "%", wrongNums]);

    } catch(err) {
      Logger.log('quiz記録エラー: ' + err.toString());
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "GAS動作中" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function testLine() {
  sendLineMessage("テスト送信：GASからLINEへ");
}

function checkSettings() {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_TOKEN');
  const userId = PropertiesService.getScriptProperties().getProperty('LINE_USER_ID');
  const lineUrl = PropertiesService.getScriptProperties().getProperty('LINE_URL');
  Logger.log('TOKEN長さ: ' + (token ? token.length : 'なし'));
  Logger.log('TOKEN最初の20文字: ' + (token ? token.substring(0,20) : 'なし'));
  Logger.log('USER_ID: ' + userId);
  Logger.log('LINE_URL: ' + (lineUrl || '未設定（デフォルト使用）'));
}
