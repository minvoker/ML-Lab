import unittest
import pandas as pd
import numpy as np
import sys
import os

# Add the app directory to the path so we can import utils
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))

from utils import (
    drop_missing_values,
    impute_missing_values,
    remove_outliers_iqr,
    get_missing_value_summary
)


class TestDropMissingValues(unittest.TestCase):
    """Test cases for drop_missing_values function."""
    
    def setUp(self):
        """Set up test data with missing values."""
        self.df_with_missing = pd.DataFrame({
            'A': [1, 2, np.nan, 4, 5],
            'B': [10, np.nan, 30, 40, 50],
            'C': [100, 200, 300, np.nan, 500],
            'D': ['a', 'b', 'c', 'd', 'e']
        })
        
        self.df_no_missing = pd.DataFrame({
            'A': [1, 2, 3, 4, 5],
            'B': [10, 20, 30, 40, 50],
            'C': [100, 200, 300, 400, 500]
        })
    
    def test_drop_all_missing_values(self):
        """Test dropping rows with any missing values."""
        result = drop_missing_values(self.df_with_missing)
        expected_rows = 2  # Rows 0 and 3 have no missing values
        self.assertEqual(len(result), expected_rows)
        self.assertTrue(result.isnull().sum().sum() == 0)
    
    def test_drop_missing_specific_columns(self):
        """Test dropping rows with missing values in specific columns."""
        result = drop_missing_values(self.df_with_missing, columns=['A'])
        expected_rows = 4  # Rows 0, 1, 3, 4 have non-missing values in column A
        self.assertEqual(len(result), expected_rows)
        self.assertTrue(result['A'].isnull().sum() == 0)
    
    def test_drop_missing_multiple_columns(self):
        """Test dropping rows with missing values in multiple columns."""
        result = drop_missing_values(self.df_with_missing, columns=['A', 'B'])
        expected_rows = 3  # Rows 0, 3, and 4 have non-missing values in both A and B
        self.assertEqual(len(result), expected_rows)
        self.assertTrue(result[['A', 'B']].isnull().sum().sum() == 0)
    
    def test_no_missing_values(self):
        """Test behavior when no missing values exist."""
        result = drop_missing_values(self.df_no_missing)
        self.assertEqual(len(result), len(self.df_no_missing))
        pd.testing.assert_frame_equal(result, self.df_no_missing)
    
    def test_empty_dataframe(self):
        """Test behavior with empty DataFrame."""
        empty_df = pd.DataFrame()
        result = drop_missing_values(empty_df)
        self.assertEqual(len(result), 0)


class TestImputeMissingValues(unittest.TestCase):
    """Test cases for impute_missing_values function."""
    
    def setUp(self):
        """Set up test data with missing values."""
        self.df_with_missing = pd.DataFrame({
            'A': [1, 2, np.nan, 4, 5],
            'B': [10, np.nan, 30, 40, 50],
            'C': [100, 200, 300, np.nan, 500],
            'D': ['a', 'b', 'c', 'd', 'e']  # Non-numeric column
        })
        
        self.df_no_missing = pd.DataFrame({
            'A': [1, 2, 3, 4, 5],
            'B': [10, 20, 30, 40, 50]
        })
    
    def test_impute_mean_strategy(self):
        """Test imputation with mean strategy."""
        result = impute_missing_values(self.df_with_missing, strategy='mean')
        
        # Check that missing values are filled
        self.assertTrue(result.isnull().sum().sum() == 0)
        
        # Check that mean values are correct
        expected_mean_A = (1 + 2 + 4 + 5) / 4  # 3.0
        expected_mean_B = (10 + 30 + 40 + 50) / 4  # 32.5
        expected_mean_C = (100 + 200 + 300 + 500) / 4  # 275.0
        
        self.assertAlmostEqual(result['A'].iloc[2], expected_mean_A)
        self.assertAlmostEqual(result['B'].iloc[1], expected_mean_B)
        self.assertAlmostEqual(result['C'].iloc[3], expected_mean_C)
    
    def test_impute_median_strategy(self):
        """Test imputation with median strategy."""
        result = impute_missing_values(self.df_with_missing, strategy='median')
        
        # Check that missing values are filled
        self.assertTrue(result.isnull().sum().sum() == 0)
        
        # Check that median values are correct
        expected_median_A = 3.0  # median of [1, 2, 4, 5]
        expected_median_B = 35.0  # median of [10, 30, 40, 50]
        expected_median_C = 250.0  # median of [100, 200, 300, 500]
        
        self.assertAlmostEqual(result['A'].iloc[2], expected_median_A)
        self.assertAlmostEqual(result['B'].iloc[1], expected_median_B)
        self.assertAlmostEqual(result['C'].iloc[3], expected_median_C)
    
    def test_impute_specific_columns(self):
        """Test imputation on specific columns only."""
        result = impute_missing_values(self.df_with_missing, columns=['A'], strategy='mean')
        
        # Column A should be imputed
        self.assertTrue(result['A'].isnull().sum() == 0)
        
        # Other columns should remain unchanged
        self.assertTrue(result['B'].isnull().sum() == 1)  # Still has one missing value
        self.assertTrue(result['C'].isnull().sum() == 1)  # Still has one missing value
    
    def test_no_missing_values(self):
        """Test behavior when no missing values exist."""
        result = impute_missing_values(self.df_no_missing, strategy='mean')
        # Convert dtypes to match for comparison
        result = result.astype(self.df_no_missing.dtypes)
        pd.testing.assert_frame_equal(result, self.df_no_missing)
    
    def test_non_numeric_columns_ignored(self):
        """Test that non-numeric columns are ignored."""
        result = impute_missing_values(self.df_with_missing, strategy='mean')
        # Non-numeric column D should remain unchanged
        pd.testing.assert_series_equal(result['D'], self.df_with_missing['D'])


class TestRemoveOutliersIQR(unittest.TestCase):
    """Test cases for remove_outliers_iqr function."""
    
    def setUp(self):
        """Set up test data with outliers."""
        # Create data with known outliers
        np.random.seed(42)
        normal_data = np.random.normal(100, 10, 100)  # Normal distribution around 100
        outlier_data = [200, 250, 300, -50, -100]  # Clear outliers
        
        self.df_with_outliers = pd.DataFrame({
            'A': list(normal_data) + outlier_data,
            'B': list(np.random.normal(50, 5, 100)) + [150, 200, 250, -25, -50],
            'C': ['a'] * 105  # Non-numeric column
        })
        
        self.df_no_outliers = pd.DataFrame({
            'A': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            'B': [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        })
    
    def test_remove_outliers_default_factor(self):
        """Test outlier removal with default IQR factor."""
        result = remove_outliers_iqr(self.df_with_outliers)
        
        # Should have fewer rows than original
        self.assertLess(len(result), len(self.df_with_outliers))
        
        # Check that extreme outliers are removed
        self.assertLess(result['A'].max(), 200)
        self.assertGreater(result['A'].min(), -50)
    
    def test_remove_outliers_custom_factor(self):
        """Test outlier removal with custom IQR factor."""
        # More lenient factor should remove fewer outliers
        result_lenient = remove_outliers_iqr(self.df_with_outliers, factor=2.0)
        result_strict = remove_outliers_iqr(self.df_with_outliers, factor=1.0)
        
        self.assertGreaterEqual(len(result_lenient), len(result_strict))
    
    def test_remove_outliers_specific_columns(self):
        """Test outlier removal on specific columns only."""
        result = remove_outliers_iqr(self.df_with_outliers, columns=['A'])
        
        # Should have fewer rows than original
        self.assertLess(len(result), len(self.df_with_outliers))
        
        # Non-numeric column should remain unchanged
        self.assertEqual(len(result), len(result[result['C'] == 'a']))
    
    def test_no_outliers(self):
        """Test behavior when no outliers exist."""
        result = remove_outliers_iqr(self.df_no_outliers)
        self.assertEqual(len(result), len(self.df_no_outliers))
    
    def test_empty_dataframe(self):
        """Test behavior with empty DataFrame."""
        empty_df = pd.DataFrame()
        result = remove_outliers_iqr(empty_df)
        self.assertEqual(len(result), 0)
    
    def test_single_column_outlier_removal(self):
        """Test outlier removal on a single column."""
        # Create data with clear outliers: normal range 1-10, outliers 50-100
        single_col_df = pd.DataFrame({
            'A': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 50, 75, 100]
        })
        
        result = remove_outliers_iqr(single_col_df, columns=['A'])
        
        # Should remove the extreme outliers (values > Q3 + 1.5*IQR)
        # Q1=3.5, Q3=7.5, IQR=4, upper_bound=7.5+1.5*4=13.5
        # So values 50, 75, 100 should be removed
        self.assertLess(len(result), len(single_col_df))
        self.assertLessEqual(result['A'].max(), 13.5)


class TestGetMissingValueSummary(unittest.TestCase):
    """Test cases for get_missing_value_summary function."""
    
    def setUp(self):
        """Set up test data with missing values."""
        self.df_with_missing = pd.DataFrame({
            'A': [1, 2, np.nan, 4, 5, np.nan],
            'B': [10, np.nan, 30, 40, 50, 60],
            'C': [100, 200, 300, np.nan, 500, 600],
            'D': ['a', 'b', 'c', 'd', 'e', 'f']  # No missing values
        })
        
        self.df_no_missing = pd.DataFrame({
            'A': [1, 2, 3, 4, 5],
            'B': [10, 20, 30, 40, 50]
        })
    
    def test_missing_value_summary(self):
        """Test missing value summary generation."""
        result = get_missing_value_summary(self.df_with_missing)
        
        # Should have 3 columns with missing values
        self.assertEqual(len(result), 3)
        
        # Check that columns are sorted by missing count
        self.assertTrue(result['Missing Count'].is_monotonic_decreasing)
        
        # Check specific values
        self.assertEqual(result.loc['A', 'Missing Count'], 2)
        self.assertEqual(result.loc['B', 'Missing Count'], 1)
        self.assertEqual(result.loc['C', 'Missing Count'], 1)
        
        # Check percentages
        self.assertAlmostEqual(result.loc['A', 'Missing Percentage'], 33.33, places=1)
        self.assertAlmostEqual(result.loc['B', 'Missing Percentage'], 16.67, places=1)
        self.assertAlmostEqual(result.loc['C', 'Missing Percentage'], 16.67, places=1)
    
    def test_no_missing_values(self):
        """Test behavior when no missing values exist."""
        result = get_missing_value_summary(self.df_no_missing)
        
        # Should return empty DataFrame
        self.assertTrue(result.empty)
    
    def test_empty_dataframe(self):
        """Test behavior with empty DataFrame."""
        empty_df = pd.DataFrame()
        result = get_missing_value_summary(empty_df)
        self.assertTrue(result.empty)
    
    def test_all_missing_values(self):
        """Test behavior when all values are missing."""
        all_missing_df = pd.DataFrame({
            'A': [np.nan, np.nan, np.nan],
            'B': [np.nan, np.nan, np.nan]
        })
        
        result = get_missing_value_summary(all_missing_df)
        
        # Should have 2 columns
        self.assertEqual(len(result), 2)
        
        # All should have 100% missing
        self.assertTrue((result['Missing Percentage'] == 100.0).all())


class TestPreprocessingIntegration(unittest.TestCase):
    """Integration tests for preprocessing functions."""
    
    def test_preprocessing_pipeline(self):
        """Test a complete preprocessing pipeline."""
        # Create a messy dataset
        df = pd.DataFrame({
            'A': [1, 2, np.nan, 4, 5, 1000],  # Missing value + outlier
            'B': [10, np.nan, 30, 40, 50, 60],
            'C': ['a', 'b', 'c', 'd', 'e', 'f']
        })
        
        # Step 1: Remove outliers
        df_clean = remove_outliers_iqr(df, columns=['A'])
        
        # Step 2: Impute missing values
        df_imputed = impute_missing_values(df_clean, strategy='mean')
        
        # Step 3: Check final result
        self.assertTrue(df_imputed.isnull().sum().sum() == 0)
        self.assertLess(len(df_imputed), len(df))  # Should have fewer rows due to outlier removal
        
        # Step 4: Get summary
        summary = get_missing_value_summary(df_imputed)
        self.assertTrue(summary.empty)  # Should have no missing values after imputation


if __name__ == '__main__':
    # Create a test suite
    test_suite = unittest.TestSuite()
    
    # Add test cases
    test_classes = [
        TestDropMissingValues,
        TestImputeMissingValues,
        TestRemoveOutliersIQR,
        TestGetMissingValueSummary,
        TestPreprocessingIntegration
    ]
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    print(f"{'='*50}")
