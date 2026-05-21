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
    if intent == "correlation_analysis":

        strength = results["correlation_strength"]

        severity = (
            "high"
            if strength > 0.8
            else "medium"
            if strength > 0.5
            else "low"
        )

        return {
            "message": (
                f"The dataset shows a maximum detected "
                f"correlation strength of {strength}, "
                f"indicating potentially meaningful "
                f"relationships between numeric variables."
            ),

            "severity": severity,

            "insights": [
                {
                    "label": "Max Correlation",
                    "value": strength,
                }
            ],

            "recommendations": [
                "Review highly correlated variables before predictive modeling."
            ],

            "metrics": results,

            "charts": [
                "correlation-heatmap"
            ],
        }
    if intent == "forecasting_readiness":

        readiness = results["forecast_readiness"]

        severity = (
            "low"
            if readiness > 80
            else "medium"
            if readiness > 60
            else "high"
        )

        return {
            "message": (
                f"The dataset demonstrates approximately "
                f"{readiness}% forecasting readiness "
                f"based on numeric feature availability "
                f"and structural quality."
            ),

            "severity": severity,

            "insights": [
                {
                    "label": "Forecast Readiness",
                    "value": readiness,
                }
            ],

            "recommendations": [
                "Ensure temporal consistency before forecasting workflows."
            ],

            "metrics": results,

            "charts": [
                "forecast-readiness"
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