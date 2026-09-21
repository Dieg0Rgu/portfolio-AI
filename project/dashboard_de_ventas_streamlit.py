import streamlit as st
import pandas as pd
import plotly.express as px

# Configurar la página
st.set_page_config(page_title="Dashboard Ventas 2024", layout="wide")

# Título principal
st.title("📊 Dashboard de Ventas 2024")

# Cargar datos
df = pd.read_excel("datos_ejemplo.xlsx")

# Calcular KPIs
total_ventas = df['Ventas'].sum()
promedio_ventas_diarias = df['Ventas'].mean()

# Mostrar KPIs en columnas
col1, col2 = st.columns(2)

with col1:
    st.metric(
        label="💰 Total de Ventas",
        value=f"${total_ventas:,.2f}"
    )

with col2:
    st.metric(
        label="📈 Promedio de Ventas Diarias",
        value=f"${promedio_ventas_diarias:,.2f}"
    )

# Espaciador
st.divider()

# Gráfica de barras: Ventas por Categoría
st.subheader("Ventas por Categoría")

# Agrupar ventas por categoría
ventas_por_categoria = df.groupby('Categoria')['Ventas'].sum().reset_index()
ventas_por_categoria = ventas_por_categoria.sort_values('Ventas', ascending=False)

# Crear gráfica con Plotly
fig = px.bar(
    ventas_por_categoria,
    x='Categoria',
    y='Ventas',
    title='Total de Ventas por Categoría',
    labels={'Ventas': 'Total Ventas ($)', 'Categoria': 'Categoría'},
    text='Ventas',
    color='Ventas',
    color_continuous_scale='Viridis'
)

# Personalizar la gráfica
fig.update_traces(texttemplate='$%{text:,.0f}', textposition='outside')
fig.update_layout(
    xaxis_title='Categoría',
    yaxis_title='Total Ventas ($)',
    hovermode='x unified',
    height=400,
    showlegend=False
)

# Mostrar gráfica en Streamlit
st.plotly_chart(fig, width="stretch")