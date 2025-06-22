/* ==========================================================================*/
// route.ts — API endpoint for scraping URLs using FireCrawl
/* ==========================================================================*/
// Purpose: Handle POST requests to scrape web content from provided URLs
// Sections: Imports, Types, Helpers, Route Handlers

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Next.js core ---
import { NextRequest, NextResponse } from "next/server";

// Local modules ---
import { scrapeUrl } from "@/lib/firecrawl2";
import type { ScrapeOptions } from "@/lib/firecrawl2";

/* ==========================================================================*/
// Types and Interfaces
/* ==========================================================================*/

interface ScrapeRequestBody {
  /** The URL to scrape */
  url: string;
  /** Optional scraping configuration */
  options?: ScrapeOptions;
}

interface ScrapeResponse {
  /** Whether the scraping was successful */
  success: boolean;
  /** The scraped content data */
  data?: unknown;
  /** Error message if scraping failed */
  error?: string;
}

interface FireCrawlResponse {
  success: boolean;
  markdown?: string;
}

/* ==========================================================================*/
// Helpers
/* ==========================================================================*/

/**
 * validateUrl
 *
 * Validate that a string is a proper URL.
 *
 * @param url - String to validate as URL
 * @returns Whether the string is a valid URL
 */
function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * extractRawText
 *
 * Removes all Markdown formatting and returns plain text.
 *
 * @param markdown - Markdown string
 * @returns Plain text string
 */
import removeMarkdown from "remove-markdown";

function extractRawText(markdown: string): string {
  return removeMarkdown(markdown || "");
}

/* ==========================================================================*/
// Route Handlers
/* ==========================================================================*/

/**
 * POST
 *
 * Scrape content from a provided URL using FireCrawl.
 *
 * @param request - NextRequest containing URL and options in body
 * @returns JSON response with scraped content or error
 *
 * @example
 * POST /api/get-source-text
 * Body: { "url": "https://example.com", "options": { "formats": ["markdown"] } }
 */
export async function POST(request: NextRequest): Promise<NextResponse<ScrapeResponse>> {
  try {
    // Parse request body
    const body: ScrapeRequestBody = await request.json();

    // Validate required fields
    if (!body.url) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required",
        },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!validateUrl(body.url)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL format",
        },
        { status: 400 }
      );
    }

    // Scrape the URL
    const scrapedData = await scrapeUrl(body.url, body.options || {}) as FireCrawlResponse;

    // Validate FireCrawl response success
    if (!scrapedData.success) {
      throw new Error('FireCrawl scraping failed');
    }

    // Extract plain text from the scraped markdown content
    const markdownContent = scrapedData.markdown || '';
    console.log("markdownContent", markdownContent);
    const plainText = extractRawText(markdownContent);

    return NextResponse.json({
      success: true,
      data: plainText,
    });
  } catch (error) {
    console.error("Scraping error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to scrape URL",
      },
      { status: 500 }
    );
  }
}

/* ==========================================================================*/
// Public API Exports
/* ==========================================================================*/

export type { ScrapeRequestBody, ScrapeResponse };
