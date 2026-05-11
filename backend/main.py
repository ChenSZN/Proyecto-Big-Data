from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CSV_PATH = "dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv"

def load_data():
    if os.path.exists(CSV_PATH):
        try:
            # Intentamos leer con latin-1 para soportar los caracteres especiales del archivo original
            df = pd.read_csv(CSV_PATH, encoding='latin-1')
        except:
            df = pd.read_csv(CSV_PATH)
            
        df.columns = [c.lower() for c in df.columns]
        
        # Mapeo de Riesgo Académico (Texto a Número)
        riesgo_map = {'BAJO': 0.2, 'MEDIO': 0.5, 'ALTO': 0.8}
        if 'riesgo_academico' in df.columns:
            # Convertimos a mayúsculas para comparar seguro
            df['riesgo_num'] = df['riesgo_academico'].astype(str).str.upper().str.strip().map(riesgo_map).fillna(0.2)
            
            # Asignamos la prioridad para el UI
            def get_prioridad(r):
                if r >= 0.8: return "CRÍTICO"
                if r >= 0.5: return "ALTO"
                if r >= 0.3: return "PREVENTIVO"
                return "ESTABLE"
            df['prioridad'] = df['riesgo_num'].apply(get_prioridad)
        
        # Limpieza de Carreras
        if 'carrera' in df.columns:
            df['carrera'] = df['carrera'].astype(str).str.strip().str.upper()
            # Quitamos posibles caracteres basura
            df['carrera'] = df['carrera'].replace('NAN', 'CARRERA GENERAL')
            
        return df
    return pd.DataFrame()

df = load_data()

@app.get("/api/patterns")
async def get_patterns():
    if 'riesgo_num' not in df.columns:
        return []
    
    # Variables numéricas para correlación
    cols = ['porcentaje_asistencia', 'promedio_anterior', 'uso_plataforma_semana', 'entregas_tareas_pct', 'materias_reprobadas_previas']
    available = [c for c in cols if c in df.columns]
    
    # Calculamos correlación con el riesgo numérico
    corrs = df[available + ['riesgo_num']].corr()['riesgo_num'].abs().drop('riesgo_num')
    
    importance = []
    colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"]
    for i, (name, val) in enumerate(corrs.items()):
        importance.append({
            "name": name.replace('_', ' ').title(),
            "value": round(val * 100, 1) if not np.isnan(val) else 10.0, # Fallback si no hay correlación
            "color": colors[i % len(colors)]
        })
    
    return sorted(importance, key=lambda x: x['value'], reverse=True)

@app.get("/api/drilldown/filters")
async def get_filters(carrera: str = None):
    carreras = sorted(df['carrera'].unique().tolist())
    f_df = df.copy()
    if carrera: f_df = f_df[f_df['carrera'] == carrera.strip().upper()]
    semestres = sorted(f_df['semestre'].unique().tolist())
    return {"carreras": carreras, "semestres": semestres}

@app.get("/api/drilldown/data")
async def get_drilldown_data(carrera: str = None, semestre: str = None, search_id: str = None):
    filtered = df.copy()
    if carrera: filtered = filtered[filtered['carrera'] == carrera.strip().upper()]
    if semestre:
        try: filtered = filtered[filtered['semestre'] == int(semestre)]
        except: pass
    if search_id:
        filtered = filtered[filtered['id_estudiante'].astype(str).str.contains(search_id.upper(), na=False)]
    
    return filtered[['id_estudiante', 'promedio_anterior', 'porcentaje_asistencia', 'prioridad', 'carrera']].head(100).to_dict(orient="records")

@app.get("/api/stats")
async def get_stats():
    total = len(df)
    if total == 0: return {}
    return {
        "total_estudiantes": int(total),
        "tasa_desercion": float((df['deserto'] == 1).sum() / total * 100) if 'deserto' in df.columns else 0,
        "tasa_reprobacion": float((df['reprobo'] == 1).sum() / total * 100) if 'reprobo' in df.columns else 0,
        "prioridad_dist": df['prioridad'].value_counts().to_dict(),
        "carreras_dist": df['carrera'].value_counts().to_dict()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
