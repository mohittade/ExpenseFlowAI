"""
ExpenseFlow AI - Main entry point for Streamlit.
"""
import subprocess
import sys
import os


def main():
    """Launch Streamlit app."""
    app_path = os.path.join(os.path.dirname(__file__), 'ui', 'streamlit_app.py')
    subprocess.run([sys.executable, '-m', 'streamlit', 'run', app_path])


if __name__ == "__main__":
    main()