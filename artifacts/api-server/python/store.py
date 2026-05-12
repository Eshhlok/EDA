"""In-memory dataset store."""
import uuid
from datetime import datetime
from typing import Optional
import pandas as pd

class DatasetStore:
    def __init__(self):
        self._datasets: dict[str, dict] = {}

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
        return self._info(entry)

    def get(self, dataset_id: str) -> Optional[dict]:
        return self._datasets.get(dataset_id)

    def get_df(self, dataset_id: str) -> Optional[pd.DataFrame]:
        entry = self._datasets.get(dataset_id)
        return entry["df"] if entry else None

    def delete(self, dataset_id: str) -> bool:
        if dataset_id in self._datasets:
            del self._datasets[dataset_id]
            return True
        return False

    def list_all(self) -> list[dict]:
        return [self._info(e) for e in self._datasets.values()]

    def _info(self, entry: dict) -> dict:
        return {k: v for k, v in entry.items() if k != "df"}


store = DatasetStore()
