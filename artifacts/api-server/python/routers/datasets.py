import io
import chardet
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np

from store import store

router = APIRouter(tags=["datasets"])


def _detect_format(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    return ext if ext in ("csv", "xlsx", "json", "parquet", "tsv") else "csv"


def _read_df(content: bytes, filename: str) -> tuple[pd.DataFrame, str, str]:
    fmt = _detect_format(filename)
    detected = chardet.detect(content)
    encoding = detected.get("encoding") or "utf-8"
    if not encoding:
        encoding = "utf-8"

    try:
        if fmt == "csv":
            df = pd.read_csv(io.BytesIO(content), encoding=encoding, low_memory=False)
        elif fmt == "tsv":
            df = pd.read_csv(io.BytesIO(content), sep="\t", encoding=encoding, low_memory=False)
        elif fmt == "xlsx":
            df = pd.read_excel(io.BytesIO(content))
            encoding = "binary"
        elif fmt == "json":
            df = pd.read_json(io.BytesIO(content), encoding=encoding)
        elif fmt == "parquet":
            df = pd.read_parquet(io.BytesIO(content))
            encoding = "binary"
        else:
            df = pd.read_csv(io.BytesIO(content), encoding=encoding, low_memory=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    return df, fmt, encoding


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or "dataset.csv"
    df, fmt, encoding = _read_df(content, filename)
    info = store.save(df, filename, fmt, encoding)
    return info


@router.get("/datasets")
def list_datasets():
    return store.list_all()


@router.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str):
    entry = store.get(dataset_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return entry


@router.delete("/datasets/{dataset_id}", status_code=204)
def delete_dataset(dataset_id: str):
    if not store.delete(dataset_id):
        raise HTTPException(status_code=404, detail="Dataset not found")


@router.get("/datasets/{dataset_id}/preview")
def get_dataset_preview(dataset_id: str, rows: int = 10):
    df = store.get_df(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    preview_df = df.head(rows)
    columns = list(preview_df.columns)
    records = preview_df.replace({float("nan"): None, float("inf"): None, float("-inf"): None}).to_dict(orient="records")
    return {"columns": columns, "rows": records}


@router.post("/datasets/{dataset_id}/transform")
def apply_transform(dataset_id: str, body: dict):
    entry = store.get(dataset_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df: pd.DataFrame = entry["df"].copy()
    column = body.get("column")
    operation = body.get("operation")
    params = body.get("params", {})

    if column and column not in df.columns and operation not in ("drop_duplicates",):
        raise HTTPException(status_code=400, detail=f"Column '{column}' not found")

    try:
        if operation == "log":
            df[column] = np.log1p(df[column].clip(lower=0))
        elif operation == "sqrt":
            df[column] = np.sqrt(df[column].clip(lower=0))
        elif operation == "one_hot":
            dummies = pd.get_dummies(df[column], prefix=column, drop_first=False)
            df = pd.concat([df.drop(columns=[column]), dummies], axis=1)
        elif operation == "bin":
            bins = int(params.get("bins", 5))
            df[f"{column}_binned"] = pd.cut(df[column], bins=bins, labels=False)
        elif operation == "drop_column":
            df = df.drop(columns=[column])
        elif operation == "fill_mean":
            df[column] = df[column].fillna(df[column].mean())
        elif operation == "fill_median":
            df[column] = df[column].fillna(df[column].median())
        elif operation == "fill_mode":
            mode_val = df[column].mode()
            if len(mode_val) > 0:
                df[column] = df[column].fillna(mode_val[0])
        elif operation == "fill_custom":
            val = params.get("value", "")
            df[column] = df[column].fillna(val)
        elif operation == "drop_duplicates":
            df = df.drop_duplicates()
        elif operation == "change_dtype":
            dtype = params.get("dtype", "str")
            df[column] = df[column].astype(dtype)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    entry["df"] = df
    entry["rows"] = len(df)
    entry["cols"] = len(df.columns)
    entry["size_mb"] = round(df.memory_usage(deep=True).sum() / 1024 / 1024, 3)
    return {k: v for k, v in entry.items() if k != "df"}
