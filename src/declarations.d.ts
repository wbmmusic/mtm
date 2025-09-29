// Ambient module declarations for styles and static assets used in the project
declare module '*.css';
declare module '*.scss';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.ico';
declare module '*.ttf';
declare module '*.woff';
declare module '*.woff2';

// Allow importing JSON in TypeScript without explicit types
declare module '*.json' {
  const value: any;
  export default value;
}
