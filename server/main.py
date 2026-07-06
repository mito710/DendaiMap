import json
import networkx as nx

def find_route(start, goal):
    try:
        path_cal = nx.shortest_path(
            G,
            source=start,
            target=goal,
            weight="time_weight"
        )

        time_cal = calculate_time(path_cal)
        distance_cal = calculate_distance(path_cal)

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
    
def calculate_time(path):
    time = 0.0

    for i in range(len(path)-1):
        time += G[path[i]][path[i+1]]["time_weight"]

    return time
    
def calculate_distance(path):
    distance = 0.0
    for i in range(len(path) - 1):
        distance += G[path[i]][path[i + 1]]["distance"]

    return distance

walking_speed = 1.5  # m/s
G = nx.Graph()

with open("data/mapping.json", encoding="utf-8") as file_mapping:
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

result = find_route("Room2903", "Room21003")

print(result)
