/**
 * Documento PDF del reporte mensual de actividad del proveedor.
 * Recibe los datos ya calculados (ordenes completadas + total de ingreso)
 * y define el layout visual del reporte usando @react-pdf/renderer.
 * Se relaciona con /api/proveedor/reporte.
 * Existe para dar al proveedor un comprobante descargable de su actividad
 * y a la administracion un formato consistente de evidencia mensual.
 */
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#262624',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  brand: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  subBrand: {
    fontSize: 8,
    color: '#A6A6A6',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  periodo: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  meta: {
    fontSize: 9,
    color: '#6B7A99',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderRadius: 4,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#A6A6A6',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
  },
  tableTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#262624',
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
    paddingVertical: 6,
  },
  colFolio:  { width: '15%', fontSize: 9, color: '#A6A6A6' },
  colTitulo: { width: '45%', fontSize: 9 },
  colFecha:  { width: '20%', fontSize: 9, color: '#A6A6A6' },
  colPrecio: { width: '20%', fontSize: 9, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  headerCell: { fontSize: 8, color: '#A6A6A6', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyState: {
    padding: 24,
    textAlign: 'center',
    color: '#A6A6A6',
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#A6A6A6',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EDEDED',
    paddingTop: 8,
  },
})

type OrdenReporte = {
  folio: string
  title: string
  cost: number
  date: Date
}

export function ReporteProveedorDocument({
  proveedor,
  orgName,
  month,
  year,
  ordenes,
  totalIngreso,
}: {
  proveedor: string
  orgName: string
  month: number
  year: number
  ordenes: OrdenReporte[]
  totalIngreso: number
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>KOTTA</Text>
            <Text style={styles.subBrand}>Reporte mensual de actividad</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.periodo}>{MESES[month - 1]} {year}</Text>
            <Text style={styles.meta}>{proveedor}</Text>
            <Text style={styles.meta}>{orgName}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { marginRight: 12 }]}>
            <Text style={styles.summaryLabel}>Órdenes completadas</Text>
            <Text style={styles.summaryValue}>{ordenes.length}</Text>
          </View>
          <View style={[styles.summaryCard, { marginRight: 12 }]}>
            <Text style={styles.summaryLabel}>Ingreso del mes</Text>
            <Text style={styles.summaryValue}>
              ${totalIngreso.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Promedio por orden</Text>
            <Text style={styles.summaryValue}>
              ${ordenes.length > 0
                ? (totalIngreso / ordenes.length).toLocaleString('es-MX', { minimumFractionDigits: 2 })
                : '0.00'}
            </Text>
          </View>
        </View>

        <Text style={styles.tableTitle}>Detalle de órdenes</Text>

        {ordenes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text>No hay órdenes completadas en este período.</Text>
          </View>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.colFolio, styles.headerCell]}>Folio</Text>
              <Text style={[styles.colTitulo, styles.headerCell]}>Trabajo</Text>
              <Text style={[styles.colFecha, styles.headerCell]}>Fecha</Text>
              <Text style={[styles.colPrecio, styles.headerCell]}>Precio</Text>
            </View>
            {ordenes.map((o, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colFolio}>#{o.folio}</Text>
                <Text style={styles.colTitulo}>{o.title}</Text>
                <Text style={styles.colFecha}>
                  {new Date(o.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </Text>
                <Text style={styles.colPrecio}>
                  ${o.cost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Generado el ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} · Kotta · Página ${pageNumber} de ${totalPages}`
          }
        />

      </Page>
    </Document>
  )
}