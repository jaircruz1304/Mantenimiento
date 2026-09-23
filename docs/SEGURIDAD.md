# Seguridad y roles

## Regla de aplicación

Administrador de interfaz:

`jcruzg@fias.org.ec`

El resto de cuentas Microsoft 365 se opera en modo consulta.

## Qué hace la aplicación

Para usuarios de consulta:

- oculta `Nuevo registro` y `Registrar`;
- bloquea `Guardar en SharePoint`;
- bloquea `Agregar ítem`;
- bloquea uso de OCR para crear registros;
- intercepta acciones protegidas antes de los listeners del núcleo.

## Qué debe hacer SharePoint

La autorización definitiva debe estar en la fuente:

- administrador: edición del libro;
- usuarios finales: lectura;
- evitar permisos heredados de edición que contradigan esta política.

El front-end reduce errores accidentales, pero no debe considerarse un mecanismo suficiente frente a manipulación deliberada del navegador.
