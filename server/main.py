import json
import networkx as nx
from pathlib import Path
from fastapi import FastAPI  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from pydantic import BaseModel  # type: ignore

# python -m uvicorn main:app --reload

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://あなたのGitHubユーザー名.github.io"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class RouteRequest(BaseModel):
    start: str
    goal: str
    allowStairs: bool
    priority: str


@app.get("/")
def root():
    return {"message": "Campus Route API"}


@app.post("/route")
def route(request: RouteRequest):
    return find_route(
        request.start,
        request.goal,
        request.allowStairs,
        request.priority
    )


def find_route(start, goal, allow_stairs, priority):
    graph = G.copy()
    try:
        if not allow_stairs:
            for u, v, data in graph.edges(data=True):
                if data["edge_type"] == "stair":
                    data["time_weight"] += 10000
                    data["distance"] += 10000

        if priority == "distance":
            weight = "distance"
        else:
            weight = "time_weight"
        path_cal = nx.shortest_path(
            graph,
            source=start,
            target=goal,
            weight=weight
        )

        time_cal = calculate_time(graph, path_cal)
        distance_cal = calculate_distance(graph, path_cal)

        return {
            "path": path_cal,
            "distance": round(distance_cal, -1),
            "time": round(time_cal, 1)
        }

    except nx.NetworkXNoPath:
        return {
            "path": "経路が存在しません",
            "distance": "エラー",
            "time": "エラー"
        }
    except nx.NodeNotFound:
        return {
            "path": "指定された地点が存在しません",
            "distance": "エラー",
            "time": "エラー"
        }


def calculate_time(graph, path):
    time = 0.0

    for i in range(len(path)-1):
        time += graph[path[i]][path[i+1]]["time_weight"]

    return time


def calculate_distance(graph, path):
    distance = 0.0
    for i in range(len(path) - 1):
        distance += graph[path[i]][path[i + 1]]["distance"]

    return distance


walking_speed = 1.5  # m/s
G = nx.Graph()

BASE_DIR = Path(__file__).resolve().parent.parent
mapping_path = BASE_DIR / "data" / "mapping.json"

with open(mapping_path, encoding="utf-8") as file_mapping:
    data = json.load(file_mapping)

for node in data["nodes"]:
    G.add_node(
        node["id"],
        name=node["name"],
        type=node["type"],
        building_number=node["buildingNumber"],
        floor=node["floor"]
    )

for edge in data["edges"]:
    time_weight = edge["distance"] / walking_speed + edge["waitTime"]

    G.add_edge(
        edge["from"],
        edge["to"],
        time_weight=time_weight,
        distance=edge["distance"],
        wait_time=edge["waitTime"],
        closed=edge["closed"],
        crowded=edge["crowded"],
        accessible=edge["accessible"],
        edge_type=edge["edgeType"]
    )

# result = find_route("Room2903", "Room21003")
# print(result)
