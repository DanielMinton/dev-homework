"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { analyzeTickets, getLatestAnalysis, AnalysisResponse } from "@/lib/api";
import { useToast } from "./ui/use-toast";
import { Loader2, Sparkles, BarChart3 } from "lucide-react";

interface AnalysisPanelProps {
  ticketCount: number;
  onAnalysisStart: () => void;
}

export function AnalysisPanel({ ticketCount, onAnalysisStart }: AnalysisPanelProps) {
  const [loading, setLoading] = useState(false);
  const [, setPolling] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLatestAnalysis();
  }, []);

  const loadLatestAnalysis = async () => {
    try {
      const data = await getLatestAnalysis();
      setAnalysis(data);
    } catch {
      // no analysis yet, that's fine
    }
  };

  const handleAnalyze = async () => {
    if (ticketCount === 0) {
      toast({
        title: "No requests",
        description: "Add some guest requests before analyzing",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    onAnalysisStart();

    try {
      await analyzeTickets();

      toast({
        title: "Analysis started",
        description: "Processing requests...",
      });

      setPolling(true);
      pollForResults();
    } catch {
      toast({
        title: "Error",
        description: "Failed to start analysis",
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
            title: "Analysis complete",
            description: `Routed ${data.analyses.length} requests`,
          });
        } else if (data.run?.status === "error") {
          setLoading(false);
          setPolling(false);
          clearInterval(interval);

          toast({
            title: "Analysis failed",
            description: "An error occurred",
            variant: "destructive",
          });
        }
      } catch {
        // keep polling
      }

      if (attempts >= maxAttempts) {
        setLoading(false);
        setPolling(false);
        clearInterval(interval);

        toast({
          title: "Timeout",
          description: "Analysis taking longer than expected",
          variant: "destructive",
        });
      }
    }, 2000);
  };

  // hospitality category colors
  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      room_service: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      maintenance: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      housekeeping: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      front_desk: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      concierge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      billing: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      noise_complaint: "bg-red-500/20 text-red-300 border-red-500/30",
      amenities: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      vip_urgent: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      other: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
    };
    return colors[category || "other"] || colors.other;
  };

  const getPriorityStyle = (priority: string | null) => {
    const styles: Record<string, string> = {
      high: "bg-red-500/20 text-red-300 border-red-500/30",
      medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    };
    return styles[priority || "low"] || styles.low;
  };

  const formatCategory = (category: string | null) => {
    if (!category) return "Other";
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="space-y-3">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Route Requests</CardTitle>
          <CardDescription className="text-xs">
            AI-powered department routing and prioritization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleAnalyze}
              disabled={loading || ticketCount === 0}
              className="w-full h-9"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Analyze Requests
                </>
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {analysis?.run && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Results
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={analysis.run.status === "complete"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs"
                    }
                  >
                    {analysis.run.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {analysis.run.ticketCount} requests analyzed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.run.summary && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-md bg-secondary/50 p-3 border border-border/50"
                  >
                    <h4 className="font-medium mb-1.5 text-xs text-muted-foreground uppercase tracking-wide">Summary</h4>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {analysis.run.summary}
                    </p>
                  </motion.div>
                )}

                {analysis.analyses.length > 0 && (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {analysis.analyses.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Accordion type="single" collapsible>
                          <AccordionItem value="details" className="border rounded-md bg-secondary/30 px-3">
                            <AccordionTrigger className="hover:no-underline py-2.5">
                              <div className="flex items-start justify-between w-full gap-2 text-left">
                                <span className="text-sm font-medium line-clamp-1 flex-1">
                                  {item.ticket.title}
                                </span>
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <Badge variant="outline" className={`${getCategoryColor(item.category)} text-[10px] px-1.5 py-0`}>
                                    {formatCategory(item.category)}
                                  </Badge>
                                  <Badge variant="outline" className={`${getPriorityStyle(item.priority)} text-[10px] px-1.5 py-0 uppercase`}>
                                    {item.priority}
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-0 pb-3">
                              <div className="space-y-2 text-xs">
                                <div>
                                  <p className="text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">Request</p>
                                  <p className="text-foreground/80">{item.ticket.description}</p>
                                </div>
                                {item.notes && (
                                  <div>
                                    <p className="text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">Routing Notes</p>
                                    <p className="text-foreground/80">{item.notes}</p>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </motion.div>
                    ))}
                  </div>
                )}

                {analysis.analyses.length === 0 && analysis.run.status === "complete" && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-xs text-muted-foreground">No analysis results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
