import math
import warnings
from typing import Optional
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from scipy import stats

from store import store

router = APIRouter(tags=["analysis"])
warnings.filterwarnings("ignore")


def _safe(v):
    if v is None:
        return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return v


def _dtype_category(series: pd.Series) -> str:
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    nunique = series.nunique()
    if nunique <= 2:
        return "boolean"
    if pd.api.types.is_object_dtype(series) and series.dropna().apply(lambda x: isinstance(x, str) and len(x) > 50).mean() > 0.5:
        return "text"
    return "categorical"


def _get_df_or_404(dataset_id: str) -> pd.DataFrame:
    df = store.get_df(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return df


@router.get("/datasets/{dataset_id}/overview")
def get_dataset_overview(dataset_id: str):
    entry = store.get(dataset_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df: pd.DataFrame = entry["df"]

    columns = []
    dtype_summary: dict[str, int] = {}
    for col in df.columns:
        s = df[col]
        cat = _dtype_category(s)
        dtype_summary[cat] = dtype_summary.get(cat, 0) + 1
        null_count = int(s.isna().sum())
        unique_count = int(s.nunique())
        sample = s.dropna().head(5).tolist()
        sample = [str(v) if not isinstance(v, (int, float, bool)) else v for v in sample]
        columns.append({
            "name": col,
            "dtype": str(s.dtype),
            "dtype_category": cat,
            "non_null_count": int(s.notna().sum()),
            "null_count": null_count,
            "null_pct": round(null_count / len(df) * 100, 2) if len(df) > 0 else 0.0,
            "unique_count": unique_count,
            "sample_values": sample,
        })

    info = {k: v for k, v in entry.items() if k != "df"}
    return {
        "info": info,
        "columns": columns,
        "duplicate_count": int(df.duplicated().sum()),
        "fully_missing_rows": int(df.isna().all(axis=1).sum()),
        "dtype_summary": dtype_summary,
    }


@router.get("/datasets/{dataset_id}/missing")
def get_missing_analysis(dataset_id: str):
    df = _get_df_or_404(dataset_id)
    n = len(df)

    stats_list = []
    for col in df.columns:
        missing = int(df[col].isna().sum())
        pct = round(missing / n * 100, 2) if n > 0 else 0.0
        if pct == 0:
            action = "No action needed"
        elif pct < 5:
            action = "Fill with mean/median/mode"
        elif pct < 20:
            action = "Fill with mean/median or consider dropping"
        elif pct < 50:
            action = "Consider dropping column"
        else:
            action = "Drop column (>50% missing)"
        stats_list.append({"column": col, "missing_count": missing, "missing_pct": pct, "recommended_action": action})

    stats_list.sort(key=lambda x: -x["missing_pct"])

    cols_with_missing = [s["column"] for s in stats_list if s["missing_count"] > 0][:20]
    heatmap_data = []
    if cols_with_missing:
        sample_df = df[cols_with_missing].head(50)
        for _, row in sample_df.iterrows():
            heatmap_data.append([None if pd.isna(v) else 1 for v in row])

    miss_correlation = []
    if len(cols_with_missing) >= 2:
        miss_df = df[cols_with_missing].isna().astype(float)
        for i, ca in enumerate(cols_with_missing):
            for cb in cols_with_missing[i + 1:]:
                corr_val = miss_df[ca].corr(miss_df[cb])
                if not math.isnan(corr_val):
                    miss_correlation.append({"col_a": ca, "col_b": cb, "correlation": round(corr_val, 3)})

    return {
        "stats": stats_list,
        "heatmap_columns": cols_with_missing,
        "heatmap_data": heatmap_data,
        "missingness_correlation": miss_correlation,
    }


def _histogram_kde(series: pd.Series, bins: int = 30):
    clean = series.dropna()
    if len(clean) == 0:
        return [], [], []
    counts, edges = np.histogram(clean, bins=bins)
    hist = [{"bin": f"{edges[i]:.2f}–{edges[i+1]:.2f}", "count": int(c)} for i, c in enumerate(counts)]
    kde_x, kde_y = [], []
    if len(clean) > 2:
        try:
            kde = stats.gaussian_kde(clean)
            x_range = np.linspace(float(clean.min()), float(clean.max()), 100)
            kde_x = x_range.tolist()
            kde_y = kde(x_range).tolist()
        except Exception:
            pass
    return hist, kde_x, kde_y


def _normality_test(series: pd.Series):
    clean = series.dropna()
    if len(clean) < 3:
        return "insufficient data", None
    try:
        if len(clean) <= 5000:
            stat, p = stats.shapiro(clean.sample(min(5000, len(clean)), random_state=42))
            test_name = "Shapiro-Wilk"
        else:
            stat, p = stats.kstest(clean, "norm", args=(clean.mean(), clean.std()))
            test_name = "Kolmogorov-Smirnov"
        interp = f"{test_name} (p={p:.4f}): {'Normal' if p > 0.05 else 'Not normal'}"
        return interp, float(p)
    except Exception:
        return "test failed", None


@router.get("/datasets/{dataset_id}/univariate")
def get_univariate_analysis(dataset_id: str):
    df = _get_df_or_404(dataset_id)

    numeric_results = []
    categorical_results = []
    datetime_results = []

    for col in df.columns:
        s = df[col]
        cat = _dtype_category(s)

        if cat == "numeric":
            clean = s.dropna()
            hist, kde_x, kde_y = _histogram_kde(s)
            norm_test, norm_pvalue = _normality_test(s)

            q1 = float(clean.quantile(0.25)) if len(clean) > 0 else None
            q3 = float(clean.quantile(0.75)) if len(clean) > 0 else None
            iqr = (q3 - q1) if q1 is not None and q3 is not None else None
            iqr_lower = (q1 - 1.5 * iqr) if iqr is not None else None
            iqr_upper = (q3 + 1.5 * iqr) if iqr is not None else None
            iqr_outliers = int(((clean < iqr_lower) | (clean > iqr_upper)).sum()) if iqr is not None else 0

            mean_val = float(clean.mean()) if len(clean) > 0 else None
            std_val = float(clean.std()) if len(clean) > 0 else None
            zscore_outliers = int((np.abs(stats.zscore(clean)) > 3).sum()) if len(clean) > 2 else 0

            numeric_results.append({
                "column": col,
                "mean": _safe(mean_val),
                "median": _safe(float(clean.median())) if len(clean) > 0 else None,
                "mode": _safe(float(clean.mode().iloc[0])) if len(clean) > 0 and len(clean.mode()) > 0 else None,
                "std": _safe(std_val),
                "variance": _safe(float(clean.var())) if len(clean) > 0 else None,
                "min": _safe(float(clean.min())) if len(clean) > 0 else None,
                "max": _safe(float(clean.max())) if len(clean) > 0 else None,
                "range": _safe(float(clean.max() - clean.min())) if len(clean) > 0 else None,
                "iqr": _safe(iqr),
                "q1": _safe(q1),
                "q3": _safe(q3),
                "skewness": _safe(float(clean.skew())) if len(clean) > 0 else None,
                "kurtosis": _safe(float(clean.kurtosis())) if len(clean) > 0 else None,
                "cv": _safe(float(clean.std() / clean.mean()) if mean_val and mean_val != 0 else None),
                "outlier_iqr_count": iqr_outliers,
                "outlier_zscore_count": zscore_outliers,
                "normality_test": norm_test,
                "normality_pvalue": _safe(norm_pvalue),
                "histogram": hist,
                "kde_x": kde_x,
                "kde_y": kde_y,
                "box_data": {
                    "q1": _safe(q1), "q3": _safe(q3), "median": _safe(float(clean.median())) if len(clean) > 0 else None,
                    "min": _safe(float(clean.min())) if len(clean) > 0 else None, "max": _safe(float(clean.max())) if len(clean) > 0 else None,
                    "iqr_lower": _safe(iqr_lower), "iqr_upper": _safe(iqr_upper),
                },
            })

        elif cat in ("categorical", "boolean"):
            vc = s.value_counts()
            total = len(s.dropna())
            top_values = [
                {"value": str(k), "count": int(v), "pct": round(v / total * 100, 2) if total > 0 else 0}
                for k, v in vc.head(20).items()
            ]
            nunique = s.nunique()
            if nunique == 1:
                cardinality = "constant"
            elif nunique <= 10:
                cardinality = "low"
            elif nunique <= 50:
                cardinality = "medium"
            elif nunique <= len(s) * 0.5:
                cardinality = "high"
            else:
                cardinality = "unique"

            entropy = None
            if total > 0:
                probs = vc / total
                entropy_val = float((-probs * np.log2(probs + 1e-10)).sum())
                entropy = round(entropy_val, 4)

            categorical_results.append({
                "column": col,
                "cardinality": cardinality,
                "entropy": _safe(entropy),
                "top_values": top_values,
            })

        elif cat == "datetime":
            try:
                dt_series = pd.to_datetime(s, errors="coerce")
                clean_dt = dt_series.dropna()
                if len(clean_dt) == 0:
                    continue

                by_year = dt_series.dt.year.value_counts().sort_index()
                by_month = dt_series.dt.month.value_counts().sort_index()
                month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                by_weekday = dt_series.dt.dayofweek.value_counts().sort_index()
                weekday_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

                datetime_results.append({
                    "column": col,
                    "min_date": str(clean_dt.min()),
                    "max_date": str(clean_dt.max()),
                    "frequency_by_year": [{"label": str(k), "count": int(v)} for k, v in by_year.items()],
                    "frequency_by_month": [{"label": month_names[k - 1] if 1 <= k <= 12 else str(k), "count": int(v)} for k, v in by_month.items()],
                    "frequency_by_weekday": [{"label": weekday_names[k] if 0 <= k <= 6 else str(k), "count": int(v)} for k, v in by_weekday.items()],
                })
            except Exception:
                pass

    return {"numeric": numeric_results, "categorical": categorical_results, "datetime": datetime_results}


@router.get("/datasets/{dataset_id}/bivariate")
def get_bivariate_analysis(dataset_id: str):
    df = _get_df_or_404(dataset_id)
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = [c for c in df.columns if _dtype_category(df[c]) in ("categorical", "boolean")]

    pearson_entries = []
    spearman_entries = []

    if len(num_cols) >= 2:
        num_df = df[num_cols].dropna()
        try:
            pearson_corr = num_df.corr(method="pearson")
            for row in pearson_corr.index:
                for col in pearson_corr.columns:
                    pearson_entries.append({"row": row, "col": col, "value": _safe(round(float(pearson_corr.loc[row, col]), 4))})
            spearman_corr = num_df.corr(method="spearman")
            for row in spearman_corr.index:
                for col in spearman_corr.columns:
                    spearman_entries.append({"row": row, "col": col, "value": _safe(round(float(spearman_corr.loc[row, col]), 4))})
        except Exception:
            pass

    return {
        "pearson_matrix": pearson_entries,
        "spearman_matrix": spearman_entries,
        "numeric_columns": num_cols,
        "categorical_columns": cat_cols,
    }


@router.get("/datasets/{dataset_id}/bivariate/scatter")
def get_scatter_data(dataset_id: str, col_x: str, col_y: str, color_col: Optional[str] = None):
    df = _get_df_or_404(dataset_id)
    if col_x not in df.columns or col_y not in df.columns:
        raise HTTPException(status_code=400, detail="Column not found")

    sample_df = df[[col_x, col_y] + ([color_col] if color_col and color_col in df.columns else [])].dropna(subset=[col_x, col_y])
    if len(sample_df) > 2000:
        sample_df = sample_df.sample(2000, random_state=42)

    x_vals = sample_df[col_x].tolist()
    y_vals = sample_df[col_y].tolist()
    color_vals = sample_df[color_col].tolist() if color_col and color_col in sample_df.columns else []

    pearson_r = spearman_r = reg_slope = reg_intercept = None
    try:
        pearson_r, _ = stats.pearsonr(sample_df[col_x], sample_df[col_y])
        pearson_r = _safe(round(float(pearson_r), 4))
        spearman_r, _ = stats.spearmanr(sample_df[col_x], sample_df[col_y])
        spearman_r = _safe(round(float(spearman_r), 4))
        slope, intercept, *_ = stats.linregress(sample_df[col_x], sample_df[col_y])
        reg_slope = _safe(float(slope))
        reg_intercept = _safe(float(intercept))
    except Exception:
        pass

    return {"x": x_vals, "y": y_vals, "color": color_vals, "pearson_r": pearson_r, "spearman_r": spearman_r,
            "regression_slope": reg_slope, "regression_intercept": reg_intercept}


@router.get("/datasets/{dataset_id}/multivariate")
def get_multivariate_analysis(dataset_id: str):
    df = _get_df_or_404(dataset_id)
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()[:8]

    sample_df = df[num_cols].dropna()
    if len(sample_df) > 500:
        sample_df = sample_df.sample(500, random_state=42)
    pairplot_sample = sample_df.replace({float("nan"): None}).to_dict(orient="records")

    elbow = []
    silhouette = []
    if len(num_cols) >= 2 and len(sample_df) >= 10:
        try:
            from sklearn.cluster import KMeans
            from sklearn.metrics import silhouette_score
            from sklearn.preprocessing import StandardScaler
            X = StandardScaler().fit_transform(sample_df.fillna(0))
            for k in range(2, min(11, len(sample_df))):
                km = KMeans(n_clusters=k, random_state=42, n_init=5)
                labels = km.fit_predict(X)
                elbow.append({"k": k, "inertia": float(km.inertia_)})
                if k <= 8:
                    try:
                        sil = float(silhouette_score(X, labels, sample_size=min(500, len(X))))
                        silhouette.append({"k": k, "score": round(sil, 4)})
                    except Exception:
                        pass
        except Exception:
            pass

    return {"pairplot_columns": num_cols, "pairplot_sample": pairplot_sample, "cluster_elbow": elbow, "silhouette_scores": silhouette}


@router.get("/datasets/{dataset_id}/outliers")
def get_outlier_analysis(dataset_id: str, zscore_threshold: float = 3.0):
    df = _get_df_or_404(dataset_id)
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    iqr_outliers = []
    zscore_outliers = []
    isolation_scores = []

    for col in num_cols:
        s = df[col].dropna()
        if len(s) < 4:
            continue
        q1 = float(s.quantile(0.25))
        q3 = float(s.quantile(0.75))
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        mask = (df[col] < lower) | (df[col] > upper)
        for idx in df[mask].index[:100]:
            iqr_outliers.append({"row_index": int(idx), "column": col, "value": _safe(float(df.loc[idx, col])), "method": "IQR", "score": None})

        z_scores = np.abs(stats.zscore(df[col].fillna(df[col].mean())))
        z_mask = z_scores > zscore_threshold
        for idx in df[z_mask].index[:100]:
            zscore_outliers.append({"row_index": int(idx), "column": col, "value": _safe(float(df.loc[idx, col])), "method": "Z-score", "score": _safe(float(z_scores[idx]))})

    num_df = df[num_cols].fillna(df[num_cols].mean())
    if len(num_cols) >= 2 and len(num_df) >= 10:
        try:
            from sklearn.ensemble import IsolationForest
            iso = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
            preds = iso.fit_predict(num_df)
            scores = iso.decision_function(num_df)
            for i, (pred, score) in enumerate(zip(preds, scores)):
                if i < 200 or pred == -1:
                    isolation_scores.append({"row_index": i, "score": round(float(score), 4), "is_outlier": bool(pred == -1)})
        except Exception:
            pass

    all_outlier_rows = set(r["row_index"] for r in iqr_outliers) | set(r["row_index"] for r in zscore_outliers)
    return {"iqr_outliers": iqr_outliers[:200], "zscore_outliers": zscore_outliers[:200],
            "isolation_scores": isolation_scores[:300], "total_outlier_rows": len(all_outlier_rows)}


@router.get("/datasets/{dataset_id}/insights")
def get_insights(dataset_id: str):
    df = _get_df_or_404(dataset_id)
    insights = []

    n = len(df)
    for col in df.columns:
        s = df[col]
        null_pct = s.isna().mean() * 100
        if null_pct > 50:
            insights.append({"message": f"{null_pct:.1f}% of rows in '{col}' are missing — exceeds recommended threshold.", "severity": "CRITICAL", "column": col, "category": "missing"})
        elif null_pct > 20:
            insights.append({"message": f"{null_pct:.1f}% of rows in '{col}' are missing — consider imputation or dropping.", "severity": "WARNING", "column": col, "category": "missing"})

        if pd.api.types.is_numeric_dtype(s):
            clean = s.dropna()
            if len(clean) > 3:
                skew = float(clean.skew())
                if abs(skew) > 1.5:
                    direction = "right" if skew > 0 else "left"
                    insights.append({"message": f"Column '{col}' is {direction}-skewed (skewness={skew:.2f}). Consider log or sqrt transform.", "severity": "INFO", "column": col, "category": "distribution"})

        nunique = s.nunique()
        if nunique == 1:
            insights.append({"message": f"Column '{col}' is constant — all values are identical. Consider dropping.", "severity": "WARNING", "column": col, "category": "uniqueness"})
        elif nunique == n:
            insights.append({"message": f"Column '{col}' has 100% unique values — likely an ID column.", "severity": "INFO", "column": col, "category": "uniqueness"})

    dup_count = int(df.duplicated().sum())
    if dup_count > 0:
        insights.append({"message": f"{dup_count} duplicate rows detected ({dup_count / n * 100:.1f}% of dataset).", "severity": "WARNING", "column": None, "category": "duplicates"})

    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if len(num_cols) >= 2:
        try:
            corr = df[num_cols].corr()
            for i, ca in enumerate(num_cols):
                for cb in num_cols[i + 1:]:
                    r = corr.loc[ca, cb]
                    if not math.isnan(r) and abs(r) > 0.8:
                        insights.append({"message": f"Columns '{ca}' and '{cb}' have strong {'positive' if r > 0 else 'negative'} correlation (r={r:.2f}).", "severity": "INFO", "column": None, "category": "correlation"})
        except Exception:
            pass

    return insights


@router.get("/datasets/{dataset_id}/quality-score")
def get_quality_score(dataset_id: str):
    df = _get_df_or_404(dataset_id)
    n = len(df)

    completeness = max(0.0, 100 - df.isna().mean().mean() * 100)
    dup_pct = df.duplicated().mean() * 100
    uniqueness = max(0.0, 100 - dup_pct)

    type_consistency = 0.0
    if len(df.columns) > 0:
        consistent = 0
        for col in df.columns:
            s = df[col].dropna()
            if len(s) == 0:
                consistent += 1
                continue
            if pd.api.types.is_numeric_dtype(s):
                consistent += 1
            elif pd.api.types.is_datetime64_any_dtype(s):
                consistent += 1
            elif pd.api.types.is_object_dtype(s):
                type_pct = s.apply(lambda x: isinstance(x, str)).mean()
                consistent += type_pct
        type_consistency = (consistent / len(df.columns)) * 100

    outlier_pct = 0.0
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if num_cols:
        outlier_counts = []
        for col in num_cols:
            s = df[col].dropna()
            if len(s) < 4:
                continue
            q1, q3 = float(s.quantile(0.25)), float(s.quantile(0.75))
            iqr = q3 - q1
            outlier_count = int(((s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)).sum())
            outlier_counts.append(outlier_count / len(s) * 100)
        if outlier_counts:
            outlier_pct = float(np.mean(outlier_counts))
    validity = max(0.0, 100 - outlier_pct * 2)

    overall = round((completeness * 0.35 + uniqueness * 0.25 + type_consistency * 0.20 + validity * 0.20), 1)

    recs = []
    if completeness < 80:
        recs.append("Address missing values — completeness is below 80%")
    if uniqueness < 90:
        recs.append("Remove duplicate rows to improve uniqueness score")
    if type_consistency < 90:
        recs.append("Review mixed-type columns for consistency")
    if validity < 80:
        recs.append("Investigate and handle outliers to improve validity")
    if not recs:
        recs.append("Dataset quality is good — no critical issues found")

    return {
        "overall_score": overall,
        "completeness": round(completeness, 1),
        "uniqueness": round(uniqueness, 1),
        "consistency": round(type_consistency, 1),
        "validity": round(validity, 1),
        "recommendations": recs,
    }


@router.get("/datasets/{dataset_id}/pca")
def get_pca_analysis(dataset_id: str, n_components: int = 10):
    df = _get_df_or_404(dataset_id)
    from sklearn.decomposition import PCA
    from sklearn.preprocessing import StandardScaler

    num_df = df.select_dtypes(include=[np.number]).dropna()
    if len(num_df.columns) < 2 or len(num_df) < 5:
        raise HTTPException(status_code=400, detail="Need at least 2 numeric columns and 5 rows for PCA")

    sample = num_df.sample(min(2000, len(num_df)), random_state=42)
    X = StandardScaler().fit_transform(sample)
    n = min(n_components, X.shape[1], X.shape[0])
    pca = PCA(n_components=n, random_state=42)
    components = pca.fit_transform(X)

    ev_ratio = pca.explained_variance_ratio_.tolist()
    cumulative = [sum(ev_ratio[:i+1]) for i in range(len(ev_ratio))]

    comp_2d = [{"pc1": float(r[0]), "pc2": float(r[1])} for r in components]
    comp_3d = [{"pc1": float(r[0]), "pc2": float(r[1]), "pc3": float(r[2] if n > 2 else 0)} for r in components]

    loadings = []
    for i, feat in enumerate(num_df.columns):
        loadings.append({"feature": feat, "pc1": float(pca.components_[0, i]), "pc2": float(pca.components_[1, i]) if n > 1 else 0.0})

    return {"explained_variance_ratio": [round(v, 4) for v in ev_ratio], "cumulative_variance": [round(v, 4) for v in cumulative],
            "components_2d": comp_2d, "components_3d": comp_3d, "loadings": loadings, "n_samples": len(sample)}


@router.get("/datasets/{dataset_id}/tsne")
def get_tsne_analysis(dataset_id: str, perplexity: float = 30.0):
    df = _get_df_or_404(dataset_id)
    from sklearn.manifold import TSNE
    from sklearn.preprocessing import StandardScaler

    num_df = df.select_dtypes(include=[np.number]).dropna()
    if len(num_df.columns) < 2 or len(num_df) < 5:
        raise HTTPException(status_code=400, detail="Need at least 2 numeric columns and 5 rows for t-SNE")

    sample = num_df.sample(min(1000, len(num_df)), random_state=42)
    X = StandardScaler().fit_transform(sample)
    perp = min(float(perplexity), len(X) - 1)

    tsne = TSNE(n_components=2, perplexity=perp, random_state=42, max_iter=500)
    coords = tsne.fit_transform(X)
    return {"coordinates": [{"x": float(r[0]), "y": float(r[1])} for r in coords], "perplexity": perp, "n_samples": len(sample)}


@router.get("/datasets/{dataset_id}/distribution-fit")
def get_distribution_fit(dataset_id: str):
    df = _get_df_or_404(dataset_id)
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    results = []

    distributions = [("norm", stats.norm), ("lognorm", stats.lognorm), ("expon", stats.expon), ("gamma", stats.gamma)]

    for col in num_cols[:10]:
        s = df[col].dropna()
        if len(s) < 10:
            continue
        s_clean = s[np.isfinite(s)]
        if len(s_clean) < 10:
            continue

        best_name = "norm"
        best_aic = float("inf")
        best_params = {}
        best_pdf_x: list = []
        best_pdf_y: list = []

        for dist_name, dist in distributions:
            try:
                params = dist.fit(s_clean)
                log_likelihood = dist.logpdf(s_clean, *params).sum()
                aic = 2 * len(params) - 2 * log_likelihood
                if aic < best_aic:
                    best_aic = aic
                    best_name = dist_name
                    best_params = dict(zip(dist.shapes.split(",") if dist.shapes else [], params[:-2])) if dist.shapes else {}
                    best_params["loc"] = params[-2]
                    best_params["scale"] = params[-1]
                    x_range = np.linspace(float(s_clean.min()), float(s_clean.max()), 100)
                    best_pdf_x = x_range.tolist()
                    best_pdf_y = dist.pdf(x_range, *params).tolist()
            except Exception:
                continue

        hist, _, _ = _histogram_kde(s, bins=30)
        hist_norm = []
        total = sum(h["count"] for h in hist)
        for h in hist:
            hist_norm.append({"bin": h["bin"], "count": h["count"] / total if total > 0 else 0})

        try:
            best_dist = next(d for n, d in distributions if n == best_name)
            best_p = tuple(best_params.get(k, 0) for k in (["loc", "scale"] if not best_dist.shapes else best_dist.shapes.split(",") + ["loc", "scale"]))
            theo, sample_qq = stats.probplot(s_clean, dist=best_dist, sparams=best_p[:-2] if len(best_p) > 2 else best_p, fit=False)
            qq_theo = theo[0].tolist()
            qq_sample = sample_qq.tolist()
        except Exception:
            qq_theo = []
            qq_sample = []

        results.append({
            "column": col, "best_fit": best_name, "parameters": {k: _safe(float(v)) for k, v in best_params.items()},
            "aic": _safe(best_aic), "histogram": hist_norm, "pdf_x": [_safe(v) for v in best_pdf_x],
            "pdf_y": [_safe(v) for v in best_pdf_y], "qq_theoretical": [_safe(v) for v in qq_theo], "qq_sample": [_safe(v) for v in qq_sample],
        })

    return results


@router.get("/datasets/{dataset_id}/timeseries")
def get_timeseries_analysis(dataset_id: str, date_col: str, value_col: Optional[str] = None):
    df = _get_df_or_404(dataset_id)
    if date_col not in df.columns:
        raise HTTPException(status_code=400, detail="date_col not found")

    ts_df = df.copy()
    ts_df[date_col] = pd.to_datetime(ts_df[date_col], errors="coerce")
    ts_df = ts_df.dropna(subset=[date_col]).sort_values(date_col)

    val_col = value_col if value_col and value_col in ts_df.columns else None
    if val_col is None:
        num_cols = ts_df.select_dtypes(include=[np.number]).columns.tolist()
        val_col = num_cols[0] if num_cols else None

    def to_timeline(series, date_series):
        return [{"date": str(d)[:19], "value": _safe(float(v)) if pd.notna(v) else None}
                for d, v in zip(date_series, series)]

    if val_col:
        val_series = ts_df[val_col].fillna(method="ffill")
        dates = ts_df[date_col]
        timeline = to_timeline(val_series, dates)
        window = max(3, len(val_series) // 20)
        rolling_mean_series = val_series.rolling(window=window, center=True).mean()
        rolling_std_series = val_series.rolling(window=window, center=True).std()
        rolling_mean = to_timeline(rolling_mean_series, dates)
        rolling_std_v = to_timeline(rolling_std_series, dates)

        trend_data, seasonal_data, residual_data = [], [], []
        if len(val_series) >= 14:
            try:
                from statsmodels.tsa.seasonal import seasonal_decompose
                period = max(2, min(7, len(val_series) // 4))
                decomp = seasonal_decompose(val_series.values, model="additive", period=period, extrapolate_trend="freq")
                trend_data = to_timeline(decomp.trend, dates)
                seasonal_data = to_timeline(decomp.seasonal, dates)
                residual_data = to_timeline(decomp.resid, dates)
            except Exception:
                pass

        acf_vals, pacf_vals = [], []
        try:
            from statsmodels.tsa.stattools import acf, pacf
            nlags = min(40, len(val_series) // 3)
            if nlags >= 2:
                acf_vals = [_safe(float(v)) for v in acf(val_series.fillna(0), nlags=nlags)]
                pacf_vals = [_safe(float(v)) for v in pacf(val_series.fillna(0), nlags=nlags, method="ywm")]
        except Exception:
            pass

        adf_stat = adf_pval = None
        adf_interp = "ADF test not computed"
        try:
            from statsmodels.tsa.stattools import adfuller
            adf_result = adfuller(val_series.fillna(0))
            adf_stat = _safe(float(adf_result[0]))
            adf_pval = _safe(float(adf_result[1]))
            if adf_pval is not None:
                adf_interp = f"ADF p={adf_pval:.4f}: {'Stationary (reject H0)' if adf_pval < 0.05 else 'Non-stationary (fail to reject H0)'}"
        except Exception:
            pass
    else:
        freq_by_date = ts_df.set_index(date_col).resample("D").size()
        timeline = [{"date": str(d)[:10], "value": float(v)} for d, v in freq_by_date.items()]
        rolling_mean = rolling_std_v = trend_data = seasonal_data = residual_data = []
        acf_vals = pacf_vals = []
        adf_stat = adf_pval = None
        adf_interp = "No numeric column selected"

    return {
        "date_col": date_col, "value_col": val_col,
        "timeline": timeline, "rolling_mean": rolling_mean, "rolling_std": rolling_std_v,
        "trend": trend_data, "seasonal": seasonal_data, "residual": residual_data,
        "acf": acf_vals, "pacf": pacf_vals,
        "adf_statistic": adf_stat, "adf_pvalue": adf_pval, "adf_interpretation": adf_interp,
    }
@router.get("/datasets/{dataset_id}/groupby")
def get_groupby_analysis(
    dataset_id: str,
    group_by: str,
    metric: str,
    aggregation: str = "sum",
    top_n: int = 20,

    filter_columns: Optional[str] = None,
    filter_values: Optional[str] = None,
):
    df = _get_df_or_404(dataset_id)

    # Validate columns
    if group_by not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"group_by column '{group_by}' not found"
        )

    if metric not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"metric column '{metric}' not found"
        )

    if not pd.api.types.is_numeric_dtype(df[metric]):
        raise HTTPException(
            status_code=400,
            detail=f"metric column '{metric}' must be numeric"
        )

   # Apply cumulative filters

    if filter_columns and filter_values:

        columns = [
            c.strip()
            for c in filter_columns.split(",")
        ]

        values = [
            v.strip()
            for v in filter_values.split(",")
        ]

        if len(columns) != len(values):

            raise HTTPException(
                status_code=400,
                detail="filter_columns and filter_values length mismatch"
            )

        for col, val in zip(columns, values):

            if col not in df.columns:

                raise HTTPException(
                    status_code=400,
                    detail=f"filter column '{col}' not found"
                )

            df = df[
                df[col]
                .astype(str)
                == str(val)
            ]
    valid_aggs = [
        "sum",
        "mean",
        "median",
        "max",
        "min",
        "count",
        "std"
    ]

    if aggregation not in valid_aggs:
        raise HTTPException(
            status_code=400,
            detail=f"aggregation must be one of {valid_aggs}"
        )

    try:

        grouped = (
            df.groupby(group_by)[metric]
            .agg(aggregation)
            .reset_index()
        )

        grouped.columns = [group_by, "value"]

        grouped = (
            grouped
            .replace([np.inf, -np.inf], np.nan)
            .dropna()
        )

        grouped = grouped.sort_values(
            "value",
            ascending=False
        ).head(top_n)

        return {
            "group_by": group_by,
            "metric": metric,
            "aggregation": aggregation,

            "filter_columns": filter_columns,
            "filter_values": filter_values,

            "data": [
                {
                    "label": str(row[group_by]),
                    "value": _safe(float(row["value"]))
                }
                for _, row in grouped.iterrows()
            ]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )