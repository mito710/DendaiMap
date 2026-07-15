const API_URL = "https://dendaimap.onrender.com/route";

let nodes = [];
let nodeMap = new Map();

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();

  document
    .getElementById("searchButton")
    .addEventListener("click", searchRoute);

  document
    .getElementById("swapButton")
    .addEventListener("click", swapLocations);

  document.getElementById("startBuilding").addEventListener("change", () => {
    updateFloorOptions("start");
  });

  document.getElementById("startFloor").addEventListener("change", () => {
    updateLocationOptions("start");
  });

  document.getElementById("goalBuilding").addEventListener("change", () => {
    updateFloorOptions("goal");
  });

  document.getElementById("goalFloor").addEventListener("change", () => {
    updateLocationOptions("goal");
  });
});

/**
 * 初期処理
 */
async function initializeApp() {
  showMessage("地点情報を読み込んでいます。", "normal");

  try {
    const mappingData = await loadMappingData();

    nodes = mappingData.nodes;

    createNodeMap();
    createBuildingOptions();

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
 * 地点IDから地点情報を取得できるようにする
 */
function createNodeMap() {
  nodeMap = new Map();

  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
  });
}

/**
 * 号館のプルダウンを作成する
 */
function createBuildingOptions() {
  const buildingNumbers = [
    ...new Set(nodes.map((node) => node.buildingNumber)),
  ].sort((a, b) => a - b);

  const startBuilding = document.getElementById("startBuilding");
  const goalBuilding = document.getElementById("goalBuilding");

  buildingNumbers.forEach((buildingNumber) => {
    startBuilding.appendChild(
      createOption(buildingNumber, `${buildingNumber}号館`),
    );

    goalBuilding.appendChild(
      createOption(buildingNumber, `${buildingNumber}号館`),
    );
  });
}

/**
 * 選択された号館に応じて階数を表示する
 */
function updateFloorOptions(prefix) {
  const buildingSelect = document.getElementById(`${prefix}Building`);

  const floorSelect = document.getElementById(`${prefix}Floor`);

  const locationSelect = document.getElementById(prefix);

  const selectedBuilding = Number(buildingSelect.value);

  resetSelect(floorSelect, "階数を選択");
  resetSelect(locationSelect, "地点を選択");

  locationSelect.disabled = true;

  if (!buildingSelect.value) {
    floorSelect.disabled = true;
    return;
  }

  const floors = [
    ...new Set(
      nodes
        .filter((node) => node.buildingNumber === selectedBuilding)
        .map((node) => node.floor),
    ),
  ].sort((a, b) => a - b);

  floors.forEach((floor) => {
    floorSelect.appendChild(createOption(floor, `${floor}階`));
  });

  floorSelect.disabled = false;

  hideResult();
}

/**
 * 選択された号館・階数に応じて地点を表示する
 */
function updateLocationOptions(prefix) {
  const buildingSelect = document.getElementById(`${prefix}Building`);

  const floorSelect = document.getElementById(`${prefix}Floor`);

  const locationSelect = document.getElementById(prefix);

  const selectedBuilding = Number(buildingSelect.value);
  const selectedFloor = Number(floorSelect.value);

  resetSelect(locationSelect, "地点を選択");

  if (!floorSelect.value) {
    locationSelect.disabled = true;
    return;
  }

  const filteredNodes = nodes
    .filter(
      (node) =>
        node.buildingNumber === selectedBuilding &&
        node.floor === selectedFloor,
    )
    .sort((a, b) => {
      if (a.type === "room" && b.type !== "room") {
        return -1;
      }

      if (a.type !== "room" && b.type === "room") {
        return 1;
      }

      return a.name.localeCompare(b.name, "ja");
    });

  filteredNodes.forEach((node) => {
    locationSelect.appendChild(
      createOption(node.id, getLocationDisplayName(node)),
    );
  });

  locationSelect.disabled = false;

  hideResult();
}

/**
 * 地点名の表示
 */
function getLocationDisplayName(node) {
  switch (node.type) {
    case "room":
      return node.name;

    case "elevator":
      return `エレベーター｜${node.name}`;

    case "escalator":
      return `エスカレーター｜${node.name}`;

    case "stair":
      return `階段｜${node.name}`;

    default:
      return node.name;
  }
}

/**
 * option要素を作成する
 */
function createOption(value, text) {
  const option = document.createElement("option");

  option.value = value;
  option.textContent = text;

  return option;
}

/**
 * selectを初期状態に戻す
 */
function resetSelect(selectElement, placeholder) {
  selectElement.innerHTML = "";

  const option = document.createElement("option");

  option.value = "";
  option.textContent = placeholder;

  selectElement.appendChild(option);
}

/**
 * 最初に表示する地点
 */
function setInitialLocation() {
  setLocationSelection("start", 2, 9, "Room2903");
  setLocationSelection("goal", 2, 10, "Room21003");
}

/**
 * 号館・階数・地点をまとめて選択する
 */
function setLocationSelection(prefix, buildingNumber, floor, locationId) {
  const buildingSelect = document.getElementById(`${prefix}Building`);

  const floorSelect = document.getElementById(`${prefix}Floor`);

  const locationSelect = document.getElementById(prefix);

  buildingSelect.value = String(buildingNumber);

  updateFloorOptions(prefix);

  floorSelect.value = String(floor);

  updateLocationOptions(prefix);

  locationSelect.value = locationId;
}

/**
 * 出発地と目的地を入れ替える
 */
function swapLocations() {
  const startNode = nodeMap.get(document.getElementById("start").value);

  const goalNode = nodeMap.get(document.getElementById("goal").value);

  if (!startNode || !goalNode) {
    showMessage("出発地と目的地をすべて選択してください。", "error");
    return;
  }

  setLocationSelection(
    "start",
    goalNode.buildingNumber,
    goalNode.floor,
    goalNode.id,
  );

  setLocationSelection(
    "goal",
    startNode.buildingNumber,
    startNode.floor,
    startNode.id,
  );

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
    showMessage("号館・階数・地点をすべて選択してください。", "error");
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
 * 検索結果を表示する
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
 * 地点種別のアイコン
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
 * 秒を分・秒に変換する
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
