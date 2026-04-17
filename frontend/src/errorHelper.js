export function parseTrainError(raw) {
  const msg = (raw || '').toLowerCase()

  if (msg.includes('could not convert string') || msg.includes('invalid literal') || msg.includes('could not convert') || msg.includes('non-numeric')) {
    return {
      title: 'Feature columns contain text values',
      detail: 'One or more selected features are categorical and cannot be used directly by this model.',
      fix: 'Go to Prepare → Categorical Encoding and one-hot encode columns like "sex", "smoker", "region" before training.',
    }
  }
  if (msg.includes('input contains nan') || msg.includes('contains nan') || msg.includes('missing values')) {
    return {
      title: 'Missing values in selected features',
      detail: 'Your features contain NaN values that sklearn cannot handle.',
      fix: 'Go to Prepare → Missing Values and choose to drop rows or impute before training.',
    }
  }
  if (msg.includes('target column required')) {
    return {
      title: 'No target column selected',
      detail: 'Regression needs a column to predict.',
      fix: 'Select a numeric column as your target (e.g. "charges", "price", "value").',
    }
  }
  if (msg.includes('no valid features')) {
    return {
      title: 'No valid feature columns',
      detail: 'All selected features were removed or not found after preprocessing.',
      fix: 'Re-select your features, or check that your one-hot encoding settings are correct.',
    }
  }
  if (msg.includes('select at least one feature')) {
    return {
      title: 'No features selected',
      detail: 'You need to pick at least one input column for the model to learn from.',
      fix: 'Select one or more feature columns below.',
    }
  }
  if (msg.includes('n_samples') || msg.includes('too few') || msg.includes('0 samples')) {
    return {
      title: 'Not enough data after preprocessing',
      detail: 'Preprocessing removed too many rows, leaving nothing to train on.',
      fix: 'Try imputation instead of dropping rows, or reduce outlier removal aggressiveness in Prepare.',
    }
  }
  if (msg.includes('found array with 0 feature') || msg.includes('0 features')) {
    return {
      title: 'No feature columns found',
      detail: 'After preprocessing, no feature columns remain.',
      fix: 'Check your column selection and preprocessing steps.',
    }
  }
  return {
    title: 'Training failed',
    detail: raw,
    fix: null,
  }
}
