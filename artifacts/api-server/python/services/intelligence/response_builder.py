def build_response(intent: str, results: dict):

    if intent == "quality_check":

        quality = results["quality_score"]
        missing = results["missing_percentage"]
        outliers = results["outlier_percentage"]
        duplicates = results["duplicate_percentage"]

        recommendations = []

        severity = "low"

        if quality >= 85:

            summary = (
                "The dataset demonstrates strong overall structural "
                "quality with minimal analytical risk indicators."
            )

        elif quality >= 60:

            severity = "medium"

            summary = (
                "The dataset is moderately reliable but contains "
                "quality concerns that may affect downstream analysis."
            )

        else:

            severity = "high"

            summary = (
                "The dataset contains elevated structural quality "
                "issues that should be addressed before advanced analysis."
            )

        # Recommendations

        if missing > 10:
            recommendations.append(
                "Consider handling missing values before modeling."
            )

        if outliers > 15:
            recommendations.append(
                "High anomaly concentration detected across numeric features."
            )

        if duplicates > 5:
            recommendations.append(
                "Duplicate records may affect analytical reliability."
            )

        insights = [
            {
                "label": "Quality Score",
                "value": quality,
            },
            {
                "label": "Missing %",
                "value": missing,
            },
            {
                "label": "Outlier %",
                "value": outliers,
            },
            {
                "label": "Duplicate %",
                "value": duplicates,
            },
        ]

        return {
            "message": summary,

            "severity": severity,

            "insights": insights,

            "recommendations": recommendations,

            "metrics": results,

            "charts": [
                "quality-gauge",
                "missing-bar",
            ],
        }

    # -------------------------------
    # OUTLIERS
    # -------------------------------

    if intent == "outlier_analysis":

        outlier_pct = results["outlier_percentage"]

        severity = (
            "high"
            if outlier_pct > 15
            else "medium"
            if outlier_pct > 5
            else "low"
        )

        return {
            "message": (
                f"The dataset contains approximately "
                f"{outlier_pct}% anomalous observations."
            ),

            "severity": severity,

            "insights": [
                {
                    "label": "Outlier %",
                    "value": outlier_pct,
                }
            ],

            "recommendations": [
                "Review extreme values before predictive modeling."
            ],

            "metrics": results,

            "charts": [
                "outlier-table"
            ],
        }

    # -------------------------------
    # DEFAULT
    # -------------------------------

    return {
        "message": "Analysis completed successfully.",

        "severity": "low",

        "insights": [],

        "recommendations": [],

        "metrics": results,

        "charts": [],
    }