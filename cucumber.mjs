export default {
  paths: ['features/**/*.feature'],
  import: ['features/step_definitions/**/*.ts'],
  format: ['progress-bar'],
  formatOptions: { snippetInterface: 'async-await' }
};
