"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExplainabilityPanel({ prediction }) {
  const [activeTab, setActiveTab] = useState("shap");

  if (!prediction?.shapValues) {
    return null;
  }

  const { shapValues } = prediction;
  const topDrivers = shapValues.top_3_drivers || [];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Why This Decision?</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b">
          <button
            onClick={() => setActiveTab("shap")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "shap"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            SHAP Explanation
          </button>
          <button
            onClick={() => setActiveTab("drivers")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "drivers"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            Key Drivers
          </button>
        </div>

        {activeTab === "shap" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              SHAP values show how each feature contributes to the prediction.
              <span className="text-red-500"> Red</span> increases risk,
              <span className="text-green-500"> Green</span> decreases risk.
            </p>

            {/* Feature Importance Bars */}
            <div className="space-y-3">
              {Object.entries(shapValues.feature_importance || {}).map(
                ([feature, value]) => (
                  <div key={feature}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">
                        {feature.replace(/_/g, " ")}
                      </span>
                      <span
                        className={
                          value > 0 ? "text-red-500" : "text-green-500"
                        }
                      >
                        {value > 0 ? "+" : ""}
                        {(value * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          value > 0 ? "bg-red-500" : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(Math.abs(value) * 200, 100)}%`,
                          marginLeft: value > 0 ? "50%" : "auto",
                          marginRight: value < 0 ? "50%" : "auto",
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {activeTab === "drivers" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">
              Top 3 factors affecting your application:
            </p>
            {topDrivers.map((driver, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  driver.direction === "increases"
                    ? "bg-red-50 border-red-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">
                    {driver.feature.replace(/_/g, " ")}
                  </span>
                  <span
                    className={
                      driver.direction === "increases"
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    {driver.direction === "increases" ? "↑" : "↓"}{" "}
                    {(driver.magnitude * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {driver.direction === "increases"
                    ? "This increases your default risk"
                    : "This helps your application"}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}