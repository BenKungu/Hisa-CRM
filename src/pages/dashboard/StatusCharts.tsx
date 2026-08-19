 
import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
const StatusChart: React.FC = () => {
  const [chartOptions, _setChartOptions] = useState({
    chart: {
      type: "line",
      stacked: false,
      height: "100%",
      width: "100%",
    },
    dataLabels: {
      enabled: false,
    },
    series: [
      {
        name: "Agents",
        data: [
          { x: "2015", y: 100 },
          { x: "2016", y: 20 },
          { x: "2017", y: 90 },
          { x: "2018", y: 50 },
          { x: "2019", y: 120 },
        ],
      },
      {
        name: "Businesses",
        data: [
          { x: "2015", y: 30 },
          { x: "2016", y: 60 },
          { x: "2017", y: 120 },
          { x: "2018", y: 80 },
          { x: "2019", y: 150 },
        ],
      },
    ],
    xaxis: {
      categories: ["2015", "2016", "2017", "2018", "2019"],
    },
    colors: ["#1b5a90", "#ff9d00"],
    stroke: {
      width: 1,
      curve: "smooth",
    },
    markers: {
      size: 3,
    },
    grid: {
      show: true,
      borderColor: "#ebebeb",
      strokeDashArray: 2,
    },
    tooltip: {
      theme: "dark",
    },
  });

  useEffect(() => {
    const handleResize = () => {
      // @ts-ignore
      if (window.ApexCharts && window.ApexCharts.mL) {
        // @ts-ignore
        window.ApexCharts.mL.updateOptions({
          chart: {
            width: "100%",
          },
        });
        // Safely check for ApexCharts and mL before calling methods
        if (
          typeof window !== "undefined" &&
          (window as any).ApexCharts &&
          (window as any).ApexCharts.mL
        ) {
          (window as any).ApexCharts.mL.updateSeries(chartOptions.series);
          (window as any).ApexCharts.mL.render();
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [chartOptions]);

  return (
    <div>
      <ReactApexChart
        options={chartOptions as ApexCharts.ApexOptions}
        series={chartOptions.series}
        type="line"
        height={300}
      />
    </div>
  );
};

export default StatusChart;
