const models = require('./models');

console.log('[Model Verification Success]: Loaded models successfully:');
Object.keys(models).forEach(modelName => {
  console.log(` - ${modelName} (Collection: ${models[modelName].collection.name})`);
});
