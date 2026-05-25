"""Persistent dataset store — saves to disk as CSV + JSON metadata."""
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "datasets"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def _csv_path(dataset_id: str) -> Path:
    return DATA_DIR / f"{dataset_id}.csv"


def _meta_path(dataset_id: str) -> Path:
    return DATA_DIR / f"{dataset_id}.json"


def _load_entry(dataset_id: str) -> Optional[dict]:
    meta = _meta_path(dataset_id)
    csv = _csv_path(dataset_id)
    if not meta.exists() or not csv.exists():
        return None
    with open(meta) as f:
        entry = json.load(f)
    entry["df"] = pd.read_csv(csv,engine="pyarrow", low_memory=False)
    return entry


class DatasetStore:
    def __init__(self):
        self._datasets: dict[str, dict] = {}
        self._load_from_disk()

    def _load_from_disk(self):
        for meta_file in DATA_DIR.glob("*.json"):
            dataset_id = meta_file.stem
            try:
                entry = _load_entry(dataset_id)
                if entry:
                    self._datasets[dataset_id] = entry
            except Exception:
                pass

    def _persist(self, entry: dict):
        dataset_id = entry["id"]
        entry["df"].to_csv(_csv_path(dataset_id), index=False)
        meta = {k: v for k, v in entry.items() if k != "df"}
        with open(_meta_path(dataset_id), "w") as f:
            json.dump(meta, f)

    def save(self, df: pd.DataFrame, filename: str, format: str, encoding: str) -> dict:
        dataset_id = str(uuid.uuid4())
        MAX_ROWS = 50_000
        is_sampled = len(df) > MAX_ROWS
        if is_sampled:
            df = df.sample(n=MAX_ROWS, random_state=42).reset_index(drop=True)

        entry = {
            "id": dataset_id,
            "filename": filename,
            "rows": len(df),
            "cols": len(df.columns),
            "size_mb": round(df.memory_usage(deep=True).sum() / 1024 / 1024, 3),
            "format": format,
            "encoding": encoding,
            "is_sampled": is_sampled,
            "sample_size": MAX_ROWS if is_sampled else None,
            "created_at": datetime.utcnow().isoformat(),
            "df": df,
        }
        self._datasets[dataset_id] = entry
        self._persist(entry)
        return self._info(entry)

    def get(self, dataset_id: str) -> Optional[dict]:
        return self._datasets.get(dataset_id)

    def get_df(self, dataset_id: str) -> Optional[pd.DataFrame]:
        entry = self._datasets.get(dataset_id)
        return entry["df"] if entry else None

    def update_df(self, dataset_id: str, df: pd.DataFrame):
        entry = self._datasets.get(dataset_id)
        if not entry:
            return
        entry["df"] = df
        entry["rows"] = len(df)
        entry["cols"] = len(df.columns)
        entry["size_mb"] = round(df.memory_usage(deep=True).sum() / 1024 / 1024, 3)
        self._persist(entry)

    def delete(self, dataset_id: str) -> bool:
        if dataset_id in self._datasets:
            del self._datasets[dataset_id]
            _csv_path(dataset_id).unlink(missing_ok=True)
            _meta_path(dataset_id).unlink(missing_ok=True)
            return True
        return False

    def list_all(self) -> list[dict]:
        return [self._info(e) for e in self._datasets.values()]

    def _info(self, entry: dict) -> dict:
        return {k: v for k, v in entry.items() if k != "df"}


store = DatasetStore()
