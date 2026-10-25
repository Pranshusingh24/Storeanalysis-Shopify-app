/**
 * Pro Plan Entitlement Banner & Feature Gate
 * Storeanalysis - Pranshu Singh Baghel
 */

import React from "react";
import { CalloutCard } from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";
import type { PlanTier } from "~/types";

interface PlanGateBannerProps {
  featureName: string;
  requiredPlan?: PlanTier;
  currentPlan: PlanTier;
  description?: string;
}

export function PlanGateBanner({
  featureName,
  requiredPlan = "Pro",
  currentPlan,
  description,
}: PlanGateBannerProps) {
  const navigate = useNavigate();

  const defaultDescription =
    description ||
    `${featureName} is available exclusively on the Storeanalysis ${requiredPlan} Plan. Upgrade today to unlock automated demand forecasting, run-out date predictions, and qualified gross margin analytics.`;

  return (
    <CalloutCard
      title={`Unlock ${featureName} with Storeanalysis ${requiredPlan}`}
      illustration="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      primaryAction={{
        content: `Upgrade to ${requiredPlan} (₹1,999/mo)`,
        onAction: () => navigate("/app/pricing"),
      }}
    >
      <p>{defaultDescription}</p>
      <p style={{ marginTop: 8, fontSize: "12px", color: "#6d7175" }}>
        Your current plan: <strong>{currentPlan}</strong>
      </p>
    </CalloutCard>
  );
}

export default PlanGateBanner;
