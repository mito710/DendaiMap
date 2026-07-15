const API_URL = "https://dendaimap.onrender.com/route";

let nodeMap = new Map();

document.addEventListener("DOMContentLoaded", () => {
    initializeApp();

    document
        .getElementById("searchButton")
        .addEventListener("click", searchRoute);

    document
        .getElementById("swapButton")
        .addEventListener("click", swapLocations);
});

/**
 * 初期処理
 */
async function initializeApp() {
    showMessage("地点情報を読み込んでいます。", "normal");

    try {
        const mappingData = await loadMappingData();

        createNodeMap(mappingData.nodes);
        createLocationOptions(mappingData.nodes);

        setInitialLocation();

        showMessage("", "normal");
    } catch (error) {
        console.error(error);

        showMessage(
            "地点情報を読み込めませんでした。mapping.jsonの配置を確認してください。",
            "error",
        );
    }
}

/**
 * mapping.jsonを読み込む
 *
 * Live Serverでリポジトリ全体を開いた場合:
 * ../data/mapping.json
 *
 * docs内にdataフォルダを作った場合:
 * ./data/mapping.json
 */
async function loadMappingData() {
    const mappingPaths = ["../data/mapping.json", "./data/mapping.json"];

    for (const path of mappingPaths) {
        try {
            const response = await fetch(path);

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn(`${path}を読み込めませんでした。`, error);
        }
    }

    throw new Error("mapping.jsonが見つかりません。");
}

/**
 * IDから地点情報を取り出せるようにする
 */
function createNodeMap(nodes) {
    nodeMap = new Map();

    nodes.forEach((node) => {
        nodeMap.set(node.id, node);
    });
}

/**
 * 出発地・目的地の選択肢を作成する
 */
function createLocationOptions(nodes) {
    const startSelect = document.getElementById("start");
    const goalSelect = document.getElementById("goal");

    const sortedNodes = [...nodes].sort((a, b) => {
        if (a.floor !== b.floor) {
            return a.floor - b.floor;
        }

        return a.name.localeCompare(b.name, "ja");
    });

    sortedNodes.forEach((node) => {
        const startOption = createOption(node);
        const goalOption = createOption(node);

        startSelect.appendChild(startOption);
        goalSelect.appendChild(goalOption);
    });
}

/**
 * selectのoptionを作成する
 */
function createOption(node) {
    const option = document.createElement("option");

    option.value = node.id;
    option.textContent = `${node.buildingNumber}号館 ${node.floor}階｜${node.name}`;

    return option;
}

/**
 * 最初から選択しておく地点
 */
function setInitialLocation() {
    document.getElementById("start").value = "Room2903";
    document.getElementById("goal").value = "Room21003";
}

/**
 * 出発地と目的地を入れ替える
 */
function swapLocations() {
    const startSelect = document.getElementById("start");
    const goalSelect = document.getElementById("goal");

    const temporaryValue = startSelect.value;

    startSelect.value = goalSelect.value;
    goalSelect.value = temporaryValue;

    hideResult();
    showMessage("出発地と目的地を入れ替えました。", "normal");
}

/**
 * 経路検索
 */
async function searchRoute() {
    const start = document.getElementById("start").value;
    const goal = document.getElementById("goal").value;
    const searchButton = document.getElementById("searchButton");

    hideResult();

    if (!start || !goal) {
        showMessage("出発地と目的地を選択してください。", "error");
        return;
    }

    if (start === goal) {
        showMessage("出発地と目的地に異なる地点を選択してください。", "error");
        return;
    }

    searchButton.disabled = true;
    searchButton.textContent = "検索中...";

    showMessage("最短経路を検索しています。", "normal");

    try {
        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                start: start,
                goal: goal,
            }),
        });

        if (!response.ok) {
            throw new Error(`通信エラー: ${response.status}`);
        }

        const result = await response.json();

        if (!Array.isArray(result.path)) {
            throw new Error(result.path || "経路を取得できませんでした。");
        }

        displayRoute(result, start, goal);

        showMessage("経路が見つかりました。", "success");
    } catch (error) {
        console.error(error);

        showMessage(`経路検索に失敗しました。${error.message}`, "error");
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = "経路を検索";
    }
}

/**
 * 検索結果を画面に表示する
 */
function displayRoute(result, startId, goalId) {
    const resultArea = document.getElementById("resultArea");
    const routeList = document.getElementById("routeList");

    const startNode = nodeMap.get(startId);
    const goalNode = nodeMap.get(goalId);

    document.getElementById("distanceResult").textContent =
        `${result.distance} m`;

    document.getElementById("timeResult").textContent = formatTime(result.time);

    document.getElementById("startResult").textContent =
        startNode?.name || startId;

    document.getElementById("goalResult").textContent = goalNode?.name || goalId;

    routeList.innerHTML = "";

    result.path.forEach((nodeId, index) => {
        const node = nodeMap.get(nodeId);
        const listItem = document.createElement("li");

        listItem.className = "route-item";

        const icon = document.createElement("span");
        icon.className = "route-icon";
        icon.textContent = getNodeIcon(node);

        const textArea = document.createElement("div");
        textArea.className = "route-text";

        const nodeName = document.createElement("strong");
        nodeName.textContent = node?.name || nodeId;

        const nodeDetail = document.createElement("span");

        if (index === 0) {
            nodeDetail.textContent = "出発地点";
        } else if (index === result.path.length - 1) {
            nodeDetail.textContent = "目的地に到着";
        } else {
            nodeDetail.textContent = `${node?.buildingNumber || "-"}号館 ${node?.floor || "-"}階`;
        }

        textArea.appendChild(nodeName);
        textArea.appendChild(nodeDetail);

        listItem.appendChild(icon);
        listItem.appendChild(textArea);

        routeList.appendChild(listItem);
    });

    resultArea.classList.remove("hidden");
}

/**
 * 地点の種類に応じたアイコン
 */
function getNodeIcon(node) {
    if (!node) {
        return "●";
    }

    switch (node.type) {
        case "room":
            return "教";

        case "elevator":
            return "EV";

        case "escalator":
            return "ES";

        case "stair":
            return "階";

        default:
            return "●";
    }
}

/**
 * 秒数を読みやすく変換する
 */
function formatTime(seconds) {
    const totalSeconds = Math.round(Number(seconds));

    if (totalSeconds < 60) {
        return `約${totalSeconds}秒`;
    }

    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    if (remainingSeconds === 0) {
        return `約${minutes}分`;
    }

    return `約${minutes}分${remainingSeconds}秒`;
}

/**
 * メッセージ表示
 */
function showMessage(text, type) {
    const message = document.getElementById("message");

    message.textContent = text;
    message.className = `message ${type}`;
}

/**
 * 結果を非表示にする
 */
function hideResult() {
    document.getElementById("resultArea").classList.add("hidden");
}
