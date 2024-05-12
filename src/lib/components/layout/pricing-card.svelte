<script lang="ts">
  import { fly } from "svelte/transition";
  import Check from "lucide-svelte/icons/check";

  import type { BillingPeriod, Subscription } from "$configs/subscriptions";

  import * as Card from "$components/ui/card";
  import { Button } from "$components/ui/button";

  type Props = {
    data: Subscription;
    billingPeriod: BillingPeriod;
  };

  let { data, billingPeriod }: Props = $props();

  const { name, description, price, features, href } = data;
</script>

<Card.Root class="max-w-96">
  <Card.Header>
    <Card.Title class="text-center text-2xl">{name}</Card.Title>
    <Card.Description class="pb-6">{description}</Card.Description>
    {#key billingPeriod}
      <div class="absolute flex items-baseline justify-center pt-20" in:fly={{ y: -50, duration: 200 }} out:fly={{ y: 50, duration: 200 }}>
        <span class="mr-2 text-5xl font-extrabold">${price[billingPeriod]}</span>
        <span class="text-gray-500 dark:text-gray-400">/ {billingPeriod}</span>
      </div>
    {/key}
  </Card.Header>
  <Card.Content>
    <hr class="border-1 mt-12" />
    <ul role="list" class="my-6 space-y-4 text-left">
      {#each features as feature}
        <li class="flex items-center space-x-3">
          <Check color="green" />
          <span>{feature}</span>
        </li>
      {/each}
    </ul>
  </Card.Content>
  <Card.Footer>
    <Button {href} class="w-full">Get started</Button>
  </Card.Footer>
</Card.Root>
