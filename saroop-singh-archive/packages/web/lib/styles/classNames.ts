import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Button component variants
 */
export const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        vintage: 'bg-vintage-600 text-white hover:bg-vintage-700 border border-vintage-700',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

/**
 * Card component variants
 */
export const cardVariants = cva(
  // Base styles
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200',
        elevated: 'bg-white border-gray-200 shadow-md hover:shadow-lg transition-shadow',
        vintage: 'bg-vintage-50 border-vintage-200 shadow-vintage',
        ghost: 'bg-transparent border-transparent shadow-none',
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:bg-accent/50 transition-colors',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      interactive: false,
    },
  }
)

/**
 * Input component variants
 */
export const inputVariants = cva(
  // Base styles
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input',
        error: 'border-red-500 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:ring-green-500',
        vintage: 'border-vintage-300 bg-vintage-50 focus-visible:ring-vintage-500',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        default: 'h-10 px-3 py-2',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

/**
 * Badge component variants
 */
export const badgeVariants = cva(
  // Base styles
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border-current',
        vintage: 'border-transparent bg-vintage-100 text-vintage-800 hover:bg-vintage-200',
        success: 'border-transparent bg-green-100 text-green-800 hover:bg-green-200',
        warning: 'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        error: 'border-transparent bg-red-100 text-red-800 hover:bg-red-200',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

/**
 * Modal/Dialog component variants
 */
export const modalVariants = cva(
  // Base styles
  'relative bg-background shadow-lg',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        default: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-screen-xl',
      },
      position: {
        center: 'mx-auto my-8',
        top: 'mx-auto mt-16',
        fullscreen: 'w-screen h-screen',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        default: 'rounded-lg',
        lg: 'rounded-xl',
      },
    },
    defaultVariants: {
      size: 'default',
      position: 'center',
      rounded: 'default',
    },
  }
)

/**
 * Container component variants
 */
export const containerVariants = cva(
  // Base styles
  'mx-auto px-4',
  {
    variants: {
      size: {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md',
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-screen-2xl',
        full: 'max-w-full',
        content: 'max-w-4xl',
      },
      padding: {
        none: 'px-0',
        sm: 'px-2',
        default: 'px-4',
        lg: 'px-6',
        xl: 'px-8',
      },
    },
    defaultVariants: {
      size: 'xl',
      padding: 'default',
    },
  }
)

/**
 * Grid component variants
 */
export const gridVariants = cva(
  // Base styles
  'grid gap-4',
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
        auto: 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
        responsive: 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]',
      },
      gap: {
        none: 'gap-0',
        sm: 'gap-2',
        default: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
      },
    },
    defaultVariants: {
      cols: 3,
      gap: 'default',
    },
  }
)

/**
 * Text component variants
 */
export const textVariants = cva(
  // Base styles
  '',
  {
    variants: {
      variant: {
        default: 'text-foreground',
        muted: 'text-muted-foreground',
        accent: 'text-accent-foreground',
        destructive: 'text-destructive',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        vintage: 'text-vintage-700',
      },
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        default: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        '4xl': 'text-4xl',
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
        justify: 'text-justify',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      weight: 'normal',
      align: 'left',
    },
  }
)

/**
 * Heading component variants
 */
export const headingVariants = cva(
  // Base styles
  'font-semibold tracking-tight',
  {
    variants: {
      variant: {
        default: 'text-foreground',
        muted: 'text-muted-foreground',
        vintage: 'text-vintage-900 headline-font',
        accent: 'text-accent-foreground',
      },
      size: {
        xs: 'text-sm',
        sm: 'text-base',
        default: 'text-lg',
        lg: 'text-xl',
        xl: 'text-2xl',
        '2xl': 'text-3xl',
        '3xl': 'text-4xl',
        '4xl': 'text-5xl',
        '5xl': 'text-6xl',
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
        extrabold: 'font-extrabold',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      weight: 'semibold',
    },
  }
)

/**
 * Skeleton component variants
 */
export const skeletonVariants = cva(
  // Base styles
  'animate-pulse rounded-md bg-muted',
  {
    variants: {
      variant: {
        default: 'bg-gray-200',
        subtle: 'bg-gray-100',
        vintage: 'bg-vintage-100',
      },
      size: {
        sm: 'h-4',
        default: 'h-6',
        lg: 'h-8',
        xl: 'h-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

/**
 * Alert component variants
 */
export const alertVariants = cva(
  // Base styles
  'relative w-full rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success: 'border-green-200 bg-green-50 text-green-800 [&>svg]:text-green-600',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600',
        info: 'border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// Export variant prop types for TypeScript
export type ButtonVariants = VariantProps<typeof buttonVariants>
export type CardVariants = VariantProps<typeof cardVariants>
export type InputVariants = VariantProps<typeof inputVariants>
export type BadgeVariants = VariantProps<typeof badgeVariants>
export type ModalVariants = VariantProps<typeof modalVariants>
export type ContainerVariants = VariantProps<typeof containerVariants>
export type GridVariants = VariantProps<typeof gridVariants>
export type TextVariants = VariantProps<typeof textVariants>
export type HeadingVariants = VariantProps<typeof headingVariants>
export type SkeletonVariants = VariantProps<typeof skeletonVariants>
export type AlertVariants = VariantProps<typeof alertVariants>

/**
 * Component class builders
 * Pre-configured className functions for common components
 */
export const componentClasses = {
  // Layout
  container: (variants?: ContainerVariants, className?: string) =>
    cn(containerVariants(variants), className),
  grid: (variants?: GridVariants, className?: string) =>
    cn(gridVariants(variants), className),

  // Typography
  heading: (variants?: HeadingVariants, className?: string) =>
    cn(headingVariants(variants), className),
  text: (variants?: TextVariants, className?: string) =>
    cn(textVariants(variants), className),

  // Interactive
  button: (variants?: ButtonVariants, className?: string) =>
    cn(buttonVariants(variants), className),
  input: (variants?: InputVariants, className?: string) =>
    cn(inputVariants(variants), className),

  // Display
  card: (variants?: CardVariants, className?: string) =>
    cn(cardVariants(variants), className),
  badge: (variants?: BadgeVariants, className?: string) =>
    cn(badgeVariants(variants), className),
  alert: (variants?: AlertVariants, className?: string) =>
    cn(alertVariants(variants), className),

  // UI
  modal: (variants?: ModalVariants, className?: string) =>
    cn(modalVariants(variants), className),
  skeleton: (variants?: SkeletonVariants, className?: string) =>
    cn(skeletonVariants(variants), className),
}

/**
 * State-based className utilities
 */
export const stateClasses = {
  // Loading states
  loading: 'opacity-50 cursor-wait pointer-events-none',
  disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
  
  // Interactive states
  interactive: 'cursor-pointer hover:bg-accent/50 transition-colors',
  clickable: 'cursor-pointer select-none',
  
  // Focus states
  focusable: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  
  // Visibility states
  hidden: 'sr-only',
  visible: 'not-sr-only',
  
  // Animation states
  animated: 'transition-all duration-200 ease-in-out',
  'animated-slow': 'transition-all duration-300 ease-in-out',
  'animated-fast': 'transition-all duration-100 ease-in-out',
}

/**
 * Responsive utilities
 */
export const responsiveClasses = {
  // Responsive display
  'mobile-only': 'block md:hidden',
  'tablet-up': 'hidden md:block',
  'desktop-up': 'hidden lg:block',
  'mobile-tablet': 'block lg:hidden',
  
  // Responsive grid
  'grid-mobile': 'grid-cols-1',
  'grid-tablet': 'grid-cols-1 md:grid-cols-2',
  'grid-desktop': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  'grid-wide': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  
  // Responsive text
  'text-responsive': 'text-sm md:text-base lg:text-lg',
  'heading-responsive': 'text-xl md:text-2xl lg:text-3xl',
  'title-responsive': 'text-2xl md:text-3xl lg:text-4xl xl:text-5xl',
}