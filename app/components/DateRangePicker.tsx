/**
 * Date Range Selector Component
 * Storeanalysis - Pranshu Singh Baghel
 */

import React from "react";
import { ButtonGroup, Button, Box } from "@shopify/polaris";
import { useSearchParams } from "@remix-run/react";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 90 Days" },
  { key: "this_month", label: "This Month" },
];

export function DateRangePicker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentRange = searchParams.get("range") || "30d";

  const handleSelect = (rangeKey: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("range", rangeKey);
    setSearchParams(newParams);
  };

  return (
    <Box paddingBlockEnd="200">
      <ButtonGroup variant="segmented">
        {RANGES.map((r) => (
          <Button
            key={r.key}
            pressed={currentRange === r.key}
            onClick={() => handleSelect(r.key)}
            size="medium"
          >
            {r.label}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
}

export default DateRangePicker;
