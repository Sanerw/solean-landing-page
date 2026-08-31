<script lang="ts">
	import SocialIcon from '$lib/components/brand/SocialIcon.svelte';
	import SoleanLogo from '$lib/components/brand/SoleanLogo.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import { BLEED, CONTAINER } from './container';
	import { CONTACT, FOOTER_BRAND, FOOTER_COLUMNS } from './content';
	import LanguageSelect from './LanguageSelect.svelte';

	const LINK =
		'rounded-sm text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted';

	const EYEBROW = 'text-xs font-semibold uppercase tracking-widest text-text-tertiary';
</script>

<footer class={BLEED}>
	<!-- surface-tint only clears AA for muted-foreground and text-tertiary (design-system 1b),
	     so this card uses muted and every text role below is checked against that ground. -->
	<div class="rounded-t-xl bg-muted py-12">
		<div class={CONTAINER}>
			<div class="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
				<SoleanLogo class="text-foreground" />
				<p class="text-xl font-medium text-foreground">{FOOTER_BRAND.tagline}</p>
			</div>

			<Separator class="my-10" />

			<!-- The reference keeps the two link columns paired and the language control in its own
			     right-hand column, so the twelve-column track is what holds those proportions. -->
			<div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
				<div class="lg:col-span-3">
					<h2 class="text-base font-bold text-foreground">{CONTACT.title}</h2>
					<ul class="mt-4 space-y-2 text-sm text-muted-foreground">
						<li class="flex items-center gap-2">
							<MailIcon aria-hidden="true" class="size-4 shrink-0" />
							<a href="mailto:{CONTACT.email}" class={LINK}>Email: {CONTACT.email}</a>
						</li>
						<li class="flex items-center gap-2">
							<PhoneIcon aria-hidden="true" class="size-4 shrink-0" />
							<a href="tel:{CONTACT.phone.replace(/\s/g, '')}" class={LINK}>
								Telephone: {CONTACT.phone}
							</a>
						</li>
					</ul>
					<p class="mt-6 text-sm font-bold text-text-tertiary">{CONTACT.hoursTitle}</p>
					<dl class="mt-2 space-y-1 text-sm text-muted-foreground">
						{#each CONTACT.hours as slot (slot.days)}
							<div class="flex gap-4">
								<dt>{slot.days}</dt>
								<dd>{slot.time}</dd>
							</div>
						{/each}
					</dl>
				</div>

				<div class="grid grid-cols-2 gap-8 sm:col-span-2 lg:col-span-3">
					{#each FOOTER_COLUMNS as column (column.title)}
						<nav aria-label={column.title}>
							<h2 class={EYEBROW}>{column.title}.</h2>
							<ul class="mt-4 space-y-3">
								{#each column.links as link (link.label)}
									<li>
										{#if link.inert}
											<span class="text-sm font-medium text-foreground">{link.label}</span>
										{:else}
											<a
												href={link.href}
												class={[LINK, 'font-medium text-foreground hover:text-muted-foreground']}
											>
												{link.label}
											</a>
										{/if}
									</li>
								{/each}
							</ul>
						</nav>
					{/each}
				</div>

				<div class="lg:col-span-4">
					<h2 class={EYEBROW}>{FOOTER_BRAND.deliveryTitle}</h2>
					<p class="mt-4 text-sm font-medium text-foreground">{FOOTER_BRAND.deliveryBody}</p>

					<!-- A fixed label column so the two logo rows line up on the same left edge. -->
					<div class="mt-4 flex items-center gap-3">
						<span class="w-16 shrink-0 text-xs font-semibold text-text-tertiary">
							{FOOTER_BRAND.shippingLabel}
						</span>
						<ul class="flex flex-wrap items-center gap-2">
							{#each FOOTER_BRAND.shipping as carrier (carrier.name)}
								<li>
									<img
										src={carrier.src}
										alt={carrier.name}
										loading="lazy"
										class="h-6 w-auto"
									/>
								</li>
							{/each}
						</ul>
					</div>
					<div class="mt-3 flex items-center gap-3">
						<span class="w-16 shrink-0 text-xs font-semibold text-text-tertiary">
							{FOOTER_BRAND.paymentsLabel}
						</span>
						<ul class="flex flex-wrap items-center gap-2">
							{#each FOOTER_BRAND.payments as method (method.name)}
								<li>
									<img
										src={method.src}
										alt={method.name}
										loading="lazy"
										class="h-6 w-auto"
									/>
								</li>
							{/each}
						</ul>
					</div>

					<p class="mt-6 text-sm font-semibold text-foreground">{FOOTER_BRAND.pharmacyNote}</p>
					<img
						src={FOOTER_BRAND.pharmacyBadge.src}
						alt={FOOTER_BRAND.pharmacyBadge.alt}
						loading="lazy"
						class="mt-2 w-24 rounded-sm"
					/>
				</div>

				<div class="lg:col-span-2">
					<LanguageSelect variant="field" display="full" showIcon />
				</div>
			</div>

			<Separator class="my-10" />

			<div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
					<p class="text-xs text-text-tertiary">{FOOTER_BRAND.copyright}</p>
					{#each FOOTER_BRAND.legal as link (link.label)}
						<span class="text-xs text-muted-foreground">{link.label}</span>
					{/each}
				</div>
				<ul class="flex gap-3">
					{#each FOOTER_BRAND.social as account (account.label)}
						<li>
							<Button
								href={account.href}
								variant="outline"
								size="icon"
								aria-label={account.label}
								rel="noopener noreferrer"
								target="_blank"
							>
								<SocialIcon name={account.icon} />
							</Button>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</footer>
