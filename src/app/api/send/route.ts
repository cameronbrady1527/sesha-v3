import { ArticleComplete } from '@/components/email/article-complete';
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

// ==========================================================================
// Configuration
// ==========================================================================

const resend = new Resend(process.env.RESEND_API_KEY);

// ==========================================================================
// Request Types
// ==========================================================================

interface SendEmailRequest {
  to: string[];
  subject: string;
  href: string;
  name: string;
  slug: string;
  version: number;
}

// ==========================================================================
// Route Handler
// ==========================================================================

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json();

    // Validate required fields
    if (!body.to || !body.subject || !body.href) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and href are required' }, 
        { status: 400 }
      );
    }

    // Validate email array
    if (!Array.isArray(body.to) || body.to.length === 0) {
      return NextResponse.json(
        { error: 'to field must be a non-empty array of email addresses' }, 
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'updates@updates.sesha-systems.com',
      to: body.to,
      subject: body.subject,
      react: ArticleComplete({ href: body.href, name: body.name, slug: body.slug, version: body.version }),
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}