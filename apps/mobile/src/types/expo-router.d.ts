// Type declarations for modules without types
declare module 'expo-router' {
    import { ComponentType, FC } from 'react';

    export const router: {
        navigate: (href: string | { pathname: string; params?: Record<string, string> }) => void;
        push: (href: string | { pathname: string; params?: Record<string, string> }) => void;
        replace: (href: string | { pathname: string; params?: Record<string, string> }) => void;
        back: () => void;
        canGoBack: () => boolean;
        setParams: (params: Record<string, string>) => void;
    };

    export function useRouter(): typeof router;

    export function useLocalSearchParams<T extends Record<string, string> = Record<string, string>>(): T;
    export function useGlobalSearchParams<T extends Record<string, string> = Record<string, string>>(): T;
    export function usePathname(): string;
    export function useSegments(): string[];

    export const Link: FC<{
        href: string | { pathname: string; params?: Record<string, string> };
        asChild?: boolean;
        replace?: boolean;
        children?: React.ReactNode;
    }>;

    export const Tabs: ComponentType<{
        screenOptions?: object;
        children?: React.ReactNode;
    }> & {
        Screen: ComponentType<{
            name: string;
            options?: {
                title?: string;
                tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
                headerShown?: boolean;
            };
        }>;
    };

    export const Stack: ComponentType<{
        screenOptions?: object;
        children?: React.ReactNode;
    }> & {
        Screen: ComponentType<{
            name: string;
            options?: {
                title?: string;
                headerShown?: boolean;
                presentation?: string;
            };
        }>;
    };

    export const Slot: FC<{ children?: React.ReactNode }>;
}
