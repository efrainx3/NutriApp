import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default tseslint.config(
  {
    files: ['src/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/app/features/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/features/registro/**',
                '**/features/pacientes/**',
                '**/features/valoracion/**',
                '**/features/planes/**',
                '../registro/**',
                '../pacientes/**',
                '../valoracion/**',
                '../planes/**',
                '../../registro/**',
                '../../pacientes/**',
                '../../valoracion/**',
                '../../planes/**',
              ],
              message:
                'Regla de arquitectura Flux: Los módulos de features/ no pueden importarse entre sí, salvo evolucion (compartido).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  }
);
