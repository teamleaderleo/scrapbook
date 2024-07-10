import React from 'react';

interface SuggestionsProps {
  suggestedTags?: string[];
  suggestedContentExtensions?: string[];
  onAddTag: (tag: string) => void;
  onAddContentExtension: (extension: string) => void;
}

export function Suggestions({ suggestedTags, suggestedContentExtensions, onAddTag, onAddContentExtension }: SuggestionsProps) {
  const handleAddTag = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();  // Prevent form submission
    onAddTag(tag);
  };

  const handleAddExtension = (e: React.MouseEvent, extension: string) => {
    e.preventDefault();  // Prevent form submission
    onAddContentExtension(extension);
  };

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">AI Suggestions</h2>
      {suggestedTags && suggestedTags.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Suggested Tags</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag, index) => (
              <button
                key={index}
                onClick={(e) => handleAddTag(e, tag)}
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full hover:bg-blue-200"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
      {suggestedContentExtensions && suggestedContentExtensions.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Content Extension Ideas</h3>
          <ul className="list-disc pl-5">
            {suggestedContentExtensions.map((idea, index) => (
              <li key={index}>
                {idea}
                <button
                  onClick={(e) => handleAddExtension(e, idea)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}