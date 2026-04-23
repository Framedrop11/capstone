"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoadmapTimeline({ roadmap, currentGrade }) {
  if (!roadmap) return null;

  const isRejected = currentGrade === "D";

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>
          {isRejected ? "📋 90-Day Approval Roadmap" : "📈 Improvement Plan"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isRejected ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Current PD:</strong>{" "}
                {(roadmap.current_pd * 100).toFixed(1)}% →
                <strong> Target:</strong> below{" "}
                {(roadmap.target_pd_threshold * 100).toFixed(0)}%
              </p>
            </div>

            {/* Timeline Steps */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200" />

              {["week_1", "week_4", "week_8", "week_12"].map((week, idx) => {
                const milestone = roadmap.roadmap?.[week];
                if (!milestone) return null;

                return (
                  <div key={week} className="relative pl-10 pb-6">
                    <div className="absolute left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">
                          Week {milestone.week}: {milestone.focus}
                        </h4>
                        <span className="text-sm text-gray-500">
                          PD: {(milestone.projected_pd * 100).toFixed(1)}%
                        </span>
                      </div>
                      {milestone.actions?.[0] && (
                        <>
                          <p className="text-sm font-medium text-gray-700">
                            {milestone.actions[0].what}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {milestone.actions[0].why}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Expected improvement:{" "}
                            {milestone.actions[0].expected_pd_improvement} PD
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-green-600">✅ Your profile is on track!</p>
            <p className="text-sm text-gray-500 mt-2">
              Maintain good financial habits to keep your score strong.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}