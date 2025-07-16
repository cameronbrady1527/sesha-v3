// lib/pdf.ts
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';

/**
 * Generate PDF from HTML string
 */
export async function generatePDFBuffer(html: string): Promise<Uint8Array> {
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';
  
  let browser;

  if (isServerless) {
    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true
    });
  } else {
    browser = await puppeteer.launch({
      headless: true
    });
  }

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: { top: "1in", bottom: "1in", left: "1in", right: "1in" },
    printBackground: true,
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}
