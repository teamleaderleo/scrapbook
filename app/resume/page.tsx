import OsuResumeSelector from "@/components/projects/components/osu-resume-selector";
import { resumeColumns } from "../lib/resume-data";

export default function ResumePage() {
  return <OsuResumeSelector resumeColumns={resumeColumns} />;
}