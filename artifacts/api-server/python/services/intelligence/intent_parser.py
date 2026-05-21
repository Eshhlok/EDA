def detect_intent(query: str) -> str:
    q = query.lower()

    if any(word in q for word in [
        "outlier",
        "outliers",
        "anomaly",
        "anomalies",
        "spike",
        "unusual",
    ]):
        return "outlier_analysis"

    if any(word in q for word in ["missing", "null", "empty"]):
        return "missing_analysis"

    if any(word in q for word in ["quality", "reliable", "clean"]):
        return "quality_check"

    if any(word in q for word in [
        "correlation",
        "relationship",
        "related",
        "correlated",
    ]):
        return "correlation_analysis"

    if any(word in q for word in ["distribution", "spread", "skew"]):
        return "distribution_analysis"

    if any(word in q for word in [
        "forecast",
        "forecasting",
        "trend",
        "timeseries",
        "future",
    ]):
        return "forecasting_readiness"

    if any(word in q for word in ["business", "summary", "insight"]):
        return "business_summary"

    return "dataset_overview"