import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useGetUnivariateAnalysis } from "@workspace/api-client-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://eda-xqob.onrender.com";
type Props = {
  datasetId: string;
};

const formatCurrency = (
  value: number
) => {

  return new Intl.NumberFormat(
    "en-IN",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    }
  ).format(value);

};

export default function SmartInsights({
  datasetId,
}: Props) {

  // -----------------------------
  // DATA FETCHING
  // -----------------------------

  const [
    departmentData,
    setDepartmentData,
    ] = useState<any>(null);

    const [
    monthlyData,
    setMonthlyData,
    ] = useState<any>(null);

    const [loading, setLoading] =
    useState(true);
    
    const { data: univariateData } =
    useGetUnivariateAnalysis(
        datasetId
    );
    const numericColumns =
        univariateData?.numeric.map(
            (n) => n.column
        ) || [];

        const categoricalColumns =
        univariateData?.categorical.map(
            (c) => c.column
        ) || [];

        const timeColumns =
        categoricalColumns.filter(
            (col) =>
            col.includes("_month") ||
            col.includes("_year") ||
            col.includes("_quarter")
        );

        // Best metric candidate

        const selectedMetric =
        numericColumns.find(
            (col) =>
            col.toLowerCase().includes(
                "cost"
            ) ||
            col.toLowerCase().includes(
                "sales"
            ) ||
            col.toLowerCase().includes(
                "revenue"
            ) ||
            col.toLowerCase().includes(
                "amount"
            )
        ) || numericColumns[0];

        // Best categorical candidate

        const selectedCategory =
        categoricalColumns.find(
            (col) =>
            !col.includes("_month") &&
            !col.includes("_year") &&
            !col.includes("_quarter")
        ) || categoricalColumns[0];

        // Best time candidate

        const selectedTime =
        timeColumns[0];

        const metricLower =
        selectedMetric
            ?.toLowerCase() || "";

        const categoryLower =
        selectedCategory
            ?.toLowerCase() || "";

        // --------------------------------
        // FINANCIAL CONTEXT
        // --------------------------------

        const isFinancial =
        [
            "cost",
            "expense",
            "revenue",
            "sales",
            "amount",
            "spend",
            "price",
            "profit",
            "income",
        ].some((word) =>
            metricLower.includes(word)
        );

        // --------------------------------
        // OPERATIONAL CONTEXT
        // --------------------------------

        const isOperational =
        [
            "department",
            "cost center",
            "division",
            "plant",
            "unit",
            "team",
            "facility",
        ].some((word) =>
            categoryLower.includes(word)
        );

        // --------------------------------
        // GEOGRAPHICAL CONTEXT
        // --------------------------------

        const isGeographical =
        [
            "region",
            "city",
            "country",
            "state",
            "zone",
            "territory",
        ].some((word) =>
            categoryLower.includes(word)
        );

        // --------------------------------
        // PRODUCT CONTEXT
        // --------------------------------

        const isProduct =
        [
            "product",
            "item",
            "sku",
            "inventory",
            "material",
            "asset",
        ].some((word) =>
            categoryLower.includes(word)
        );
                    
        const metricLabel =
        isFinancial
            ? "expenditure"
            : "metric value";

        const categoryLabel =
        isOperational
            ? "department"

            : isGeographical
            ? "region"

            : isProduct
            ? "product category"

            : "category";

        const concentrationLabel =
        isOperational
            ? "operational concentration"

            : isGeographical
            ? "regional concentration"

            : isProduct
            ? "product concentration"

            : "Distribution Concentration";

        const recommendationLabel =
        isOperational
            ? "Review operational efficiency in high-impact departments to identify optimization opportunities."

            : isGeographical
            ? "Review regional distribution patterns to identify concentration opportunities."

            : isProduct
            ? "Review high-impact product categories to optimize distribution and utilization."

            : "Review dominant categories and trends to identify optimization opportunities.";

    useEffect(() => {

    async function fetchInsights() {

        try {
            if (
                !selectedMetric ||
                !selectedCategory ||
                !selectedTime
                ) {
                return;
                }

        setLoading(true);

        const deptRes =
            await fetch(
            `${API_BASE}/api/datasets/${datasetId}/groupby?group_by=${selectedCategory}&metric=${selectedMetric}&aggregation=sum`
            );

        const deptJson =
            await deptRes.json();

        setDepartmentData(
            deptJson
        );

        const monthRes =
            await fetch(
            `${API_BASE}/api/datasets/${datasetId}/groupby?group_by=${selectedTime}&metric=${selectedMetric}&aggregation=sum`
            );

        const monthJson =
            await monthRes.json();

        setMonthlyData(
            monthJson
        );

        } catch (err) {

        console.error(err);

        } finally {

        setLoading(false);

        }
    }
    fetchInsights();

            }, [
            datasetId,
            ]);
    

  // -----------------------------
  // AI INSIGHTS ENGINE
  // -----------------------------

  const insights = useMemo(() => {

    if (
      !departmentData?.data ||
      !monthlyData?.data
    ) {
      return [];
    }

    const results: {
      title: string;
      description: string;
      severity:
        | "info"
        | "warning"
        | "success";
    }[] = [];

    // --------------------------------
    // TOTAL SPEND
    // --------------------------------

    const totalSpend =
      departmentData.data.reduce(
        (sum, row) =>
          sum + row.value,
        0
      );

    results.push({

      title:
        `Total ${selectedMetric}`,

      description:
        `Total ${metricLabel} reached ${formatCurrency(totalSpend)} across ${departmentData.data.length} ${categoryLabel}s.`,

      severity:
        "info",

    });

    // --------------------------------
    // TOP DEPARTMENT
    // --------------------------------

    const topDept =
      [...departmentData.data]
        .sort(
          (a, b) =>
            b.value - a.value
        )[0];

    const topPct =
      (
        (topDept.value /
          totalSpend) *
        100
      ).toFixed(1);

    results.push({

      title:
        `Top ${categoryLabel.charAt(0).toUpperCase() +categoryLabel.slice(1)}`,

      description:
        `${topDept.label} contributes ${topPct}% of total ${metricLabel} with ${formatCurrency(topDept.value)} in observed impact.`,

      severity:
        "warning",

    });

    // --------------------------------
    // TOP 3 CONCENTRATION
    // --------------------------------

    const top3 =
      [...departmentData.data]
        .sort(
          (a, b) =>
            b.value - a.value
        )
        .slice(0, 3);

    const top3Total =
      top3.reduce(
        (sum, row) =>
          sum + row.value,
        0
      );

    const top3Pct =
      (
        (top3Total /
          totalSpend) *
        100
      ).toFixed(1);

    results.push({

      title:
        concentrationLabel,

      description:
        `Top 3 ${categoryLabel}s account for ${top3Pct}% of total ${metricLabel}, indicating significant ${concentrationLabel}.`,

      severity:
        "warning",

    });

    // --------------------------------
    // MONTHLY TREND
    // --------------------------------

    const sortedMonths =
      [...monthlyData.data];

    const highestMonth =
      sortedMonths[0];

    results.push({

      title:
        "Peak Activity Period",

      description:
        `${highestMonth.label} recorded the highest ${metricLabel} at ${formatCurrency(highestMonth.value)}.`,

      severity:
        "info",

    });

    // --------------------------------
    // ANOMALY DETECTION
    // --------------------------------

    const monthlyAverage =
      sortedMonths.reduce(
        (sum, row) =>
          sum + row.value,
        0
      ) /
      sortedMonths.length;

    const anomalies =
      sortedMonths.filter(
        (row) =>
          row.value >
          monthlyAverage * 1.2
      );

    if (
      anomalies.length > 0
    ) {

      results.push({

        title:
          "Anomaly Detection",

        description:
          `${anomalies[0].label} shows unusually high ${metricLabel} compared to the historical average.`,

        severity:
          "warning",

      });

    }

    // --------------------------------
    // BUSINESS RECOMMENDATION
    // --------------------------------

    results.push({

      title:
        "Optimization Recommendation",

      description:
        recommendationLabel,

      severity:
        "success",

    });

    return results;

  }, [
    departmentData,
    monthlyData,
  ]);

  // -----------------------------
  // LOADING
  // -----------------------------

  if (loading){

    return (
      <div className="p-6">

        <Skeleton className="h-[400px] w-full rounded-2xl" />

      </div>
    );
  }

  // -----------------------------
  // UI
  // -----------------------------

  return (

    <div className="p-6 space-y-6">

      <div>

        <h1 className="text-3xl font-bold tracking-tight">

          Smart Insights

        </h1>

        <p className="text-muted-foreground mt-2">

          AI-powered executive analytics and business intelligence insights.

        </p>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {insights.map(
          (
            insight,
            index
          ) => (

            <Card key={index}>

              <CardHeader>

                <CardTitle className="flex items-center gap-2">

                  <div
                    className={`
                      h-2.5
                      w-2.5
                      rounded-full

                      ${
                        insight.severity ===
                        "warning"

                          ? "bg-yellow-500"

                          : insight.severity ===
                            "success"

                          ? "bg-green-500"

                          : "bg-blue-500"
                      }
                    `}
                  />

                  {insight.title}

                </CardTitle>

              </CardHeader>

              <CardContent>

                <p className="text-muted-foreground leading-relaxed">

                  {insight.description}

                </p>

              </CardContent>

            </Card>

          )
        )}

      </div>

    </div>

  );
}