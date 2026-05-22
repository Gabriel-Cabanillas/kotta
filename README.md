# Kotta

Sistema SaaS para administración y gestión de condominios.

Kotta centraliza la operación de condominios en una sola plataforma moderna, organizada y fácil de usar. El sistema permite administrar usuarios, tickets, pagos, reservas, activos, proveedores y accesos desde paneles separados por rol.

---

# Objetivo del proyecto

El objetivo de Kotta es resolver los problemas operativos más comunes dentro de condominios y privadas:

* Desorganización administrativa
* Falta de seguimiento de tickets
* Mala comunicación entre administración y residentes
* Procesos manuales para pagos y reservas
* Control deficiente de proveedores y accesos
* Fragmentación de herramientas

Kotta busca convertir toda la operación del condominio en un flujo digital centralizado.

---

# Características principales

## Administración de usuarios

* Gestión de residentes
* Gestión de administradores
* Gestión de proveedores
* Gestión de guardias
* Activación y desactivación de usuarios
* Sistema de invitaciones

## Sistema multirrol

Kotta separa la experiencia según el tipo de usuario:

* Superadmin
* Administrador
* Vecino
* Proveedor
* Guardia

Cada rol visualiza únicamente las herramientas necesarias para su operación.

## Sistema multicoto

La plataforma soporta múltiples condominios dentro de una misma arquitectura.

Cada coto mantiene:

* Usuarios independientes
* Configuración independiente
* Tickets independientes
* Pagos independientes
* Reservas independientes

---

# Funcionalidades del sistema

## Tickets

* Creación de reportes
* Asignación de tickets
* Seguimiento de incidencias
* Actualización de estados
* Gestión administrativa

## Pagos

* Registro de pagos
* Actualización de estados
* Seguimiento administrativo
* Visualización para residentes

## Reservas

* Solicitud de amenidades
* Cancelación de reservas
* Gestión administrativa

## Activos

* Registro de activos del condominio
* Administración de inventario
* Actualización de información

## Órdenes de trabajo

* Gestión de órdenes para proveedores
* Seguimiento operativo
* Evidencias de trabajo

## Configuración

* Configuración general del condominio
* Parámetros administrativos
* Ajustes operativos

---

# Landing Page

Kotta incluye una landing page comercial enfocada en:

* Presentación del producto
* Explicación del problema
* Explicación de funcionalidades
* Proceso de implementación
* Plan comercial
* Preguntas frecuentes
* Conversión comercial

---

# Tecnologías utilizadas

## Frontend

* React
* Next.js 14
* TypeScript
* Tailwind CSS

## Backend

* Next.js App Router
* API Routes
* Prisma ORM
* PostgreSQL

## Infraestructura y servicios

* Supabase
* Vercel
* Cloudinary
* Resend

---

# Arquitectura general

El proyecto utiliza una arquitectura basada en:

* App Router de Next.js
* Componentes reutilizables
* APIs separadas por dominio
* Sistema modular por roles
* Configuración centralizada
* Prisma como capa de acceso a datos

---

# Estructura del proyecto

```txt
src/
 ├── app/
 │    ├── api/
 │    ├── [coto]/
 │    ├── dashboard/
 │    └── superadmin/
 │
 ├── components/
 │    ├── admin/
 │    ├── vecino/
 │    ├── proveedor/
 │    ├── sections/
 │    └── layout/
 │
 ├── lib/
 │
 └── middleware.ts
```

---

# Seguridad y autenticación

Kotta utiliza:

* Kotta utiliza autenticación propia desarrollada desde cero, basada en sesiones, cookies seguras, códigos de verificación e invitaciones.
* Cookies seguras
* Middleware de protección de rutas
* Separación de permisos por rol
* Validaciones del lado servidor

---

# Estado actual del proyecto

Actualmente Kotta cuenta con:

* Arquitectura principal funcional
* Sistema multirrol
* Sistmulticoto
* APIs princiema pales
* Landing page comercial
* Documentación interna del proyecto
* Estructura lista para escalamiento

---

# Instalación local

## Clonar repositorio

```bash
git clone https://github.com/Gabriel-Cabanillas/kotta.git
```

## Instalar dependencias

```bash
npm install
```

## Configurar variables de entorno

Crear archivo:

```txt
.env.local
```

## Ejecutar en desarrollo

```bash
npm run dev
```

## Ejecutar build

```bash
npm run build
```

---

# Scripts principales

```bash
npm run dev
npm run build
npm run lint
```

---

# Autor

Gabriel Cabanillas / Saul Inquermán Guzmán Romero

Licenciatura en Informática — Facultad de Informática Mazatlán UAS

Proyecto desarrollado como sistema SaaS enfocado en administración y gestión de condominios.

---

# Visión del proyecto

Kotta busca convertirse en una plataforma moderna para la operación integral de condominios, combinando:

* Simplicidad
* Centralización
* Escalabilidad
* Experiencia de usuario
* Automatización operativa

La meta es reemplazar procesos manuales y herramientas fragmentadas por una sola plataforma clara y fácil de usar.
