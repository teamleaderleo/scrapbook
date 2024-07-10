import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatArtifact() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>New Project Artifact</CardTitle>
        <CardDescription>Collaborate with your team to create and discuss new project items.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center gap-2">
            <Textarea
              placeholder="Share your thoughts, ideas, or updates..."
              className="flex-1 min-h-[80px] resize-none"
            />
            <Button variant="outline" size="icon">
              <PaperclipIcon className="w-5 h-5" />
              <span className="sr-only">Attach file</span>
              <Input type="file" className="hidden" />
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button type="submit">Post</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PaperclipIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}