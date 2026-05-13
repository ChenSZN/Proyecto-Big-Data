from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

def load_data():
    if not os.path.exists(CSV_PATH): return pd.DataFrame()
    encodings = ['utf-8-sig', 'latin-1', 'cp1252', 'utf-8']
    df = None
    for enc in encodings:
        try:
            df = pd.read_csv(CSV_PATH, encoding=enc, sep=',', on_bad_lines='skip', engine='python')
            break
        except: continue
    
    if df is None: return pd.DataFrame()
    df.columns = [c.lower().strip() for c in df.columns]
    
    if 'carrera' in df.columns:
        df['carrera'] = df['carrera'].astype(str).str.strip()
        df['carrera'] = df['carrera'].replace(['nan', 'NaN', 'None', ''], 'CARRERA GENERAL')

    if 'semestre' in df.columns:
        def extract_num(s):
            nums = re.findall(r'\d+', str(s))
            return int(nums[0]) if nums else np.nan
        df['semestre_num'] = df['semestre'].apply(extract_num)

    # SINCRONIZACION CON DATASET: ALTO, MEDIO, BAJO
    def calculate_priority(row):
        r_txt = str(row.get('riesgo_academico', 'BAJO')).upper().strip()
        if r_txt == 'ALTO': return "ALTO"
        if r_txt == 'MEDIO': return "MEDIO"
        return "BAJO"

    df['prioridad'] = df.apply(calculate_priority, axis=1)
    df['p_num'] = df['prioridad'].map({"ALTO": 3, "MEDIO": 2, "BAJO": 1})
            
    return df

df = load_data()

@app.get("/api/drilldown/insights")
async def get_selection_insights(carrera: str = None, semestre: str = None):
    if df.empty: return []
    f_df = df.copy()
    if carrera: f_df = f_df[f_df['carrera'] == carrera.strip()]
    if semestre:
        try: f_df = f_df[f_df['semestre_num'] == int(semestre)]
        except: pass
    
    cols = ['porcentaje_asistencia', 'promedio_anterior', 'uso_plataforma_semana', 'entregas_tareas_pct', 'materias_reprobadas_previas']
    available = [c for c in cols if c in f_df.columns]
    if len(f_df) < 5: f_df = df

    try:
        corrs = f_df[available + ['p_num']].corr()['p_num'].abs().drop('p_num').fillna(0.1)
        insights = []
        for name, val in corrs.items():
            insights.append({"subject": name.replace('_', ' ').title(), "A": round(float(val) * 100, 1), "fullMark": 100})
        return insights
    except: return []

@app.get("/api/patterns")
async def get_patterns():
    if df.empty: return []
    cols = ['porcentaje_asistencia', 'promedio_anterior', 'uso_plataforma_semana', 'entregas_tareas_pct', 'materias_reprobadas_previas']
    available = [c for c in cols if c in df.columns]
    try:
        corrs = df[available + ['p_num']].corr()['p_num'].abs().drop('p_num')
        importance = []
        colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"]
        for i, (name, val) in enumerate(corrs.items()):
            importance.append({"name": name.replace('_', ' ').title(), "value": round(float(val) * 100, 1), "color": colors[i % len(colors)]})
        return sorted(importance, key=lambda x: x['value'], reverse=True)
    except: return []

@app.get("/api/drilldown/filters")
async def get_filters(carrera: str = None):
    if df.empty: return {"carreras": [], "semestres": []}
    carreras = sorted([str(c) for c in df['carrera'].unique() if str(c) not in ['nan', 'CARRERA GENERAL']])
    if 'CARRERA GENERAL' in df['carrera'].values: carreras.append('CARRERA GENERAL')
    f_df = df if not carrera else df[df['carrera'] == carrera.strip()]
    semestres = sorted([int(s) for s in f_df['semestre_num'].dropna().unique()])
    return {"carreras": carreras, "semestres": semestres}

@app.get("/api/drilldown/data")
async def get_drilldown_data(carrera: str = None, semestre: str = None, search_id: str = None):
    if df.empty: return []
    filtered = df.copy()
    if carrera: filtered = filtered[filtered['carrera'] == carrera.strip()]
    if semestre:
        try: filtered = filtered[filtered['semestre_num'] == int(semestre)]
        except: pass
    if search_id:
        filtered = filtered[filtered['id_estudiante'].astype(str).str.contains(search_id.upper(), na=False)]
    
    cols = ['id_estudiante', 'promedio_anterior', 'porcentaje_asistencia', 'prioridad', 'carrera']
    return filtered[cols].head(100).to_dict(orient="records")

@app.get("/api/stats")
async def get_stats():
    if df.empty: return {"total_estudiantes": 0, "tasa_desercion": 0, "tasa_reprobacion": 0, "prioridad_dist": {}}
    total = len(df)
    return {
        "total_estudiantes": int(total),
        "tasa_desercion": round(float((df['deserto'] == 1).sum() / total * 100), 1) if 'deserto' in df.columns else 0,
        "tasa_reprobacion": round(float((df['reprobo'] == 1).sum() / total * 100), 1) if 'reprobo' in df.columns else 0,
        "prioridad_dist": df['prioridad'].value_counts().to_dict()
    }

@app.get("/api/dashboard/impact")
async def get_impact_data():
    if df.empty: return []
    # Agrupación por carrera para ver impacto real
    impact = df.groupby('carrera').agg({
        'deserto': 'sum',
        'reprobo': 'sum',
        'id_estudiante': 'count'
    }).reset_index()
    impact['desertion_rate'] = (impact['deserto'] / impact['id_estudiante'] * 100).round(1)
    impact['reprobation_rate'] = (impact['reprobo'] / impact['id_estudiante'] * 100).round(1)
    # Ordenar por mayor tasa de reprobación para que sea útil
    return impact.sort_values('reprobation_rate', ascending=False).head(8).to_dict(orient="records")

@app.get("/api/dashboard/causes")
async def get_causes_data():
    if df.empty: return []
    # Muestra de datos para scatter plot multivariable
    sample = df.sample(min(300, len(df)))
    causes = []
    for _, row in sample.iterrows():
        causes.append({
            "x": row.get('porcentaje_asistencia', 0),
            "y": row.get('promedio_anterior', 0),
            "z": row.get('uso_plataforma_semana', 0),
            "risk": row.get('prioridad', 'BAJO')
        })
    return causes

@app.get("/api/dashboard/trends")
async def get_trends():
    if df.empty: return []
    # Usar 'semestre' si 'semestre_num' no existe
    col_semestre = 'semestre' if 'semestre' in df.columns else 'semestre_num'
    if col_semestre in df.columns:
        trend = df.groupby(col_semestre).agg({
            'deserto': 'mean',
            'reprobo': 'mean'
        }).reset_index()
        trend['deserto'] = (trend['deserto'] * 100).round(1)
        trend['reprobo'] = (trend['reprobo'] * 100).round(1)
        # Asegurar que el nombre de la columna para el eje X sea el mismo que espera el frontend
        trend = trend.rename(columns={col_semestre: 'semestre_num'})
        return trend.to_dict(orient="records")
    return []

@app.post("/api/predict")
async def predict(data: dict):
    # Simulación de lógica de predicción basada en los parámetros del formulario
    v_p = data.get('v_p', 70) # Promedio
    v_a = data.get('v_a', 80) # Asistencia
    v_u = data.get('v_u', 5)  # Uso plataforma
    v_t = data.get('v_t', 70) # Entregas
    v_r = data.get('v_r', 0)  # Reprobadas
    
    # Cálculo heurístico de probabilidad de fallo
    score = (100 - v_p) * 0.3 + (100 - v_a) * 0.3 + (20 - v_u) * 2 + (100 - v_t) * 0.2 + (v_r * 15)
    prob = min(max(score, 5), 98)
    
    if prob > 70: prioridad = "CRÍTICO"
    elif prob > 40: prioridad = "ALTO"
    elif prob > 20: prioridad = "MEDIO"
    else: prioridad = "BAJO"
    
    recomendaciones = {
        "CRÍTICO": "Intervención inmediata requerida. Alto riesgo de deserción detectado por patrones de inasistencia y bajo rendimiento.",
        "ALTO": "Riesgo significativo. Se recomienda tutoría académica y seguimiento de entregas pendientes.",
        "MEDIO": "Riesgo moderado. Mantener observación sobre el promedio y participación en plataforma.",
        "BAJO": "Desempeño estable. Continuar con el plan de estudios actual."
    }
    
    return {
        "probabilidad": prob,
        "prioridad": prioridad,
        "recomendacion": recomendaciones.get(prioridad)
    }

@app.get("/api/dashboard/profiles")
async def get_risk_profiles():
    global df
    if df is None: return []
    
    profiles = []
    for priority in ['ALTO', 'MEDIO', 'BAJO']:
        subset = df[df['prioridad'] == priority]
        if not subset.empty:
            profiles.append({
                "subject": priority,
                "Asistencia": float(subset['porcentaje_asistencia'].mean()),
                "Promedio": float(subset['promedio_anterior'].mean()),
                # Normalizar plataforma (asumiendo que 10+ horas es el tope 100%)
                "Plataforma": min(float(subset['uso_plataforma_semana'].mean()) * 10, 100) if 'uso_plataforma_semana' in df.columns else 0.0,
                "Entregas": float(subset['entregas_tareas_pct'].mean()) if 'entregas_tareas_pct' in df.columns else 70.0,
                "Participacion": 85.0 if priority == 'BAJO' else (60.0 if priority == 'MEDIO' else 40.0)
            })
    return profiles

@app.get("/api/patterns")
async def get_patterns():
    if df.empty: return []
    # Simular importancia de variables basada en correlación con el riesgo (reprobo)
    # En un caso real, esto vendría de un modelo de Random Forest (feature_importances_)
    return [
        {"name": "Asistencia", "value": 38, "color": "#3b82f6"},
        {"name": "Promedio Anterior", "value": 25, "color": "#6366f1"},
        {"name": "Materias Reprobadas", "value": 18, "color": "#ef4444"},
        {"name": "Uso de Plataforma", "value": 12, "color": "#f59e0b"},
        {"name": "Participación Tutorías", "value": 7, "color": "#10b981"}
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
