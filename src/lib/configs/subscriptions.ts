export type Subscription = {
  name: string;
  description: string;
  price: { monthly: string; yearly: string };
  href: string;
  features: string[];
};

export enum BillingPeriod {
  YEARLY = "yearly",
  MONTHLY = "monthly"
}

export const subscriptions: Subscription[] = [
  {
    name: "Starter",
    description: "Start from here",
    price: { monthly: "4.99", yearly: "49.99" },
    href: "#",
    features: ["Feature #1", "Feature #2", "Feature #3"]
  },
  {
    name: "Standard",
    description: "Good balance",
    price: { monthly: "14.99", yearly: "149.99" },
    href: "#",
    features: ["All in Starter plan plus", "Feature #4", "Feature #5"]
  },
  {
    name: "Premium",
    description: "If you want everything",
    price: { monthly: "49.99", yearly: "499.99" },
    href: "#",
    features: ["All in Standard plan plus", "Feature #6", "Feature #7"]
  }
];
