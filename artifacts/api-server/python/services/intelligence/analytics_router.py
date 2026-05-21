from store import store


def run_analysis(intent: str, dataset_id: str) -> dict:
    df = store.get_df(dataset_id)

    if df is None:
        return {
            "error": "Dataset not found"
        }

    if intent == "quality_check":

        missing_pct = (
            df.isna().sum().sum()
            / (df.shape[0] * df.shape[1])
        ) * 100

        quality_score = max(0, round(100 - missing_pct, 2))

        return {
            "quality_score": quality_score,
            "missing_percentage": round(missing_pct, 2),
            "rows": len(df),
            "columns": len(df.columns),
        }

    return {
        "rows": len(df),
        "columns": len(df.columns),
    }