# Notificaciones de Kotta

Las notificaciones in-app siempre se crean primero. El canal de email es opcional, está desacoplado de la persistencia y permanece deshabilitado cuando la variable no existe o no vale exactamente `true`.

## Activar email en el futuro

Configurar en el entorno del servidor:

```env
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_NOTIFICATIONS_FROM="Kotta <remitente-del-dominio-verificado>"
RESEND_API_KEY="clave-del-entorno"
NEXT_PUBLIC_APP_URL="url-publica-de-kotta"
```

- `EMAIL_NOTIFICATIONS_FROM` debe usar un remitente validado en Resend. No debe activarse hasta que el dominio oficial esté verificado.
- `NEXT_PUBLIC_APP_URL` se utiliza para convertir un `href` interno en el enlace absoluto del correo.
- Las claves y remitentes no se guardan en código ni en la base de datos.
- Estas variables controlan únicamente el canal adicional de notificaciones. Los correos de verificación e invitación conservan su flujo actual.

Con email deshabilitado, cada registro se guarda con `emailStatus = DISABLED` y la operación se considera exitosa. Si Resend falla con email habilitado, la notificación in-app permanece disponible y el registro queda en `FAILED` sin revertir la operación principal.
