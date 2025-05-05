
/// <reference path="../types/hm_jsmode.d.ts" />


// HmConvAIWeb.js 共通ライブラリ。 v 1.1.0.1
// 全「Hm*****Web」シリーズで共通。

// このdllのソースも全「Hm****Web」シリーズで共通であるが、ファイル名とGUIDだけ違う。
var com = createobject(`${currentMacroDirectory}\\${renderPaneTargetName}.dll`, `${renderPaneTargetName}.${renderPaneTargetName}`);

// エラーメッセージ用
function outputAlert(msg) {
    if (msg == null) { return; }
    if (msg == "") { return; }
    const dll = loaddll("HmOutputPane.dll");
    msg = msg.toString().replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
    dll.dllFuncW.OutputW(hidemaru.getCurrentWindowHandle(), msg + "\r\n");
}


// 前回分が実行されずに溜まっていたら除去
var timeHandleOfWindowCloseCheck;
if (typeof (timeHandleOfWindowCloseCheck) != "undefined") {
    hidemaru.clearTimeout(timeHandleOfWindowCloseCheck);
}

// AIウィンドウを１つだけに絞る処理(他のAIシリーズがレンダリングペイン実装なので無理やり辻褄をあわせている)
function oneAIWindowFrameCheck() {

    if (!isOneAtTimeAIRenderPane) {
        return;
    }

    try {

        let lastAiRenderPaneTargetName = getstaticvariable("OneAtTimeAIRenderPane", 2);

        // 自分だよ、何もしない。
        if (lastAiRenderPaneTargetName == renderPaneTargetName) {
            return;
        }

        // 他のAIマクロがAIパネル枠を利用しているなら、閉じる
        if (lastAiRenderPaneTargetName) {
            const param = {
                target: lastAiRenderPaneTargetName,
                show: 0,
            };

            renderpanecommand(param);
        }
    } catch (err) {
        outputAlert(err);
    }
}

// AIウィンドウを１つだけに絞る処理情報の上書き
function oneAIWindowFrameUpdate() {

    if (!isOneAtTimeAIRenderPane) {
        return;
    }

    setstaticvariable("OneAtTimeAIRenderPane", renderPaneTargetName, 2);

    timeHandleOfWindowCloseCheck = hidemaru.setTimeout(oneAIWindowCloseCheck, 300);
}


// 自分自身でAIウィンドウを終了するかチェック継続
// 本来なら他のAIシリーズがクローズするのであるが、
// Hm*****Webはレンダリングペイン実装ではなく、個別ブラウザ枠実装なので無理やり辻褄をあわせている
function oneAIWindowCloseCheck() {

    // 他のAIシリーズのウィンドウが開かれていたら、
    let lastAiRenderPaneTargetName = getstaticvariable("OneAtTimeAIRenderPane", 2);

    // 同じということは状況が継続している。
    if (lastAiRenderPaneTargetName == renderPaneTargetName) {
        timeHandleOfWindowCloseCheck = hidemaru.setTimeout(oneAIWindowCloseCheck, 300);
        return;
    }

    // クローズタイマーは無意味になってるので終了
    hidemaru.clearTimeout(timeHandleOfWindowCloseCheck);

    // 個別ブラウザ枠が、このAIだと思われるならば、
    let url = browserpanecommand({
        "target": "_each",
        "get": "url",
    });

    // 新たなAIがWebならなにもしない。同じ個別ブラウザで開かれるだろうから
    if (lastAiRenderPaneTargetName.endsWith("Web")) {
        return;
    }

    // 個別ブラウザ枠がこのAIのサイトならば、閉じる(万全ではないが、まぁ仕方がないだろう)
    if (url.includes(baseUrl)) {
        browserpanecommand({
            target: "_each",
            show: 0
        });
    }

}

// ブラウザウィンドウオープン
function openRenderPaneCommand(text) {

    try {
        // 個別ブラウザ枠が、このAIのウィンドウだと思われるならば、
        let url = browserpanecommand({
            "target": "_each",
            "get": "url",
        });

        // 開かれていない時だけ...
        if (!url.includes(baseUrl)) {

            let firstParam = {};
            if (typeof (firstParamDecorator) == "function") {
                firstParam = firstParamDecorator(baseUrl, text);
            }

            let renderPaneOriginalParam = {
                url: baseUrl,
                target: "_each",
                initialize: "async",
                show: 1
            };

            const browserPaneMixParam = { ...renderPaneOriginalParam, ...renderPaneCustomParam, ...firstParam };

            // 現在のサイズとプレースと同じであれば、再度送信する意味がない(ピクっとしてしまうのを防止）
            let currentSize = browserpanecommand({target: "_each", get:"size"});
            let currentPlace = browserpanecommand({target: "_each", get:"place"});
            if (browserPaneMixParam.size == currentSize && browserPaneMixParam.place == currentPlace) {
                browserPaneMixParam.size = undefined;
                browserPaneMixParam.place = undefined;
            }

            browserpanecommand(browserPaneMixParam);

            // 最初のオープンの時は、処理を継続するな、という関数が定義してあれば、
            if (typeof (notContinueIfFirstAIConversation) == "function" && notContinueIfFirstAIConversation()) {
                return;
            }
        } else {
            focusInputField();
            
            // ２回目の実行以降のパラメータという意味のメソッド名を３つ
            let secondParam = {};
            if (typeof (secondParamDecorator) == "function") {
                secondParam = secondParamDecorator(baseUrl, text);
            }
            let browserPaneMixParam = { ...{ target: "_each" }, ...renderPaneCustomParam, ...secondParam };

            // 現在のサイズとプレースと同じであれば、再度送信する意味がない(ピクっとしてしまうのを防止）
            let currentSize = browserpanecommand({target: "_each", get:"size"});
            let currentPlace = browserpanecommand({target: "_each", get:"place"});
            if (browserPaneMixParam.size == currentSize && browserPaneMixParam.place == currentPlace) {
                browserPaneMixParam.size = undefined;
                browserPaneMixParam.place = undefined;
            }

            browserpanecommand(browserPaneMixParam);
        }

        hidemaru.setTimeout(waitBrowserPane, 0, text);

    } catch (err) {
        outputAlert(err);
    }
}


function waitBrowserPane(text) {
    const status = browserpanecommand({
        target: "_each",
        get: "readyState"
    });

    let waitTimeout = null;
    if (typeof(waitBrowserPaneDecorator)=="function") {
        waitTimeout = waitBrowserPaneDecorator(status);
    }
    

    if (status == "complete") {
        if (waitTimeout && waitTimeout > 500) {
            timeHandleOfDoMain = hidemaru.setTimeout(onCompleteBrowserPane, waitTimeout, text);
        } else {
            timeHandleOfDoMain = hidemaru.setTimeout(onCompleteBrowserPane, 500, text);
        }
    }

    else {
        if (waitTimeout && waitTimeout > 500) {
            timeHandleOfDoMain = hidemaru.setTimeout(waitBrowserPane, waitTimeout, text);
        } else {
            timeHandleOfDoMain = hidemaru.setTimeout(waitBrowserPane, 500, text);
        }
    }
}

function sendCtrlV() {
    try {
        com.SendCtrlVSync();
    } catch (e) { }
}

function sendReturn() {
    try {
        com.SendReturnSync();
    } catch (e) { }
}

function sendTab() {
    try {
        com.SendTabSync();
    } catch (e) { }
}

function onCompleteBrowserPane(text) {
    try {
        setFocusToBrowserPane();
        browserpanecommand({
            target: "_each",
            "focusinputfield": 1,
        });
        com.CaptureForBrowserPane(text);


        function nextProcedure() {
            if (typeof (onCompleteBrowserPaneDecorator) == "function") {
                onCompleteBrowserPaneDecorator(text);
            }
            timeHandleOfDoMain = hidemaru.setTimeout(onEndQuestionToAI, 200);
        }

        // キー送信を開始する前に、デコレータによるキー送信がある。
        if (typeof (onPrevKeySendDecorator) == "function") {
            onPrevKeySendDecorator();
        }

        setFocusToBrowserPane();
        timeHandleOfDoMain = hidemaru.setTimeout(
            () => {
                setFocusToBrowserPane();
                sendCtrlV();
                timeHandleOfDoMain = hidemaru.setTimeout(
                    () => {
                        setFocusToBrowserPane();
                        sendReturn();
                        nextProcedure();
                    }, 300);
            }, 300);
    } catch (err) {
        outputAlert(err);
    } finally {
    }
}

function setFocusToBrowserPane() {
    browserpanecommand({
        target: "_each",
        focus: 1
    });
}

var orgFocus = getfocus();
async function onEndQuestionToAI() {
    setfocus(orgFocus);

    // 再実行してもここまで来てたらこれはやめないよっと。
    restoreClipBoard()

    /*
    // ２つ履歴が増えるので消してしまう
    timeHandleOfDoMain = hidemaru.setTimeout(() => {
        hidemaru.postExecMacroMemory( "clearcliphist 0; clearcliphist 0;" );
    }, 0);
    */
}

var processInfoFocus;
processInfoFocus?.kill();

function focusInputField() {
    var command = currentMacroDirectory + "\\HmFocusEachBrowserInputField.exe " + hidemaru.getCurrentWindowHandle();
    processInfoFocus = hidemaru.runProcess(command, ".", "stdio", "utf8");
    if (!processInfoFocus) {
        if (typeof (focusInputFieldFailDecorator) == "function") {
            focusInputFieldFailDecorator();
        }
        return;
    }

    processInfoFocus.stdOut.onReadLine((text)=> {
        if (typeof (focusInputSuccessDecorator) == "function") {
            focusInputSuccessDecorator();
        }
    });

    processInfoFocus.stdErr.onReadLine((text)=> {
        if (typeof (focusInputFailDecorator) == "function") {
            focusInputFailDecorator();
        }
    });
    
}


function execEndMacroDecorator() {
    if (typeof (onEndMacroDecorator) == "function") {
        onEndMacroDecorator();
    }
}


function captureClipBoard() {
    try {
        com.CaptureClipboard();
    } catch (e) { }
}

function restoreClipBoard() {

    try {
        // Windows 10 の 1809 以降にはクリップボード履歴がある
        let processInfo = hidemaru.runProcess(currentMacroDirectory + "\\ClipboardHistMngr.exe", ".", "stdio", "sjis");
        if (processInfo) {
            processInfo.onClose = function () {
                try {
                    // 普通のクリップボードの復元
                    com.RestoreClipboard();
                    if (processInfo) {
                        processInfo.kill();
                        processInfo = null;
                    }
                } catch (e) {
                } finally {
                    execEndMacroDecorator();
                }
            }
        } else {
            execEndMacroDecorator();
        }
    } catch (e) { }
}

function getQuestionText() {

    // 外部からカスタムで定義されている。
    if (typeof (onRequestQuestionText) == "function") {
        return onRequestQuestionText();
    }

    return getselectedtext();
}

// 前回分が実行されずに溜まっていたら除去
var timeHandleOfDoMain;
if (typeof (timeHandleOfDoMain) != "undefined") {
    hidemaru.clearTimeout(timeHandleOfDoMain);
}

// メイン処理
function doMain() {

    // 質問内容のテキスト。外部マクロからquestion内容を上書きしやすいようにするため、ここだけ同期
    let text = getQuestionText();
    if (!text) {
        return;
    }

    timeHandleOfDoMain = hidemaru.setTimeout(doAsyncAction, 0, text);
}

// 秀丸の同期スレッドに負荷をかけないため、非同期に逃がす
function doAsyncAction(text) {
    // AIウィンドウフレームに絞るかどうか
    oneAIWindowFrameCheck();

    // ブラウザウィンドウ開く
    openRenderPaneCommand(text);

    // AIウィンドウフレーム情報更新
    oneAIWindowFrameUpdate();
}

