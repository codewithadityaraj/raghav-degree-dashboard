import sys
sys.path.append('.')
import server

for key in ["token-cohort", "token-monthly", "fp-cohort", "fp-monthly"]:
    try:
        rows = server._get_sheet_rows(key)
        print(f"\n{key} (count: {len(rows)}):")
        if rows:
            print("Headers:", list(rows[0].keys()))
            print("Sample Row:", rows[0])
    except Exception as e:
        print(f"Error reading {key}:", e)

