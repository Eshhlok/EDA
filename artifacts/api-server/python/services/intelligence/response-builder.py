def build_response(intent: str, results: dict) -> dict:

    if intent == "quality_check":
        score = results.get("quality_score", 0)

        if score >= 85:
            message = (
                "The dataset demonstrates strong overall quality "
                "with minimal structural concerns."
            )
            severity = "low"

        elif score >= 60:
            message = (
                "The dataset is moderately reliable but contains "
                "quality concerns that may affect downstream analysis."
            )
            severity = "medium"

        else:
            message = (
                "The dataset contains significant quality issues "
                "that should be addressed before analysis."
            )
            severity = "high"

        return {
            "message": message,
            "severity": severity,
            "metrics": results,
            "charts": [],
            "recommendations": [],
        }

    return {
        "message": "Analysis completed successfully.",
        "severity": "low",
        "metrics": results,
        "charts": [],
        "recommendations": [],
    }