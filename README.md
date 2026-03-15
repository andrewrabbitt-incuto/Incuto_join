# Incuto Join Form Builder

A multi-tenant, AI-powered form builder for credit unions to create and manage member join forms.

## Features

### Form Builder
- **Drag & drop** form builder with 30+ field types
- **Sections** with help text, info buttons, and descriptions
- **Show/hide logic** on fields and sections based on previous answers
- **Field properties**: validation, placeholders, help text, info tooltips/modals
- **Incuto field mapping** for automatic back-office sync
- **Live preview** of the form as you build

### Member Journey
- **Multi-step forms** with progress indicator
- **Product selection**: Savings, Loan, or both
- **Member types**: Individual, Corporate, Children/Junior
- **Common bond** eligibility check
- **Address lookup** with postcode search
- **ID verification** via Incuto API (with Vouchsafe fallback)
- **Loan application redirect** with member ID token
- **AI chatbot** to help members complete the form

### Multi-tenancy & Security
- Each credit union is a separate tenant
- Login with email + tenant slug
- **Demo mode** — bypass password authentication
- Role-based access (Owner / Admin / Staff)

### Analytics & Campaigns
- **Per-form analytics**: starts, completions, dropout rates
- **Dropout by section** analysis
- **7-day trend** charts
- **Campaign tracking** with UTM parameters and tracking codes
- **Application management** screen

### Integrations
- **Incuto API**: Submit member data and run ID checks
- **Vouchsafe**: Fallback document verification journey
- **Anthropic Claude AI**: Form builder assistant + member chatbot

### Branding
- Per-tenant colour customisation
- Logo and favicon
- Font selection
- Border radius control
- Custom CSS injection

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- (Optional) Anthropic API key for AI features

### Installation

```bash
git clone <repo>
cd incuto-join-form-builder
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your database URL and other settings
```

Required:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/incuto_join"
NEXTAUTH_SECRET="your-random-secret"
DEMO_MODE="true"  # Set to false in production
```

### Database Setup

```bash
# Push schema to database
npm run db:push

# Seed demo data
npm run db:seed
```

### Run Development Server

```bash
npm run dev
```

Visit **http://localhost:3000**

---

## Demo Login

After seeding:
- **URL**: http://localhost:3000/login
- **Tenant Slug**: `demo-credit-union`
- **Email**: `admin@demo-cu.co.uk`
- **Password**: any (demo mode is enabled)

---

## Building Forms

1. Go to **Forms** → **New Form**
2. Configure the form type and products
3. Open the **Form Builder**
4. **Drag fields** from the left panel onto sections
5. Click any field to edit its properties in the right panel
6. Use the **Logic** tab on fields to add show/hide conditions
7. Use the **AI Assistant** (purple button, bottom right) for help
8. **Save** and **Publish** when ready

---

## Member-Facing URL

Published forms are available at:
```
/join/{form-slug}
```

With campaign tracking:
```
/join/{form-slug}?campaign={TRACKING_CODE}
```

---

## Architecture

```
src/
├── app/
│   ├── (admin)/          # Protected admin area
│   │   ├── dashboard/
│   │   ├── forms/        # Form list + builder
│   │   ├── applications/ # Application management
│   │   ├── campaigns/    # Campaign tracking
│   │   ├── common-bonds/ # Eligibility rules
│   │   ├── branding/     # Brand customisation
│   │   └── settings/     # API & integration settings
│   ├── (auth)/login/     # Login page
│   ├── api/              # API routes
│   └── join/[slug]/      # Member-facing forms
├── components/
│   ├── form-builder/     # Drag & drop builder
│   ├── form-renderer/    # Member-facing renderer
│   ├── admin/            # Admin UI components
│   └── ui/               # Base UI components
├── lib/
│   ├── prisma.ts         # Database client
│   ├── auth.ts           # NextAuth config
│   ├── incuto.ts         # Incuto API client
│   └── field-palette.ts  # Field type definitions
└── types/                # TypeScript types
```

---

## Production Deployment

1. Set `DEMO_MODE="false"`
2. Configure real `INCUTO_API_KEY` and `INCUTO_API_URL`
3. Add `ANTHROPIC_API_KEY` for AI features
4. Run `prisma migrate deploy` instead of `db:push`
5. Set `NEXTAUTH_URL` to your production URL
