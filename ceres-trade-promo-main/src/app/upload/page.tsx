"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "@/components/chat-bubble";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message?: string }>({ type: "idle" });

  const handleUpload = async () => {
    if (!file) return;
    setStatus({ type: "loading" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", message: `Successfully uploaded ${data.inserted} promotions.` });
        setFile(null);
      } else {
        setStatus({ type: "error", message: data.error || "Upload failed" });
      }
    } catch (e) {
      setStatus({ type: "error", message: "Network error during upload" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload Calendar</h2>
        <p className="text-muted-foreground">Upload new promotional plans via CSV</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Upload Promotion Plan</CardTitle>
          <CardDescription>
            Upload a CSV file with columns: RETAILER_ID, PPG_ID, WEEK_START, DISCOUNT_PCT, PROMO_TYPE, PLANNED_SPEND_IDR
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block mx-auto text-sm"
            />
            {file && <p className="mt-2 text-sm text-muted-foreground">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
          </div>

          <Button onClick={handleUpload} disabled={!file || status.type === "loading"}>
            {status.type === "loading" ? "Uploading..." : "Upload CSV"}
          </Button>

          {status.type === "success" && (
            <div className="p-3 rounded-md bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200 text-sm">
              {status.message}
            </div>
          )}
          {status.type === "error" && (
            <div className="p-3 rounded-md bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200 text-sm">
              {status.message}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p className="font-medium">CSV Template columns:</p>
            <code className="block bg-muted p-2 rounded text-xs">
              RETAILER_ID,PPG_ID,WEEK_START,WEEK_END,DISCOUNT_PCT,PROMO_TYPE,PLANNED_SPEND_IDR,PLANNED_VOLUME_CASES
            </code>
            <p>PROMO_TYPE values: TPR, TPR+D, TPR+F, TPR+D+F</p>
          </div>
        </CardContent>
      </Card>

      <ChatBubble />
    </div>
  );
}
