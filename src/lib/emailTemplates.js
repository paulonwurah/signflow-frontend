// Email HTML generators — used by the backend email service
// These match the visual templates built in the UI

const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F7F6F2; color: #1A1916; }
  .wrapper { max-width: 580px; margin: 0 auto; padding: 2rem 1rem; }
  .card { background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #E8E5DE; }
  .card-body { padding: 2rem; }
  .logo { font-family: Georgia, serif; font-size: 1.3rem; font-style: italic; color: #1A1916; margin-bottom: 1.75rem; display: block; }
  .logo span { color: #2563EB; font-style: normal; }
  h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
  p { font-size: 14px; color: #5C5A53; line-height: 1.7; margin-bottom: 1rem; }
  .doc-card { background: #F7F6F2; border-radius: 10px; padding: 1.25rem 1.5rem; margin: 1.25rem 0; }
  .doc-name { font-size: 1rem; font-weight: 600; color: #1A1916; margin-bottom: 6px; }
  .doc-meta { font-size: 13px; color: #6B6860; line-height: 1.7; }
  .cta { display: inline-block; padding: 13px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 0.5rem 0 1.25rem; }
  .cta-dark { background: #1A1916; color: #fff; }
  .cta-blue { background: #2563EB; color: #fff; }
  .cta-green { background: #16A34A; color: #fff; }
  .link-small { font-size: 12px; color: #9B9890; word-break: break-all; }
  .divider { height: 1px; background: #E8E5DE; margin: 1.5rem 0; }
  .footer { font-size: 12px; color: #9B9890; line-height: 1.7; }
  .footer a { color: #2563EB; text-decoration: none; }
  .success-box { background: #F0FDF4; border-left: 3px solid #16A34A; border-radius: 0 8px 8px 0; padding: 1rem 1.25rem; margin: 1.25rem 0; }
  .success-box strong { display: block; font-size: 14px; color: #15803D; margin-bottom: 4px; }
  .success-box span { font-size: 12px; color: #166534; line-height: 1.8; display: block; }
  .warn-box { background: #FFFBEB; border-left: 3px solid #D97706; border-radius: 0 8px 8px 0; padding: 1rem 1.25rem; margin: 1.25rem 0; }
  .warn-box strong { display: block; font-size: 14px; color: #B45309; margin-bottom: 4px; }
  .warn-box span { font-size: 12px; color: #92400E; line-height: 1.8; display: block; }
  .danger-card { background: #FEF2F2; }
  .danger-name { color: #DC2626; }
`

// 1. Signing request — sent to recipient
export function signingRequestEmail({ document, signingUrl, senderName }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_STYLES}</style></head><body>
  <div class="wrapper">
    <div class="card">
      <div class="card-body">
        <a href="#" class="logo">Sign<span>Flow</span></a>
        <h2>You have a document to sign</h2>
        <p><strong>${senderName || 'Someone'}</strong> has sent you a <strong>${document.doc_type}</strong> that requires your signature.</p>
        <div class="doc-card">
          <div class="doc-name">${document.title}</div>
          <div class="doc-meta">
            ${document.total ? `Value: <strong>${document.currency_symbol}${Number(document.total).toLocaleString()}</strong><br>` : ''}
            ${document.due_date ? `Due: ${document.due_date}<br>` : ''}
            Sent by: ${senderName || 'Sender'}
          </div>
        </div>
        <p>Click below to review and sign — no account required.</p>
        <a href="${signingUrl}" class="cta cta-blue">Review &amp; Sign Document →</a>
        <p class="link-small">Or paste this link: ${signingUrl}</p>
        <p style="font-size:13px;color:#9B9890">This link expires in 7 days. If you didn't expect this, you can safely ignore it.</p>
        <div class="divider"></div>
        <div class="footer">Sent via <a href="#">SignFlow</a> · Questions? Reply to this email.</div>
      </div>
    </div>
  </div>
</body></html>`
}

// 2. Document signed notification — sent to document owner
export function documentSignedEmail({ document, signerName, signerEmail, signedAt, pdfUrl }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_STYLES}</style></head><body>
  <div class="wrapper">
    <div class="card">
      <div class="card-body">
        <a href="#" class="logo">Sign<span>Flow</span></a>
        <h2>Your document has been signed ✓</h2>
        <p><strong>${signerName}</strong> has signed <strong>${document.title}</strong>. The document is now fully executed.</p>
        <div class="success-box">
          <strong>Document completed</strong>
          <span>Document: ${document.title}</span>
          <span>Signed by: ${signerName} (${signerEmail})</span>
          <span>Signed at: ${new Date(signedAt).toLocaleString()}</span>
          <span>Document ID: ${document.id?.slice(0,8) || '—'}</span>
        </div>
        ${pdfUrl ? `<a href="${pdfUrl}" class="cta cta-green">Download Signed PDF →</a>` : ''}
        <div class="divider"></div>
        <div class="footer">Sent via <a href="#">SignFlow</a> · <a href="#">View in dashboard →</a></div>
      </div>
    </div>
  </div>
</body></html>`
}

// 3. Completion confirmation — sent to recipient after signing
export function completionConfirmationEmail({ document, signerName, signerEmail, signedAt, pdfUrl, senderName }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_STYLES}</style></head><body>
  <div class="wrapper">
    <div class="card">
      <div class="card-body">
        <a href="#" class="logo">Sign<span>Flow</span></a>
        <h2>You've signed the document ✓</h2>
        <p>Thank you, <strong>${signerName}</strong>. You've successfully signed <strong>${document.title}</strong> for <strong>${senderName || 'the sender'}</strong>.</p>
        <div class="success-box">
          <strong>Signing confirmed</strong>
          <span>Document: ${document.title}</span>
          <span>Signed by: ${signerName}</span>
          <span>Timestamp: ${new Date(signedAt).toLocaleString()}</span>
          <span>Status: Fully executed</span>
        </div>
        ${pdfUrl ? `<a href="${pdfUrl}" class="cta cta-green">Download Your Copy →</a>` : ''}
        <p style="font-size:13px;color:#9B9890">Keep this email as your record of the signed agreement.</p>
        <div class="divider"></div>
        <div class="footer">Sent via <a href="#">SignFlow</a> · Questions? Contact <a href="mailto:">${senderName}</a></div>
      </div>
    </div>
  </div>
</body></html>`
}

// 4. Signing reminder — sent to recipient after X days
export function signingReminderEmail({ document, signingUrl, senderName, expiresAt }) {
  const daysLeft = Math.ceil((new Date(expiresAt) - new Date()) / (1000*60*60*24))
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_STYLES}</style></head><body>
  <div class="wrapper">
    <div class="card">
      <div class="card-body">
        <a href="#" class="logo">Sign<span>Flow</span></a>
        <h2>Friendly reminder — signature needed</h2>
        <p><strong>${senderName || 'Someone'}</strong> is waiting for your signature on the following document.</p>
        <div class="doc-card">
          <div class="doc-name">${document.title}</div>
          <div class="doc-meta">
            ${document.total ? `Value: <strong>${document.currency_symbol}${Number(document.total).toLocaleString()}</strong><br>` : ''}
            <span style="color:#D97706;font-weight:600">⚠ Expires in ${daysLeft} day${daysLeft!==1?'s':''}</span>
          </div>
        </div>
        <div class="warn-box">
          <strong>Action required</strong>
          <span>This signing link expires on ${new Date(expiresAt).toLocaleDateString()}. Please sign before then.</span>
        </div>
        <a href="${signingUrl}" class="cta cta-dark">Sign Now →</a>
        <p style="font-size:13px;color:#9B9890;margin-top:0.5rem">If you've already signed or don't need to, ignore this reminder.</p>
        <div class="divider"></div>
        <div class="footer">Sent via <a href="#">SignFlow</a> on behalf of ${senderName} · <a href="#">Unsubscribe from reminders</a></div>
      </div>
    </div>
  </div>
</body></html>`
}

// 5. Link expired — sent to recipient
export function linkExpiredEmail({ document, senderName, senderEmail }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_STYLES}</style></head><body>
  <div class="wrapper">
    <div class="card">
      <div class="card-body">
        <a href="#" class="logo">Sign<span>Flow</span></a>
        <h2>Signing link expired</h2>
        <p>The signing link for <strong>${document.title}</strong> sent by <strong>${senderName}</strong> has expired and is no longer active.</p>
        <div class="doc-card danger-card">
          <div class="doc-name danger-name">${document.title}</div>
          <div class="doc-meta" style="color:#EF4444;font-weight:500;margin-top:4px">Link expired</div>
        </div>
        <p>If you still need to sign this document, please contact <strong>${senderName}</strong> and ask them to send a new signing link.</p>
        <div class="divider"></div>
        <div class="footer">Sent via <a href="#">SignFlow</a> · Contact sender: <a href="mailto:${senderEmail||''}">${senderEmail||senderName}</a></div>
      </div>
    </div>
  </div>
</body></html>`
}
