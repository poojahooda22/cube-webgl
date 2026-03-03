/// <reference types="vite/client" />

declare module '*.glsl' {
    const value: string;
    export default value;
}

declare module '*.vert' {
    const value: string;
    export default value;
}

declare module '*.frag' {
    const value: string;
    export default value;
}

declare module '*.png' {
    const value: string;
    export default value;
}

declare module 'query-string' {
    const queryString: {
        parse(query: string): Record<string, string | undefined>;
        stringify(obj: Record<string, any>): string;
    };
    export default queryString;
}
