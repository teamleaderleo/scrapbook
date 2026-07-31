import type { Metadata } from "next";
import OsuResumeSelector from "@/components/osu-resume-selector";
import { resumeColumns } from "../lib/resume-data";

export const metadata: Metadata = {
  title: "Resume | teamleaderleo",
  description: "Selected engineering work, open-source contributions, and personal software projects.",
  alternates: { canonical: "/resume" },
};

export default function ResumePage() {
  return <OsuResumeSelector resumeColumns={resumeColumns} />;
}
