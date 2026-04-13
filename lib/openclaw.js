export function getOpenClawConfig() {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";
  const hasGatewayToken = Boolean(process.env.OPENCLAW_GATEWAY_TOKEN);

  return {
    gatewayUrl,
    hasGatewayToken
  };
}

export function getOpenClawConfigStatus() {
  const { gatewayUrl, hasGatewayToken } = getOpenClawConfig();

  return {
    ok: hasGatewayToken,
    gatewayUrl,
    hasGatewayToken
  };
}
