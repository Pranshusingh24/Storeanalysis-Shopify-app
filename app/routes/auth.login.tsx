/**
 * Shopify App Login Form
 * Storeanalysis - Pranshu Singh Baghel
 */

import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  AppProvider,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField,
  BlockStack,
  InlineStack,
  Box,
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { login } from "~/services/shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  return json({ showForm: Boolean(!url.searchParams.get("shop")) });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = login(request);
  return json({ errors });
};

export default function AuthLogin() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");

  return (
    <AppProvider i18n={enTranslations}>
      <Page>
        <Box paddingBlockStart="800">
          <Card>
            <Form method="post">
              <FormLayout>
                <BlockStack gap="300" align="center">
                  <Box paddingBlockEnd="200">
                    <InlineStack align="center" gap="300" blockAlign="center">
                      <img
                        src="/storeanalysis-logo.png"
                        alt="Storeanalysis Logo"
                        style={{ width: 48, height: 48, borderRadius: 10, objectFit: "contain" }}
                      />
                      <BlockStack gap="050">
                        <Text as="h2" variant="headingLg">
                          Storeanalysis
                        </Text>
                        {/* <Text as="span" variant="bodyXs" tone="subdued">
                          by Pranshu Singh Baghel
                        </Text> */}
                      </BlockStack>
                    </InlineStack>
                  </Box>
                  <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                    Enter your Shopify store domain to access your analytics dashboard.
                  </Text>
                </BlockStack>

                <TextField
                  type="text"
                  name="shop"
                  label="Shop domain"
                  helpText="e.g. my-store.myshopify.com"
                  value={shop}
                  onChange={setShop}
                  autoComplete="on"
                  error={(actionData as any)?.errors?.shop}
                />

                <Button variant="primary" submit>
                  Log in
                </Button>
              </FormLayout>
            </Form>
          </Card>
        </Box>
      </Page>
    </AppProvider>
  );
}
