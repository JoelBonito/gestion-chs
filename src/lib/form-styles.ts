/**
 * Estilos centralizados para formulários
 * Import: import { formStyles } from '@/lib/form-styles';
 */

export const formStyles = {
    // Background de seções/cards dentro de modais
    section: "bg-surface border border-border rounded-xl p-5 mb-4 shadow-sm",

    // Labels
    label: "text-xs font-semibold uppercase text-muted-foreground tracking-wide flex items-center gap-2",

    // Inputs
    input: "bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20",

    // Headers de seção
    sectionHeader: "flex items-center gap-2 mb-4 pb-3 border-b border-border/30",
    sectionTitle: "text-sm font-semibold text-foreground",
    sectionIcon: "w-4 h-4 text-primary",

    // Grid layouts
    gridTwo: "grid grid-cols-1 md:grid-cols-2 gap-4",
    gridThree: "grid grid-cols-1 md:grid-cols-3 gap-4",

    // Select content
    selectContent: "bg-popover border-border text-foreground",
    selectItem: "focus:bg-accent focus:text-accent-foreground",

    // Texto
    textPrimary: "text-foreground",
    textSecondary: "text-muted-foreground",

    // Buttons
    buttonSave: "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-button hover:shadow-hover transition-all duration-200",
    buttonAdd: "bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-sm",
    buttonCancel: "bg-transparent border-border hover:bg-muted text-muted-foreground hover:text-foreground",
} as const;

// Classes CSS como string para uso direto
export const SectionStyles = formStyles.section;
export const LabelStyles = formStyles.label;
export const InputStyles = formStyles.input;
