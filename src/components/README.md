# Components Directory

React components organized by feature domain.

## Structure

- **auth/** - Authentication components (login, register, user menu)
- **recipes/** - Recipe management components (recipe form, recipe list, recipe detail)
- **filters/** - Filtering components (ingredient selector, filter panel)
- **common/** - Shared/reusable components (buttons, modals, forms)
- **layout/** - Layout components (header, sidebar, footer)

## Conventions

- One component per file when possible
- File names match component names (PascalCase)
- Index exports for easy imports: `import { Button } from '@components/common'`
- Props types in separate `.types.ts` files for larger components
