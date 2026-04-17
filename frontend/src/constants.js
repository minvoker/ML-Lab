export const MODEL_CONFIGS = {
  Regression: {
    'Linear Regression': { params: [] },
    'Decision Tree': { params: ['max_depth'] },
    'Forest Regression': { params: ['n_estimators', 'max_depth'] },
  },
  Clustering: {
    DBSCAN: { params: ['eps', 'min_samples'] },
  },
  'Anomaly Detection': {
    'Isolation Forest': { params: ['contamination', 'n_estimators'] },
  },
}

export const HYPERPARAM_DEFAULTS = {
  max_depth: 5,
  n_estimators: 50,
  eps: 0.5,
  min_samples: 5,
  contamination: 0.05,
}

export const CLUSTER_COLORS = [
  '#EF4444', '#F97316', '#FBBF24', '#34D399', '#60A5FA',
  '#A78BFA', '#F472B6', '#2DD4BF', '#FB923C', '#818CF8',
]
