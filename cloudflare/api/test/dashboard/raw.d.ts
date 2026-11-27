// Lets the test import the migration file as text (a Vite feature).
declare module '*?raw' {
  const text: string
  export default text
}
