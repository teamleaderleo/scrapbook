import SiteNav from "@/components/site-nav";
import { resumeColumns } from "./lib/resume-data";

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <SiteNav />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4 mb-6">
        <div className="grid grid-cols-3 gap-12">
          {resumeColumns.map((sections, colIdx) => (
            <div key={colIdx} className="space-y-8">
              {sections.map((section) => (
                <div key={section.title}>
                  <h2 className="text-xl font-semibold mb-3 text-black">
                    {section.title}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">{section.meta}</p>

                  <ul className="space-y-3 text-sm text-black">
                    {section.items.map((item, i) => (
                      <li key={i}>
                        <div>• {item.bullet}</div>
                        {item.note && (
                          <div className="ml-4 mt-1 text-gray-700">
                            {item.note}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
