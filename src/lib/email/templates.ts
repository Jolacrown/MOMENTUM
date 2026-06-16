function baseHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f0; font-family: 'PlusJakartaSans', -apple-system, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo-symbol { width: 48px; height: 48px; background: #fff7ed; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; }
    .logo-text { font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 800; color: #1a1a18; letter-spacing: -0.025em; }
    h1 { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 800; color: #1a1a18; margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.6; color: #6b6b66; margin: 0 0 16px; }
    .btn { display: inline-block; padding: 12px 28px; border-radius: 12px; background: #f97316; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; }
    .footer { text-align: center; margin-top: 24px; }
    .footer p { font-size: 12px; color: #a0a09a; }
    hr { border: none; border-top: 1px solid rgba(0,0,0,0.06); margin: 24px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">
        <div class="logo-symbol">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
        </div>
        <div class="logo-text">Momentum</div>
      </div>
      ${body}
    </div>
    <div class="footer">
      <p>Momentum &mdash; AI-Powered Accountability Coach</p>
      <p>If you have questions, reply to this email or contact support@momentum.app</p>
    </div>
  </div>
</body>
</html>`;
}

export function renderWelcomeEmail(name: string, dashboardUrl: string): string {
  return baseHtml(`
    <h1>Welcome to Momentum, ${name}!</h1>
    <p>We're thrilled to have you on board. Momentum is Africa's first emotionally intelligent AI accountability coach — built to help you stay consistent, build better habits, and reach your goals.</p>
    <p>Here's what you can do next:</p>
    <p style="margin:0 0 8px">✦ Set your first goal<br/>✦ Chat with your AI Coach<br/>✦ Build your daily check-in habit</p>
    <p style="text-align:center; margin-top:24px">
      <a href="${dashboardUrl}" class="btn">Go to Dashboard</a>
    </p>
    <hr/>
    <p style="font-size:13px; color:#a0a09a;">Need help? Your AI Coach is always available — just ask.</p>
  `);
}

export function renderPremiumConfirmationEmail(name: string, profileUrl: string): string {
  return baseHtml(`
    <h1>You're now a Premium member, ${name}!</h1>
    <p>Thank you for upgrading to Momentum Premium. You now have full access to:</p>
    <p style="margin:0 0 8px">
      ✦ Unlimited active goals<br/>
      ✦ Unlimited AI coaching conversations<br/>
      ✦ Advanced progress analytics<br/>
      ✦ Priority support
    </p>
    <p style="text-align:center; margin-top:24px">
      <a href="${profileUrl}" class="btn">View Your Profile</a>
    </p>
    <hr/>
    <p style="font-size:13px; color:#a0a09a;">Your premium features are active now. If you have any questions, reply to this email.</p>
  `);
}

export function renderStreakRecoveryEmail(name: string, streak: number, dashboardUrl: string): string {
  return baseHtml(`
    <h1>We miss you, ${name}!</h1>
    <p>You were on a <strong>${streak}-day streak</strong> — that's real momentum. Life happens, and that's okay. The important thing is that you start again today.</p>
    <p>Remember: <em>Momentum pauses. It doesn't disappear.</em></p>
    <p style="text-align:center; margin-top:24px">
      <a href="${dashboardUrl}" class="btn">Pick Up Where You Left Off</a>
    </p>
    <hr/>
    <p style="font-size:13px; color:#a0a09a;">Your AI Coach is ready to help you restart with a small, achievable step.</p>
  `);
}

export function renderStreakMilestoneEmail(name: string, streak: number, dashboardUrl: string): string {
  return baseHtml(`
    <h1>🔥 ${streak} days strong, ${name}!</h1>
    <p>You've hit a <strong>${streak}-day streak</strong> — that's incredible consistency. Every day you show up, you're proving that small actions compound into remarkable results.</p>
    <p>Keep the momentum going. Your future self is thanking you.</p>
    <p style="text-align:center; margin-top:24px">
      <a href="${dashboardUrl}" class="btn">Keep Going</a>
    </p>
    <hr/>
    <p style="font-size:13px; color:#a0a09a;">Celebrate this win — you've earned it. Then get back to building.</p>
  `);
}

export function renderDailyReminderEmail(name: string, streak: number, dashboardUrl: string): string {
  return baseHtml(`
    <h1>Time for your daily check-in, ${name}</h1>
    ${streak > 0 ? `<p>You're on a <strong>${streak}-day streak</strong> — don't break it now! One small action today keeps your momentum alive.</p>` : `<p>Every journey starts with a single step. Log your first check-in and get your streak going.</p>`}
    <p style="text-align:center; margin-top:24px">
      <a href="${dashboardUrl}" class="btn">Complete My Check-in</a>
    </p>
    <hr/>
    <p style="font-size:13px; color:#a0a09a;">Consistency beats intensity. Just show up today.</p>
  `);
}

export function renderWeeklyDigestEmail(
  name: string,
  checkins: number,
  streak: number,
  consistencyPercent: number,
  dashboardUrl: string,
): string {
  return baseHtml(`
    <h1>Your Weekly Summary, ${name}</h1>
    <p>Here's how your week went:</p>
    <table style="width:100%; margin: 16px 0;">
      <tr>
        <td style="padding:8px 0; font-size:14px; color:#6b6b66;">Check-ins completed</td>
        <td style="padding:8px 0; font-size:14px; font-weight:700; color:#1a1a18; text-align:right;">${checkins}</td>
      </tr>
      <tr>
        <td style="padding:8px 0; font-size:14px; color:#6b6b66;">Current streak</td>
        <td style="padding:8px 0; font-size:14px; font-weight:700; color:#1a1a18; text-align:right;">${streak} days</td>
      </tr>
      <tr>
        <td style="padding:8px 0; font-size:14px; color:#6b6b66;">Consistency score</td>
        <td style="padding:8px 0; font-size:14px; font-weight:700; color:#1a1a18; text-align:right;">${consistencyPercent}%</td>
      </tr>
    </table>
    <p style="text-align:center; margin-top:24px">
      <a href="${dashboardUrl}" class="btn">View Full Progress</a>
    </p>
    <hr/>
    <p style="font-size:13px; color:#a0a09a;">Next week, aim to beat your consistency score. Your AI Coach is here to help.</p>
  `);
}
