"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const currencies = [
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
];

export default function TestCheckoutPage() {
  const router = useRouter();
  const [currency, setCurrency] = useState("INR");
  const [amount, setAmount] = useState("199");
  const [loading, setLoading] = useState(false);

  const goStripeTest = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency, amount: Number(amount) || 199 }),
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  const instantDummySubscribe = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/dummy", { method: "POST" });
      if (res.ok) router.push("/settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Details (Test Mode)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                className="w-full border rounded-md px-3 py-2"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (per month)</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={goStripeTest} disabled={loading}>
                Proceed to Stripe Test Checkout
              </Button>
              <Button variant="secondary" onClick={instantDummySubscribe} disabled={loading}>
                Instant Dummy Subscribe
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Use Stripe test card 4242 4242 4242 4242, any future expiry, any CVC.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-lg font-medium">Plan: Genius Pro (Test)</div>
            <div className="text-sm text-muted-foreground">
              Unlimited AI Generations while active.
            </div>
            <div className="text-xl">
              {currency} {amount}/month
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


