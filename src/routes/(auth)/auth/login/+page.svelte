<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import * as Form from "$lib/components/ui/form";
  import { Input } from "$lib/components/ui/input";
  import * as Card from "$lib/components/ui/card";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { loginFormSchema } from "$validations/auth";
  import Button from "$components/ui/button/button.svelte";
  import { GitHub, Google } from "$components/icons";
  import { route } from "$lib/ROUTES.js";
  import * as flashModule from "sveltekit-flash-message/client";
  import Turnstile from "$components/layout/Turnstile.svelte";
  import { Loader2 } from "lucide-svelte";
  import * as m from "$paraglide/messages";

  let { data } = $props();

  const form = superForm(data.form, {
    validators: zodClient(loginFormSchema),
    delayMs: 500,
    timeoutMs: 5000,
    multipleSubmits: "prevent",
    syncFlashMessage: true,
    flashMessage: { module: flashModule },
    onUpdate: () => resetTurnstile()
  });

  const { form: formData, enhance, delayed } = form;

  let resetTurnstile = $state(() => {});
</script>

<Card.Header class="space-y-1">
  <Card.Title class="text-2xl">{m.auth_login_title()}</Card.Title>
</Card.Header>
<Card.Content class="grid gap-4">
  <div class="grid grid-cols-2 gap-6">
    <Button variant="outline" href={route("GET /auth/oauth/github")}>
      <GitHub class="mr-2 h-4 w-4" />
      {m.core_form_shared_label_github()}
    </Button>
    <Button variant="outline" href={route("GET /auth/oauth/google")}>
      <Google class="mr-2 h-4 w-4" />
      {m.core_form_shared_label_google()}
    </Button>
  </div>
  <div class="relative">
    <div class="absolute inset-0 flex items-center">
      <span class="w-full border-t" />
    </div>
    <div class="relative flex justify-center text-xs uppercase">
      <span class="bg-card px-2 text-muted-foreground"> {m.auth_login_textSeparator()} </span>
    </div>
  </div>
  <form class="flex flex-col gap-2" method="post" use:enhance>
    <Form.Field {form} name="email" class="space-y-1">
      <Form.Control let:attrs>
        <Form.Label>{m.core_form_shared_label_email()}</Form.Label>
        <Input {...attrs} type="email" bind:value={$formData.email} />
      </Form.Control>
      <Form.FieldErrors class="h-4 text-xs" />
    </Form.Field>
    <Form.Field {form} name="password" class="space-y-1">
      <Form.Control let:attrs>
        <Form.Label>{m.core_form_shared_label_password()}</Form.Label>
        <Input {...attrs} type="password" bind:value={$formData.password} />
      </Form.Control>
      <Form.FieldErrors class="h-4 text-xs" />
    </Form.Field>
    <a href={route("/auth/reset-password")} class="flex justify-end text-right text-sm font-medium hover:underline">
      {m.auth_login_forgotPassword()}
    </a>
    <Turnstile action={"login"} bind:resetTurnstile />
    <Form.Button type="submit" disabled={$delayed}>
      {#if $delayed}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" /> {m.core_form_shared_label_loading()}
      {:else}
        {m.core_form_shared_label_login()}
      {/if}
    </Form.Button>
  </form>
</Card.Content>
<Card.Footer>
  <p class="text-sm">
    {m.auth_login_footer()}
    <a href={route("/auth/register")} class="font-medium hover:underline">
      {m.core_form_shared_label_register()}
    </a>
  </p>
</Card.Footer>
