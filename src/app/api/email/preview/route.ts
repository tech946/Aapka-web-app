import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomerEmailTemplate,
  getInternalEmailTemplate,
} from '@/lib/email-preview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      );
    }

    let html = '';
    if (type === 'customer') {
      html = getCustomerEmailTemplate(data);
    } else if (type === 'internal') {
      html = getInternalEmailTemplate(data);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ html });
  } catch (error: any) {
    console.error('Error generating email preview:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
