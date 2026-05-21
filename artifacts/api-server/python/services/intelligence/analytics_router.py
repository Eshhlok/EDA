import numpy as np

from store import store


def calculate_missing_percentage(df):
    total_cells = df.shape[0] * df.shape[1]

    if total_cells == 0:
        return 0

    return round(
        (df.isna().sum().sum() / total_cells) * 100,
        2,
    )


def calculate_outlier_percentage(df):
    numeric_df = df.select_dtypes(include=[np.number])

    if numeric_df.empty:
        return 0

    total_outliers = 0

    for col in numeric_df.columns:

        series = numeric_df[col].dropna()

        if len(series) < 4:
            continue

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)

        iqr = q3 - q1

        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr

        outliers = series[
            (series < lower) | (series > upper)
        ]

        total_outliers += len(outliers)

    total_cells = max(len(df), 1)

    return round(
        (total_outliers / total_cells) * 100,
        2,
    )


def calculate_duplicate_percentage(df):

    if len(df) == 0:
        return 0

    duplicates = df.duplicated().sum()

    return round(
        (duplicates / len(df)) * 100,
        2,
    )


def calculate_quality_score(
    missing_pct,
    outlier_pct,
    duplicate_pct,
):

    score = 100

    score -= missing_pct * 0.7
    score -= outlier_pct * 0.2
    score -= duplicate_pct * 0.1

    return max(0, round(score, 2))


def run_analysis(intent: str, dataset_id: str):

    df = store.get_df(dataset_id)

    if df is None:
        return {
            "error": "Dataset not found"
        }

    rows = len(df)
    columns = len(df.columns)

    # -------------------------------
    # QUALITY CHECK
    # -------------------------------

    if intent == "quality_check":

        missing_pct = calculate_missing_percentage(df)

        outlier_pct = calculate_outlier_percentage(df)

        duplicate_pct = calculate_duplicate_percentage(df)

        quality_score = calculate_quality_score(
            missing_pct,
            outlier_pct,
            duplicate_pct,
        )

        return {
            "rows": rows,
            "columns": columns,

            "quality_score": quality_score,

            "missing_percentage": missing_pct,

            "outlier_percentage": outlier_pct,

            "duplicate_percentage": duplicate_pct,
        }

    # -------------------------------
    # OUTLIER ANALYSIS
    # -------------------------------

    if intent == "outlier_analysis":

        outlier_pct = calculate_outlier_percentage(df)

        return {
            "rows": rows,
            "columns": columns,
            "outlier_percentage": outlier_pct,
        }

    # -------------------------------
    # DATASET OVERVIEW
    # -------------------------------

    return {
        "rows": rows,
        "columns": columns,
    }