# shadcn/ui Components for Auth

This directory contains shadcn/ui components that are ready to use in your auth pages.

## Available Components

### Button

```tsx
import { Button } from "@/components/ui/button"

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// Disabled state
<Button disabled>Disabled</Button>
```

### Input

```tsx
import { Input } from "@/components/ui/input"

// Basic input
<Input placeholder="Enter your email" />

// With custom styling (as used in auth pages)
<Input
  className="h-12 bg-white/5 border-gray-600 text-white placeholder:text-gray-400"
  type="email"
  placeholder="Email"
/>
```

### Form Components

```tsx
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Used with react-hook-form
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name='email'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder='email@example.com' {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>;
```

### Card Components

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Login</CardTitle>
  </CardHeader>
  <CardContent>{/* Your form content */}</CardContent>
</Card>;
```

### Alert Components

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

<Alert variant='destructive'>
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please log in again.
  </AlertDescription>
</Alert>;
```

### Separator

```tsx
import { Separator } from '@/components/ui/separator';

<div>
  <div>Content above</div>
  <Separator />
  <div>Content below</div>
</div>;
```

## Usage in Auth Pages

All auth pages in `src/app/(auth)/` are already using these components:

- `login/page.tsx` - Uses Button and Input
- `signup/page.tsx` - Uses Button and Input with form validation
- `forgetpassword/page.tsx` - Uses Button and Input
- `updatepassword/page.tsx` - Uses Button and Input

## Styling

The components use CSS variables defined in `src/app/globals.css` for theming. You can customize the appearance by modifying these variables.

## Dependencies

All necessary dependencies are already installed:

- `@radix-ui/react-*` - For accessibility and behavior
- `class-variance-authority` - For variant styling
- `clsx` and `tailwind-merge` - For className merging
- `react-hook-form` - For form handling
- `zod` - For validation

## Import Shortcuts

You can import all components from the index file:

```tsx
import { Button, Input, Card } from '@/components/ui';
```
