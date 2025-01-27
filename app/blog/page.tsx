import React from 'react';
import ReactMarkdown from 'react-markdown';
import SiteNav from '@/components/site-nav';

const firstPost = `
# My First Blog Post

Hold on, this is still under construction. I will be working on posting some more posts this week.

Stay tuned? 🤔

January 27, 2025, 4:48 AM.

..

## What I'm Working On

I just set up this basic blog system using Tailwind's typography plugin. Check out how it handles different elements:

### Code blocks
\`\`\`typescript
// Look how nice this code block looks
const greeting = "Hello, blog!";
console.log(greeting);
\`\`\`

### Lists
- This is a bullet point
- Another bullet point
  - Nested bullet point
  - Another nested one

### Blockquotes
> This is what a blockquote looks like
> Pretty neat, huh?

### Links and Emphasis
Here's a [link](#) and some *italic* and **bold** text.
`;

const SimpleBlog = () => {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <article className="prose prose-slate lg:prose-lg">
        <ReactMarkdown>{firstPost}</ReactMarkdown>
      </article>
    </div>
  );
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <div className="max-w-2xl mx-auto p-4">
        <article className="prose prose-slate lg:prose-lg">
          <ReactMarkdown>{firstPost}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}