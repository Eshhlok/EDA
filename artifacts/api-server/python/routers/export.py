import io
import math
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from store import store

router = APIRouter(tags=["export"])


def _clean_df(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in df.select_dtypes(include=[float]).columns:
        df[col] = df[col].apply(lambda x: None if (isinstance(x, float) and (math.isnan(x) or math.isinf(x))) else x)
    return df


@router.get("/datasets/{dataset_id}/export/csv")
def export_csv(dataset_id: str):
    df = store.get_df(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    entry = store.get(dataset_id)
    filename = entry["filename"].rsplit(".", 1)[0] + "_cleaned.csv" if entry else "export.csv"
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/datasets/{dataset_id}/export/excel")
def export_excel(dataset_id: str):
    df = store.get_df(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if num_cols:
            desc = df[num_cols].describe().reset_index()
            desc.to_excel(writer, sheet_name="Summary Stats", index=False)

        missing = df.isna().sum().reset_index()
        missing.columns = ["Column", "Missing Count"]
        missing["Missing %"] = (missing["Missing Count"] / len(df) * 100).round(2)
        missing.to_excel(writer, sheet_name="Missing Values", index=False)

        dtype_df = pd.DataFrame({"Column": df.columns, "Dtype": [str(d) for d in df.dtypes], "Unique Values": [int(df[c].nunique()) for c in df.columns]})
        dtype_df.to_excel(writer, sheet_name="Schema", index=False)

    output.seek(0)
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                             headers={"Content-Disposition": 'attachment; filename="eda_summary.xlsx"'})


@router.get("/datasets/{dataset_id}/export/outliers")
def export_outliers_csv(dataset_id: str):
    df = store.get_df(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    outlier_indices = set()
    for col in num_cols:
        s = df[col].dropna()
        if len(s) < 4:
            continue
        q1, q3 = float(s.quantile(0.25)), float(s.quantile(0.75))
        iqr = q3 - q1
        mask = (df[col] < q1 - 1.5 * iqr) | (df[col] > q3 + 1.5 * iqr)
        outlier_indices.update(df[mask].index.tolist())

    outlier_df = df.loc[list(outlier_indices)] if outlier_indices else pd.DataFrame(columns=df.columns)
    output = io.StringIO()
    outlier_df.to_csv(output, index=True)
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": 'attachment; filename="outliers.csv"'})
