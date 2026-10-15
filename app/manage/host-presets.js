// Provider presets for CNAME mode. Each one knows the target shape the
// provider actually needs and the steps that provider requires beyond DNS —
// which is exactly where the health check's stuck names come from: pointing
// at a deployment URL instead of a custom-domain target, or attaching the
// domain on the provider's side never happening at all. The preset fills the
// half DNS can do and walks the user through the half it can't.
//
// `label` doubles as the provider identity: it is matched against what
// `providerFor()` reads off a stored CNAME, so an owner returning to a record
// sees their own provider's steps. Every label has to stay a value
// `providerFor` can return, which host-presets.test.mjs pins.
//
// `prefillFor` is only for a target this form can genuinely derive. A
// provider that issues a per-project target has to leave it null and put the
// shape in `placeholder` instead: a value typed into the field reads as the
// answer, and whatever is sitting there is what gets saved.
export const PRESETS = [
  {
    id: 'github-pages',
    label: 'GitHub Pages',
    placeholder: 'yourusername.github.io',
    prefillFor: (login) => (login ? `${String(login).toLowerCase()}.github.io` : ''),
    guide: null,
    steps: (name, login) => [
      `Target ${login ? `${String(login).toLowerCase()}.github.io` : 'yourusername.github.io'} (or <project>.github.io if the site lives in a project repo)`,
      `In that repo: Settings → Pages → Custom domain, enter ${name}.runs-on.dev, save`,
      "Save here. The zone publishes within a minute, HTTPS follows on GitHub's side",
    ],
  },
  {
    id: 'netlify',
    label: 'Netlify',
    placeholder: 'your-site.netlify.app',
    prefillFor: null,
    guide: null,
    steps: (name) => [
      "Target your site's netlify.app address (Domain settings shows it)",
      `In Netlify: Domain settings → Add a domain → ${name}.runs-on.dev`,
      'Save here, then let Netlify provision the certificate',
    ],
  },
  {
    id: 'cloudflare-pages',
    label: 'Cloudflare Pages',
    placeholder: 'your-project.pages.dev',
    prefillFor: null,
    guide: null,
    steps: (name) => [
      "Target your project's pages.dev address",
      `In Cloudflare: your Pages project → Custom domains → Set up a custom domain → ${name}.runs-on.dev`,
      'Save here. Cloudflare issues the certificate once the CNAME is live',
    ],
  },
  {
    id: 'vercel',
    label: 'Vercel',
    // Vercel issues a target per project and shows it in the Domains tab.
    // `cname.vercel-dns.com` is the generic value from its public docs, and
    // prefilling that sent owners to DNS with a target their own project
    // never claims: the name resolves, Vercel serves nothing, and the daily
    // health check opens a stuck-name issue. #323 and #328 were both this.
    placeholder: '<hash>.vercel-dns-017.com',
    prefillFor: null,
    guide: '/docs/guides/vercel',
    steps: (name) => [
      `In your Vercel project: Settings → Domains → Add, enter ${name}.runs-on.dev`,
      'Copy the CNAME target it shows you, which is specific to your project, and paste it above',
      'It also shows a verification TXT starting with vc-domain-verify= — copy the whole value',
      'Add that in the subdomain records section below: label _vercel, type TXT',
      'Save there. Vercel needs one re-check after the TXT is live, so give it a minute',
    ],
  },
  {
    id: 'render',
    label: 'Render',
    placeholder: 'your-service.onrender.com',
    prefillFor: null,
    guide: null,
    steps: (name) => [
      "Target your service's onrender.com address",
      `In Render: your service → Settings → Custom Domains → Add ${name}.runs-on.dev`,
      'Save here; Render validates the CNAME and issues the certificate',
    ],
  },
];
