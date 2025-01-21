import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";


import { Button } from "@/components/ui/button";

import LiteracyPage from "@/components/literacy-page";

export default function DashboardPage() {
  
  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <LiteracyPage />
    </div>
  )
}
