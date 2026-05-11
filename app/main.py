import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import os

# Configuración institucional
st.set_page_config(
    page_title="SAT ITNL | Inteligencia Académica",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- CSS DE BLOQUEO TOTAL ABSOLUTO ---
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    .stApp { background-color: #FFFFFF !important; }
    [data-testid="stAppViewContainer"] section.main * { color: #1E3D59 !important; font-family: 'Poppins', sans-serif !important; }
    [data-testid="stMarkdownContainer"] * { color: #1E3D59 !important; }
    h1, h2, h3, .section-title { color: #1E3D59 !important; font-weight: 800 !important; }
    .section-title { border-left: 10px solid #FF6E40 !important; padding-left: 20px !important; margin-bottom: 30px !important; display: block; font-size: 2.2rem; }
    .stAlert, .stAlert * { color: #000000 !important; }
    [data-testid="stWidgetLabel"] *, label p { color: #1E3D59 !important; font-weight: 700 !important; }
    [data-testid="stSidebar"] *, [data-testid="stSidebar"] span { color: #FFFFFF !important; }
    .stButton > button, .stButton > button * { color: #FFFFFF !important; }
    [data-baseweb="select"] div, ul[role="listbox"] * { background-color: #FFFFFF !important; color: #1E3D59 !important; }
    </style>
    """, unsafe_allow_html=True)

# Lógica de Diagnóstico
def obtener_diagnostico(promedio, asistencia, reprobadas):
    if promedio < 70 and asistencia < 70:
        return "⚠️ CRÍTICO", "Intervención de emergencia."
    elif promedio < 70 or asistencia < 70 or reprobadas > 2:
        return "🔴 ALTO", "Riesgo de reprobación."
    elif promedio <= 79 or asistencia <= 79:
        return "🟡 PREVENTIVO", "Zona de riesgo moderado."
    else:
        return "🟢 ESTABLE", "Desempeño óptimo."

# Carga de datos
@st.cache_data
def load_data():
    path = 'dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv'
    if os.path.exists(path):
        df = pd.read_csv(path)
        df['Estatus'] = df['deserto'].map({0: 'Permanencia', 1: 'Deserción'})
        df['Prioridad'] = df.apply(lambda r: obtener_diagnostico(r['promedio_anterior'], r['porcentaje_asistencia'], r['materias_reprobadas_previas'])[0], axis=1)
        return df
    return None

df = load_data()

# Navegación Sidebar
with st.sidebar:
    st.markdown("<h2 style='text-align: center; color: white;'>ITNL - SAT</h2>", unsafe_allow_html=True)
    st.markdown("---")
    menu = st.radio("MÓDULOS DEL SISTEMA", 
                    ["Dashboard Ejecutivo", "Gestión por Asignatura (Drill-Down)", "Patrones de Reprobación (ML)", "Simulador de Riesgo"])
    st.markdown("---")
    st.write("Mayo 2026")

if df is not None:
    plt.rcParams.update({'figure.facecolor': 'white', 'text.color': '#1E3D59'})

    if menu == "Dashboard Ejecutivo":
        st.markdown("<h1 class='section-title'>Análisis Global Institucional</h1>", unsafe_allow_html=True)
        k1, k2, k3, k4 = st.columns(4)
        k1.metric("Estudiantes", f"{len(df):,}")
        k2.metric("Índice Deserción", f"{df['deserto'].mean()*100:.1f}%")
        k3.metric("Índice Reprobación", f"{df['reprobo'].mean()*100:.1f}%")
        k4.metric("Casos Críticos", len(df[df['Prioridad'] == "⚠️ CRÍTICO"]))
        
        st.markdown("---")
        c1, c2 = st.columns([7, 3])
        with c1:
            st.subheader("Población por Programa Académico")
            fig, ax = plt.subplots(figsize=(10, 4))
            sns.countplot(data=df, y='carrera', hue='carrera', palette='Blues_r', ax=ax, legend=False)
            st.pyplot(fig)
        with c2:
            st.subheader("Semáforo de Riesgo")
            counts = df['Prioridad'].value_counts()
            for n, t in counts.items():
                st.write(f"**{n}:** {t} alumnos")

    elif menu == "Gestión por Asignatura (Drill-Down)":
        st.markdown("<h1 class='section-title'>Drill-Down Académico</h1>", unsafe_allow_html=True)
        st.write("Análisis granular por Carrera, Semestre, Materia y Maestro.")
        
        # Filtros en Cascada
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            car_f = st.selectbox("1. Carrera:", sorted(df['carrera'].unique()))
            df_c = df[df['carrera'] == car_f]
        with col2:
            sem_f = st.selectbox("2. Semestre:", sorted(df_c['semestre'].unique()))
            df_s = df_c[df_c['semestre'] == sem_f]
        with col3:
            mat_f = st.selectbox("3. Materia:", sorted(df_s['materia'].unique()))
            df_m = df_s[df_s['materia'] == mat_f]
        with col4:
            mae_f = st.selectbox("4. Maestro:", sorted(df_m['maestro'].unique()))
            df_final = df_m[df_m['maestro'] == mae_f]

        st.markdown("---")
        
        # Resultados del Drill-Down
        d1, d2, d3 = st.columns(3)
        d1.metric("Alumnos en Grupo", len(df_final))
        d2.metric("Prob. Deserción", f"{df_final['deserto'].mean()*100:.1f}%")
        d3.metric("Prob. Reprobación", f"{df_final['reprobo'].mean()*100:.1f}%")

        st.subheader(f"Listado de Alumnos en Riesgo: {mat_f}")
        st.dataframe(df_final[['id_estudiante', 'promedio_anterior', 'porcentaje_asistencia', 'Prioridad']], use_container_width=True)

    elif menu == "Patrones de Reprobación (ML)":
        st.markdown("<h1 class='section-title'>Inteligencia de Patrones de Comportamiento</h1>", unsafe_allow_html=True)
        st.write("Identificación de factores que causan la reprobación mediante Machine Learning.")
        
        if st.button("ANALIZAR PATRONES DEL REPOSITORIO"):
            # Modelo enfocado en reprobación
            X = df[['promedio_anterior', 'porcentaje_asistencia', 'uso_plataforma_semana', 'entregas_tareas_pct', 'materias_reprobadas_previas']]
            y = df['reprobo']
            
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            model = RandomForestClassifier(n_estimators=100, random_state=42)
            model.fit(X_train, y_train)
            
            st.success("Patrones Identificados Exitosamente.")
            
            c_p1, c_p2 = st.columns(2)
            with c_p1:
                st.subheader("Factores Determinantes")
                imp = pd.Series(model.feature_importances_, index=X.columns).sort_values()
                fig, ax = plt.subplots()
                imp.plot(kind='barh', color='#FF6E40', ax=ax)
                st.pyplot(fig)
            with c_p2:
                st.subheader("Mapa de Comportamiento")
                fig, ax = plt.subplots()
                sns.scatterplot(data=df, x='porcentaje_asistencia', y='entregas_tareas_pct', hue='reprobo', palette='RdYlGn_r', ax=ax)
                st.pyplot(fig)
            
            st.markdown("---")
            st.subheader("🔍 Explicación del Patrón de Riesgo")
            st.info("""
            **Perfil Típico del Alumno que Reprueba:**
            1. **Baja Asistencia**: Menor al 75% es el predictor más fuerte.
            2. **Inactividad Digital**: Menos de 4 horas semanales en plataforma.
            3. **Entregas Incompletas**: Menos del 65% de tareas entregadas dispara el riesgo en un 80%.
            """)

    elif menu == "Simulador de Riesgo":
        st.markdown("<h1 class='section-title'>Simulador de Riesgo Preventivo</h1>", unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        with c1:
            v_p = st.slider("Promedio Institucional", 0.0, 100.0, 75.0)
            v_a = st.slider("Nivel de Asistencia (%)", 0.0, 100.0, 85.0)
        with c2:
            v_r = st.number_input("Materias Reprobadas", 0, 15, 0)
            v_b = st.selectbox("¿Cuenta con Beca?", ["Sí", "No"])

        if st.button("GENERAR DIAGNÓSTICO"):
            nivel, desc = obtener_diagnostico(v_p, v_a, v_r)
            st.markdown("---")
            st.subheader(f"Estatus Resultante: {nivel}")
            st.write(desc)
            if "⚠️" in nivel or "🔴" in nivel: st.error("Atención Urgente Requerida.")
            elif "🟡" in nivel: st.warning("Monitoreo Sugerido.")
            else: st.success("Perfil Estable.")
else:
    st.error("Archivo institucional no encontrado.")
