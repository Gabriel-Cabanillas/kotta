/**
 * Documento PDF del reporte financiero administrativo.
 * Recibe datos ya normalizados por la ruta API y solo define su presentación.
 */
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

export type FilaDesgloseFinanciero = {
  etiqueta: string
  monto: number
}

export type MovimientoReporteFinanciero = {
  id: string
  tipo: string
  contraparte: string
  detalle: string
  monto: number
  montoRecibido?: number
  comisionEstimada?: number
  montoDescontado?: number
  estado: string
  origenManual: boolean
  fecha: Date
}

type ReporteFinancieroDocumentProps = {
  nombreCondominio: string
  rangoFechas: string
  resumen: {
    ingresos: number
    egresos: number
    balanceNeto: number
    saldoDisponible: number
  }
  ingresosPorConcepto: FilaDesgloseFinanciero[]
  ingresosPorVecino: FilaDesgloseFinanciero[]
  egresosPorProveedor: FilaDesgloseFinanciero[]
  egresosPorServicio: FilaDesgloseFinanciero[]
  movimientos: MovimientoReporteFinanciero[]
}

const styles = StyleSheet.create({
  page: { paddingTop: 34, paddingRight: 34, paddingBottom: 42, paddingLeft: 34, fontFamily: 'Helvetica', fontSize: 8.5, color: '#262624' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#000000' },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 16, letterSpacing: 1 },
  subtitle: { fontSize: 8, color: '#6B7A99', marginTop: 3 },
  headerRight: { alignItems: 'flex-end' },
  organization: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  period: { fontSize: 8, color: '#6B7A99', marginTop: 3 },
  summaryRow: { flexDirection: 'row', marginBottom: 20 },
  summaryCard: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, padding: 8 },
  summaryLabel: { fontSize: 6.8, color: '#6B7A99', textTransform: 'uppercase', letterSpacing: 0.45, marginBottom: 4 },
  summaryValue: { fontFamily: 'Helvetica-Bold', fontSize: 11 },
  historicalNote: { fontSize: 6.5, color: '#8A8A8A', marginTop: 3 },
  section: { marginBottom: 18 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 },
  grid: { flexDirection: 'row' },
  gridColumn: { flex: 1 },
  table: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 3 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EDEDED' },
  tableRowLast: { flexDirection: 'row' },
  th: { paddingTop: 5, paddingRight: 6, paddingBottom: 5, paddingLeft: 6, fontSize: 6.8, fontFamily: 'Helvetica-Bold', color: '#6B7A99', textTransform: 'uppercase' },
  td: { paddingTop: 5, paddingRight: 6, paddingBottom: 5, paddingLeft: 6, fontSize: 7.5 },
  right: { textAlign: 'right' },
  colDetalle: { width: '66%' },
  colMonto: { width: '34%' },
  colFecha: { width: '14%' },
  colTipo: { width: '18%' },
  colContraparte: { width: '20%' },
  colMovimientoDetalle: { width: '21%' },
  colOrigen: { width: '11%' },
  colEstado: { width: '16%' },
  empty: { color: '#8A8A8A', fontSize: 8, paddingTop: 10, paddingRight: 8, paddingBottom: 10, paddingLeft: 8, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 18, left: 34, right: 34, paddingTop: 7, borderTopWidth: 1, borderTopColor: '#E5E7EB', fontSize: 6.5, color: '#8A8A8A', textAlign: 'center' },
})

const moneda = (monto: number) => `$${monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fecha = (valor: Date) => new Date(valor).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

function TablaDesglose({ filas }: { filas: FilaDesgloseFinanciero[] }) {
  if (filas.length === 0) return <Text style={styles.empty}>No hay movimientos en este período.</Text>

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader} fixed>
        <Text style={[styles.th, styles.colDetalle]}>Concepto</Text>
        <Text style={[styles.th, styles.colMonto, styles.right]}>Monto</Text>
      </View>
      {filas.map((fila, index) => (
        <View key={`${fila.etiqueta}-${index}`} style={index === filas.length - 1 ? styles.tableRowLast : styles.tableRow} wrap={false}>
          <Text style={[styles.td, styles.colDetalle]}>{fila.etiqueta}</Text>
          <Text style={[styles.td, styles.colMonto, styles.right]}>{moneda(fila.monto)}</Text>
        </View>
      ))}
    </View>
  )
}

function SeccionDesglose({ titulo, filas, marginRight = 0 }: { titulo: string; filas: FilaDesgloseFinanciero[]; marginRight?: number }) {
  return (
    <View style={[styles.gridColumn, { marginRight }]}>
      <Text style={styles.sectionTitle}>{titulo}</Text>
      <TablaDesglose filas={filas} />
    </View>
  )
}

export default function ReporteFinancieroDocument({
  nombreCondominio,
  rangoFechas,
  resumen,
  ingresosPorConcepto,
  ingresosPorVecino,
  egresosPorProveedor,
  egresosPorServicio,
  movimientos,
}: ReporteFinancieroDocumentProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>KOTTA</Text>
            <Text style={styles.subtitle}>Reporte financiero</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.organization}>{nombreCondominio}</Text>
            <Text style={styles.period}>{rangoFechas}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { marginRight: 8 }]}><Text style={styles.summaryLabel}>Ingresos del período</Text><Text style={styles.summaryValue}>{moneda(resumen.ingresos)}</Text></View>
          <View style={[styles.summaryCard, { marginRight: 8 }]}><Text style={styles.summaryLabel}>Egresos del período</Text><Text style={styles.summaryValue}>{moneda(resumen.egresos)}</Text></View>
          <View style={[styles.summaryCard, { marginRight: 8 }]}><Text style={styles.summaryLabel}>Balance neto</Text><Text style={styles.summaryValue}>{moneda(resumen.balanceNeto)}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Saldo disponible</Text><Text style={styles.summaryValue}>{moneda(resumen.saldoDisponible)}</Text><Text style={styles.historicalNote}>Acumulado histórico en plataforma</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desglose de ingresos</Text>
          <View style={styles.grid}>
            <SeccionDesglose titulo="Por concepto" filas={ingresosPorConcepto} marginRight={10} />
            <SeccionDesglose titulo="Por vivienda o vecino" filas={ingresosPorVecino} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desglose de egresos</Text>
          <View style={styles.grid}>
            <SeccionDesglose titulo="Por proveedor" filas={egresosPorProveedor} marginRight={10} />
            <SeccionDesglose titulo="Por tipo de servicio" filas={egresosPorServicio} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movimientos del período</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader} fixed>
              <Text style={[styles.th, styles.colFecha]}>Fecha</Text>
              <Text style={[styles.th, styles.colTipo]}>Tipo</Text>
              <Text style={[styles.th, styles.colContraparte]}>Corresponde a</Text>
              <Text style={[styles.th, styles.colMovimientoDetalle]}>Detalle</Text>
              <Text style={[styles.th, styles.colOrigen]}>Origen</Text>
              <Text style={[styles.th, styles.colEstado]}>Estado / monto</Text>
            </View>
            {movimientos.length === 0 ? (
              <Text style={styles.empty}>No hay movimientos en este período.</Text>
            ) : movimientos.map((movimiento, index) => (
              <View key={movimiento.id} style={index === movimientos.length - 1 ? styles.tableRowLast : styles.tableRow} wrap={false}>
                <Text style={[styles.td, styles.colFecha]}>{fecha(movimiento.fecha)}</Text>
                <Text style={[styles.td, styles.colTipo]}>{movimiento.tipo}</Text>
                <Text style={[styles.td, styles.colContraparte]}>{movimiento.contraparte}</Text>
                <Text style={[styles.td, styles.colMovimientoDetalle]}>{movimiento.detalle}</Text>
                <Text style={[styles.td, styles.colOrigen]}>{movimiento.origenManual ? 'Externo' : 'Stripe/Kotta'}</Text>
                <Text style={[styles.td, styles.colEstado]}>{movimiento.estado} · {movimiento.tipo === 'Pago a proveedor' && movimiento.comisionEstimada ? `Recibe ${moneda(movimiento.montoRecibido ?? movimiento.monto)} · Descontado ${moneda(movimiento.montoDescontado ?? movimiento.monto)}` : moneda(movimiento.monto)}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `Generado el ${new Date().toLocaleDateString('es-MX')} · Kotta · Página ${pageNumber} de ${totalPages}`} />
      </Page>
    </Document>
  )
}
