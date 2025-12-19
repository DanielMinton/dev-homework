"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { PriorityBadge } from "./priority-badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { analyzeTickets, getLatestAnalysis, AnalysisResponse } from "@/lib/api";
import { useToast } from "./ui/use-toast";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";

interface AnalysisPanelProps {
  ticketCount: number;
  onAnalysisStart: () => void;
}

export function AnalysisPanel({ ticketCount, onAnalysisStart }: AnalysisPanelProps) {
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLatestAnalysis();
  }, []);

  const loadLatestAnalysis = async () => {
    try {
      const data = await getLatestAnalysis();
      setAnalysis(data);
    } catch (error) {
      console.error("Failed to load analysis:", error);
    }
  };

  const handleAnalyze = async () => {
    if (ticketCount === 0) {
      toast({
        title: "No Tickets",
        description: "Please create some tickets before running analysis",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    onAnalysisStart();

    try {
      await analyzeTickets();

      toast({
        title: "Analysis Started",
        description: "Processing tickets with AI...",
      });

      setPolling(true);
      pollForResults();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start analysis. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const pollForResults = async () => {
    const maxAttempts = 30;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const data = await getLatestAnalysis();

        if (data.run?.status === "complete") {
          setAnalysis(data);
          setLoading(false);
          setPolling(false);
          clearInterval(interval);

          toast({
            title: "Analysis Complete",
            description: `Successfully analyzed ${data.analyses.length} tickets`,
          });
        } else if (data.run?.status === "error") {
          setLoading(false);
          setPolling(false);
          clearInterval(interval);

          toast({
            title: "Analysis Failed",
            description: "An error occurred during analysis",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
      }

      if (attempts >= maxAttempts) {
        setLoading(false);
        setPolling(false);
        clearInterval(interval);

        toast({
          title: "Timeout",
          description: "Analysis is taking longer than expected",
          variant: "destructive",
        });
      }
    }, 2000);
  };

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      billing: "bg-blue-100 text-blue-800 border-blue-200",
      bug: "bg-red-100 text-red-800 border-red-200",
      feature_request: "bg-purple-100 text-purple-800 border-purple-200",
      account: "bg-orange-100 text-orange-800 border-orange-200",
      technical_support: "bg-teal-100 text-teal-800 border-teal-200",
      other: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return colors[category || "other"] || colors.other;
  };

  const formatCategory = (category: string | null) => {
    if (!category) return "Other";
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Analysis</CardTitle>
          <CardDescription>
            Automatically categorize and prioritize support tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleAnalyze}
            disabled={loading || ticketCount === 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Tickets...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Analyze Tickets
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis?.run && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Analysis Results
                {analysis.run.status === "complete" && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    Complete
                  </Badge>
                )}
                {analysis.run.status === "pending" && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Pending
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Analyzed {analysis.run.ticketCount} tickets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {analysis.run.summary && (
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-semibold mb-2 text-sm">Summary</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {analysis.run.summary}
                  </p>
                </div>
              )}

              {analysis.analyses.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Ticket Analysis</h4>
                  {analysis.analyses.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-l-4" style={{ borderLeftColor: item.priority === "high" ? "#ef4444" : item.priority === "medium" ? "#f59e0b" : "#10b981" }}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">{item.ticket.title}</CardTitle>
                            <div className="flex gap-2 flex-shrink-0">
                              <PriorityBadge priority={item.priority} />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge className={getCategoryColor(item.category)}>
                              {formatCategory(item.category)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="details" className="border-0">
                              <AccordionTrigger className="text-sm hover:no-underline">
                                View Details
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 text-sm">
                                  <div>
                                    <p className="font-medium mb-1">Original Description:</p>
                                    <p className="text-muted-foreground">{item.ticket.description}</p>
                                  </div>
                                  {item.notes && (
                                    <div>
                                      <p className="font-medium mb-1">Analysis Notes:</p>
                                      <p className="text-muted-foreground">{item.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {analysis.analyses.length === 0 && analysis.run.status === "complete" && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No analysis results available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
