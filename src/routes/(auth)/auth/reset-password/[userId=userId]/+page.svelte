<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import * as Form from "$lib/components/ui/form";
  import { route } from "$lib/ROUTES";
  import { Input } from "$components/ui/input";
  import { superForm } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import * as flashModule from "sveltekit-flash-message/client";
  import { resetPasswordFormSchemaSecondStep } from "$validations/auth";
  import { Turnstile } from "$components/layout";
  import { Loader2 } from "lucide-svelte";
  import { enhance } from "$app/forms";
  import * as m from "$paraglide/messages";

  let { data } = $props();

  const form = superForm(data.form, {
    validators: zodClient(resetPasswordFormSchemaSecondStep),
    delayMs: 500,
    timeoutMs: 5000,
    multipleSubmits: "prevent",
    syncFlashMessage: true,
    flashMessage: { module: flashModule },
    onUpdate: () => resetTurnstile()
  });

  const { form: formData, enhance: enhanceConfirmForm, delayed } = form;

  let resetTurnstile = $state(() => {});
</script>

<Card.Header class="space-y-1">
  <Card.Title class="text-2xl">{m.auth_resetPassword_title()}</Card.Title>
</Card.Header>
<Card.Content class="grid gap-4">
  <div class="text-muted-foreground">{m.auth_resetPassword_step2_description()}</div>
  <form
    class="flex flex-col"
    method="post"
    action={route("confirm /auth/reset-password/[userId=userId]", { userId: data.userId })}
    use:enhanceConfirmForm
  >
    <Form.Field {form} name="token" class="space-y-1">
      <Form.Control let:attrs>
        <Form.Label>{m.core_form_shared_label_token()}</Form.Label>
        <Input {...attrs} type="text" bind:value={$formData.token} />
      </Form.Control>
      <Form.FieldErrors class="h-4 text-xs" />
    </Form.Field>
    <Turnstile action={"reset-password-confirm"} bind:resetTurnstile />
    <Form.Button type="submit" disabled={$delayed}>
      {#if $delayed}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" /> {m.core_form_shared_label_loading()}
      {:else}
        {m.core_form_shared_label_verify()}
      {/if}
    </Form.Button>
  </form>
</Card.Content>
<Card.Footer>
  {m.core_form_shared_emailNotReceived()}
  <form
    class="mx-1 flex flex-col"
    method="post"
    action={route("resendEmail /auth/reset-password/[userId=userId]", { userId: data.userId })}
    use:enhance
  >
    <button type="submit" class="underline">{m.core_form_shared_label_resendEmail()}</button>
  </form>
</Card.Footer>
