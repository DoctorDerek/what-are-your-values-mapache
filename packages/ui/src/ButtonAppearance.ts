import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center gap-2 transition-[transform,box-shadow,color,background-color] outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary shadow-[6px_6px_0px_0px_#000000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        destructive:
          "bg-destructive shadow-[6px_6px_0px_0px_#000000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        outline:
          "bg-card shadow-[6px_6px_0px_0px_#000000] hover:bg-secondary active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        secondary:
          "bg-secondary shadow-[6px_6px_0px_0px_#000000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        ghost:
          "border-transparent bg-transparent hover:border-black hover:bg-accent",
        link: "bg-transparent",
        battle: "bg-mapache-vivid-primary-orange",
        accent: "bg-mapache-vivid-secondary-purple",
      },
      size: {
        default: "min-h-11 border-4 px-[20px] py-[12px]",
        confirmation: "min-h-11 border-4 px-[12px] py-[12px]",
        sm: "min-h-10 border-4 px-[12px] py-[8px]",
        lg: "min-h-14 border-4 px-[24px] py-[16px]",
        arrival:
          "min-h-13 border-4 px-[24px] py-[clamp(8px,calc(100dvh-430px),16px)]",
        section: "min-h-14 border-4 px-[4px] py-[16px]",
        navigation: "min-h-[44px] border-4 px-[8px] py-[8px]",
        tall: "min-h-14 border-4 px-[20px] py-[12px]",
        featured: "min-h-16 border-4 px-[20px] py-[12px]",
        icon: "min-h-11 size-11 border-4 p-0",
        link: "min-h-11 border-0 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
    compoundVariants: [
      {
        variant: ["default", "destructive", "secondary", "battle", "accent"],
        className:
          "relative hover:after:absolute hover:after:inset-x-0 hover:after:top-full hover:after:h-[calc(0.25rem+4px)]",
      },
      {
        variant: ["battle", "accent"],
        className:
          "shadow-[6px_6px_0px_0px_#000000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
      },
    ],
  },
)

export const buttonTypographyVariants = cva("", {
  variants: {
    size: {
      default: "text-lg",
      confirmation: "text-lg",
      sm: "text-base",
      lg: "text-2xl",
      arrival: "text-2xl",
      section: "text-2xl",
      navigation: "text-base",
      tall: "text-lg",
      featured: "text-3xl",
      icon: "text-3xl leading-none",
      link: "text-base",
    },
  },
})

export const buttonTextVariants = cva("font-black", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-card-foreground hover:text-secondary-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground hover:text-accent-foreground",
      link: "text-mapache-vivid-dark underline underline-offset-4",
      battle: "text-white",
      accent: "text-white",
    },
  },
  defaultVariants: { variant: "default" },
})
