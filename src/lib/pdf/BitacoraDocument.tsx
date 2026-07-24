import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

export type BitacoraReportRow = {
  date: string
  visitorName: string
  visitorTypeLabel: string
  entryTime: string
  exitTime: string
  notes: string
  guardName: string
}

type BitacoraDocumentProps = {
  orgName: string
  dateLabel: string
  totalAccesos: number
  totalDentro: number
  rows: BitacoraReportRow[]
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#262624',
  },
  header: {
    marginBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 12,
  },
  orgName: {
    fontSize: 9,
    color: '#A6A6A6',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 10,
    color: '#4A5568',
    textTransform: 'capitalize',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#A6A6A6',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  table: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#EDEDED',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  th: {
    padding: 6,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#4A5568',
    textTransform: 'uppercase',
  },
  td: {
    padding: 6,
    fontSize: 8.5,
    color: '#262624',
  },
  colDate: { width: '10%' },
  colName: { width: '18%' },
  colType: { width: '11%' },
  colEntry: { width: '9%' },
  colExit: { width: '9%' },
  colGuard: { width: '15%' },
  colNotes: { width: '28%' },
  emptyState: {
    padding: 24,
    textAlign: 'center',
    color: '#A6A6A6',
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 32,
    right: 32,
    fontSize: 8,
    color: '#A6A6A6',
    textAlign: 'center',
  },
})

export default function BitacoraDocument({
  orgName,
  dateLabel,
  totalAccesos,
  totalDentro,
  rows,
}: BitacoraDocumentProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.orgName}>{orgName}</Text>
          <Text style={styles.title}>Reporte de Bitácora</Text>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Accesos registrados</Text>
            <Text style={styles.summaryValue}>{totalAccesos}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Sin salida registrada</Text>
            <Text style={styles.summaryValue}>{totalDentro}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed>
            <Text style={[styles.th, styles.colDate]}>Fecha</Text>
            <Text style={[styles.th, styles.colName]}>Nombre</Text>
            <Text style={[styles.th, styles.colType]}>Tipo</Text>
            <Text style={[styles.th, styles.colEntry]}>Entrada</Text>
            <Text style={[styles.th, styles.colExit]}>Salida</Text>
            <Text style={[styles.th, styles.colGuard]}>Guardia</Text>
            <Text style={[styles.th, styles.colNotes]}>Notas</Text>
          </View>

          {rows.length === 0 ? (
            <Text style={styles.emptyState}>
              No hay accesos registrados en este periodo.
            </Text>
          ) : (
            rows.map((row, index) => (
              <View
                key={index}
                style={index === rows.length - 1 ? styles.tableRowLast : styles.tableRow}
                wrap={false}
              >
                <Text style={[styles.td, styles.colDate]}>{row.date}</Text>
                <Text style={[styles.td, styles.colName]}>{row.visitorName}</Text>
                <Text style={[styles.td, styles.colType]}>{row.visitorTypeLabel}</Text>
                <Text style={[styles.td, styles.colEntry]}>{row.entryTime}</Text>
                <Text style={[styles.td, styles.colExit]}>{row.exitTime}</Text>
                <Text style={[styles.td, styles.colGuard]}>{row.guardName}</Text>
                <Text style={[styles.td, styles.colNotes]}>{row.notes}</Text>
              </View>
            ))
          )}
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages} · Generado por Kotta`
          }
        />
      </Page>
    </Document>
  )
}