# Quill Variables Module

A Quill.js module that adds a variable picker dropdown to the toolbar, allowing users to insert variables with customizable token formatting.

## Features

- Dropdown menu with hierarchical variable selection
- Customizable token formatting (e.g., `{{variable}}`, `${variable}`, etc.)
- Keyboard navigation support
- Accessible with ARIA attributes
- TypeScript support
- Quill v2 compatible

## Installation

```bash
npm install quill-variables-module
```

## Usage

### Basic Setup

```typescript
import Quill from 'quill';
import Variables from 'quill-variables-module';

// Define your variables structure
const variables = {
  user: {
    title: 'User Information',
    children: {
      first_name: {
        title: 'First Name',
        description: 'User\'s first name'
      },
      last_name: {
        title: 'Last Name',
        description: 'User\'s last name'
      },
      email: {
        title: 'Email Address',
        description: 'User\'s email address'
      }
    }
  },
  clinic: {
    title: 'Clinic Information',
    children: {
      name: {
        title: 'Clinic Name',
        description: 'Name of the clinic'
      },
      address: {
        title: 'Clinic Address',
        description: 'Full address of the clinic'
      }
    }
  }
};

// Initialize Quill with the variables module
const quill = new Quill('#editor', {
  modules: {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        ['variables'] // Add the variables module to toolbar
      ]
    },
    variables: {
      variables: variables,
      placeholder: 'Insert Variable',
      token: { open: '{{', close: '}}' }
    }
  }
});
```

### Advanced Configuration

```typescript
const quill = new Quill('#editor', {
  modules: {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        ['variables']
      ]
    },
    variables: {
      variables: variables,
      placeholder: 'Insert Variable',
      includeParentNodes: true, // Allow inserting parent nodes
      token: (path: string) => `\${${path}}`, // Custom token function
      icon: '<svg>...</svg>' // Custom SVG icon
    }
  }
});
```

### Programmatic Usage

```typescript
// Get the variables module
const variablesModule = quill.getModule('variables');

// Insert a variable programmatically
variablesModule.insert('user.first_name');

// Get all available variable paths
const availableVars = variablesModule.getAvailableVariables();

// Update variables dynamically
variablesModule.updateVariables(newVariables);

// Destroy the module
variablesModule.destroy();
```

## API Reference

### VariablePickerOptions

```typescript
interface VariablePickerOptions {
  variables: VariableTree;           // Required: Variable structure
  includeParentNodes?: boolean;      // Optional: Allow parent nodes to be insertable
  placeholder?: string;              // Optional: Button label (default: 'Variables')
  token?: {                          // Optional: Token formatting
    open?: string;                   // Opening token (default: '{{')
    close?: string;                  // Closing token (default: '}}')
  } | ((path: string) => string);    // Or custom function
  icon?: string;                     // Optional: Custom SVG icon (default: curly braces icon)
}
```

### VariableTree Structure

```typescript
type VariableTree = Record<string, VarNode>;

interface VarNode {
  title: string;                     // Display name
  description?: string;              // Optional description
  children?: VariableTree;           // Nested variables
}
```

## Icon Customization

The module uses a curly braces SVG icon by default. You can customize it by providing your own SVG:

```typescript
const quill = new Quill('#editor', {
  modules: {
    variables: {
      variables: variables,
      icon: `<svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>`
    }
  }
});
```

The icon should be an SVG element with appropriate sizing (recommended 16x16 or 24x24 viewBox). The SVG will inherit the text color via `currentColor`.

## Styling

The module includes default CSS styles. You can customize the appearance by overriding the CSS classes:

- `.ql-variable-picker` - Container
- `.ql-variable-button` - Button element
- `.ql-variable-menu` - Dropdown menu
- `.ql-variable-item` - Menu items
- `.ql-variable-group-title` - Section titles
- `.ql-variable-divider` - Section dividers

## Browser Support

- Modern browsers with ES2018 support
- Requires Quill.js v2.0.0 or higher

## License

MIT
