import pandas as pd
import random

# Cargar el dataset original
file_path = 'dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv'
df = pd.read_csv(file_path)

# Mapeo de materias por carrera y semestre (Ejemplos representativos)
reticulas = {
    'Ingeniería en Sistemas Computacionales': {
        1: ['Fundamentos de Programación', 'Matemáticas Discretas'],
        2: ['Programación Orientada a Objetos', 'Cálculo Diferencial'],
        3: ['Estructura de Datos', 'Sistemas Operativos'],
        4: ['Taller de Base de Datos', 'Métodos Numéricos'],
        5: ['Ingeniería de Software', 'Arquitectura de Computadoras'],
        6: ['Redes de Computadoras', 'Lenguajes y Autómatas'],
        7: ['Inteligencia Artificial', 'Gestión de Proyectos'],
        8: ['Programación Web', 'Conmutación y Enrutamiento'],
        9: ['Especialidad ISC', 'Residencia Profesional']
    },
    'Ingeniería Industrial': {
        1: ['Introducción a la Ing. Industrial', 'Dibujo Industrial'],
        2: ['Probabilidad y Estadística', 'Electricidad y Electrónica'],
        3: ['Estudio del Trabajo I', 'Metrología'],
        4: ['Estudio del Trabajo II', 'Procesos de Fabricación'],
        5: ['Gestión de Costos', 'Investigación de Operaciones I'],
        6: ['Control Estadístico de Calidad', 'Logística'],
        7: ['Sistemas de Manufactura', 'Planeación Financiera'],
        8: ['Formulación de Proyectos', 'Relaciones Industriales']
    }
}

# Maestros simulados
maestros = [
    'Ing. Ricardo Treviño', 'Dr. Sergio Martínez', 'Mtra. Laura Garza', 
    'Ing. David Cantú', 'Dra. Elena Villareal', 'Ing. Jorge Lozano',
    'Mtro. Arturo Peña', 'Dra. Claudia Ortiz'
]

def asignar_materia(row):
    carrera = row['carrera']
    semestre = row['semestre']
    # Si no está en la retícula detallada, asignamos una genérica
    if carrera in reticulas and semestre in reticulas[carrera]:
        return random.choice(reticulas[carrera][semestre])
    return f"Materia Troncal {semestre}°"

def asignar_maestro(materia):
    # Generar una semilla basada en el nombre de la materia para que sea consistente
    random.seed(materia)
    return random.choice(maestros)

# Aplicar las nuevas columnas
df['materia'] = df.apply(asignar_materia, axis=1)
df['maestro'] = df['materia'].apply(asignar_maestro)

# Guardar los cambios
df.to_csv(file_path, index=False)
print("Dataset enriquecido exitosamente con columnas 'materia' y 'maestro'.")
