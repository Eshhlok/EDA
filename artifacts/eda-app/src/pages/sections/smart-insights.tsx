import React, {
  useEffect,
  useMemo,
  useState,
} from "react";


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

    useEffect(() => {

    async function fetchInsights() {

        try {

        setLoading(true);

        const deptRes =
            await fetch(
            `${API_BASE}/api/datasets/${datasetId}/groupby?group_by=Cost Center Name&metric=LNG Cost&aggregation=sum`
            );

        const deptJson =
            await deptRes.json();

        setDepartmentData(
            deptJson
        );

        const monthRes =
            await fetch(
            `${API_BASE}/api/datasets/${datasetId}/groupby?group_by=Posting Date_month&metric=LNG Cost&aggregation=sum`
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

    }, [datasetId]);

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
        "Total LNG Expenditure",

      description:
        `Total LNG expenditure reached ${formatCurrency(totalSpend)} across ${departmentData.data.length} operational departments.`,

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
        "Top Consuming Department",

      description:
        `${topDept.label} contributes ${topPct}% of total LNG expenditure with ${formatCurrency(topDept.value)} in consumption.`,

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
        "Operational Concentration",

      description:
        `Top 3 departments account for ${top3Pct}% of total LNG expenditure, indicating significant operational concentration.`,

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
        "Peak Consumption Period",

      description:
        `${highestMonth.label} recorded the highest LNG expenditure at ${formatCurrency(highestMonth.value)}.`,

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
          `${anomalies[0].label} shows unusually high LNG expenditure compared to the monthly average.`,

        severity:
          "warning",

      });

    }

    // --------------------------------
    // BUSINESS RECOMMENDATION
    // --------------------------------

    results.push({

      title:
        "Operational Recommendation",

      description:
        `Review LNG utilization efficiency in high-consumption departments to identify optimization opportunities and reduce operational cost concentration.`,

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