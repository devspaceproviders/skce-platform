# SKCE — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS implementation of the SKCE
training institute website, matching the homepage design provided.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** lucide-react

## Getting Started

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app works standalone with mock data (`src/lib/mockData.ts`) even before
the backend is running — `src/lib/api.ts` falls back to mock data if the
API request fails, so you'll see the full homepage immediately.

Once your Express/PostgreSQL backend is running, set
`NEXT_PUBLIC_API_URL` in `.env.local` to point at it (default:
`http://localhost:5000/api`) and the same components will render live data.

## Folder Structure (screen-based)

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home screen  (matches screenshots 1–4)
│   │   ├── layout.tsx            # Root layout (Navbar + Footer wrapper)
│   │   ├── globals.css
│   │   ├── courses/page.tsx      # Courses screen
│   │   ├── trainers/page.tsx     # Trainers screen
│   │   ├── about/page.tsx        # About screen
│   │   ├── contact/page.tsx      # Contact screen
│   │   └── login/page.tsx        # Login screen (email/password + Google)
│   │
│   ├── components/               # Reusable UI building blocks
│   │   ├── Navbar.tsx / TopBar.tsx / Footer.tsx
│   │   ├── Hero.tsx              # Dark gradient hero (screenshot 1)
│   │   ├── StatsBar.tsx          # 5,000+ / 20+ / 10+ / 98% stats
│   │   ├── CourseCard.tsx / CoursesPreview.tsx
│   │   ├── WhyChooseUs.tsx       # 4-feature grid (screenshot 3)
│   │   ├── TrainerCard.tsx / TrainersPreview.tsx
│   │   ├── TestimonialCard.tsx / TestimonialsPreview.tsx
│   │   ├── CTASection.tsx        # Bottom blue CTA banner (screenshot 4)
│   │   └── ContactForm.tsx
│   │
│   ├── lib/
│   │   ├── api.ts                # Fetch helpers (with mock fallback)
│   │   └── mockData.ts           # Sample courses/trainers/testimonials
│   │
│   └── types/index.ts            # Shared TS interfaces
│
├── public/trainers/               # Placeholder trainer avatars (swap for real photos)
├── tailwind.config.ts             # Brand colors/tokens
├── next.config.js
└── package.json
```

## Design tokens

| Token | Value | Usage |
|---|---|---|
| `brand` | `#2563EB` | Primary buttons, links, price text |
| `brand.dark` | `#0B1220` | Hero background base |
| `brand.sky` | `#38BDF8` | "Tech Career" accent text |

## Notes

- All six pages/screens from the nav (Home, Courses, Trainers, About,
  Contact, Login) are implemented and route correctly.
- The Login page posts to `/api/auth/login` and redirects to
  `/api/auth/google` for Google sign-in — wire these up when your backend
  is ready (JWT token is stored in `localStorage` under `skce_token`).
- Replace `public/trainers/*.svg` placeholders with real trainer photos
  (or S3/CDN URLs) any time.
