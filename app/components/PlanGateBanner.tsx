/**
 * Pro Plan Entitlement Banner & Feature Gate
 * Storeanalysis - Pranshu Singh Baghel
 * 
 * Complies with official Shopify App Pricing Guidelines:
 * - Plans billed in USD ($9.99/mo Basic, $29.99/mo Pro)
 * - 7-day free trial on paid plans
 * - Integrated with PricingModal for in-context plan comparison & upgrades
 */

import React, { useState } from "react";
import { CalloutCard, InlineStack, Button } from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";
import type { PlanTier } from "~/types";
import { PricingModal } from "./PricingModal";

interface PlanGateBannerProps {
  featureName: string;
  requiredPlan?: PlanTier;
  currentPlan: PlanTier;
  shopDomain?: string;
  description?: string;
}

export function PlanGateBanner({
  featureName,
  requiredPlan = "Pro",
  currentPlan,
  shopDomain,
  description,
}: PlanGateBannerProps) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const priceFormatted = requiredPlan === "Pro" ? "$29.99/mo" : "$9.99/mo";

  const defaultDescription =
    description ||
    `${featureName} is available exclusively on the Storeanalysis ${requiredPlan} Plan (${priceFormatted}). Upgrade today to unlock advanced store intelligence, 7-day free trial included.`;

  return (
    <>
      <CalloutCard
        title={`Unlock ${featureName} with Storeanalysis ${requiredPlan}`}
        illustration="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        primaryAction={{
          content: `Upgrade to ${requiredPlan} (${priceFormatted})`,
          onAction: () => setModalOpen(true),
        }}
        secondaryAction={{
          content: "View Full Plans Page",
          onAction: () => navigate("/app/pricing"),
        }}
      >
        <p>{defaultDescription}</p>
        <p style={{ marginTop: 8, fontSize: "12px", color: "#6d7175" }}>
          Your current plan: <strong>{currentPlan}</strong> • 7-day risk-free trial on paid plans • Billed monthly via Shopify
        </p>
      </CalloutCard>

      <PricingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        currentPlan={currentPlan}
        shopDomain={shopDomain}
        initialSelectedPlan={requiredPlan}
      />
    </>
  );
}

export default PlanGateBanner;
