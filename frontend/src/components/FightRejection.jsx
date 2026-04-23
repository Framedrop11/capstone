"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loanApi } from "@/lib/api";

export default function FightRejection({ prediction, features }) {
  const [fightResult, setFightResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFight = async () => {
    setLoading(true);
    try {
      const result = await loanApi.fight({
        features,
        current_pd: prediction.modelPdScore,
      });
      setFightResult(result);
    } catch (error) {
      console.error("Fight rejection error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (prediction.modelRiskGrade !== "D") return null;

  return (
    <Card className="mt-6 border-red-200">
      <CardHeader className="bg-red-50">
        <CardTitle className="text-red-800">⚠️ Application Rejected</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!fightResult ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Find out the fastest way to improve your approval chances
            </p>
            <Button
              onClick={handleFight}
              disabled={loading}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Analyzing..." : "🚀 Fight Rejection"}
            </Button>
          </div>
        ) : (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="font-medium text-green-800 mb-2">
              {fightResult.message}
            </p>
            {fightResult.action && (
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Expected PD Improvement:</strong>{" "}
                  {(fightResult.action.expected_pd_improvement * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}