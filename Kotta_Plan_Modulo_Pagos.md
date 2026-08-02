# Plan formal — Módulo de pagos de Kotta

## Cómo usar este documento

Este documento es la referencia completa y cerrada del módulo de pagos, resultado de varias rondas de análisis. Está pensado para retomarse en otro chat y empezar el desarrollo directamente desde la Fase 0, sin necesidad de repetir la discusión de arquitectura.


---

## 1. Decisiones de arquitectura (cerradas)

- **Intermediario de pagos:** Stripe Connect. Kotta nunca almacena datos bancarios ni de tarjetas, y nunca tiene una cuenta propia por donde pase el dinero de terceros.
- **Tipo de cuenta conectada:** Express, usando **componentes embebidos de Stripe** (Connect embedded components). El formulario de datos bancarios se ve y se siente parte de Kotta — mismos colores, misma tipografía, dentro del dominio de Kotta. El condominio y el proveedor **nunca** ven una pantalla con el logo de Stripe ni crean un login separado.
- **Cobro a vecinos:** Direct Charges. El cargo se crea directamente sobre la cuenta conectada del condominio; el dinero cae ahí sin pasar por Kotta.
- **Pago a proveedores:** Transfers entre cuentas conectadas. Es una operación distinta a un cargo — mueve dinero que ya está en el balance del condominio hacia el balance del proveedor, y requiere saldo disponible.
- **Quién necesita configuración de cuenta:** solo quienes **reciben** dinero — el condominio y el proveedor. El vecino no necesita ninguna cuenta ni verificación previa; solo paga cuando le corresponde.
- **Banco del condominio o del proveedor:** irrelevante. Stripe paga vía SPEI a cualquier CLABE de cualquier institución mexicana (Santander, Banorte, BBVA, etc.), sin distinción.
- **Verificación de identidad (KYC) del condominio y del proveedor:** es un requisito legal mexicano (no de Stripe específicamente), inevitable con cualquier proveedor de pagos serio. Se resuelve con un formulario corto, una sola vez, embebido en Kotta.
- **STP:** fuera del alcance de este módulo. No aporta nada que Stripe no resuelva ya, y usarlo para dispersar dinero directamente implicaría que Kotta tenga una cuenta concentradora propia — justo lo que esta arquitectura evita, y lo que activaría requisitos de licencia IFPE bajo la Ley Fintech mexicana.

## 2. Decisión pendiente antes de desarrollar

- **Modelo de comisión:** ¿Kotta cobra un `application_fee` por transacción, o el ingreso es 100% por planes de suscripción y el pago pasa íntegro del vecino al condominio? Esta decisión es de Gustavo (CFO) y debe cerrarse antes de escribir la lógica de creación de cargos, porque afecta directamente el parámetro `application_fee_amount` en cada `PaymentIntent`.

---

## 3. Modelo de datos (Prisma)

Esquema conceptual — se ajusta en implementación, pero la forma y las relaciones ya están validadas.

```prisma
enum TipoCuentaConectada {
  CONDOMINIO
  PROVEEDOR
}

model CuentaConectada {
  id                String              @id @default(cuid())
  tipo              TipoCuentaConectada
  cotoId            String?             @unique
  proveedorId       String?             @unique
  stripeAccountId   String              @unique
  chargesEnabled    Boolean             @default(false)
  payoutsEnabled    Boolean             @default(false)
  detailsSubmitted  Boolean             @default(false)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
}

model MetodoPago {
  id                      String   @id @default(cuid())
  vecinoId                String
  stripePaymentMethodId   String   @unique
  tipo                    String   // "tarjeta" | "spei"
  predeterminado          Boolean  @default(false)
  createdAt               DateTime @default(now())
}
// Opcional/conveniencia: el vecino puede guardar un método de pago para
// futuros cobros, pero no es un requisito para poder pagar.

enum TipoCargo {
  MASIVO       // todas las viviendas
  GRUPO        // varias viviendas seleccionadas
  INDIVIDUAL   // una sola vivienda
}

model Cargo {
  id             String              @id @default(cuid())
  cotoId         String
  concepto       String
  monto          Decimal
  fechaLimite    DateTime
  tipo           TipoCargo
  creadoPorId    String
  createdAt      DateTime            @default(now())
  destinatarios  CargoDestinatario[]
  pagos          Pago[]
}

model CargoDestinatario {
  id          String @id @default(cuid())
  cargoId     String
  viviendaId  String
  cargo       Cargo  @relation(fields: [cargoId], references: [id])

  @@unique([cargoId, viviendaId])
}

enum EstadoPago {
  PENDIENTE
  PROCESANDO
  PAGADO
  FALLIDO
  EN_DISPUTA
  REEMBOLSADO
}

enum TipoOperacionPago {
  CARGO          // vecino -> condominio
  TRANSFERENCIA  // condominio -> proveedor
}

model Pago {
  id                       String            @id @default(cuid())
  cotoId                   String
  cargoId                  String?
  vecinoId                 String?
  proveedorId              String?
  servicioId               String?
  monto                    Decimal
  moneda                   String            @default("MXN")
  estado                   EstadoPago
  tipoOperacion            TipoOperacionPago
  stripePaymentIntentId    String?           @unique
  stripeTransferId         String?           @unique
  referencia               String?
  comprobanteUrl           String?
  createdAt                DateTime          @default(now())
  updatedAt                DateTime          @updatedAt
}

model WebhookEvent {
  id             String   @id @default(cuid())
  stripeEventId  String   @unique
  tipo           String
  procesadoEn    DateTime @default(now())
}
```

**Por qué un solo modelo `Cargo`:** una cuota mensual masiva y un cargo asignado a un vecino son el mismo objeto con distinta cantidad de destinatarios. Un solo modelo evita duplicar lógica de cobro, webhook y reportes.

**Por qué un solo modelo `CuentaConectada`:** condominio y proveedor son ambos cuentas conectadas de Stripe con los mismos tres flags de estado; solo cambia a quién pertenecen.

**Por qué `Pago` cubre ambos tipos de operación:** un reporte financiero completo necesita ver ingresos y egresos en una sola tabla de movimientos; separar cargos y transferencias en modelos distintos obligaría a hacer dos consultas y unirlas cada vez que se muestre el dashboard.

---

## 4. Flujos funcionales detallados

### 4.1 Admin — Asignar pago (`app/[coto]/administrador/pagos/asignar`)

- Botón "Asignar pago" en la sección de Pagos.
- Formulario: concepto, monto, fecha límite.
- **Selector de destinatarios:** buscador por nombre o número de vivienda con filtrado en tiempo real, lista con checkbox por fila, y un checkbox superior "Seleccionar todos".
  - Todas las viviendas seleccionadas → `Cargo.tipo = MASIVO`.
  - Varias, pero no todas → `GRUPO`.
  - Una sola → `INDIVIDUAL`.
- Al confirmar: se crea el `Cargo` con sus `CargoDestinatario`, y se notifica (in-app + email vía Resend) a cada vecino seleccionado.

### 4.2 Vecino — Pagar un cargo (`app/[coto]/vecino/pagos`)

- Lista de cargos pendientes con monto, concepto y fecha límite. Sin ningún registro ni configuración previa.
- Botón "Pagar" abre el Payment Element de Stripe (tarjeta + SPEI habilitados).
- El vecino ingresa sus propios datos de pago — nunca ve ni necesita el número de cuenta del condominio, porque el `PaymentIntent` ya se creó sobre la cuenta conectada correcta.
- Confirmación → Stripe procesa → webhook actualiza `Pago.estado = PAGADO` → notificación al vecino y al admin.

### 4.3 Admin — Registrar proveedor con cuenta de pago (`app/[coto]/administrador/usuarios/proveedores`)

- Al dar de alta un proveedor: datos de contacto normales, más un botón **"Configurar cuenta de pago"**.
- Este botón abre el formulario embebido de Stripe (Connect embedded components) dentro de la propia interfaz de Kotta — no hay redirección externa. El proveedor completa nombre legal, RFC y CLABE una sola vez.
- En la lista de proveedores se muestra el estado: **"Pendiente de configurar"** o **"Listo para recibir pagos"** (según `CuentaConectada.payoutsEnabled`).

### 4.4 Admin — Pagar a un proveedor (`app/[coto]/administrador/proveedores/servicios`)

- El botón "Pagar" (ya existente en el flujo de aprobación de servicios) solo se habilita si `payoutsEnabled = true` para ese proveedor.
- Si no está habilitado, se muestra un mensaje explicando que el proveedor aún no completa su registro, con opción de reenviar la invitación.
- Un clic en "Pagar" crea un `Transfer` desde el balance del condominio hacia la cuenta del proveedor. Si el condominio no tiene saldo suficiente, se muestra el error de forma clara, no un mensaje genérico de Stripe.

### 4.5 Proveedor — Editar sus datos bancarios (`app/[coto]/proveedor/configuracion/pagos`)

- Sección "Datos bancarios" con estado actual y botón "Actualizar información".
- Abre el mismo componente embebido de Stripe, dentro de Kotta, para editar sus datos.
- Kotta solo muestra el estado (completo / incompleto), nunca los datos en sí.

---

## 5. Sección de Pagos del admin — panel financiero completo

Esta sección deja de ser solo una lista de cobros y se convierte en el centro de control financiero del condominio.

**Resumen financiero (parte superior):**
- Ingresos totales del mes (cobros a vecinos).
- Egresos totales del mes (pagos a proveedores).
- Balance neto del mes.
- Saldo disponible en la cuenta Stripe del condominio (antes de su próximo payout automático a su banco).

**Desglose de ingresos:**
- Por concepto (mantenimiento, cargos individuales, extraordinarios, etc.).
- Por vivienda/vecino.
- Por periodo.

**Desglose de egresos:**
- Por proveedor.
- Por tipo de servicio.
- Por periodo.

**Gráficas:**
- Barras comparativas: ingresos vs. egresos, últimos 6–12 meses.
- Línea: evolución del balance neto mensual.
- Dona/pastel: distribución de cargos del mes por estado (pagado / pendiente / vencido).

**Tabla de movimientos (unificada):**
- Todos los registros de `Pago`, tanto `CARGO` como `TRANSFERENCIA`, en una sola tabla.
- Filtros por tipo de operación, estado, rango de fecha, vivienda/vecino o proveedor.
- Búsqueda por texto.

**Estado de cuentas conectadas:**
- Estado de verificación del condominio.
- Estado de verificación de cada proveedor, con acceso rápido para reenviar invitación si falta.

**Alertas y pendientes:**
- Cargos vencidos.
- Proveedores pendientes de configurar cuenta.
- Transferencias fallidas por saldo insuficiente.

**Exportación:**
- Reutilizar el patrón de 4 archivos que ya usan para PDF (`@react-pdf/renderer`) para generar reportes financieros descargables.

Sugerencia de librería para las gráficas: Recharts — se integra bien con Next.js/React sin agregar dependencias pesadas.

---

## 6. Cambios por dashboard

**Administrador**
- Pagos: rediseño completo como panel financiero (sección 5).
- Usuarios → Proveedores: botón de configuración de cuenta de pago al registrar.
- Configuración: mantiene "Conectar cuenta bancaria" del condominio, ahora vía componente embebido.

**Vecino**
- Pagos: lista de cargos pendientes/pagados, botón pagar, historial y comprobantes descargables. Sin registro previo.
- Perfil: sección opcional "Métodos de pago" para guardar tarjetas.

**Proveedor**
- Pagos recibidos: historial de transferencias.
- Configuración: sección "Datos bancarios" con edición vía componente embebido de Stripe.

---

## 7. Plan de implementación por fases

**Fase 0 — Fundaciones**
- Modelos `CuentaConectada` y `WebhookEvent`.
- Endpoint `/api/webhooks/stripe` con verificación de firma sobre el body crudo e idempotencia por `stripeEventId`.
- Variables de entorno de Stripe (test/live) en Preview y Production de Vercel.

**Fase 1 — Onboarding de cuentas conectadas**
- Componente embebido de Stripe para conectar cuenta bancaria del condominio.
- Mismo componente para el proveedor, disparado desde su registro en Usuarios y editable desde su propio panel.

**Fase 2 — Cargos y cobro a vecinos**
- Modelos `Cargo` y `CargoDestinatario`.
- UI de "Asignar pago" con selector buscable (todos / grupo / individual).
- Payment Element del lado del vecino (tarjeta + SPEI).
- Actualización de estado vía webhook.
- *Requiere que el modelo de comisión (sección 2) esté definido antes de esta fase.*

**Fase 3 — Pago a proveedores**
- Botón "Pagar" condicionado a `payoutsEnabled`.
- Transfer API, manejo de saldo insuficiente, actualización de estado.

**Fase 4 — Panel financiero del admin**
- Resumen, desgloses, gráficas, tabla de movimientos, alertas, exportación (sección 5).

**Fase 5 — Refinamiento**
- Reembolsos, disputas, pagos recurrentes automáticos, reintentos por fondos insuficientes.

---

## 8. Archivos involucrados (referencia inicial)

- `ConfiguracionForm.tsx` — onboarding embebido de cuenta bancaria del condominio.
- `PagosList.tsx` — se amplía para soportar filtros y los nuevos estados.
- `AsignarPagoForm.tsx` — nuevo, formulario de asignación con selector de destinatarios.
- `SelectorVecinos.tsx` — nuevo, componente de búsqueda y selección múltiple.
- `PanelFinancieroPagos.tsx` — nuevo, resumen, gráficas y tabla de movimientos.
- `ProveedorCuentaPago.tsx` — nuevo, estado y componente embebido de configuración/edición.
- `app/api/webhooks/stripe/route.ts` — nuevo, `export const runtime = 'nodejs'`, verificación de firma sobre el body crudo.
