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
    page_title="SAT ITNL | Gestión de Permanencia",
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

# Lógica de Diagnóstico Refinada (Sugerencia Usuario: Preventivo 70-79)
def obtener_diagnostico(promedio, asistencia, reprobadas):
    if promedio < 70 and asistencia < 70:
        return "⚠️ CRÍTICO", "Intervención de emergencia requerida. El alumno incumple ambos estándares mínimos (70)."
    elif promedio < 70 or asistencia < 70 or reprobadas > 2:
        return "🔴 ALTO", "Estatus de reprobación detectado. Requiere canalización inmediata a cursos de regularización."
    elif promedio <= 79 or asistencia <= 79:
        return "🟡 PREVENTIVO", "Zona de riesgo moderado (70-79). Se recomienda monitoreo para evitar que el alumno caiga en estatus de reprobación."
    else:
        return "🟢 ESTABLE", "Desempeño óptimo (80+). El alumno cumple satisfactoriamente con los estándares institucionales."

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
    st.markdown("<h2 style='text-align: center; color: white;'>ITNL - ISC</h2>", unsafe_allow_html=True)
    st.markdown("---")
    menu = st.radio("SISTEMA DE GESTIÓN", 
                    ["Vista Ejecutiva", "Análisis de Factores", "Modelo Predictivo", "Listado de Intervención", "Simulador de Riesgo"])
    st.markdown("---")
    st.write("Mayo 2026")

if df is not None:
    plt.rcParams.update({'figure.facecolor': 'white', 'text.color': '#1E3D59'})

    if menu == "Vista Ejecutiva":
        st.markdown("<h1 class='section-title'>Análisis de Permanencia Estudiantil</h1>", unsafe_allow_html=True)
        k1, k2, k3, k4 = st.columns(4)
        k1.metric("Estudiantes", f"{len(df):,}")
        k2.metric("Índice Deserción", f"{df['deserto'].mean()*100:.1f}%")
        k3.metric("Casos Críticos", len(df[df['Prioridad'] == "⚠️ CRÍTICO"]))
        k4.metric("Promedio Institucional", f"{df['promedio_anterior'].mean():.1f}")
        st.markdown("---")
        cl, cr = st.columns([7, 3])
        with cl:
            st.subheader("Distribución Académica por Carrera")
            fig, ax = plt.subplots(figsize=(10, 5))
            sns.countplot(data=df, y='carrera', hue='carrera', palette='Blues_r', ax=ax, legend=False)
            st.pyplot(fig)
        with cr:
            st.subheader("Semáforo de Riesgo (ITNL)")
            counts = df['Prioridad'].value_counts()
            for nivel, total in counts.items():
                st.write(f"**{nivel}:** {total} alumnos")

    elif menu == "Análisis de Factores":
        st.markdown("<h1 class='section-title'>Estudio de Factores de Riesgo</h1>", unsafe_allow_html=True)
        sel = st.selectbox("Filtrar Carrera:", ["Todas"] + list(df['carrera'].unique()))
        df_f = df if sel == "Todas" else df[df['carrera'] == sel]
        t1, t2 = st.tabs(["Rendimiento Académico", "Esfuerzo Digital"])
        with t1:
            c1, c2 = st.columns(2)
            with c1:
                st.write("### Asistencia vs Estatus")
                fig, ax = plt.subplots()
                sns.boxplot(data=df_f, x='Estatus', y='porcentaje_asistencia', palette='vlag', ax=ax)
                st.pyplot(fig)
            with c2:
                st.write("### Distribución de Calificaciones")
                fig, ax = plt.subplots()
                sns.histplot(data=df_f, x='promedio_anterior', hue='Estatus', kde=True, ax=ax)
                st.pyplot(fig)

    elif menu == "Modelo Predictivo":
        st.markdown("<h1 class='section-title'>Inteligencia Predictiva</h1>", unsafe_allow_html=True)
        if st.button("EJECUTAR ANÁLISIS DE INDICADORES"):
            X = df.drop(['id_estudiante', 'deserto', 'reprobo', 'riesgo_academico', 'Estatus', 'Prioridad'], axis=1)
            X = pd.get_dummies(X)
            y = df['deserto']
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            model = RandomForestClassifier(n_estimators=100, random_state=42)
            model.fit(X_train, y_train)
            st.success(f"Análisis Finalizado. Fiabilidad: {model.score(X_test, y_test)*100:.1f}%")
            st.subheader("Variables Determinantes")
            imp = pd.Series(model.feature_importances_, index=X.columns).sort_values().tail(10)
            fig, ax = plt.subplots()
            imp.plot(kind='barh', color='#1E3D59', ax=ax)
            st.pyplot(fig)

    elif menu == "Listado de Intervención":
        st.markdown("<h1 class='section-title'>Listado de Prioridad Académica</h1>", unsafe_allow_html=True)
        nivel_f = st.multiselect("Filtrar por Estatus:", ["⚠️ CRÍTICO", "🔴 ALTO", "🟡 PREVENTIVO", "🟢 ESTABLE"], default=["⚠️ CRÍTICO", "🔴 ALTO", "🟡 PREVENTIVO"])
        df_listado = df[df['Prioridad'].isin(nivel_f)]
        st.dataframe(df_listado[['id_estudiante', 'carrera', 'promedio_anterior', 'porcentaje_asistencia', 'materias_reprobadas_previas', 'Prioridad']], use_container_width=True)
        st.markdown("---")
        st.subheader("Protocolos Institucionales Sugeridos")
        st.error("**⚠️ CRÍTICO / 🔴 ALTO:** Alumnos con indicadores de reprobación inmediata.")
        st.warning("**🟡 PREVENTIVO:** Alumnos en zona gris (70-79). Requieren orientación para evitar la caída en el promedio.")

    elif menu == "Simulador de Riesgo":
        st.markdown("<h1 class='section-title'>Simulador de Riesgo Preventivo</h1>", unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        with c1:
            v_p = st.slider("Promedio Institucional", 0.0, 100.0, 75.0) # Iniciamos en zona preventiva para prueba
            v_a = st.slider("Nivel de Asistencia (%)", 0.0, 100.0, 85.0)
        with c2:
            v_r = st.number_input("Materias Reprobadas", 0, 15, 0)
            v_b = st.selectbox("¿Cuenta con Beca?", ["Sí", "No"])

        if st.button("GENERAR DIAGNÓSTICO"):
            nivel, desc = obtener_diagnostico(v_p, v_a, v_r)
            st.markdown("---")
            st.subheader(f"Estatus Resultante: {nivel}")
            if "⚠️" in nivel or "🔴" in nivel:
                st.error(desc)
            elif "🟡" in nivel:
                st.warning(desc)
            else:
                st.success(desc)
else:
    st.error("Repositorio institucional no encontrado.")
