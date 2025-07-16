// src/lib/pdf.ts
import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer"; // full Puppeteer for local dev

/**
 * Generate a PDF buffer from HTML content.
 * - In Vercel/AWS Lambda: uses puppeteer-core + @sparticuz/chromium
 * - Locally (Windows/Mac/Linux dev): uses full puppeteer (bundles its own Chromium)
 */
export async function generatePDFBuffer(html: string): Promise<Buffer> {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_REGION);

  // Launch the right browser
  const browser = isServerless
    ? await puppeteerCore.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
        // you can add '--no-sandbox' here if you hit sandbox errors
      })
    : await puppeteer.launch({
        headless: true,
        // you can add other args here for your local Chrome if needed
      });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "1in", bottom: "1in", left: "1in", right: "1in" },
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}
