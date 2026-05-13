// server/middleware/aiCredits.js
// Intercepts AI API calls and enforces per-environment credit budgets.
'use strict';

function aiCreditsMiddleware(req, res, next) {
  const environmentId =
    req.body?.environment_id ||
    req.body?.environmentId  ||
    req.headers['x-environment-id'];

  if (!environmentId) return next();

  try {
    // Lazy-require to avoid circular dependency at startup
    const { checkCredits } = require('../routes/ai_credits');
    const status = checkCredits(environmentId);

    if (status.uncapped) return next();

    res.setHeader('X-AI-Credits-Remaining-USD', status.remaining_usd?.toFixed(4) || '');
    res.setHeader('X-AI-Credits-Pct-Remaining',  status.pct_remaining ?? '');
    res.setHeader('X-AI-Credits-Budget-USD',      status.budget_usd?.toFixed(2) || '');
    if (status.warn_level) res.setHeader('X-AI-Credits-Warning', status.warn_level.severity);

    if (!status.allowed) {
      return res.status(402).json({
        error: 'AI credit limit reached',
        code:  'AI_CREDITS_EXHAUSTED',
        details: {
          environment_id: environmentId,
          budget_usd:     status.budget_usd,
          used_usd:       status.used_usd,
          remaining_usd:  0,
          message: 'This environment has reached its monthly AI credit limit. Please contact your administrator to top up.',
        },
      });
    }

    if (status.warn_level?.severity === 'critical') {
      console.warn(`[AI Credits] ${environmentId} critically low: ${status.pct_remaining}% ($${status.remaining_usd?.toFixed(2)} left)`);
    }

    next();
  } catch (err) {
    console.error('[AI Credits] Credit check error:', err.message);
    next(); // fail open
  }
}

module.exports = aiCreditsMiddleware;
