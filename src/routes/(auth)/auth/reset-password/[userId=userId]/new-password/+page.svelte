<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import * as Form from "$lib/components/ui/form";
  import { superForm } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import * as flashModule from "sveltekit-flash-message/client";
  import { resetPasswordFormSchemaThirdStep } from "$validations/auth";
  import Input from "$components/ui/input/input.svelte";
  import PasswordStrength from "$components/layout/PasswordStrength.svelte";
  import { passwordStrength, type FirstOption, type Result, type Option } from "check-password-strength";
  import { Eye, EyeOff } from "lucide-svelte";
  import Button from "$components/ui/button/button.svelte";
  import Turnstile from "$components/layout/Turnstile.svelte";
  import { Loader2 } from "lucide-svelte";
  import * as m from "$paraglide/messages";

  let { data } = $props();

  let isPasswordFieldFocused = $state(false);
  let revealPassword = $state(false);
  let passwordInputType = $derived(revealPassword ? "text" : "password");

  const form = superForm(data.form, {
    validators: zodClient(resetPasswordFormSchemaThirdStep),
    delayMs: 500,
    timeoutMs: 5000,
    multipleSubmits: "prevent",
    syncFlashMessage: true,
    flashMessage: { module: flashModule },
    onUpdate: () => resetTurnstile()
  });

  const { form: formData, enhance, delayed } = form;

  let resetTurnstile = $state(() => {});

  // ! this code is duplicated from register route
  // TODO export
  const customOptions: [FirstOption<string>, ...Option<string>[]] = [
    { id: 0, value: m.validation_password_strength_tooWeak(), minDiversity: 0, minLength: 0 },
    { id: 1, value: m.validation_password_strength_weak(), minDiversity: 2, minLength: 6 },
    { id: 2, value: m.validation_password_strength_medium(), minDiversity: 3, minLength: 8 },
    { id: 3, value: m.validation_password_strength_strong(), minDiversity: 4, minLength: 10 }
  ];

  let pwd: Result<string> = $state(passwordStrength($formData.password, customOptions));
  let myData: Array<{ name: string; isDone: boolean }> = $derived([
    { name: m.validation_password_options_longerThan({ characters: 10 }), isDone: pwd.length >= 10 },
    { name: m.validation_password_options_containsLowercases(), isDone: pwd.contains.includes("lowercase") },
    { name: m.validation_password_options_containsUppercases(), isDone: pwd.contains.includes("uppercase") },
    { name: m.validation_password_options_containsNumbers(), isDone: pwd.contains.includes("number") },
    { name: m.validation_password_options_containsSpecialCharacters(), isDone: pwd.contains.includes("symbol") }
  ]);

  $effect(() => {
    pwd = passwordStrength($formData.password, customOptions);
  });
</script>

<Card.Header class="space-y-1">
  <Card.Title class="text-2xl">{m.auth_resetPassword_title()}</Card.Title>
</Card.Header>
<Card.Content class="grid gap-4">
  <div class="text-muted-foreground">{m.auth_resetPassword_step3_description()}</div>
  <form class="flex flex-col gap-3" method="post" use:enhance>
    <Form.Field {form} name="password" class="relative space-y-1">
      <Form.Control let:attrs>
        <Form.Label>{m.core_form_shared_label_password()}</Form.Label>
        <Input
          {...attrs}
          type={passwordInputType}
          bind:value={$formData.password}
          onfocus={() => (isPasswordFieldFocused = true)}
          onblur={() => (isPasswordFieldFocused = false)}
        />
        <Button variant="ghost" class="absolute right-1 top-7 size-8 p-0" on:click={() => (revealPassword = !revealPassword)}>
          {#if passwordInputType === "text"}
            <Eye size={22} />
          {:else}
            <EyeOff size={22} />
          {/if}
        </Button>
        {#if isPasswordFieldFocused}
          <PasswordStrength {pwd} {myData}></PasswordStrength>
        {/if}
      </Form.Control>
      <Form.FieldErrors let:errors class="h-4 text-xs">
        {#if errors[0]}
          {errors[0]}
        {/if}
      </Form.FieldErrors>
    </Form.Field>
    <Form.Field {form} name="passwordConfirm" class="mt-2 space-y-1">
      <Form.Control let:attrs>
        <Form.Label>{m.core_form_shared_label_passwordConfirm()}</Form.Label>
        <Input {...attrs} type="password" bind:value={$formData.passwordConfirm} />
      </Form.Control>
      <Form.FieldErrors let:errors class="h-4 text-xs">
        {#if errors[0]}
          {errors[0]}
        {/if}
      </Form.FieldErrors>
    </Form.Field>
    <Turnstile action={"reset-password-change"} bind:resetTurnstile />
    <Form.Button type="submit" disabled={$delayed}>
      {#if $delayed}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" /> {m.core_form_shared_label_loading()}
      {:else}
        {m.core_form_shared_label_verify()}
      {/if}
    </Form.Button>
  </form>
</Card.Content>
