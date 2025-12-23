import * as LucideIcons from 'lucide-react';

export default function EventIcon({ name, size = 18 }: { name: string, size?: number }): React.ReactNode {
    const Icon = LucideIcons[name as keyof typeof LucideIcons] as React.ElementType;
    return Icon ? <Icon size={size} strokeWidth={1.5} /> : null;
}