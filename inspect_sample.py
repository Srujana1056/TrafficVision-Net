
import tarfile
from pathlib import Path

archive = Path(
    "traffic_subset/downloads/data/train-00000-of-00646.tar"
)

if not archive.exists():
    raise FileNotFoundError(f"Archive not found: {archive}")

with tarfile.open(archive, "r") as tar:
    members = tar.getmembers()

    print("Total archive entries:", len(members))

    for member in members[:20]:
        print(member.name, "-", round(member.size / 1024, 1), "KB")

    jpgs = [m for m in members if m.name.lower().endswith(".jpg")]
    jsons = [m for m in members if m.name.lower().endswith(".json")]
    pngs = [m for m in members if m.name.lower().endswith(".png")]

    print("\nJPG images:", len(jpgs))
    print("JSON files:", len(jsons))
    print("PNG masks:", len(pngs))
