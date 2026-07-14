// Cloudflare Pages Function — Form submission handler
// Deploy path: functions/api/submit.js
// Handles POST /api/submit, calls Resend API

const RESEND_API_KEY = 're_E7QpRQ9h_BTsnUCWVTiiiyYwDJmBHWagm';
const FROM_EMAIL = 'noreply@cemalengineering.com';
const TO_EMAIL = 'sales@cemalengineering.com';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmailHtml(data) {
  const hasAttachment = !!(data.attachment && data.attachment.filename);
  const drawingInfo = hasAttachment
    ? `<span style="color:#3fa66b;font-weight:600;">✓ Attached:</span> ${escapeHtml(data.attachment.filename)}`
    : '<span style="color:#999;">No file attached</span>';
  const submittedAt = new Date().toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
  });

  const rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Phone', data.phone],
    ['Project Type', data.project],
    ['Quantity', data.quantity],
    ['Material', data.material],
    ['Target Timeline', data.delivery],
    ['Drawing File', drawingInfo]
  ];

  const tableRows = rows.map(([label, value]) => {
    const isFileRow = label === 'Drawing File';
    return `<tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#f8fafc;width:160px;font-size:13px;font-weight:700;color:#1e293b;${isFileRow ? 'border-bottom:2px solid #e2e8f0;' : ''}">${label}</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:14px;color:#334155;${isFileRow ? 'border-bottom:2px solid #e2e8f0;' : ''}">${value ? (isFileRow ? value : escapeHtml(value)) : '<span style="color:#94a3b8;">—</span>'}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#0e5bd8 0%,#0a48ab 100%);padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Manufacturing RFQ</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Received from website form · ${escapeHtml(submittedAt)}</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${tableRows}
          </table>
          <h3 style="margin:28px 0 10px;font-size:15px;font-weight:700;color:#1e293b;">Project Notes</h3>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;font-size:14px;color:#334155;line-height:1.7;white-space:pre-wrap;">${escapeHtml(data.message || 'No additional notes provided.')}</div>
          ${hasAttachment ? `<p style="margin:16px 0 0;font-size:13px;color:#3fa66b;background:rgba(63,166,107,0.08);padding:10px 14px;border-radius:6px;border:1px solid rgba(63,166,107,0.2);">📎 Attachment <strong>${escapeHtml(data.attachment.filename)}</strong> is included with this email.</p>` : ''}
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#64748b;">Submitted via <a href="https://www.cemalengineering.com" style="color:#0e5bd8;text-decoration:none;font-weight:600;">Cemal Engineering</a> website</p>
          <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Reply directly to this email to contact the sender.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function onRequestPost(context) {
  const request = context.request;

  // CORS preflight is handled automatically by Cloudflare, but we add headers to response
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    let data = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = await request.text();
      body.split('&').forEach(pair => {
        const eq = pair.indexOf('=');
        const k = eq >= 0 ? pair.slice(0, eq) : pair;
        const v = eq >= 0 ? pair.slice(eq + 1) : '';
        if (k) data[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
      });
    } else {
      data = await request.json();
    }

    // Honeypot check
    if (data.company_zip && data.company_zip.trim() !== '') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Bot detected. Please contact us directly at sales@cemalengineering.com'
      }), { status: 200, headers: corsHeaders });
    }

    // Timestamp check (if provided)
    const ts = parseInt(data._ts, 10);
    const now = Date.now();
    if (data._ts && (!ts || (now - ts) < 3000 || (now - ts) > 3600000)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Bot detected. Please contact us directly at sales@cemalengineering.com'
      }), { status: 200, headers: corsHeaders });
    }

    // Build Resend payload
    const payload = {
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `Manufacturing RFQ - ${data.project || 'Cemal Engineering'}`,
      html: buildEmailHtml(data),
      reply_to: data.email || undefined
    };

    if (data.attachment && data.attachment.filename && data.attachment.content) {
      payload.attachments = [
        {
          filename: data.attachment.filename,
          content: data.attachment.content
        }
      ];
    }

    // Call Resend API via fetch
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resendBody = await resendRes.text();

    if (resendRes.ok) {
      const result = JSON.parse(resendBody);
      return new Response(JSON.stringify({
        success: true,
        message: 'Thank you! We received your manufacturing request and will respond within 24 hours.'
      }), { status: 200, headers: corsHeaders });
    } else {
      console.error('[Worker] Resend error:', resendRes.status, resendBody);
      return new Response(JSON.stringify({
        success: false,
        message: 'We could not send your request. Please email us directly at sales@cemalengineering.com'
      }), { status: 200, headers: corsHeaders });
    }

  } catch (e) {
    console.error('[Worker] Error:', e);
    return new Response(JSON.stringify({
      success: false,
      message: 'Something went wrong. Please email us directly at sales@cemalengineering.com'
    }), { status: 200, headers: corsHeaders });
  }
}

// Handle OPTIONS (CORS preflight)
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
