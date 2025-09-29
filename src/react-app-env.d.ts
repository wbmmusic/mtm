/// <reference types="react-scripts" />

declare module "*.jsx" {
  const component: any;
  export default component;
}

declare module "*.css" {
  const content: any;
  export default content;
}

declare global {
  interface Window {
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      send: (channel: string, args?: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
      removeListener: (channel: string) => void;
      ver: () => string;
      msgMkr: any;
    };
  }
}

declare module "react" {
  interface ReactElement {
    [key: string]: any;
  }
  type ReactNode = any;
  type Element = any;
  type JSXElementConstructor = any;
  type ComponentType = any;
}

declare namespace JSX {
  interface Element extends React.ReactElement<any, any> {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

export {};