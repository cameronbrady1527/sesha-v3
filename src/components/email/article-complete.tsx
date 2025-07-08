import * as React from "react";

interface ArticleCompleteProps {
  href: string;
}

export function ArticleComplete({ href }: ArticleCompleteProps) {
  return (
    <div>
      <p>
        Your article is complete! You can view it{" "}
        <a target="_blank" href={href}>
          here
        </a>
        .
      </p>
    </div>
  );
}
