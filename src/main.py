"""
ExpenseFlow AI - Main entry point.
"""
import sys
import os
import argparse


def run_backend():
    """Launch FastAPI backend."""
    os.chdir(os.path.join(os.path.dirname(__file__), '..', 'backend'))
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


def run_streamlit():
    """Launch Streamlit app (legacy)."""
    import subprocess
    app_path = os.path.join(os.path.dirname(__file__), 'ui', 'streamlit_app.py')
    subprocess.run([sys.executable, '-m', 'streamlit', 'run', app_path])


def main():
    parser = argparse.ArgumentParser(description='ExpenseFlow AI')
    parser.add_argument('--backend', action='store_true', help='Run FastAPI backend')
    parser.add_argument('--streamlit', action='store_true', help='Run Streamlit UI (legacy)')
    parser.add_argument('--port', type=int, default=8000, help='Backend port')
    args = parser.parse_args()

    if args.streamlit:
        run_streamlit()
    else:
        # Default to backend
        run_backend()


if __name__ == "__main__":
    main()