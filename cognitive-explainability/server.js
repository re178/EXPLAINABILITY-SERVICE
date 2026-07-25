const express = require('express');
const config = require('./config');
const { fetchAccount, fetchPositions, submitEvidence } = require('./rts-client');
const { explain } = require('./explain');
const { buildEvidence } = require('./evidence');

const app = express();
const { SYMBOL, SERVICE_NAME, POLL_INTERVAL_MS, PORT } = config;

let eventCounter = 0;
let isProcessing = false;

async function generateExplanation() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    // In production, fetch actual evidence from RTS /signals.
    // For now, simulate based on account state to generate a meaningful narrative.
    const [account, positions] = await Promise.all([
      fetchAccount(),
      fetchPositions(),
    ]);

    // Simulated decision (in production, fetch from RTS Decision Engine via /signals)
    const decision = {
      action: positions && positions.length > 0 ? 'HOLD' : 'BUY',
      confidence: 0.68,
      uncertainty: 0.22,
      failureConditions: 'spread > 2pts',
    };

    // Simulated evidence from other services (in production, these come from RTS cache)
    const evidenceList = [
      { serviceName: 'research', summary: 'Bullish trend, Wyckoff accumulation', confidence: 0.72, historicalReliability: 0.82 },
      { serviceName: 'regime', summary: 'Strong trending regime', confidence: 0.80, historicalReliability: 0.78 },
      { serviceName: 'risk', summary: 'Low risk, 1.2% drawdown', confidence: 0.85, historicalReliability: 0.88 },
      { serviceName: 'validation', summary: 'High reliability, no drift', confidence: 0.75, historicalReliability: 0.90 },
    ];

    const result = explain(evidenceList, decision);

    const evidence = buildEvidence({
      serviceName: SERVICE_NAME,
      eventId: `${SERVICE_NAME}_${++eventCounter}_${Date.now()}`,
      symbol: SYMBOL,
      evidenceType: 'explanation',
      summary: result.summary,
      confidence: result.confidence,
      uncertainty: result.uncertainty,
      historicalReliability: 0.92,
      supportingData: {
        narrative: result.narrative,
        decision: decision.action,
        agreementCount: `${evidenceList.filter(e => e.confidence > 0.6).length}/${evidenceList.length}`,
      },
      conflictingData: {},
      applicableMarketRegime: 'all',
      failureConditions: ['no_evidence'],
      expectedValidityDuration: 120,
      processingTime: 0,
    });

    await submitEvidence(evidence);
    console.log(`[${SERVICE_NAME}] ✅ Explanation generated: ${result.summary}`);

  } catch (error) {
    console.error(`[${SERVICE_NAME}] ❌ Error:`, error.message);
  } finally {
    isProcessing = false;
  }
}

setInterval(generateExplanation, POLL_INTERVAL_MS);

app.get('/health', (req, res) => res.send('OK'));
app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] 🚀 Running on port ${PORT}, explaining every ${POLL_INTERVAL_MS}ms`);
  setTimeout(generateExplanation, 2000);
});
