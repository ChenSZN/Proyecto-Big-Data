# Sistema de Alertas Tempranas (SAT) - ITNL ISC

## 📝 Descripción del Proyecto
Este sistema constituye una solución analítica avanzada de Inteligencia de Negocios y Machine Learning, desarrollada específicamente para el Tecnológico de Nuevo Laredo. Su objetivo es la identificación proactiva de estudiantes en riesgo de reprobación y deserción escolar mediante el procesamiento del repositorio de datos institucional.

## 📊 Arquitectura del Conjunto de Datos
El sistema opera sobre un conjunto de 5,000 registros institucionales con las siguientes dimensiones:
- **Dimensión Académica**: Promedio anterior, materias reprobadas, créditos inscritos y semestre.
- **Dimensión de Compromiso**: Porcentaje de asistencia, entregas de tareas y uso de plataforma digital (hrs/semana).
- **Dimensión Socioeconómica**: Índice socioeconómico, beca institucional y situación laboral.
- **Dimensión Contextual**: Turno, distancia al campus, acceso a red y reinscripción tardía.

## 🛠️ Componentes del Sistema

1. **Gestión de Datos**: Carga y procesamiento automático del archivo `dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv`.
2. **Análisis de Factores**: Visualizaciones ejecutivas que correlacionan el rendimiento académico con la permanencia.
3. **Inteligencia Predictiva**: 
   - Implementación del algoritmo **Random Forest** (Bosques Aleatorios).
   - **Reproducibilidad**: Se ha fijado una semilla aleatoria (`random_state=42`) para asegurar que los resultados y la jerarquía de variables sean consistentes en cada análisis.
4. **Evaluador de Riesgo**: Interfaz interactiva para el diagnóstico individual basado en el perfil del estudiante.

## 🚀 Guía de Instalación y Ejecución

### Requisitos Previos
- Python 3.10 o superior.
- Dependencias listadas en `requirements.txt`.

### Ejecución
Para iniciar el sistema de gestión, ejecute el siguiente comando en la terminal:
```powershell
.\setup.bat
```

## 📈 Metodología de Implementación
1. **Recolección**: Integración del repositorio oficial proporcionado por la institución.
2. **Normalización**: Tratamiento de variables categóricas mediante técnicas de codificación (One-Hot Encoding).
3. **Entrenamiento**: Ajuste del modelo predictivo utilizando una división de datos de 80/20 para entrenamiento y validación.
4. **Análisis de Importancia**: Identificación de los factores de mayor impacto para la toma de decisiones directivas.

---
**Institución**: Tecnológico de Nuevo Laredo  
**Carrera**: Ingeniería en Sistemas Computacionales  
**Fecha de Actualización**: Mayo 2026
