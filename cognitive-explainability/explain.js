function explain(evidenceList, decision) {
  const supports = evidenceList.filter(e => e.confidence > 0.6);
  const contradicts = evidenceList.filter(e => e.confidence < 0.4);

  let narrative = `🧠 DECISION: ${decision.action || 'HOLD'}\n`;
  narrative += `📊 Confidence: ${(decision.confidence * 100).toFixed(0)}% | `;
  narrative += `⚠️ Uncertainty: ${(decision.uncertainty * 100).toFixed(0)}%\n\n`;

  narrative += `✅ SUPPORTING EVIDENCE (${supports.length} services):\n`;
  supports.forEach(e => {
    narrative += `  • ${e.serviceName}: ${e.summary} [conf: ${(e.confidence*100).toFixed(0)}%, reliability: ${(e.historicalReliability*100).toFixed(0)}%]\n`;
  });

  if (contradicts.length > 0) {
    narrative += `\n❌ CONFLICTING EVIDENCE (${contradicts.length} services):\n`;
    contradicts.forEach(e => {
      narrative += `  • ${e.serviceName}: ${e.summary} [conf: ${(e.confidence*100).toFixed(0)}%]\n`;
    });
  }

  narrative += `\n🔍 WHY ALTERNATIVES WERE REJECTED:\n`;
  narrative += `  • Agreement threshold not met (${supports.length}/${evidenceList.length} services in consensus).\n`;
  narrative += `  • Historical reliability of dissenting services: ${contradicts.map(e => (e.historicalReliability*100).toFixed(0)+'%').join(', ')}.\n`;
  narrative += `  • Failure conditions checked: ${decision.failureConditions || 'None'}.\n`;

  return {
    narrative,
    summary: `Decision: ${decision.action}. ${supports.length}/${evidenceList.length} services agree.`,
    confidence: decision.confidence,
    uncertainty: decision.uncertainty,
  };
}

module.exports = { explain };
