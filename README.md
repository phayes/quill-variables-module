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

**Note**: This module requires Quill.js v2.0.0 or higher. Make sure you're using the correct version of Quill in your project.

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
      token: { open: '{{', close: '}}' } // Default token style
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
      ]
    },
    variables: {
      variables: variables,
      placeholder: 'Insert Variable',
      includeParentNodes: true, // Allow inserting parent nodes
      token: { open: '${', close: '}' }, // Different token style
      icon: '<svg>...</svg>' // Custom SVG icon
    }
  }
});
```

### Token Formatting Examples

The `token` option supports two formats for customizing how variables are inserted:

#### Object Format (Simple)
```typescript
// Default style: {{variable}}
token: { open: '{{', close: '}}' }

// Template literal style: ${variable}
token: { open: '${', close: '}' }

// Bracket style: [variable]
token: { open: '[', close: ']' }
```

#### Function Format (Complete Control)
```typescript
// Custom formatting with validation
token: (path: string) => {
  if (path.includes('user.')) {
    return `{{${path}}}`; // User variables with curly braces
  }
  return `$${path}`; // Others with dollar sign
}

// Simple function format
token: (path: string) => `[${path}]`

// With additional formatting
token: (path: string) => `{{ ${path.toUpperCase()} }}`
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
  } | ((path: string) => string);    // Or custom function for complete control
  icon?: string;                     // Optional: Custom SVG icon (default: curly braces icon)
}
```

**Token Formatting Details:**
- **Object format**: Simple `{ open: '{{', close: '}}' }` for basic token wrapping
- **Function format**: `(path: string) => string` for custom formatting logic
- **Default**: `{{variable}}` style if no token option is provided

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
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" class="ql-stroke">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>`
    }
  }
});
```

The icon should be an SVG element with appropriate sizing (recommended 16x16 or 24x24 viewBox). The SVG will inherit the text color via `currentColor`. For proper Quill toolbar styling, include the `ql-stroke` class on the SVG element.

## Styling

The module includes default CSS styles. You can customize the appearance by overriding the CSS classes:

- `.ql-variable-picker` - Container
- `.ql-variable-button` - Button element
- `.ql-variable-menu` - Dropdown menu
- `.ql-variable-item` - Menu items
- `.ql-variable-group-title` - Section titles
- `.ql-variable-divider` - Section dividers

## Examples

### Basic Variable Insertion
When you select "First Name" from the user section, it inserts: `{{user.first_name}}`

### Custom Token Styles
- **Default**: `{{user.first_name}}`
- **Template literals**: `${user.first_name}`
- **Brackets**: `[user.first_name]`
- **Custom function**: `{{ USER.FIRST_NAME }}` (uppercase with spaces)
