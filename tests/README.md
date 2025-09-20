# ML Lab Preprocessing Tests

## Test Coverage

The test suite covers all preprocessing functions:

### 1. `drop_missing_values()`
- Drop all missing values
- Drop missing values from specific columns
- Drop missing values from multiple columns
- Handle dataframes with no missing values
- Handle empty dataframes

### 2. `impute_missing_values()`
- Mean imputation strategy
- Median imputation strategy
- Imputation on specific columns
- Handle dataframes with no missing values
- Ignore non-numeric columns

### 3. `remove_outliers_iqr()`
- Remove outliers with default IQR factor (1.5)
- Remove outliers with custom IQR factor
- Remove outliers from specific columns
- Handle dataframes with no outliers
- Handle empty dataframes
- Single column outlier removal

### 4. `get_missing_value_summary()`
- Generate missing value summary
- Handle dataframes with no missing values
- Handle empty dataframes
- Handle dataframes with all missing values

### 5. Integration Tests
- Complete preprocessing pipeline
- Multiple preprocessing steps in sequence

## Running Tests

### Option 1: Using the test runner script (Recommended)
```bash
cd tests
python run_tests.py
```

### Option 2: Using unittest directly
```bash
cd tests
python -m unittest test_preprocessing.py -v
```

### Option 3: Running specific test classes
```bash
cd tests
python -m unittest test_preprocessing.TestDropMissingValues -v
python -m unittest test_preprocessing.TestImputeMissingValues -v
python -m unittest test_preprocessing.TestRemoveOutliersIQR -v
python -m unittest test_preprocessing.TestGetMissingValueSummary -v
```

## Test Data

The tests use carefully crafted datasets to ensure comprehensive coverage:

- **Missing Values**: DataFrames with various patterns of missing values
- **Outliers**: DataFrames with known outliers using statistical methods
- **Mixed Data Types**: DataFrames with both numeric and categorical columns
- **Edge Cases**: Empty DataFrames, single-column DataFrames, etc.

## Adding New Tests

To add new tests:

1. Add test methods to the appropriate test class in `test_preprocessing.py`
2. Follow the naming convention: `test_<functionality_description>`
3. Use descriptive docstrings for test methods
4. Run tests to ensure they pass

