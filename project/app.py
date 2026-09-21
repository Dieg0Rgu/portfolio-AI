import streamlit as st
import pandas as pd
import plotly.express as px


st.set_page_config(page_title="Sales Project", page_icon="📊", layout="wide")

st.title("Sales Project")
st.caption("Resumen de ventas y distribución por categoría")

ventas = pd.read_excel("datos_ejemplo.xlsx")

total_ventas = ventas["Ventas"].sum()
promedio_ventas_diarias = ventas["Ventas"].mean()
ventas_por_categoria = (
    ventas.groupby("Categoria", as_index=False)["Ventas"]
    .sum()
    .sort_values("Ventas", ascending=False)
)

col_total, col_promedio = st.columns(2)
with col_total:
    st.metric("Total de ventas", f"${total_ventas:,.2f}")
with col_promedio:
    st.metric("Promedio de ventas diarias", f"${promedio_ventas_diarias:,.2f}")

figura = px.bar(
    ventas_por_categoria,
    x="Categoria",
    y="Ventas",
    title="Ventas por categoría",
    labels={"Categoria": "Categoría", "Ventas": "Ventas ($)"},
    text_auto=".2s",
    color="Categoria",
)
figura.update_layout(showlegend=False, yaxis_tickprefix="$", yaxis_tickformat=",.0f")

st.plotly_chart(figura, width="stretch")