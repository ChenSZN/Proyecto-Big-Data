import pandas as pd
import os

CSV_PATH = r"d:\Proyecto Big Data (Desercion y Reprobacion)\backend\dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv"

def debug_csv():
    if not os.path.exists(CSV_PATH):
        print("CSV NOT FOUND")
        return
        
    try:
        df = pd.read_csv(CSV_PATH, encoding='latin-1')
        print("COLUMNS FOUND:")
        for i, col in enumerate(df.columns):
            print(f"{i}: '{col}' (type: {type(col)})")
            
        print("\nFIRST ROW DATA:")
        first_row = df.iloc[0].to_dict()
        for k, v in first_row.items():
            print(f"'{k}': {v} (type: {type(v)})")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    debug_csv()
