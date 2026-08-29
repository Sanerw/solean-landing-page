<script lang="ts">
	import SoleanLogo from '$lib/components/brand/SoleanLogo.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import { BLEED, CONTAINER } from './container';
	import { CONTACT, FOOTER_BRAND, FOOTER_COLUMNS } from './content';
	import LanguageSelect from './LanguageSelect.svelte';

	const LINK =
		'rounded-sm text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted';
</script>

<footer class={BLEED}>
	<!-- surface-tint only clears AA for muted-foreground and text-tertiary (design-system 1b),
	     so this card uses muted and every text role below is checked against that ground. -->
	<div class="rounded-t-xl bg-muted py-12">
		<div class={CONTAINER}>
			<div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<SoleanLogo class="text-foreground" />
				<p class="font-display text-xl text-foreground">{FOOTER_BRAND.tagline}</p>
			</div>

			<Separator class="my-10" />

			<div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
				<div>
					<h2 class="text-sm font-semibold text-foreground">{CONTACT.title}</h2>
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
					<p class="mt-6 text-xs font-semibold uppercase tracking-widest text-text-tertiary">
						{CONTACT.hoursTitle}
					</p>
					<dl class="mt-2 space-y-1 text-sm text-muted-foreground">
						{#each CONTACT.hours as slot (slot.days)}
							<div class="flex gap-4">
								<dt>{slot.days}</dt>
								<dd>{slot.time}</dd>
							</div>
						{/each}
					</dl>
				</div>

				{#each FOOTER_COLUMNS as column (column.title)}
					<nav aria-label={column.title}>
						<h2 class="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
							{column.title}.
						</h2>
						<ul class="mt-4 space-y-2">
							{#each column.links as link (link.label)}
								<li>
									{#if link.inert}
										<span class="text-sm text-text-tertiary">{link.label}</span>
									{:else}
										<a href={link.href} class={[LINK, 'text-muted-foreground hover:text-foreground']}>
											{link.label}
										</a>
									{/if}
								</li>
							{/each}
						</ul>
					</nav>
				{/each}

				<div>
					<h2 class="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
						{FOOTER_BRAND.deliveryTitle}
					</h2>
					<p class="mt-4 text-sm text-foreground">{FOOTER_BRAND.deliveryBody}</p>

					<!-- Named as text rather than shipped as trademarked logo art. -->
					<div class="mt-4 flex items-center gap-3">
						<span class="shrink-0 text-xs text-text-tertiary">{FOOTER_BRAND.shippingLabel}</span>
						<ul class="flex flex-wrap gap-2">
							{#each FOOTER_BRAND.shipping as carrier (carrier)}
								<li class="rounded-sm bg-card px-2 py-1 text-xs font-medium text-muted-foreground">
									{carrier}
								</li>
							{/each}
						</ul>
					</div>
					<div class="mt-3 flex items-center gap-3">
						<span class="shrink-0 text-xs text-text-tertiary">{FOOTER_BRAND.paymentsLabel}</span>
						<ul class="flex flex-wrap gap-2">
							{#each FOOTER_BRAND.payments as method (method)}
								<li class="rounded-sm bg-card px-2 py-1 text-xs font-medium text-muted-foreground">
									{method}
								</li>
							{/each}
						</ul>
					</div>
					<p class="mt-4 text-xs text-text-tertiary">{FOOTER_BRAND.pharmacyNote}</p>

					<LanguageSelect display="full" showIcon class="mt-6 -ml-3" />
				</div>
			</div>

			<Separator class="my-10" />

			<div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
					<p class="text-xs text-text-tertiary">{FOOTER_BRAND.copyright}</p>
					{#each FOOTER_BRAND.legal as link (link.label)}
						<span class="text-xs text-text-tertiary">{link.label}</span>
					{/each}
				</div>
				<!-- Named in text, not drawn: Lucide 1.x dropped its brand glyphs over trademark
				     concerns, the same reason the payment marks above are text chips. -->
				<ul class="flex gap-3">
					{#each FOOTER_BRAND.social as account (account.label)}
						<li>
							<a
								href={account.href}
								aria-label={account.label}
								rel="noopener noreferrer"
								target="_blank"
								class="flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted"
							>
								{account.name}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</footer>
