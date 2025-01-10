import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/esm/index.js',
      format: 'esm',  // ESM output
      sourcemap: true,
    },
    external: [
      '@multitenant-graphql/utils', 
      '@graphql-mesh/types', 
      'graphql-yoga', 
      'graphql'
    ],
    plugins: [
      typescript({ useTsconfigDeclarationDir: true }), // Handle TypeScript
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cjs/index.js',
      format: 'cjs',  // CommonJS output
      sourcemap: true,
    },
    external: [
      '@multitenant-graphql/utils', 
      '@graphql-mesh/types', 
      'graphql-yoga', 
      'graphql'
    ],
    plugins: [
      typescript({ useTsconfigDeclarationDir: true }), // Handle TypeScript
    ],
  },
];
