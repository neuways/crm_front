/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-primary)',
          'primary-hover': 'var(--color-primary-hover)',
          'primary-light': 'var(--color-primary-light)',
          secondary: 'var(--color-secondary)',
          'secondary-hover': 'var(--color-secondary-hover)',
          'secondary-light': 'var(--color-secondary-light)',
        },
        surface: {
          page: 'var(--color-page-bg)',
          card: 'var(--color-card-bg)',
          sidebar: 'var(--color-sidebar-bg)',
          header: 'var(--color-header-bg)',
          subtle: 'var(--color-subtle-bg)',
          'table-header': 'var(--color-table-header-bg)',
          'table-total': 'var(--color-table-total-bg)',
          'table-hover': 'var(--color-table-row-hover)',
        },
        content: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          subtle: 'var(--color-text-subtle)',
          inverse: 'var(--color-text-inverse)',
        },
        edge: {
          DEFAULT: 'var(--color-border)',
          subtle: 'var(--color-border-subtle)',
          focus: 'var(--color-border-focus)',
        },
        status: {
          success: 'var(--color-success)',
          'success-bg': 'var(--color-success-bg)',
          'success-border': 'var(--color-success-border)',
          warning: 'var(--color-warning)',
          'warning-bg': 'var(--color-warning-bg)',
          'warning-border': 'var(--color-warning-border)',
          danger: 'var(--color-danger)',
          'danger-bg': 'var(--color-danger-bg)',
          'danger-border': 'var(--color-danger-border)',
          info: 'var(--color-info)',
          'info-bg': 'var(--color-info-bg)',
          'info-border': 'var(--color-info-border)',
        },
        priority: {
          hot: 'var(--color-hot-priority)',
          'hot-bg': 'var(--color-hot-priority-bg)',
          'hot-border': 'var(--color-hot-priority-border)',
          'hot-text': 'var(--color-hot-priority-text)',
          poss: 'var(--color-poss-pipeline)',
          'poss-bg': 'var(--color-poss-pipeline-bg)',
          'poss-border': 'var(--color-poss-pipeline-border)',
          'poss-text': 'var(--color-poss-pipeline-text)',
        }
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        dropdown: 'var(--shadow-dropdown)',
      },
      borderRadius: {
        card: 'var(--radius-lg)',
        pill: 'var(--radius-full)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      }
    },
  },
  plugins: [],
};
