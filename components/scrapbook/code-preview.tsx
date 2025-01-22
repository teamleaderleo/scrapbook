import { Card } from '@/components/ui/card';
import { Code } from 'lucide-react';

interface CodeAttachment {
  title: string;
  content: string;
}

const CodePreview = ({ 
  code, 
  isExpanded, 
  transformClass 
}: { 
  code: CodeAttachment;
  isExpanded: boolean;
  transformClass: string;
}) => (
  <Card className={`
    absolute top-0 left-0 bg-white border-2 border-gray-200
    transition-all duration-300 ease-out rotate-2 w-80
    ${transformClass}
  `}>
    {isExpanded ? (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Code className="w-4 h-4" />
          <span className="text-sm font-medium">{code.title}</span>
        </div>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
          {code.content}
        </pre>
      </div>
    ) : (
      <div className="h-[120px]">
        <div className="absolute top-2 right-2">
          <Code className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    )}
  </Card>
);

export default CodePreview;